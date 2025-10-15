const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Helper: Recalculate goal progress and update DB
async function syncGoalProgress(userId, goalId) {
    // Sum all amounts from entries for this goal
    const [[{ total }]] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total 
         FROM entries 
         WHERE user_id = ? AND goal_id = ?`,
        [userId, goalId]
    );

    // Fetch current goal details
    const [[goal]] = await pool.execute(
        `SELECT goal_amount, allocated_amount, completed 
         FROM goals 
         WHERE id = ? AND user_id = ?`,
        [goalId, userId]
    );

    if (!goal) return null;

    const newAllocated = Number(total);
    const isCompleted = newAllocated >= goal.goal_amount;

    // Update goal in DB
    await pool.execute(
        `UPDATE goals 
         SET allocated_amount = ?, 
             completed = ?, 
             completed_at = ?
         WHERE id = ? AND user_id = ?`,
        [newAllocated, isCompleted ? 1 : 0, isCompleted ? new Date() : null, goalId, userId]
    );

    // Return updated goal
    const [rows] = await pool.execute(
        'SELECT * FROM goals WHERE id = ? AND user_id = ?',
        [goalId, userId]
    );
    return rows[0];
}

// --- GET all goals ---
router.get('/', auth, async (req, res) => {
    try {
        // Fetch all user goals
        const [goals] = await pool.execute(
            'SELECT id, note, goal_amount, allocated_amount, completed, created_at FROM goals WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        // Recalculate progress for each goal
        const syncedGoals = await Promise.all(
            goals.map(g => syncGoalProgress(req.user.id, g.id))
        );

        res.json(syncedGoals.filter(Boolean));
    } catch (err) {
        console.error('Error fetching goals:', err);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// --- POST new goal ---
router.post('/', auth, async (req, res) => {
    const { note, goal_amount } = req.body;

    if (!note || goal_amount === undefined) {
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

// --- PUT update goal ---
router.put('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    const { note, goal_amount, allocated_amount, completed } = req.body;

    try {
        const updates = [];
        const values = [];

        if (note !== undefined) { updates.push('note = ?'); values.push(note); }
        if (goal_amount !== undefined) { updates.push('goal_amount = ?'); values.push(Number(goal_amount)); }
        if (allocated_amount !== undefined) { updates.push('allocated_amount = ?'); values.push(Number(allocated_amount)); }
        if (completed !== undefined) {
            const completedValue = completed ? 1 : 0;
            updates.push('completed = ?');
            values.push(completedValue);
            updates.push('completed_at = ?');
            values.push(completedValue ? new Date() : null);
        }

        if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, goalId);

        await pool.execute(
            `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        // Return recalculated goal
        const updatedGoal = await syncGoalProgress(req.user.id, goalId);
        res.json(updatedGoal);
    } catch (err) {
        console.error('Error updating goal:', err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// --- DELETE a goal ---
router.delete('/:id', auth, async (req, res) => {
    const goalId = req.params.id;

    try {
        // Optionally clear goal_id from entries
        await pool.execute(
            'UPDATE entries SET goal_id = NULL WHERE goal_id = ? AND user_id = ?',
            [goalId, req.user.id]
        );

        // Delete the goal
        await pool.execute('DELETE FROM goals WHERE id = ? AND user_id = ?', [goalId, req.user.id]);

        res.json({ message: 'Goal deleted' });
    } catch (err) {
        console.error('Error deleting goal:', err);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

module.exports = router;
