import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
  const [goals, setGoals] = useState([]);
  const token = localStorage.getItem('token');

  const authHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

  // Fetch goals from backend
  const fetchGoals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/goals', authHeaders());
      setGoals(
        res.data.map(g => ({
          ...g,
          allocated_amount: Number(g.allocated_amount || 0),
          goal_amount: Number(g.goal_amount || 0),
          completed: !!g.completed,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch goals:', err.response?.data || err.message);
    }
  }, [token, authHeaders]);

  const refreshGoals = async () => {
    await fetchGoals();
  };

  // Add remaining calculation
  const goalsWithRemaining = goals.map(g => ({
    ...g,
    remaining: g.goal_amount - g.allocated_amount
  }));

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return (
    <SavingsGoalsContext.Provider
      value={{
        goals: goalsWithRemaining,
        activeGoals: goalsWithRemaining.filter(g => !g.completed),
        completedGoals: goalsWithRemaining.filter(g => g.completed),
        fetchGoals,
        refreshGoals,
        validCategories: ['emergency','roth ira','stocks','401k','savingsgoal'], // optional for frontend validation
      }}
    >
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);
