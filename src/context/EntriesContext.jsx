import React, { createContext, useContext, useState, useEffect } from 'react';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
    const [entries, setEntries] = useState(() => {
        // Load from localStorage on page load
        const stored = localStorage.getItem('entries');
        return stored ? JSON.parse(stored) : [];
    });

    // Save to localStorage whenever entries change
    useEffect(() => {
        localStorage.setItem('entries', JSON.stringify(entries));
    }, [entries]);

    const addEntry = (entry) => {
        const newEntry = {
            ...entry,
            id: Date.now(),
            timestamp: new Date().toISOString(),
        };
        setEntries((prev) => [...prev, newEntry]);
    };

    const deleteEntry = (id) => {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
    };

    return (
        <EntriesContext.Provider value={{ entries, addEntry, deleteEntry }}>
            {children}
        </EntriesContext.Provider>
    );
}

export const useEntries = () => useContext(EntriesContext);
