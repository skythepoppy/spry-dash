import React from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import { DollarSign, PiggyBank, TrendingUp, CalendarDays, Wallet } from 'lucide-react';
import { useEntries } from '../context/EntriesContext';

export default function Dashboard() {
  const { entries } = useEntries();

  const totalExpenses = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalSavings = entries
    .filter((e) => e.type === 'saving')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const walletBalance = totalSavings - totalExpenses;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Card title="Total Expenses" value={`$${totalExpenses}`} icon={DollarSign} color="bg-red-50" />
          <Card title="Total Savings" value={`$${totalSavings}`} icon={PiggyBank} color="bg-green-50" />
          <Card title="Wallet Balance" value={`$${walletBalance}`} icon={Wallet} color="bg-purple-50" />
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
