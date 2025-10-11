import React, { createContext, useContext, useState, useEffect } from 'react';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState(() => {
    const stored = localStorage.getItem('entries');
    if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(e => ({
            ...e,
            amount: Number(e.amount), // ensure amount is always a number
            timestamp: e.timestamp || new Date().toISOString() // fallback timestamp
        }));
    }
    return [];
});


    // Persist entries to localStorage
    useEffect(() => {
        localStorage.setItem('entries', JSON.stringify(entries));
    }, [entries]);

    // Add a new entry
    const addEntry = (entry) => {
        const newEntry = { ...entry, id: Date.now() };
        setEntries((prev) => [...prev, newEntry]);
    };

    // Delete an entry
    const deleteEntry = (id) => {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
    };

    // Deduct or return savings safely
    const deductSavings = (amount) => {
        if (amount === 0) return;

        setEntries((prev) => {
            let remaining = amount;

            if (amount > 0) {
                // Deduct from savings
                const updated = prev
                    .map((e) => {
                        if (e.type === 'saving' && remaining > 0) {
                            const deduction = Math.min(Number(e.amount), remaining);
                            remaining -= deduction;
                            return { ...e, amount: Number(e.amount) - deduction };
                        }
                        return e;
                    })
                    .filter((e) => e.amount > 0); // remove zero-amount entries
                return updated;
            } else {
                // Return money to savings
                const returnAmount = -amount;
                return [
                    ...prev,
                    { id: Date.now(), type: 'saving', amount: returnAmount }
                ];
            }
        });
    };

    // Compute total available savings
    const totalSavings = entries
        .filter((e) => e.type === 'saving')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <EntriesContext.Provider value={{ entries, addEntry, deleteEntry, deductSavings, totalSavings }}>
            {children}
        </EntriesContext.Provider>
    );
}

export const useEntries = () => useContext(EntriesContext);
