import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import { DollarSign, PiggyBank, Wallet } from 'lucide-react';
import { useEntries } from '../context/EntriesContext';
import { useSavingsGoals } from '../context/SavingsGoalsContext';

export default function Dashboard() {
    const { entries, fetchEntries } = useEntries();
    const { goals, fetchGoals } = useSavingsGoals();

    useEffect(() => {
        fetchEntries();
        fetchGoals();
    }, []);

    const totalAllocatedToGoals = goals.reduce(
        (sum, g) => sum + Number(g.allocated_amount || 0),
        0
    );

    const totalExpenses = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalSavingsRaw = entries
        .filter(e => e.type === 'saving')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // ✅ Never let displayed savings go below 0
    const availableSavings = Math.max(totalSavingsRaw - totalAllocatedToGoals, 0);

    // ⚖️ Allow wallet balance to go negative (represents overspending or over-allocation)
    const walletBalance = (totalSavingsRaw - totalAllocatedToGoals) - totalExpenses;

    const achievedGoals = goals.filter(g => g.completed).length;

    // 🎨 Dynamic color based on wallet balance
    const walletColor =
        walletBalance < 0 ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-purple-50';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <Card
                        title="Total Expenses"
                        value={`$${totalExpenses.toFixed(2)}`}
                        icon={DollarSign}
                        color="bg-red-50"
                    />
                    <Card
                        title="Total Savings"
                        value={`$${availableSavings.toFixed(2)}`}
                        icon={PiggyBank}
                        color="bg-green-50"
                    />
                    <Card
                        title="Wallet Balance"
                        value={`$${walletBalance.toFixed(2)}`}
                        icon={Wallet}
                        color={walletColor}
                    />
                    <Card
                        title="Goals Achieved"
                        value={achievedGoals}
                        color="bg-green-50"
                    />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
                    <p className="italic text-gray-400">[Charts will appear here later]</p>
                </div>
            </div>
        </div>
    );
}
