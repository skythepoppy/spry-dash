import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const ExpensesContext = createContext();

export function ExpensesProvider({ children }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    const fetchExpenses = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await api.get('/expenses', authHeaders());
            setExpenses(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch expenses.');
        } finally {
            setLoading(false);
        }
    };

    const addExpense = async (data) => {
        const res = await api.post('/expenses', data, authHeaders());
        setExpenses(prev => [res.data, ...prev]);
    };

    const deleteExpense = async (id) => {
        await api.delete(`/expenses/${id}`, authHeaders());
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    useEffect(() => { fetchExpenses(); }, [token]);

    return (
        <ExpensesContext.Provider value={{ expenses, addExpense, deleteExpense, fetchExpenses, loading, error }}>
            {children}
        </ExpensesContext.Provider>
    );
}

export const useExpenses = () => useContext(ExpensesContext);
