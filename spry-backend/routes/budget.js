const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET current active monthly budget
router.get('/', auth, async (req, res) => {
    try {
        const [[session]] = await pool.execute(
            `SELECT * FROM budget_sessions 
       WHERE user_id = ? 
       AND is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT 1`,
            [req.user.id]
        );

        if (!session) {
            return res.status(404).json({ message: 'No active budget session found' });
        }

        const [allocations] = await pool.execute(
            `SELECT entry_id, amount_allocated 
       FROM budget_allocations 
       WHERE session_id = ?`,
            [session.id]
        );

        res.json({
            sessionId: session.id,
            monthly_income: session.total_income,
            unallocated_income: session.unallocated_income,
            allocations
        });
    } catch (err) {
        console.error('Error fetching budget:', err);
        res.status(500).json({ error: 'Failed to fetch budget' });
    }
});

// PUT  budget
router.put('/', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { allocations, monthly_income } = req.body;

        if (!allocations || !Array.isArray(allocations)) {
            return res.status(400).json({ error: 'Allocations must be an array' });
        }

        await connection.beginTransaction();

        const [[existingSession]] = await connection.execute(
            `SELECT * FROM budget_sessions 
       WHERE user_id = ? 
       AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(created_at) = YEAR(CURRENT_DATE()) 
       LIMIT 1`,
            [req.user.id]
        );

        let sessionId;
        let total_income = Number(monthly_income) || 0;

        if (existingSession) {
            sessionId = existingSession.id;

            if (total_income && total_income !== existingSession.total_income) {
                await connection.execute(
                    `UPDATE budget_sessions 
           SET total_income = ? 
           WHERE id = ?`,
                    [total_income, sessionId]
                );
            } else {
                total_income = existingSession.total_income;
            }
        } else {
            await connection.execute(
                `UPDATE budget_sessions 
         SET is_active = FALSE 
         WHERE user_id = ?`,
                [req.user.id]
            );

            const [result] = await connection.execute(
                `INSERT INTO budget_sessions (user_id, total_income, unallocated_income, created_at, is_active)
         VALUES (?, ?, ?, NOW(), TRUE)`,
                [req.user.id, total_income, total_income]
            );
            sessionId = result.insertId;
        }

        // Remove old allocations for this session before reinserting new ones
        await connection.execute(
            `DELETE FROM budget_allocations WHERE session_id = ?`,
            [sessionId]
        );

        // Insert fresh allocations
        let totalAllocated = 0;
        for (const { entry_id, amount_allocated } of allocations) {
            const amount = Number(amount_allocated) || 0;
            totalAllocated += amount;

            await connection.execute(
                `INSERT INTO budget_allocations (session_id, entry_id, amount_allocated)
         VALUES (?, ?, ?)`,
                [sessionId, entry_id, amount]
            );
        }

        const unallocated_income = Math.max(total_income - totalAllocated, 0);

        await connection.execute(
            `UPDATE budget_sessions 
       SET unallocated_income = ? 
       WHERE id = ?`,
            [unallocated_income, sessionId]
        );

        await connection.commit();

        const [updatedAllocations] = await connection.execute(
            `SELECT entry_id, amount_allocated FROM budget_allocations WHERE session_id = ?`,
            [sessionId]
        );

        res.json({
            success: true,
            message: 'Budget updated successfully',
            sessionId,
            monthly_income: total_income,
            unallocated_income,
            allocations: updatedAllocations
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error updating budget:', err);
        res.status(500).json({ error: 'Failed to update budget' });
    } finally {
        connection.release();
    }
});


// DELETE budget session for current month
router.delete('/', auth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Find the current month session
        const [[session]] = await connection.execute(
            `SELECT * FROM budget_sessions 
       WHERE user_id = ? 
       AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(created_at) = YEAR(CURRENT_DATE()) 
       LIMIT 1`,
            [req.user.id]
        );

        if (!session) {
            return res.status(404).json({ message: 'No budget session found to delete' });
        }

        // Delete allocations
        await connection.execute(
            `DELETE FROM budget_allocations WHERE session_id = ?`,
            [session.id]
        );

        // Delete session itself
        await connection.execute(
            `DELETE FROM budget_sessions WHERE id = ?`,
            [session.id]
        );

        await connection.commit();

        res.json({ success: true, message: 'Budget session deleted' });
    } catch (err) {
        await connection.rollback();
        console.error('Error deleting budget session:', err);
        res.status(500).json({ error: 'Failed to delete budget session' });
    } finally {
        connection.release();
    }
});
module.exports = router;
