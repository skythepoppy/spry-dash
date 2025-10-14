import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Automatically keep token in sync if it changes elsewhere
    useEffect(() => {
        const handleStorageChange = () => setToken(localStorage.getItem('token'));
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const authHeaders = useCallback(() => ({
        headers: { Authorization: `Bearer ${token}` },
    }), [token]);

    // Fetch all entries for logged-in user
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

    // Add a new entry
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

    // Update existing entry
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

    // Delete an entry
    const deleteEntry = async (id) => {
        try {
            await api.delete(`/entries/${id}`, authHeaders());
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Failed to delete entry:', err.response?.data || err.message);
            throw err;
        }
    };

    return (
        <EntriesContext.Provider
            value={{
                entries,
                loading,
                error,
                addEntry,
                updateEntry,
                deleteEntry,
                fetchEntries
            }}
        >
            {children}
        </EntriesContext.Provider>
    );
}

export const useEntries = () => useContext(EntriesContext);
