import React, { createContext, useContext, useState } from 'react';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
  const [goals, setGoals] = useState([]);

  const addGoal = (goal) => setGoals((prev) => [...prev, { ...goal, id: Date.now(), achieved: false }]);
  const deleteGoal = (id) => setGoals((prev) => prev.filter((goal) => goal.id !== id));
  const markAchieved = (id) =>
    setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, achieved: true } : goal)));

  return (
    <SavingsGoalsContext.Provider value={{ goals, addGoal, deleteGoal, markAchieved }}>
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);