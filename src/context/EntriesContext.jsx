import React, { createContext, useContext, useState, useEffect } from 'react';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState(() => {
        const stored = localStorage.getItem('entries');
        return stored ? JSON.parse(stored) : [];
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

    // Deduct or return savings
    const deductSavings = (amount) => {
        if (amount === 0) return;

        if (amount > 0) {
            // Deduct from savings
            let remaining = amount;
            setEntries((prev) =>
                prev
                    .map((e) => {
                        if (e.type === 'saving' && remaining > 0) {
                            const deduction = Math.min(Number(e.amount), remaining);
                            remaining -= deduction;
                            return { ...e, amount: Number(e.amount) - deduction };
                        }
                        return e;
                    })
                    .filter((e) => e.amount > 0) // remove zero-amount entries
            );
        } else {
            // Return money to savings
            const returnAmount = -amount;
            setEntries((prev) => [
                ...prev,
                { id: Date.now(), type: 'saving', amount: returnAmount }
            ]);
        }
    };

    return (
        <EntriesContext.Provider value={{ entries, addEntry, deleteEntry, deductSavings }}>
            {children}
        </EntriesContext.Provider>
    );
}

export const useEntries = () => useContext(EntriesContext);
