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
            // Ensure each goal has manualAllocatedAmount
            setGoals(res.data.map(g => ({ manualAllocatedAmount: 0, ...g })));
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
                res.data.goal || { ...goal, id: res.data.goalId, allocatedAmount: 0, manualAllocatedAmount: 0, completed: false }
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

    // Allocate funds to a goal (manual or auto)
    const allocateToGoal = async (id, amount, isManual = true) => {
        const totalSavings = entries
            .filter(e => e.type === 'saving')
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const totalAllocated = goals.reduce((sum, g) => sum + Number(g.allocatedAmount || 0), 0);
        const availableSavings = totalSavings - totalAllocated;
        if (amount > availableSavings) {
            alert('Not enough savings available!');
            return;
        }

        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const remainingForGoal = goal.goalAmount - goal.allocatedAmount;
        const allocation = Math.min(amount, remainingForGoal);
        const completed = goal.allocatedAmount + allocation >= goal.goalAmount;

        try {
            await api.put(`/goals/${id}`, { allocatedAmount: goal.allocatedAmount + allocation, completed }, authHeaders());
            setGoals(prev =>
                prev.map(g => {
                    if (g.id !== id) return g;
                    return {
                        ...g,
                        allocatedAmount: g.allocatedAmount + allocation,
                        manualAllocatedAmount: isManual ? (g.manualAllocatedAmount || 0) + allocation : g.manualAllocatedAmount || 0,
                        completed,
                    };
                })
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

    // Perform auto allocation
    const performAutoAllocation = () => {
        let availableSavings = entries
            .filter(e => e.type === 'saving')
            .reduce((sum, e) => sum + Number(e.amount), 0)
            - goals.reduce((sum, g) => sum + Number(g.allocatedAmount || 0), 0);

        if (availableSavings <= 0) return;

        const autoGoals = goals.filter(g => !g.completed && g.autoPercentage > 0);
        if (autoGoals.length === 0) return;

        autoGoals.forEach(goal => {
            if (availableSavings <= 0) return;

            const remainingForGoal = goal.goalAmount - goal.allocatedAmount;
            let allocationAmount = (availableSavings * goal.autoPercentage) / 100;
            allocationAmount = Math.min(allocationAmount, remainingForGoal, availableSavings);

            if (allocationAmount > 0) {
                // Mark as auto allocation
                allocateToGoal(goal.id, allocationAmount, false);
                availableSavings -= allocationAmount;
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
