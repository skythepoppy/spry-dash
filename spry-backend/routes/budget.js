const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET budget allocations for the current active session
router.get('/', auth, async (req, res) => {
  try {
    //  Get the active session for this user
    const [[session]] = await pool.execute(
      `SELECT * FROM budget_sessions WHERE user_id = ? AND is_active = TRUE LIMIT 1`,
      [req.user.id]
    );

    if (!session) {
      return res.status(404).json({ message: 'No active budget session found' });
    }

    const sessionId = session.id;

    // Get allocations for this session
    const [allocationsRows] = await pool.execute(
      `SELECT entry_id, amount_allocated FROM budget_allocations WHERE session_id = ?`,
      [sessionId]
    );

    res.json({
      sessionId,
      allocations: allocationsRows,
    });
  } catch (err) {
    console.error('Error fetching budget:', err);
    console.error(err.stack);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// PUT (update/create) allocations for the active session
router.put('/', auth, async (req, res) => {
  try {
    const { allocations } = req.body; // [{ entry_id, amount_allocated }, ...]

    if (!allocations || !Array.isArray(allocations)) {
      return res.status(400).json({ error: 'Allocations must be an array' });
    }

    // Get or create the active session
    let [[session]] = await pool.execute(
      `SELECT * FROM budget_sessions WHERE user_id = ? AND is_active = TRUE LIMIT 1`,
      [req.user.id]
    );

    let sessionId;

    if (session) {
      sessionId = session.id;
    } else {
      const [result] = await pool.execute(
        `INSERT INTO budget_sessions (user_id, created_at, is_active) VALUES (?, NOW(), TRUE)`,
        [req.user.id]
      );
      sessionId = result.insertId;
    }

    // Upsert each allocation
    for (const alloc of allocations) {
      const { entry_id, amount_allocated } = alloc;

      await pool.execute(
        `INSERT INTO budget_allocations (session_id, entry_id, amount_allocated)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE amount_allocated = ?`,
        [sessionId, entry_id, amount_allocated, amount_allocated]
      );
    }

    res.json({ success: true, message: 'Budget allocations updated', sessionId });
  } catch (err) {
    console.error('Error updating budget:', err);
    console.error(err.stack);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

module.exports = router;
