import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const BudgetsContext = createContext();

export function BudgetsProvider({ children }) {
    const [budgets, setBudgets] = useState([]);
    const token = localStorage.getItem('token');

    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` },
    });

    const fetchBudgets = async (month, year) => {
        if (!month || !year) return;
        try {
            const res = await api.get(`/budgets?month=${month}&year=${year}`, authHeaders());
            setBudgets(res.data);
        } catch (err) {
            console.error('Failed to fetch budgets:', err);
        }
    };

    const updateBudget = async (expenseId, updates) => {
        try {
            const res = await api.put(`/budgets/${expenseId}`, updates, authHeaders());
            setBudgets((prev) =>
                prev.map((b) => (b.expenseId === expenseId ? { ...b, ...updates } : b))
            );
            return res.data;
        } catch (err) {
            console.error('Failed to update budget:', err);
        }
    };

    return (
        <BudgetsContext.Provider value={{ budgets, fetchBudgets, updateBudget }}>
            {children}
        </BudgetsContext.Provider>
    );
}

export const useBudgets = () => useContext(BudgetsContext);
