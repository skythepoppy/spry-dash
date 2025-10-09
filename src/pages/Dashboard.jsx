import React from 'react';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import { DollarSign, PiggyBank, TrendingUp, CalendarDays, Wallet } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Card
            title="Total Expenses"
            value="$2,450"
            icon={DollarSign}
            color="bg-red-50"
          />
          <Card
            title="Savings"
            value="$820"
            icon={PiggyBank}
            color="bg-green-50"
          />
          <Card
            title="Projections"
            value="+12%"
            icon={TrendingUp}
            color="bg-blue-50"
          />
          <Card
            title="Upcoming Bills"
            value="3 Due Soon"
            icon={CalendarDays}
            color="bg-yellow-50"
          />
          <Card
            title="Wallet Balance"
            value="$5,600"
            icon={Wallet}
            color="bg-purple-50"
          />
        </div>

        {/* Placeholder for charts or recent activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Monthly Overview
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            {/* Placeholder chart area */}
            <p className="italic">[Charts & graphs will appear here]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
