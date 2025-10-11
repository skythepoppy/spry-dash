const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all entries for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const [entries] = await pool.execute('SELECT * FROM entries WHERE user_id = ?', [req.user.id]);
        res.json(entries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Create a new entry
router.post('/', auth, async (req, res) => {
    const { type, amount, description, date } = req.body;
    try {
        const [result] = await pool.execute(
            `INSERT INTO entries (user_id, type, amount, description, date) 
            VALUES (?, ?, ?, ?, ?)`,
            [req.user.id, type, amount, description || null, date || new Date()]
        );
        res.status(201).json({ message: 'Entry created', entryId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// Update an entry
router.put('/:id', auth, async (req, res) => {
    const entryId = req.params.id;
    const { type, amount, description, date } = req.body;

    try {
        const updates = [];
        const values = [];

        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (date !== undefined) { updates.push('date = ?'); values.push(date); }

        if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, entryId);

        await pool.execute(
            `UPDATE entries SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        res.json({ message: 'Entry updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Delete an entry
router.delete('/:id', auth, async (req, res) => {
    const entryId = req.params.id;
    try {
        await pool.execute('DELETE FROM entries WHERE user_id = ? AND id = ?', [req.user.id, entryId]);
        res.json({ message: 'Entry deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

module.exports = router;
