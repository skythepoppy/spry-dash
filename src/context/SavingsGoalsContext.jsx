// src/context/SavingsGoalsContext.jsx
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

  // Fetch goals
  const fetchGoals = async () => {
    if (!token) return;
    try {
      const res = await api.get('/goals', authHeaders());
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch goals:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  // Add goal
  const addGoal = async (goal) => {
    try {
      const res = await api.post('/goals', goal, authHeaders());
      setGoals(prev => [
        ...prev,
        res.data.goal || { ...goal, id: res.data.goalId, allocatedAmount: 0, completed: false }
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

  // Calculate available savings after allocated amounts
  const calculateAvailableSavings = () => {
    const totalSavings = entries
      .filter(e => e.type === 'saving')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalAllocated = goals.reduce((sum, g) => sum + Number(g.allocatedAmount || 0), 0);
    return totalSavings - totalAllocated;
  };

  // Allocate funds to a goal
  const allocateToGoal = async (id, amount) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    // Cap allocation to goal’s remaining amount
    const remainingGoalAmount = goal.goalAmount - goal.allocatedAmount;
    const safeAmount = Math.min(amount, remainingGoalAmount);

    // Cap allocation to available savings
    const availableSavings = calculateAvailableSavings();
    if (safeAmount > availableSavings) {
      alert('Not enough savings available!');
      return;
    }

    const newAllocated = goal.allocatedAmount + safeAmount;
    const completed = newAllocated >= goal.goalAmount;

    try {
      await api.put(`/goals/${id}`, { allocatedAmount: newAllocated, completed }, authHeaders());
      setGoals(prev =>
        prev.map(g => (g.id === id ? { ...g, allocatedAmount: newAllocated, completed } : g))
      );
    } catch (err) {
      console.error('Failed to allocate funds:', err.response?.data || err.message);
    }
  };

  // Lock auto allocation
  const lockInAutoSettings = async (id, autoPercentage, autoType) => {
    try {
      await api.put(`/goals/${id}`, { autoPercentage, autoType }, authHeaders());
      setGoals(prev =>
        prev.map(g => (g.id === id ? { ...g, autoPercentage, autoType } : g))
      );
    } catch (err) {
      console.error('Failed to update auto allocation:', err.response?.data || err.message);
    }
  };

  // Perform percentage-based auto allocation safely
  const performAutoAllocation = () => {
    let availableSavings = calculateAvailableSavings();
    if (availableSavings <= 0) return;

    goals.forEach(goal => {
      if (goal.autoPercentage > 0 && !goal.completed) {
        const remainingGoalAmount = goal.goalAmount - goal.allocatedAmount;
        let allocationAmount = (availableSavings * goal.autoPercentage) / 100;

        // Cap allocation to remaining goal amount
        allocationAmount = Math.min(allocationAmount, remainingGoalAmount, availableSavings);

        if (allocationAmount > 0) {
          allocateToGoal(goal.id, allocationAmount);
          availableSavings -= allocationAmount;
        }
      }
    });
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
        lockInAutoSettings,
        performAutoAllocation,
        fetchGoals,
      }}
    >
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);
