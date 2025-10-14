const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// ✅ Helper to recalculate goal progress
async function updateGoalProgress(userId, goalId) {
    if (!goalId) return;

    // Get total saved for this goal
    const [[{ total }]] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total 
         FROM entries 
         WHERE user_id = ? AND goal_id = ?`,
        [userId, goalId]
    );

    // Get the goal info
    const [[goal]] = await pool.execute(
        `SELECT goal_amount, completed 
         FROM goals 
         WHERE id = ? AND user_id = ?`,
        [goalId, userId]
    );

    if (!goal) return;

    const isCompleted = total >= goal.goal_amount;

    // Update goal allocation + completion status
    await pool.execute(
        `UPDATE goals 
         SET allocated_amount = ?, 
             completed = ?, 
             completed_at = ${isCompleted ? 'NOW()' : 'NULL'}
         WHERE id = ? AND user_id = ?`,
        [total, isCompleted ? 1 : 0, goalId, userId]
    );
}

// Get all entries for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const [entries] = await pool.execute(
            `SELECT id, user_id, type, amount, note, category, goal_id, created_at 
             FROM entries 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json(entries);
    } catch (err) {
        console.error('Error fetching entries:', err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Create a new entry
router.post('/', auth, async (req, res) => {
    const { type, amount, note, category, goal_id } = req.body;

    try {
        const [result] = await pool.execute(
            `INSERT INTO entries (user_id, type, amount, note, category, goal_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, type, amount, note || null, category || null, goal_id || null]
        );

        // Recalculate goal if relevant
        if (goal_id) await updateGoalProgress(req.user.id, goal_id);

        // Return full inserted entry
        const [newEntryRows] = await pool.execute(
            `SELECT id, user_id, type, amount, note, category, goal_id, created_at 
             FROM entries 
             WHERE id = ? AND user_id = ?`,
            [result.insertId, req.user.id]
        );

        res.status(201).json(newEntryRows[0]);
    } catch (err) {
        console.error('Error creating entry:', err);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// Update an entry
router.put('/:id', auth, async (req, res) => {
    const entryId = req.params.id;
    const { type, amount, note, category, goal_id } = req.body;

    try {
        // Get the current goal_id before updating
        const [[oldEntry]] = await pool.execute(
            `SELECT goal_id FROM entries WHERE id = ? AND user_id = ?`,
            [entryId, req.user.id]
        );

        const updates = [];
        const values = [];

        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
        if (note !== undefined) { updates.push('note = ?'); values.push(note); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (goal_id !== undefined) { updates.push('goal_id = ?'); values.push(goal_id); }

        if (updates.length === 0)
            return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, entryId);

        await pool.execute(
            `UPDATE entries SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        // Recalculate goals for old and new goal_id
        if (oldEntry?.goal_id) await updateGoalProgress(req.user.id, oldEntry.goal_id);
        if (goal_id && goal_id !== oldEntry?.goal_id)
            await updateGoalProgress(req.user.id, goal_id);

        const [updatedEntry] = await pool.execute(
            `SELECT id, user_id, type, amount, note, category, goal_id, created_at 
             FROM entries 
             WHERE user_id = ? AND id = ?`,
            [req.user.id, entryId]
        );

        res.json(updatedEntry[0]);
    } catch (err) {
        console.error('Error updating entry:', err);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Delete an entry
router.delete('/:id', auth, async (req, res) => {
    const entryId = req.params.id;

    try {
        // Get goal_id before deleting
        const [[entry]] = await pool.execute(
            `SELECT goal_id FROM entries WHERE id = ? AND user_id = ?`,
            [entryId, req.user.id]
        );

        await pool.execute(
            'DELETE FROM entries WHERE user_id = ? AND id = ?',
            [req.user.id, entryId]
        );

        // Recalculate if goal-related
        if (entry?.goal_id) await updateGoalProgress(req.user.id, entry.goal_id);

        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

module.exports = router;
