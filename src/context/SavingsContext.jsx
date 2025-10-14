import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const SavingsContext = createContext();

export function SavingsProvider({ children }) {
    const [savings, setSavings] = useState([]);
    const token = localStorage.getItem('token');

    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` },
    });

    const fetchSavings = async (month, year) => {
        if (!month || !year) return;
        try {
            const res = await api.get(`/savings?month=${month}&year=${year}`, authHeaders());
            setSavings(res.data);
        } catch (err) {
            console.error('Failed to fetch savings:', err);
        }
    };

    const addSaving = async (saving) => {
        try {
            const res = await api.post('/savings', saving, authHeaders());
            setSavings((prev) => [res.data, ...prev]);
            return res.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const updateSaving = async (id, updates) => {
        try {
            await api.put(`/savings/${id}`, updates, authHeaders());
            setSavings((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteSaving = async (id) => {
        try {
            await api.delete(`/savings/${id}`, authHeaders());
            setSavings((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <SavingsContext.Provider value={{ savings, fetchSavings, addSaving, updateSaving, deleteSaving }}>
            {children}
        </SavingsContext.Provider>
    );
}

export const useSavings = () => useContext(SavingsContext);
