import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
  const [goals, setGoals] = useState([]);
  const token = localStorage.getItem('token');

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch goals from backend
  const fetchGoals = async () => {
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
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  return (
    <SavingsGoalsContext.Provider
      value={{
        goals,
        activeGoals: goals.filter(g => !g.completed),
        completedGoals: goals.filter(g => g.completed),
        fetchGoals,
      }}
    >
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);
