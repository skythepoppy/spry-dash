const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Helper to recalc a goal before returning
async function syncGoalProgress(userId, goalId) {
    // Total from entries
    const [[{ total }]] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total 
         FROM entries 
         WHERE user_id = ? AND goal_id = ?`,
        [userId, goalId]
    );

    // Get goal details
    const [[goal]] = await pool.execute(
        `SELECT goal_amount, allocated_amount, completed 
         FROM goals 
         WHERE id = ? AND user_id = ?`,
        [goalId, userId]
    );

    if (!goal) return null;

    const newAllocated = Number(total);
    const isCompleted = newAllocated >= goal.goal_amount;

    // Only update DB if something changed
    await pool.execute(
        `UPDATE goals 
         SET allocated_amount = ?, 
             completed = ?, 
             completed_at = ${isCompleted ? 'NOW()' : 'NULL'}
         WHERE id = ? AND user_id = ?`,
        [newAllocated, isCompleted ? 1 : 0, goalId, userId]
    );

    // Return updated goal row
    const [rows] = await pool.execute(
        'SELECT * FROM goals WHERE id = ? AND user_id = ?',
        [goalId, userId]
    );
    return rows[0];
}

// Get all goals for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        // Fetch user’s goals
        const [goals] = await pool.execute(
            'SELECT id FROM goals WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        // Recalculate each goal’s progress in parallel
        const syncedGoals = await Promise.all(
            goals.map(g => syncGoalProgress(req.user.id, g.id))
        );

        res.json(syncedGoals.filter(Boolean));
    } catch (err) {
        console.error('Error fetching goals:', err);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Create a new goal
router.post('/', auth, async (req, res) => {
    const { note, goal_amount } = req.body;

    if (!note || !goal_amount) {
        return res.status(400).json({ error: 'Note and goal amount are required' });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO goals (user_id, note, goal_amount, allocated_amount, completed) 
             VALUES (?, ?, ?, 0, 0)`,
            [req.user.id, note, goal_amount]
        );

        const [newGoalRows] = await pool.execute(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [result.insertId, req.user.id]
        );

        res.status(201).json(newGoalRows[0]);
    } catch (err) {
        console.error('Error creating goal:', err);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    const { allocated_amount, completed } = req.body;

    try {
        const updates = [];
        const values = [];

        if (allocated_amount !== undefined) {
            const safeAmount = Number(allocated_amount);
            if (isNaN(safeAmount)) {
                return res.status(400).json({ error: 'Invalid allocated_amount value' });
            }
            updates.push('allocated_amount = ?');
            values.push(safeAmount);
        }

        if (completed !== undefined) {
            const completedValue = completed ? 1 : 0;
            updates.push('completed = ?');
            values.push(completedValue);
            updates.push(`completed_at = ${completedValue ? 'NOW()' : 'NULL'}`);
        }

        if (updates.length === 0)
            return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, goalId);

        await pool.execute(
            `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        // Always return the fresh recalculated goal
        const updatedGoal = await syncGoalProgress(req.user.id, goalId);
        res.json(updatedGoal);
    } catch (err) {
        console.error('Error updating goal:', err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
    const goalId = req.params.id;

    try {
        await pool.execute('DELETE FROM goals WHERE user_id = ? AND id = ?', [
            req.user.id,
            goalId,
        ]);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        console.error('Error deleting goal:', err);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

module.exports = router;
