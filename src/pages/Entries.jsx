import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ExpensesTab from '../components/ExpensesTab';
import BudgetingTab from '../components/BudgetingTab';
import SavingsTab from '../components/SavingsTab';
import { EntriesProvider } from '../context/EntriesContext';

export default function Entries() {
    const [activeTab, setActiveTab] = useState('expenses');

    // Month/year state
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Handle tab rendering
    const renderTab = () => {
        switch (activeTab) {
            case 'expenses':
                return <ExpensesTab month={currentMonth} year={currentYear} />;
            case 'budgeting':
                return <BudgetingTab month={currentMonth} year={currentYear} />;
            case 'savings':
                return <SavingsTab month={currentMonth} year={currentYear} />;
            default:
                return null;
        }
    };

    // Month navigation
    const handlePrevMonth = () => {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const year = currentMonth === 1 ? currentYear - 1 : currentYear;
        setCurrentMonth(prevMonth);
        setCurrentYear(year);
    };

    const handleNextMonth = () => {
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const year = currentMonth === 12 ? currentYear + 1 : currentYear;
        setCurrentMonth(nextMonth);
        setCurrentYear(year);
    };

    return (
        <EntriesProvider>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="p-8 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4 text-gray-800">Entries</h1>

                    {/* Month Navigation */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handlePrevMonth}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Prev
                        </button>
                        <span className="font-semibold">{`${currentMonth}/${currentYear}`}</span>
                        <button
                            onClick={handleNextMonth}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Next
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`px-4 py-2 rounded-t-lg ${
                                activeTab === 'expenses'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Expenses
                        </button>
                        <button
                            onClick={() => setActiveTab('budgeting')}
                            className={`px-4 py-2 rounded-t-lg ${
                                activeTab === 'budgeting'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Budgeting
                        </button>
                        <button
                            onClick={() => setActiveTab('savings')}
                            className={`px-4 py-2 rounded-t-lg ${
                                activeTab === 'savings'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Savings
                        </button>
                    </div>

                    {/* Active Tab Content */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        {renderTab()}
                    </div>
                </div>
            </div>
        </EntriesProvider>
    );
}
