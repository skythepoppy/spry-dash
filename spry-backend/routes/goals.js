const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all goals for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const [goals] = await pool.execute('SELECT * FROM goals WHERE user_id = ?', [req.user.id]);
        res.json(goals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Create a new goal
router.post('/', auth, async (req, res) => {
    let { note, goal_amount } = req.body;

    note = note ?? '';
    goal_amount = goal_amount ?? 0;

    try {
        const [result] = await pool.execute(
            `INSERT INTO goals 
            (user_id, note, goal_amount, allocated_amount, completed) 
            VALUES (?, ?, ?, 0, 0)`,
            [req.user.id, note, goal_amount]
        );
        res.status(201).json({ message: 'Goal created', goalId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update a goal (allocate or mark complete)
router.put('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    const { allocated_amount, completed, note } = req.body;


    try {
        const updates = [];
        const values = [];

        if (allocated_amount !== undefined) {
            updates.push('allocated_amount = ?');
            values.push(allocated_amount);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            values.push(completed ? 1 : 0);
        }
        if (note !== undefined) {
            updates.push('note = ?');
            values.push(note);
        }

        if (updates.length === 0)
            return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, goalId);

        console.log("🧠 Update payload:", { allocated_amount, completed, note });
        console.log("🧠 Final SQL:", `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`);
        console.log("🧠 Values:", values);


        await pool.execute(
            `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        // ✅ Return the updated goal (only one response)
        const [updatedGoal] = await pool.execute(
            'SELECT * FROM goals WHERE user_id = ? AND id = ?',
            [req.user.id, goalId]
        );

        if (updatedGoal.length === 0)
            return res.status(404).json({ error: 'Goal not found' });

        res.status(200).json(updatedGoal[0]);
    } catch (err) {
        console.error('Error updating goal:', err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});


// Delete a goal
router.delete('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    try {
        await pool.execute('DELETE FROM goals WHERE user_id = ? AND id = ?', [req.user.id, goalId]);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

module.exports = router;
