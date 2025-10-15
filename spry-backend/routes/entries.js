const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Predefined categories
const expenseCategories = ['rent', 'food', 'utilities', 'entertainment', 'clothing', 'other'];
const savingCategories = ['emergency', 'roth ira', 'stocks', '401k', 'savingsgoal'];

// Helper: Recalculate goal progress
async function updateGoalProgress(userId, goalId) {
    if (!goalId) return;

    const [[{ total }]] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM entries WHERE user_id = ? AND goal_id = ?`,
        [userId, goalId]
    );

    const [[goal]] = await pool.execute(
        `SELECT goal_amount, completed FROM goals WHERE id = ? AND user_id = ?`,
        [goalId, userId]
    );

    if (!goal) return;

    const isCompleted = total >= goal.goal_amount;

    await pool.execute(
        `UPDATE goals 
         SET allocated_amount = ?, completed = ?, completed_at = ${isCompleted ? 'NOW()' : 'NULL'}
         WHERE id = ? AND user_id = ?`,
        [total, isCompleted ? 1 : 0, goalId, userId]
    );
}

// --- GET all entries ---
router.get('/', auth, async (req, res) => {
    try {
        const [entries] = await pool.execute(
            `SELECT id, user_id, type, amount, note, category, goal_id, created_at 
             FROM entries WHERE user_id = ? ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(entries);
    } catch (err) {
        console.error('Error fetching entries:', err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// --- POST a new entry ---
router.post('/', auth, async (req, res) => {
    let { type, amount, note, category, goal_id } = req.body;
    const normalizedCategory = category?.toLowerCase() || null;

    try {
        // Validate category strictly
        if (type === 'expense' && !expenseCategories.includes(normalizedCategory)) {
            return res.status(400).json({ error: `Invalid expense category: ${category}` });
        }
        if (type === 'saving' && !savingCategories.includes(normalizedCategory)) {
            return res.status(400).json({ error: `Invalid saving category: ${category}` });
        }

        const [result] = await pool.execute(
            `INSERT INTO entries (user_id, type, amount, note, category, goal_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, type, amount, note || null, normalizedCategory, goal_id || null]
        );

        let finalGoalId = goal_id;
        const entryId = result.insertId;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Handle expenses
        if (type === 'expense') {
            await pool.execute(
                `INSERT INTO expense (entry_id, type, month, year, amount) VALUES (?, ?, ?, ?, ?)`,
                [entryId, normalizedCategory, month, year, amount]
            );
        }

        // Handle savings
        if (type === 'saving') {
            if (normalizedCategory === 'savingsgoal') {
                if (!finalGoalId) {
                    const [goalResult] = await pool.execute(
                        `INSERT INTO goals (user_id, note, goal_amount, allocated_amount, completed) VALUES (?, ?, ?, 0, 0)`,
                        [req.user.id, note || 'New Savings Goal', amount || 0]
                    );
                    finalGoalId = goalResult.insertId;
                    await pool.execute(`UPDATE entries SET goal_id = ? WHERE id = ?`, [finalGoalId, entryId]);
                }
                await updateGoalProgress(req.user.id, finalGoalId);
            } else {
                await pool.execute(
                    `INSERT INTO saving (entry_id, type, amount, month, year) VALUES (?, ?, ?, ?, ?)`,
                    [entryId, normalizedCategory, amount, month, year]
                );
            }
        }

        const [newEntryRows] = await pool.execute(
            `SELECT id, user_id, type, amount, note, category, goal_id, created_at FROM entries WHERE id = ? AND user_id = ?`,
            [entryId, req.user.id]
        );

        res.status(201).json(newEntryRows[0]);
    } catch (err) {
        console.error('Error creating entry:', err);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// --- PUT: Update an entry ---
router.put('/:id', auth, async (req, res) => {
    const entryId = req.params.id;
    let { type, amount, note, category, goal_id } = req.body;
    const normalizedCategory = category?.toLowerCase() || null;

    try {
        const [[oldEntry]] = await pool.execute(
            `SELECT type, category, amount, goal_id FROM entries WHERE id = ? AND user_id = ?`,
            [entryId, req.user.id]
        );
        if (!oldEntry) return res.status(404).json({ error: 'Entry not found' });

        const newType = type || oldEntry.type;

        // Validate category strictly
        if (newType === 'expense' && normalizedCategory && !expenseCategories.includes(normalizedCategory)) {
            return res.status(400).json({ error: `Invalid expense category: ${category}` });
        }
        if (newType === 'saving' && normalizedCategory && !savingCategories.includes(normalizedCategory)) {
            return res.status(400).json({ error: `Invalid saving category: ${category}` });
        }

        const updates = [];
        const values = [];

        if (type !== undefined) updates.push('type = ?') && values.push(type);
        if (amount !== undefined) updates.push('amount = ?') && values.push(amount);
        if (note !== undefined) updates.push('note = ?') && values.push(note);
        if (category !== undefined) updates.push('category = ?') && values.push(normalizedCategory);
        if (goal_id !== undefined) updates.push('goal_id = ?') && values.push(goal_id);

        if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, entryId);
        await pool.execute(`UPDATE entries SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`, values);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Remove old record from saving/expense
        if (oldEntry.type === 'expense' && oldEntry.category && expenseCategories.includes(oldEntry.category)) {
            await pool.execute(`DELETE FROM expense WHERE entry_id = ?`, [entryId]);
        }
        if (oldEntry.type === 'saving' && oldEntry.category && oldEntry.category !== 'savingsgoal') {
            await pool.execute(`DELETE FROM saving WHERE entry_id = ?`, [entryId]);
        }

        // Insert new record into correct table
        const newCategory = normalizedCategory || oldEntry.category;
        const newGoalId = goal_id || oldEntry.goal_id;

        if (newType === 'expense' && expenseCategories.includes(newCategory)) {
            await pool.execute(
                `INSERT INTO expense (entry_id, type, month, year, amount) VALUES (?, ?, ?, ?, ?)`,
                [entryId, newCategory, month, year, amount || oldEntry.amount]
            );
        } else if (newType === 'saving' && savingCategories.includes(newCategory)) {
            if (newCategory === 'savingsgoal') {
                let finalGoalId = newGoalId;
                if (!finalGoalId) {
                    const [goalResult] = await pool.execute(
                        `INSERT INTO goals (user_id, note, goal_amount, allocated_amount, completed) VALUES (?, ?, ?, 0, 0)`,
                        [req.user.id, note || 'New Savings Goal', amount || 0]
                    );
                    finalGoalId = goalResult.insertId;
                    await pool.execute(`UPDATE entries SET goal_id = ? WHERE id = ?`, [finalGoalId, entryId]);
                }
                await updateGoalProgress(req.user.id, finalGoalId);
            } else {
                await pool.execute(
                    `INSERT INTO saving (entry_id, type, amount, month, year) VALUES (?, ?, ?, ?, ?)`,
                    [entryId, newCategory, amount || oldEntry.amount, month, year]
                );
            }
        }

        if (oldEntry.goal_id) await updateGoalProgress(req.user.id, oldEntry.goal_id);
        if (newGoalId && newGoalId !== oldEntry.goal_id) await updateGoalProgress(req.user.id, newGoalId);

        const [updatedEntry] = await pool.execute(
            `SELECT id, user_id, type, amount, note, category, goal_id, created_at FROM entries WHERE user_id = ? AND id = ?`,
            [req.user.id, entryId]
        );

        res.json(updatedEntry[0]);
    } catch (err) {
        console.error('Error updating entry:', err);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// --- DELETE an entry ---
router.delete('/:id', auth, async (req, res) => {
    const entryId = req.params.id;

    try {
        const [[entry]] = await pool.execute(
            `SELECT goal_id FROM entries WHERE id = ? AND user_id = ?`,
            [entryId, req.user.id]
        );

        await pool.execute(`DELETE FROM entries WHERE user_id = ? AND id = ?`, [req.user.id, entryId]);
        await pool.execute(`DELETE FROM expense WHERE entry_id = ?`, [entryId]);
        await pool.execute(`DELETE FROM saving WHERE entry_id = ?`, [entryId]);

        if (entry?.goal_id) await updateGoalProgress(req.user.id, entry.goal_id);

        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

module.exports = router;
