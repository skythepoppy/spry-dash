const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all goals for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(goals);
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

        // Return the full created goal (including timestamps)
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

// ✅ Update a goal (allocate funds or mark as completed)
router.put('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    const { allocated_amount, completed } = req.body;

    try {
        const updates = [];
        const values = [];

        // Ensure allocated_amount is always numeric or defaults to 0
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

            // Handle timestamp logic safely
            if (completedValue) {
                updates.push('completed_at = NOW()');
            } else {
                updates.push('completed_at = NULL');
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        values.push(req.user.id, goalId);

        await pool.execute(
            `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        const [updatedRows] = await pool.execute(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [goalId, req.user.id]
        );

        res.json(updatedRows[0]);
    } catch (err) {
        console.error('Error updating goal:', err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});// ✅ Update a goal (allocate funds or mark as completed)
router.put('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    const { allocated_amount, completed } = req.body;

    console.log("🧠 Incoming update body:", req.body);

    try {
        const updates = [];
        const values = [];

        // ✅ Only include allocated_amount if it's actually defined and numeric
        if (allocated_amount !== undefined && allocated_amount !== null) {
            const safeAmount = Number(allocated_amount);
            if (isNaN(safeAmount)) {
                console.error("🚫 Invalid allocated_amount:", allocated_amount);
                return res.status(400).json({ error: 'Invalid allocated_amount value' });
            }
            updates.push('allocated_amount = ?');
            values.push(safeAmount);
        }

        // ✅ Handle completed safely
        if (completed !== undefined && completed !== null) {
            const completedValue = completed ? 1 : 0;
            updates.push('completed = ?');
            values.push(completedValue);

            if (completedValue) {
                updates.push('completed_at = NOW()');
            } else {
                updates.push('completed_at = NULL');
            }
        }

        // ✅ Stop early if no valid updates
        if (updates.length === 0) {
            console.warn("⚠️ Nothing to update for goal:", goalId);
            return res.status(400).json({ error: 'Nothing to update' });
        }

        values.push(req.user.id, goalId);

        console.log("🧩 Final SQL:", `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`);
        console.log("🧩 Values:", values);

        await pool.execute(
            `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        // ✅ Fetch and return updated goal
        const [updatedRows] = await pool.execute(
            'SELECT * FROM goals WHERE id = ? AND user_id = ?',
            [goalId, req.user.id]
        );

        res.json(updatedRows[0]);
    } catch (err) {
        console.error('❌ Error updating goal:', err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});


// ✅ Delete a goal
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
