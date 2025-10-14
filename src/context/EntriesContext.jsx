import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Sync token if it changes elsewhere
    useEffect(() => {
        const handleStorageChange = () => setToken(localStorage.getItem('token'));
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const authHeaders = useCallback(() => ({
        headers: { Authorization: `Bearer ${token}` },
    }), [token]);

    const fetchEntries = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/entries', authHeaders());
            setEntries(res.data || []);
        } catch (err) {
            console.error('Failed to fetch entries:', err.response?.data || err.message);
            setError('Failed to load entries.');
        } finally {
            setLoading(false);
        }
    }, [token, authHeaders]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const addEntry = async (entryData) => {
        try {
            const res = await api.post('/entries', entryData, authHeaders());
            const newEntry = res.data;
            setEntries(prev => [newEntry, ...prev]);
            return newEntry;
        } catch (err) {
            console.error('Failed to add entry:', err.response?.data || err.message);
            throw err;
        }
    };

    const updateEntry = async (id, updates) => {
        try {
            const res = await api.put(`/entries/${id}`, updates, authHeaders());
            const updated = res.data;
            setEntries(prev =>
                prev.map(e => (e.id === id ? updated : e))
            );
            return updated;
        } catch (err) {
            console.error('Failed to update entry:', err.response?.data || err.message);
            throw err;
        }
    };

    const deleteEntry = async (id) => {
        try {
            await api.delete(`/entries/${id}`, authHeaders());
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Failed to delete entry:', err.response?.data || err.message);
            throw err;
        }
    };

    // Filter entries by current month/year
    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const date = e.created_at ? new Date(e.created_at) : new Date();
            return (
                date.getMonth() + 1 === currentMonth &&
                date.getFullYear() === currentYear
            );
        });
    }, [entries, currentMonth, currentYear]);

    return (
        <EntriesContext.Provider
            value={{
                entries,
                filteredEntries,
                loading,
                error,
                addEntry,
                updateEntry,
                deleteEntry,
                fetchEntries,
                currentMonth,
                currentYear,
                setCurrentMonth,
                setCurrentYear
            }}
        >
            {children}
        </EntriesContext.Provider>
    );
}

export const useEntries = () => useContext(EntriesContext);
