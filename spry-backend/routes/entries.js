const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all entries for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        // Explicitly select columns to ensure created_at is included
        const [entries] = await pool.execute(
            'SELECT id, user_id, type, amount, note, created_at FROM entries WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        // Optional: fill in missing created_at just in case
        const safeEntries = entries.map(e => ({
            ...e,
            created_at: e.created_at ?? new Date()
        }));

        res.json(safeEntries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Create a new entry
router.post('/', auth, async (req, res) => {
    const { type, amount, note } = req.body; // no created_at
    try {
        const [result] = await pool.execute(
            `INSERT INTO entries (user_id, type, amount, note) 
             VALUES (?, ?, ?, ?)`,
            [req.user.id, type, amount, note || null]
        );

        // Fetch the full row including created_at
        const [newEntryRows] = await pool.execute(
            'SELECT * FROM entries WHERE id = ? AND user_id = ?',
            [result.insertId, req.user.id]
        );

        res.status(201).json(newEntryRows[0]); // return full entry
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});


// Update an entry
router.put('/:id', auth, async (req, res) => {
    const entryId = req.params.id;
    const { type, amount, note } = req.body;

    try {
        const updates = [];
        const values = [];

        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
        if (note !== undefined) { updates.push('note = ?'); values.push(note); }

        if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

        values.push(req.user.id, entryId);

        await pool.execute(
            `UPDATE entries SET ${updates.join(', ')} WHERE user_id = ? AND id = ?`,
            values
        );

        // Return the updated entry
        const [updatedEntry] = await pool.execute(
            'SELECT id, user_id, type, amount, note, created_at FROM entries WHERE user_id = ? AND id = ?',
            [req.user.id, entryId]
        );

        res.json(updatedEntry[0]);
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
