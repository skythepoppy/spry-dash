// src/pages/SavingsGoals.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useSavingsGoals } from '../context/SavingsGoalsContext';
import { useEntries } from '../context/EntriesContext';

export default function SavingsGoals() {
    const {
        goals,
        addGoal,
        deleteGoal,
        allocateToGoal,
        performAutoAllocation,
        lockInAutoSettings,
    } = useSavingsGoals();

    const { entries } = useEntries();
    const [newGoal, setNewGoal] = useState({ title: '', goalAmount: '' });
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [allocate, setAllocate] = useState({});
    const [autoEdits, setAutoEdits] = useState({});

    // Total available savings
    const totalSavings = entries
        .filter((e) => e.type === 'saving')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoal.title || !newGoal.goalAmount) return;
        addGoal({ title: newGoal.title, goalAmount: Number(newGoal.goalAmount) });
        setNewGoal({ title: '', goalAmount: '' });
    };

    // Auto allocation whenever entries change
    useEffect(() => {
        if (totalSavings > 0) performAutoAllocation(totalSavings);
    }, [entries]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Savings Goals</h1>

                <p className="mb-4 text-lg font-medium">
                    Total Savings Available: ${totalSavings.toFixed(2)}
                </p>

                {/* Add Goal Form */}
                <form
                    onSubmit={handleAddGoal}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row items-center gap-4"
                >
                    <input
                        type="text"
                        placeholder="Goal Title"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Goal Amount"
                        value={newGoal.goalAmount}
                        onChange={(e) => setNewGoal({ ...newGoal, goalAmount: e.target.value })}
                        className="w-32 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition"
                    >
                        Add Goal
                    </button>
                </form>

                {/* Goals List */}
                <div className="space-y-4">
                    {goals.map((goal) => {
                        const progress = Math.min((goal.allocatedAmount / goal.goalAmount) * 100, 100);
                        const progressColor = goal.completed
                            ? 'bg-green-500'
                            : progress >= 100
                                ? 'bg-red-500'
                                : 'bg-blue-500';

                        return (
                            <div
                                key={goal.id}
                                className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ${editingGoalId === goal.id ? 'pb-6' : 'pb-4'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold">{goal.title}</span>
                                    <div className="flex gap-2 items-center">
                                        {goal.completed && (
                                            <span className="text-green-600 font-bold">Completed</span>
                                        )}
                                        <button
                                            onClick={() =>
                                                setEditingGoalId(editingGoalId === goal.id ? null : goal.id)
                                            }
                                            className="text-blue-500 text-sm hover:underline"
                                        >
                                            {editingGoalId === goal.id ? 'Close' : 'Edit'}
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden relative">
                                    <div
                                        className={`h-full ${progressColor} flex items-center justify-center text-white text-sm font-semibold transition-all duration-500`}
                                        style={{ width: `${progress}%` }}
                                    >
                                        {progress.toFixed(0)}%
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    ${goal.allocatedAmount.toFixed(2)} / ${goal.goalAmount}
                                </p>

                                {/* Expanded Edit Panel */}
                                {editingGoalId === goal.id && (
                                    <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center">
                                        {/* Manual Allocation */}
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Add Amount"
                                            value={allocate[goal.id] ?? ''}
                                            onChange={(e) =>
                                                setAllocate({ ...allocate, [goal.id]: e.target.value })
                                            }
                                            className="w-28 border p-2 rounded focus:ring-2 focus:ring-green-400 outline-none"
                                        />
                                        <button
                                            onClick={() => {
                                                let amount = Number(allocate[goal.id]);
                                                if (amount > 0) {
                                                    if (amount > totalSavings) {
                                                        alert('Not enough savings available!');
                                                        amount = totalSavings; // optionally allocate max available
                                                    }
                                                    if (amount > 0) {
                                                        allocateToGoal(goal.id, amount);
                                                        setAllocate({ ...allocate, [goal.id]: '' });
                                                    }
                                                }
                                            }}
                                            className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition"
                                        >
                                            Allocate
                                        </button>


                                        {/* Auto Allocation */}
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={autoEdits[goal.id]?.autoPercentage ?? goal.autoPercentage}
                                            placeholder="Auto %"
                                            onChange={(e) =>
                                                setAutoEdits({
                                                    ...autoEdits,
                                                    [goal.id]: {
                                                        ...autoEdits[goal.id],
                                                        autoPercentage: Number(e.target.value),
                                                        autoType: autoEdits[goal.id]?.autoType ?? goal.autoType,
                                                    },
                                                })
                                            }
                                            className="w-28 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                                        />
                                        <select
                                            value={autoEdits[goal.id]?.autoType ?? goal.autoType}
                                            onChange={(e) =>
                                                setAutoEdits({
                                                    ...autoEdits,
                                                    [goal.id]: {
                                                        ...autoEdits[goal.id],
                                                        autoType: e.target.value,
                                                        autoPercentage: autoEdits[goal.id]?.autoPercentage ?? goal.autoPercentage,
                                                    },
                                                })
                                            }
                                            className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="weekly">Weekly</option>
                                        </select>
                                        <button
                                            onClick={() => {
                                                const percentage = autoEdits[goal.id]?.autoPercentage ?? goal.autoPercentage;
                                                const type = autoEdits[goal.id]?.autoType ?? goal.autoType;
                                                lockInAutoSettings(goal.id, percentage, type);

                                                // Calculate allocation amount
                                                let allocationAmount = (totalSavings * percentage) / 100;
                                                if (allocationAmount > totalSavings) allocationAmount = totalSavings;

                                                if (allocationAmount > 0) allocateToGoal(goal.id, allocationAmount);
                                            }}
                                            className="text-blue-500 text-sm hover:underline"
                                        >
                                            Apply Auto
                                        </button>


                                        {/* Delete */}
                                        <button
                                            onClick={() => deleteGoal(goal.id)}
                                            className="text-red-500 text-sm hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
