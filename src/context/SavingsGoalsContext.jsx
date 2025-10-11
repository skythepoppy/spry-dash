import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEntries } from './EntriesContext';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
  const [goals, setGoals] = useState(() => {
    const stored = localStorage.getItem('goals');
    return stored
      ? JSON.parse(stored).map(g => ({ ...g, allocatedAmount: Number(g.allocatedAmount) || 0 }))
      : [];
  });

  const { entries, deductSavings } = useEntries();

  // Persist goals to localStorage
  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  // Check if goal should auto-allocate
  const shouldAutoAllocate = (goal, now) => {
    if (!goal.lastAutoApplied) return true;
    const last = new Date(goal.lastAutoApplied);
    if (goal.autoType === 'weekly') {
      return (now - last) / (1000 * 60 * 60 * 24 * 7) >= 1;
    }
    if (goal.autoType === 'monthly') {
      return now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear();
    }
    return false;
  };

  // Add a new goal
  const addGoal = (goal) => {
    setGoals(prev => [
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
    const goalToDelete = goals.find(g => g.id === id);
    if (goalToDelete && goalToDelete.allocatedAmount > 0) {
      deductSavings(-goalToDelete.allocatedAmount); // return to savings
    }
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Inside allocateToGoal
  const allocateToGoal = (id, requestedAmount) => {
    if (requestedAmount <= 0) return;

    const totalSavings = entries
      .filter(e => e.type === 'saving')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const amount = Math.min(requestedAmount, totalSavings);
    if (amount <= 0) return;

    setGoals(prev =>
      prev.map(goal => {
        if (goal.id === id) {
          const newAllocated = goal.allocatedAmount + amount;
          const completed = newAllocated >= goal.goalAmount;
          return {
            ...goal,
            allocatedAmount: newAllocated,
            completed,
            completedAt: completed ? new Date().toISOString() : goal.completedAt,
          };
        }
        return goal;
      })
    );

    deductSavings(amount);
  };


  // Lock auto allocation settings
  const lockInAutoSettings = (id, autoPercentage, autoType) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id ? { ...goal, autoPercentage, autoType } : goal
      )
    );
  };

  // Auto allocate savings to goals
  const performAutoAllocation = () => {
    const totalSavings = entries
      .filter(e => e.type === 'saving')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    if (totalSavings <= 0) return;

    const now = new Date();

    const allocations = goals
      .filter(goal => goal.autoPercentage > 0 && shouldAutoAllocate(goal, now))
      .map(goal => ({
        id: goal.id,
        amount: (totalSavings * goal.autoPercentage) / 100,
      }));

    // Update lastAutoApplied timestamp
    setGoals(prev =>
      prev.map(goal => {
        if (allocations.find(a => a.id === goal.id)) {
          return { ...goal, lastAutoApplied: now.toISOString() };
        }
        return goal;
      })
    );

    // Allocate funds
    allocations.forEach(({ id, amount }) => {
      if (amount > 0) allocateToGoal(id, amount);
    });
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <SavingsGoalsContext.Provider
      value={{
        goals,
        activeGoals,
        completedGoals,
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
