// src/context/EntriesContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState([]);

    // Fetch entries for logged-in user
    const fetchEntries = async () => {
        try {
            const res = await api.get('/entries');
            setEntries(res.data);
        } catch (err) {
            console.error('Failed to fetch entries:', err);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    // Add a new entry
    const addEntry = async (entry) => {
        try {
            const res = await api.post('/entries', entry);
            setEntries((prev) => [...prev, { ...entry, id: res.data.entryId }]);
        } catch (err) {
            console.error('Failed to add entry:', err);
        }
    };

    // Update an entry
    const updateEntry = async (id, updates) => {
        try {
            await api.put(`/entries/${id}`, updates);
            setEntries((prev) =>
                prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
            );
        } catch (err) {
            console.error('Failed to update entry:', err);
        }
    };

    // Delete an entry
    const deleteEntry = async (id) => {
        try {
            await api.delete(`/entries/${id}`);
            setEntries((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    return (
        <EntriesContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry }}>
            {children}
        </EntriesContext.Provider>
    );
}

export const useEntries = () => useContext(EntriesContext);
