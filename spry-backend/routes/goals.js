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
    const { title, goalAmount, autoPercentage = 0, autoType = 'monthly' } = req.body;
    try {
        const [result] = await pool.execute(
            `INSERT INTO goals 
            (user_id, title, goal_amount, allocated_amount, auto_percentage, auto_type, completed) 
            VALUES (?, ?, ?, 0, ?, ?, 0)`,
            [req.user.id, title, goalAmount, autoPercentage, autoType]
        );
        res.status(201).json({ message: 'Goal created', goalId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update a goal (allocate, mark complete, or edit auto settings)
router.put('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    const { allocatedAmount, completed, autoPercentage, autoType } = req.body;

    try {
        // Build dynamic query
        const updates = [];
        const values = [];

        if (allocatedAmount !== undefined) {
            updates.push('allocated_amount = ?');
            values.push(allocatedAmount);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            values.push(completed ? 1 : 0);
        }
        if (autoPercentage !== undefined) {
            updates.push('auto_percentage = ?');
            values.push(autoPercentage);
        }
        if (autoType !== undefined) {
            updates.push('auto_type = ?');
            values.push(autoType);
        }

        if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, goalId); // for WHERE clause

        const [result] = await pool.execute(
            `UPDATE goals SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        res.json({ message: 'Goal updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
    const goalId = req.params.id;
    try {
        const [result] = await pool.execute('DELETE FROM goals WHERE user_id = ? AND id = ?', [
            req.user.id,
            goalId,
        ]);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

module.exports = router;
