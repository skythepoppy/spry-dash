import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEntries } from './EntriesContext';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
  const [goals, setGoals] = useState(() => {
    const stored = localStorage.getItem('goals');
    return stored ? JSON.parse(stored) : [];
  });

  const { deductSavings } = useEntries();

  // Persist goals to localStorage
  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  // Add goal
  const addGoal = (goal) => {
    setGoals((prev) => [
      ...prev,
      {
        ...goal,
        id: Date.now(),
        allocatedAmount: 0,
        completed: false,
        autoPercentage: goal.autoPercentage || 0,
        autoType: goal.autoType || 'monthly',
        lastAutoApplied: null,
      },
    ]);
  };

  // Delete goal
  const deleteGoal = (id) => {
    const goalToDelete = goals.find((g) => g.id === id);
    if (goalToDelete && goalToDelete.allocatedAmount > 0) {
      deductSavings(-goalToDelete.allocatedAmount); // return to savings
    }
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  // Allocate money to goal (manual)
  const allocateToGoal = (id, amount) => {
    if (amount <= 0) return;
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === id) {
          const newAllocated = goal.allocatedAmount + amount;
          deductSavings(amount); // deduct from savings
          return {
            ...goal,
            allocatedAmount: newAllocated,
            completed: newAllocated >= goal.goalAmount,
          };
        }
        return goal;
      })
    );
  };

  // Lock auto settings
  const lockInAutoSettings = (id, autoPercentage, autoType) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id ? { ...goal, autoPercentage, autoType } : goal
      )
    );
  };

  // Safe auto allocation
  const performAutoAllocation = (totalSavings) => {
    if (totalSavings <= 0) return;

    const now = new Date();
    const allocations = [];

    const updatedGoals = goals.map((goal) => {
      if (goal.autoPercentage > 0) {
        const shouldAllocate = (() => {
          if (!goal.lastAutoApplied) return true;
          const last = new Date(goal.lastAutoApplied);
          if (goal.autoType === 'weekly') {
            return (now - last) / (1000 * 60 * 60 * 24 * 7) >= 1;
          }
          if (goal.autoType === 'monthly') {
            return now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear();
          }
          return false;
        })();

        if (shouldAllocate) {
          const allocation = (totalSavings * goal.autoPercentage) / 100;
          allocations.push({ id: goal.id, amount: allocation });
          return { ...goal, lastAutoApplied: now.toISOString() };
        }
      }
      return goal;
    });

    setGoals(updatedGoals);

    // Deduct and update allocated amounts after state is updated
    allocations.forEach(({ id, amount }) => {
      if (amount > 0) allocateToGoal(id, amount);
    });
  };

  return (
    <SavingsGoalsContext.Provider
      value={{
        goals,
        addGoal,
        deleteGoal,
        allocateToGoal,
        lockInAutoSettings,
        performAutoAllocation,
      }}
    >
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);
