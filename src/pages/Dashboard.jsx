import React from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import { DollarSign, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { useEntries } from '../context/EntriesContext';
import { useSavingsGoals } from '../context/SavingsGoalsContext';

export default function Dashboard() {
    const { entries } = useEntries();
    const { goals } = useSavingsGoals();

    // Total allocated to goals
    const totalAllocatedToGoals = goals.reduce(
        (sum, g) => sum + g.allocatedAmount,
        0
    );

    // Expenses
    const totalExpenses = entries
        .filter((e) => e.type === 'expense')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    // Raw savings
    const totalSavingsRaw = entries
        .filter((e) => e.type === 'saving')
        .reduce((sum, e) => sum + Number(e.amount), 0);

    // Available savings after allocations
    const availableSavings = totalSavingsRaw;

    // Wallet balance after expenses
    const walletBalance = availableSavings - totalExpenses;

    // Goals achieved
    const achievedGoals = goals.filter((g) => g.completed).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <Card title="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} icon={DollarSign} color="bg-red-50" />
                    <Card title="Total Savings" value={`$${availableSavings.toFixed(2)}`} icon={PiggyBank} color="bg-green-50" />
                    <Card title="Wallet Balance" value={`$${walletBalance.toFixed(2)}`} icon={Wallet} color="bg-purple-50" />

                    {/* Savings Goals Card */}
                    <Card title="Savings Goals" color="bg-blue-50" value="" icon={TrendingUp}>
                        <div className="space-y-3 mt-2">
                            {goals.length === 0 ? (
                                <p className="text-gray-500 italic text-sm">No goals set yet.</p>
                            ) : (
                                goals.map((goal) => (
                                    <div key={goal.id}>
                                        <div className="flex justify-between text-sm font-medium text-gray-700">
                                            <span>{goal.title}</span>
                                            <span>
                                                ${goal.allocatedAmount.toFixed(2)} / ${goal.goalAmount}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1 mb-1">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(
                                                        (goal.allocatedAmount / goal.goalAmount) * 100,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        {goal.autoPercentage > 0 && (
                                            <p className="text-xs text-gray-500">
                                                Auto-allocating {goal.autoPercentage}% of savings
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card title="Goals Achieved" value={achievedGoals} color="bg-green-50" />
                </div>

                {/* Placeholder for charts */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
                    <p className="italic text-gray-400">[Charts will appear here later]</p>
                </div>
            </div>
        </div>
    );
}
