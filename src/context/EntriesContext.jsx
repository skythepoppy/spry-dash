import React, { createContext, useContext, useState } from 'react';

const EntriesContext = createContext();

export function EntriesProvider({ children }) {
  const [entries, setEntries] = useState([]);

  const addEntry = (entry) => setEntries((prev) => [...prev, entry]);
  const deleteEntry = (id) =>
    setEntries((prev) => prev.filter((entry) => entry.id !== id));

  return (
    <EntriesContext.Provider value={{ entries, addEntry, deleteEntry }}>
      {children}
    </EntriesContext.Provider>
  );
}

export const useEntries = () => useContext(EntriesContext);
