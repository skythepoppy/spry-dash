const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// 🧩 Get the active budget for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    // Find user's active session
    const [[session]] = await pool.execute(
      `SELECT id FROM budget_sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!session) {
      return res.status(404).json({ message: 'No active budget session found' });
    }

    const sessionId = session.id;

    // Get total income and expenses
    const [[incomeResult]] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) AS total_income FROM entries WHERE user_id = ? AND type = 'saving' AND session_id = ?`,
      [req.user.id, sessionId]
    );

    const [[expenseResult]] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) AS total_expense FROM entries WHERE user_id = ? AND type = 'expense' AND session_id = ?`,
      [req.user.id, sessionId]
    );

    const totalIncome = incomeResult.total_income || 0;
    const totalExpense = expenseResult.total_expense || 0;

    const remaining = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      remaining,
      sessionId,
    });
  } catch (err) {
    console.error('Error fetching budget:', err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// 🧩 Update the user’s budget (optional feature)
router.put('/', auth, async (req, res) => {
  try {
    const { newBudget } = req.body;
    if (!newBudget) return res.status(400).json({ error: 'Missing newBudget field' });

    const [[session]] = await pool.execute(
      `SELECT id FROM budget_sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    await pool.execute(
      `UPDATE budget_sessions SET total_budget = ? WHERE id = ?`,
      [newBudget, session.id]
    );

    res.json({ message: 'Budget updated successfully', newBudget });
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

module.exports = router;
