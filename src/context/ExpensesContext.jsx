import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const ExpensesContext = createContext();

export function ExpensesProvider({ children }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` },
    });

    const fetchExpenses = async (month, year) => {
        if (!month || !year) return;
        try {
            setLoading(true);
            const res = await api.get(`/expenses?month=${month}&year=${year}`, authHeaders());
            setExpenses(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch expenses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addExpense = async (expense) => {
        try {
            const res = await api.post('/expenses', expense, authHeaders());
            setExpenses((prev) => [res.data, ...prev]);
            return res.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateExpense = async (id, updates) => {
        try {
            await api.put(`/expenses/${id}`, updates, authHeaders());
            setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteExpense = async (id) => {
        try {
            await api.delete(`/expenses/${id}`, authHeaders());
            setExpenses((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <ExpensesContext.Provider
            value={{ expenses, loading, error, fetchExpenses, addExpense, updateExpense, deleteExpense }}
        >
            {children}
        </ExpensesContext.Provider>
    );
}

export const useExpenses = () => useContext(ExpensesContext);
