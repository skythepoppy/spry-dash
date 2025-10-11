// src/context/SavingsGoalsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useEntries } from './EntriesContext';

const SavingsGoalsContext = createContext();

export function SavingsGoalsProvider({ children }) {
    const [goals, setGoals] = useState([]);
    const { entries } = useEntries();

    // Fetch goals for logged-in user
    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data);
        } catch (err) {
            console.error('Failed to fetch goals:', err);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    // Add goal
    const addGoal = async (goal) => {
        try {
            const res = await api.post('/goals', goal);
            setGoals((prev) => [...prev, { ...goal, id: res.data.goalId, allocatedAmount: 0, completed: false }]);
        } catch (err) {
            console.error('Failed to add goal:', err);
        }
    };

    // Delete goal
    const deleteGoal = async (id) => {
        try {
            await api.delete(`/goals/${id}`);
            setGoals((prev) => prev.filter((g) => g.id !== id));
        } catch (err) {
            console.error('Failed to delete goal:', err);
        }
    };

    // Allocate funds to goal
    const allocateToGoal = async (id, amount) => {
        // Check if enough savings
        const totalSavings = entries.filter(e => e.type === 'saving').reduce((sum, e) => sum + Number(e.amount), 0);
        if (amount > totalSavings) {
            alert('Not enough savings available!');
            return;
        }

        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const newAllocated = goal.allocatedAmount + amount;
        const completed = newAllocated >= goal.goalAmount;

        try {
            await api.put(`/goals/${id}`, {
                allocatedAmount: newAllocated,
                completed
            });
            setGoals((prev) =>
                prev.map(g => g.id === id ? { ...g, allocatedAmount: newAllocated, completed } : g)
            );
        } catch (err) {
            console.error('Failed to allocate funds:', err);
        }
    };

    // Lock auto allocation
    const lockInAutoSettings = async (id, autoPercentage, autoType) => {
        try {
            await api.put(`/goals/${id}`, { autoPercentage, autoType });
            setGoals(prev =>
                prev.map(g => g.id === id ? { ...g, autoPercentage, autoType } : g)
            );
        } catch (err) {
            console.error('Failed to update auto allocation:', err);
        }
    };

    // Auto allocate (percentage-based)
    const performAutoAllocation = () => {
        const totalSavings = entries.filter(e => e.type === 'saving').reduce((sum, e) => sum + Number(e.amount), 0);
        if (totalSavings <= 0) return;

        goals.forEach(goal => {
            if (goal.autoPercentage > 0) {
                const allocationAmount = (totalSavings * goal.autoPercentage) / 100;
                if (allocationAmount <= totalSavings) {
                    allocateToGoal(goal.id, allocationAmount);
                } else {
                    alert(`Not enough savings for auto-allocation to "${goal.title}"`);
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
            }}
        >
            {children}
        </SavingsGoalsContext.Provider>
    );
}

export const useSavingsGoals = () => useContext(SavingsGoalsContext);
