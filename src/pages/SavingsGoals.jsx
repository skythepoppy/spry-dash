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
    const [allocate, setAllocate] = useState({ goalId: '', amount: '' });
    const [autoEdits, setAutoEdits] = useState({});

    // Real-time total available savings
    const totalSavings = entries
        .filter((e) => e.type === 'saving')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    // Add a new goal
    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoal.title || !newGoal.goalAmount) return;
        addGoal({
            title: newGoal.title,
            goalAmount: Number(newGoal.goalAmount),
        });
        setNewGoal({ title: '', goalAmount: '' });
    };

    // Manual allocation
    const handleAllocate = (e) => {
        e.preventDefault();
        if (!allocate.goalId || !allocate.amount) return;
        const amount = Number(allocate.amount);
        if (amount > totalSavings) {
            alert('Not enough savings available!');
            return;
        }
        allocateToGoal(Number(allocate.goalId), amount);
        setAllocate({ goalId: '', amount: '' });
    };

    // Auto allocation whenever entries change
    useEffect(() => {
        if (totalSavings > 0) {
            performAutoAllocation(totalSavings);
        }
        // Only depend on entries, not goals
    }, [entries]); // <-- remove goals from dependency

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Savings Goals</h1>

                {/* Display total available savings */}
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

                {/* Manual Allocation Form */}
                {goals.length > 0 && (
                    <form
                        onSubmit={handleAllocate}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row items-center gap-4"
                    >
                        <select
                            value={allocate.goalId}
                            onChange={(e) => setAllocate({ ...allocate, goalId: e.target.value })}
                            className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                            <option value="">Select Goal</option>
                            {goals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.title} (Allocated: ${goal.allocatedAmount.toFixed(2)})
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={allocate.amount}
                            onChange={(e) => setAllocate({ ...allocate, amount: e.target.value })}
                            className="w-32 border p-2 rounded focus:ring-2 focus:ring-green-400 outline-none"
                        />
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600 transition"
                        >
                            Allocate
                        </button>
                    </form>
                )}

                {/* Goals List */}
                <div className="space-y-4">
                    {goals.map((goal) => (
                        <div
                            key={goal.id}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">{goal.title}</span>
                                {goal.completed && (
                                    <span className="text-green-600 font-bold">Completed</span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{
                                        width: `${Math.min(
                                            (goal.allocatedAmount / goal.goalAmount) * 100,
                                            100
                                        )}%`,
                                    }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                ${goal.allocatedAmount.toFixed(2)} / ${goal.goalAmount}
                            </p>

                            {/* Auto Allocation Settings & Delete */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
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
                                                autoPercentage:
                                                    autoEdits[goal.id]?.autoPercentage ?? goal.autoPercentage,
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
                                        const confirmed = window.confirm(
                                            `Apply ${autoEdits[goal.id]?.autoPercentage ?? goal.autoPercentage}% ${autoEdits[goal.id]?.autoType ?? goal.autoType} allocation to "${goal.title}"?`
                                        );
                                        if (confirmed) {
                                            lockInAutoSettings(
                                                goal.id,
                                                autoEdits[goal.id]?.autoPercentage ?? goal.autoPercentage,
                                                autoEdits[goal.id]?.autoType ?? goal.autoType
                                            );
                                            // Immediate allocation
                                            const allocationAmount =
                                                (totalSavings * (autoEdits[goal.id]?.autoPercentage ?? goal.autoPercentage)) / 100;
                                            allocateToGoal(goal.id, allocationAmount);
                                        }
                                    }}
                                    className="text-blue-500 text-sm hover:underline"
                                >
                                    Enter
                                </button>

                                <button
                                    onClick={() => {
                                        const confirmed = window.confirm(
                                            `Are you sure you want to delete "${goal.title}"?`
                                        );
                                        if (confirmed) deleteGoal(goal.id);
                                    }}
                                    className="text-red-500 text-sm hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
