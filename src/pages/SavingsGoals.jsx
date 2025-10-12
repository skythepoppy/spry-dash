import React, { useState, useEffect, useMemo } from 'react';
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
        fetchGoals,
    } = useSavingsGoals();

    const { entries } = useEntries();
    const [newGoal, setNewGoal] = useState({ note: '', goal_amount: '' });
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [allocate, setAllocate] = useState({});

    // Total savings from entries
    const totalSavings = useMemo(() => {
        return entries
            .filter(e => e.type === 'saving')
            .reduce((sum, e) => sum + Number(e.amount), 0);
    }, [entries]);

    // Total allocated to active goals
    const totalAllocated = useMemo(() => {
        return activeGoals.reduce((sum, g) => sum + Number(g.allocated_amount || 0), 0);
    }, [activeGoals]);

    // Available savings
    const availableSavings = useMemo(() => Math.max(totalSavings - totalAllocated, 0), [totalSavings, totalAllocated]);

    // Add new goal
    const handleAddGoal = e => {
        e.preventDefault();
        if (!newGoal.note || !newGoal.goal_amount) return;
        addGoal({ note: newGoal.note, goal_amount: Number(newGoal.goal_amount), allocated_amount: 0 });
        setNewGoal({ note: '', goal_amount: '' });
    };

    

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Savings Goals</h1>
                <p className="mb-4 text-lg font-medium">
                    Total Savings Available: ${availableSavings.toFixed(2)}
                </p>

                {/* Add Goal Form */}
                <form
                    onSubmit={handleAddGoal}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row items-center gap-4"
                >
                    <input
                        type="text"
                        placeholder="Goal Name"
                        value={newGoal.note}
                        onChange={e => setNewGoal({ ...newGoal, note: e.target.value })}
                        className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Goal Amount"
                        value={newGoal.goal_amount}
                        onChange={e => setNewGoal({ ...newGoal, goal_amount: e.target.value })}
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
                        activeGoals.map(goal => {
                            const allocated = Number(goal.allocated_amount || 0);
                            const goal_amount = Number(goal.goal_amount || 0);
                            const progress = goal_amount > 0 ? Math.min((allocated / goal_amount) * 100, 100) : 0;

                            let progressColor = 'bg-red-500';
                            if (progress >= 75) progressColor = 'bg-green-500';
                            else if (progress >= 25) progressColor = 'bg-yellow-400';

                            return (
                                <div
                                    key={goal.id}
                                    className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ${editingGoalId === goal.id ? 'pb-6' : 'pb-4'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">{goal.note}</span>
                                        <button
                                            onClick={() =>
                                                setEditingGoalId(editingGoalId === goal.id ? null : goal.id)
                                            }
                                            className="text-blue-500 text-sm hover:underline"
                                        >
                                            {editingGoalId === goal.id ? 'Close' : 'Edit'}
                                        </button>
                                    </div>

                                    <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden relative">
                                        <div
                                            className={`h-full ${progressColor} flex items-center justify-center text-white text-sm font-semibold transition-all duration-700`}
                                            style={{ width: `${progress}%` }}
                                        >
                                            {progress.toFixed(0)}%
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 mt-1">
                                        ${allocated.toFixed(2)} / ${goal_amount} — {(goal_amount - allocated).toFixed(2)} remaining
                                    </p>

                                    {editingGoalId === goal.id && (
                                        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center">
                                            {/* Allocate */}
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder={`Max: $${availableSavings.toFixed(2)}`}
                                                value={allocate[goal.id] ?? ''}
                                                onChange={e =>
                                                    setAllocate({ ...allocate, [goal.id]: e.target.value })
                                                }
                                                className="w-28 border p-2 rounded focus:ring-2 focus:ring-green-400 outline-none"
                                            />
                                            <button
                                                onClick={async () => {
                                                    const amount = Number(allocate[goal.id]);
                                                    if (amount <= 0) return;
                                                    if (amount > availableSavings) {
                                                        alert('Not enough savings available!');
                                                        return;
                                                    }

                                                    await allocateToGoal(goal.id, amount);
                                                    await fetchGoals();
                                                    setAllocate({ ...allocate, [goal.id]: '' }); 
                                                }}
                                                className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition"
                                            >
                                                Allocate
                                            </button>


                                            {/* Delete */}
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this goal?')) deleteGoal(goal.id);
                                                }}
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
                                    <span className="font-semibold">{goal.note}</span>
                                    <span className="text-green-600 font-bold">Completed</span>
                                </div>
                                {goal.completed_at && (
                                    <p className="text-sm text-gray-500">
                                        Completed at: {new Date(goal.completed_at).toLocaleString()}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                    ${Number(goal.allocated_amount || 0).toFixed(2)} / ${goal.goal_amount}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
