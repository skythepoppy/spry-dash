import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useSavingsGoals } from './SavingsGoalsContext'; // Import context to refresh goals

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const { refreshGoals } = useSavingsGoals(); // To refresh goals when savingsgoal changes

    // Sync token if it changes elsewhere
    useEffect(() => {
        const handleStorageChange = () => setToken(localStorage.getItem('token'));
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const authHeaders = useCallback(() => ({
        headers: { Authorization: `Bearer ${token}` },
    }), [token]);

    const fetchEntries = useCallback(async (month = currentMonth, year = currentYear) => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/entries?month=${month}&year=${year}`, authHeaders());
            setEntries(res.data || []);
        } catch (err) {
            console.error('Failed to fetch entries:', err.response?.data || err.message);
            setError('Failed to load entries.');
        } finally {
            setLoading(false);
        }
    }, [token, authHeaders, currentMonth, currentYear]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const expenseCategories = ['rent', 'food', 'utilities', 'entertainment', 'clothing', 'other'];
    const savingCategories = ['emergency', 'roth ira', 'stocks', '401k', 'savingsgoal'];

    const addEntry = async (entryData) => {
        const { type, category } = entryData;

        // Validate category
        if (type === 'expense' && !expenseCategories.includes(category)) {
            throw new Error(`Invalid expense category: ${category}`);
        }
        if (type === 'saving' && !savingCategories.includes(category)) {
            throw new Error(`Invalid saving category: ${category}`);
        }

        try {
            const res = await api.post('/entries', entryData, authHeaders());
            const newEntry = res.data;
            setEntries(prev => [newEntry, ...prev]);

            // If it's a savingsgoal entry, refresh goals
            if (newEntry.type === 'saving' && newEntry.category?.toLowerCase() === 'savingsgoal') {
                refreshGoals();
            }

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

            // Refresh goals if savingsgoal
            if (updated.type === 'saving' && updated.category?.toLowerCase() === 'savingsgoal') {
                refreshGoals();
            }

            return updated;
        } catch (err) {
            console.error('Failed to update entry:', err.response?.data || err.message);
            throw err;
        }
    };

    const deleteEntry = async (id) => {
        try {
            const entryToDelete = entries.find(e => e.id === id);

            await api.delete(`/entries/${id}`, authHeaders());
            setEntries(prev => prev.filter(e => e.id !== id));

            // Refresh goals if savingsgoal
            if (entryToDelete?.type === 'saving' && entryToDelete.category?.toLowerCase() === 'savingsgoal') {
                refreshGoals();
            }
        } catch (err) {
            console.error('Failed to delete entry:', err.response?.data || err.message);
            throw err;
        }
    };

    // Filter entries by current month/year
    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const date = e.created_at ? new Date(e.created_at) : new Date();
            return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
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
