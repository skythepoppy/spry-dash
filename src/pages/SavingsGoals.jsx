// src/pages/SavingsGoals.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useSavingsGoals } from '../context/SavingsGoalsContext';
import { useEntries } from '../context/EntriesContext';

export default function SavingsGoals() {
    const {
        activeGoals,
        completedGoals,
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

    const totalSavings = entries
        .filter((e) => e.type === 'saving')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoal.title || !newGoal.goalAmount) return;
        addGoal({ title: newGoal.title, goalAmount: Number(newGoal.goalAmount) });
        setNewGoal({ title: '', goalAmount: '' });
    };

    useEffect(() => {
        if (totalSavings > 0) performAutoAllocation();
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

                {/* Active Goals */}
                <h2 className="text-2xl font-semibold mb-3">Active Goals</h2>
                <div className="space-y-4 mb-8">
                    {activeGoals.length === 0 ? (
                        <p className="text-gray-500 italic">No active goals.</p>
                    ) : (
                        activeGoals.map((goal) => {
                            const progress = Math.min((goal.allocatedAmount / goal.goalAmount) * 100, 100);
                            const progressColor = 'bg-blue-500';

                            return (
                                <div
                                    key={goal.id}
                                    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ${editingGoalId === goal.id ? 'pb-6' : 'pb-4'}`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">{goal.title}</span>
                                        <div className="flex gap-2 items-center">
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
                                                    if (amount <= 0) return;

                                                    if (amount > totalSavings) {
                                                        alert('Not enough savings available!');
                                                        return; // Stop allocation
                                                    }

                                                    allocateToGoal(goal.id, amount);
                                                    setAllocate({ ...allocate, [goal.id]: '' });
                                                }}
                                                className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition"
                                            >
                                                Allocate
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
                        })
                    )}
                </div>

                {/* Completed Goals */}
                <h2 className="text-2xl font-semibold mb-3">Goal History</h2>
                <div className="space-y-4">
                    {completedGoals.length === 0 ? (
                        <p className="text-gray-500 italic">No completed goals yet.</p>
                    ) : (
                        completedGoals.map(goal => (
                            <div
                                key={goal.id}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold">{goal.title}</span>
                                    <span className="text-green-600 font-bold">Completed</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Completed at: {new Date(goal.completedAt).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    ${goal.allocatedAmount.toFixed(2)} / ${goal.goalAmount}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
