import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const BudgetsContext = createContext();

export function BudgetsProvider({ children }) {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    const fetchBudgets = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await api.get('/budgets', authHeaders());
            setBudgets(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch budgets.');
        } finally { setLoading(false); }
    };

    const addBudget = async (data) => {
        const res = await api.post('/budgets', data, authHeaders());
        setBudgets(prev => [res.data, ...prev]);
    };

    const deleteBudget = async (id) => {
        await api.delete(`/budgets/${id}`, authHeaders());
        setBudgets(prev => prev.filter(b => b.id !== id));
    };

    useEffect(() => { fetchBudgets(); }, [token]);

    return (
        <BudgetsContext.Provider value={{ budgets, addBudget, deleteBudget, fetchBudgets, loading, error }}>
            {children}
        </BudgetsContext.Provider>
    );
}

export const useBudgets = () => useContext(BudgetsContext);
