import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState([]);
    const token = localStorage.getItem('token'); // JWT stored after login

    // Helper to set Authorization header
    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` },
    });

    // Fetch entries for logged-in user
    const fetchEntries = async () => {
        try {
            const res = await api.get('/entries', authHeaders());
            setEntries(res.data); // use the backend response directly
        } catch (err) {
            console.error('Failed to fetch entries:', err.response?.data || err.message);
        }
    };

    useEffect(() => {
        if (token) fetchEntries();
    }, [token]);

    // Add a new entry
    const addEntry = async (entryData) => {
        try {
            const response = await api.post('/entries', entryData, authHeaders());
            const newEntry = response.data; // full row from backend
            setEntries(prev => [newEntry, ...prev]);
            return newEntry;
        } catch (err) {
            console.error('Failed to add entry:', err);
            throw err;
        }
    };


    // Update an entry
    const updateEntry = async (id, updates) => {
        try {
            const res = await api.put(`/entries/${id}`, updates, authHeaders());
            setEntries((prev) =>
                prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
            );
        } catch (err) {
            console.error('Failed to update entry:', err.response?.data || err.message);
        }
    };

    // Delete an entry
    const deleteEntry = async (id) => {
        try {
            await api.delete(`/entries/${id}`, authHeaders());
            setEntries((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error('Failed to delete entry:', err.response?.data || err.message);
        }
    };

    return (
        <EntriesContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry, fetchEntries }}>
            {children}
        </EntriesContext.Provider>
    );
}

export const useEntries = () => useContext(EntriesContext);
