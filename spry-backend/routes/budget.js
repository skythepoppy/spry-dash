const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET budget for the user (per category + total)
router.get('/', auth, async (req, res) => {
  try {
    // Fetch the latest session for this month/year
    const [[session]] = await pool.execute(
      `SELECT * FROM budget_sessions 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!session) {
      return res.status(404).json({ message: 'No budget session found' });
    }

    const sessionId = session.id;

    // Fetch allocations per category
    const [allocationsRows] = await pool.execute(
      `SELECT category, amount_allocated FROM budget_allocations WHERE session_id = ?`,
      [sessionId]
    );

    const allocations = {};
    allocationsRows.forEach(row => {
      allocations[row.category] = Number(row.amount_allocated);
    });

    res.json({
      totalIncome: Number(session.total_income || 0),
      allocations,
      sessionId,
    });
  } catch (err) {
    console.error('Error fetching budget:', err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// PUT update/create budget session with allocations
router.put('/', auth, async (req, res) => {
  try {
    const { allocations, totalIncome, month, year } = req.body;
    if (!allocations || !totalIncome) {
      return res.status(400).json({ error: 'Missing allocations or totalIncome' });
    }

    // Check if a session exists for this user/month/year
    const [[existingSession]] = await pool.execute(
      `SELECT id FROM budget_sessions WHERE user_id = ? AND month = ? AND year = ?`,
      [req.user.id, month, year]
    );

    let sessionId;
    if (existingSession) {
      sessionId = existingSession.id;
      // Update totalIncome
      await pool.execute(
        `UPDATE budget_sessions SET total_income = ? WHERE id = ?`,
        [totalIncome, sessionId]
      );
    } else {
      // Create a new session
      const [result] = await pool.execute(
        `INSERT INTO budget_sessions (user_id, month, year, total_income) VALUES (?, ?, ?, ?)`,
        [req.user.id, month, year, totalIncome]
      );
      sessionId = result.insertId;
    }

    // Upsert allocations per category
    for (const [category, amount] of Object.entries(allocations)) {
      await pool.execute(
        `INSERT INTO budget_allocations (session_id, category, amount_allocated)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE amount_allocated = ?`,
        [sessionId, category, amount, amount]
      );
    }

    res.json({ success: true, message: 'Budget updated successfully', sessionId });
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

module.exports = router;
