import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const SavingsContext = createContext();

export function SavingsProvider({ children }) {
    const [savings, setSavings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');

    const authHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

    const fetchSavings = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await api.get('/savings', authHeaders());
            setSavings(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch savings.');
        } finally { setLoading(false); }
    };

    const addSaving = async (data) => {
        const res = await api.post('/savings', data, authHeaders());
        setSavings(prev => [res.data, ...prev]);
    };

    const deleteSaving = async (id) => {
        await api.delete(`/savings/${id}`, authHeaders());
        setSavings(prev => prev.filter(s => s.id !== id));
    };

    useEffect(() => { fetchSavings(); }, [token]);

    return (
        <SavingsContext.Provider value={{ savings, addSaving, deleteSaving, fetchSavings, loading, error }}>
            {children}
        </SavingsContext.Provider>
    );
}

export const useSavings = () => useContext(SavingsContext);
