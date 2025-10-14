const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

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
        const updates = [];
        const values = [];

        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
        if (note !== undefined) { updates.push('note = ?'); values.push(note); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (goal_id !== undefined) { updates.push('goal_id = ?'); values.push(goal_id); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        values.push(req.user.id, entryId);

        await pool.execute(
            `UPDATE entries SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

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
        await pool.execute(
            'DELETE FROM entries WHERE user_id = ? AND id = ?',
            [req.user.id, entryId]
        );
        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting entry:', err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

module.exports = router;
