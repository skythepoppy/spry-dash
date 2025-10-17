import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
  const [goals, setGoals] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const authHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token]);

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
          remaining: Number(g.goal_amount || 0) - Number(g.allocated_amount || 0),
        }))
      );
    } catch (err) {
      console.error('Failed to fetch goals:', err.response?.data || err.message);
    }
  }, [token, authHeaders]);

  const refreshGoals = useCallback(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Watch for token updates
  useEffect(() => {
    const handleStorageChange = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <SavingsGoalsContext.Provider
      value={{
        goals,
        activeGoals,
        completedGoals,
        fetchGoals,
        refreshGoals,
        validCategories: ['emergency', 'roth ira', 'stocks', '401k', 'savingsgoal'],
      }}
    >
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);
