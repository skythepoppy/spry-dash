import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useEntries } from './EntriesContext';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
  const [goals, setGoals] = useState([]);
  const { entries } = useEntries();
  const token = localStorage.getItem('token');

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch goals from backend
  const fetchGoals = async () => {
    if (!token) return;
    try {
      const res = await api.get('/goals', authHeaders());
      // Ensure allocatedAmount is always a number
      setGoals(res.data.map(g => ({ allocated_amount: g.allocated_amount || 0, ...g })));
    } catch (err) {
      console.error('Failed to fetch goals:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  // Add new goal (uses `note` now)
  const addGoal = async (goal) => {
    try {
      const res = await api.post('/goals', {
        note: goal.note,
        goal_amount: goal.goal_amount,
        allocated_amount: 0,
      }, authHeaders());

      setGoals(prev => [
        ...prev,
        res.data.goal || { ...goal, id: res.data.goalId, allocated_amount: 0, completed: false }
      ]);
    } catch (err) {
      console.error('Failed to add goal:', err.response?.data || err.message);
    }
  };

  // Delete goal
  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`, authHeaders());
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete goal:', err.response?.data || err.message);
    }
  };

  // Allocate funds manually
  const allocateToGoal = async (id, amount) => {
    const totalSavings = entries
      .filter(e => e.type === 'saving')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalAllocated = goals.reduce((sum, g) => sum + Number(g.allocated_amount || 0), 0);
    const availableSavings = totalSavings - totalAllocated;

    if (amount > availableSavings) {
      alert('Not enough savings available!');
      return 0;
    }

    const goal = goals.find(g => g.id === id);
    if (!goal) return 0;

    // 🔧 use 0 as default if undefined
    const currentAllocated = Number(goal.allocated_amount || 0);
    const goalAmount = Number(goal.goal_amount || 0);

    const remainingForGoal = goalAmount - currentAllocated;
    const allocation = Math.min(amount, remainingForGoal);
    const newAllocated = currentAllocated + allocation;
    const completed = newAllocated >= goalAmount;

    console.log("➡️ Sending allocation update:", { id, allocated_amount: newAllocated, completed });

    try {
      const updatedGoal = await api.put(
        `/goals/${id}`,
        { allocated_amount: newAllocated, completed },
        authHeaders()
      );

      setGoals(prev =>
        prev.map(g => g.id === id ? { ...g, ...updatedGoal.data } : g)
      );

      return allocation;
    } catch (err) {
      console.error('Failed to allocate funds:', err.response?.data || err.message);
      return 0;
    }
  };




  return (
    <SavingsGoalsContext.Provider
      value={{
        goals,
        activeGoals: goals.filter(g => !g.completed),
        completedGoals: goals.filter(g => g.completed),
        addGoal,
        deleteGoal,
        allocateToGoal,
        fetchGoals,
      }}
    >
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);
