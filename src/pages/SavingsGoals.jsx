import React, { useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useSavingsGoals } from '../context/SavingsGoalsContext';
import { useEntries } from '../context/EntriesContext';

export default function SavingsGoals() {
    const { activeGoals, completedGoals } = useSavingsGoals();
    const { entries } = useEntries();

    // Total savings allocated toward goals (using category 'savingsgoal')
    const totalSavings = useMemo(
        () =>
            entries
                .filter(e => e.type === 'saving' && e.category === 'savingsgoal')
                .reduce((sum, e) => sum + Number(e.amount), 0),
        [entries]
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-gray-800 text-center">
                    Savings Goals
                </h1>

                {/* Completed goals count */}
                <p className="mb-4 text-lg font-medium text-center">
                    Completed Goals: {completedGoals.length}
                </p>

                {/* Total savings for goals */}
                <p className="mb-6 text-lg font-medium text-center">
                    Total Savings Allocated to Goals: ${totalSavings.toFixed(2)}
                </p>

                {/* Active Goals */}
                <h2 className="text-2xl font-semibold mb-3">Active Goals</h2>
                <div className="space-y-4 mb-8">
                    {activeGoals.length === 0 ? (
                        <p className="text-gray-500 italic">No active goals.</p>
                    ) : (
                        activeGoals.map(goal => {
                            const allocated = Number(goal.allocated_amount || 0);
                            const remaining = Math.max(goal.goal_amount - allocated, 0);
                            const progress = goal.goal_amount
                                ? Math.min((allocated / goal.goal_amount) * 100, 100)
                                : 0;

                            let progressColor = 'bg-red-500';
                            if (progress >= 75) progressColor = 'bg-green-500';
                            else if (progress >= 25) progressColor = 'bg-yellow-400';

                            return (
                                <div
                                    key={goal.id}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                                >
                                    <span className="font-semibold">{goal.note}</span>

                                    <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden relative mt-2">
                                        <div
                                            className={`h-full ${progressColor} flex items-center justify-center text-white text-sm font-semibold`}
                                            style={{ width: `${progress}%` }}
                                        >
                                            {progress.toFixed(0)}%
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 mt-1">
                                        ${allocated.toFixed(2)} / ${goal.goal_amount} — ${remaining.toFixed(2)} remaining
                                    </p>
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
