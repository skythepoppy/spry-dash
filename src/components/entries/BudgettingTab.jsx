import React, { useState, useEffect } from 'react';
import { useEntries } from '../context/EntriesContext';

export default function BudgetingTab() {
    const { filteredEntries, fetchEntries, addEntry, currentMonth, currentYear } = useEntries();

    const [isBudgeting, setIsBudgeting] = useState(false);
    const [income, setIncome] = useState('');
    const [allocations, setAllocations] = useState({});
    const [allocateToSavings, setAllocateToSavings] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    // Only consider this month's expenses
    const expenses = filteredEntries.filter(e => e.type === 'expense');
    const categories = [...new Set(expenses.map(e => e.note))];

    const totalByCategory = categories.map(cat => {
        const total = expenses
            .filter(e => e.note === cat)
            .reduce((sum, e) => sum + Number(e.amount), 0);
        return { category: cat, total };
    });

    const totalAllocated = Object.values(allocations).reduce((sum, a) => sum + (Number(a) || 0), 0);
    const remaining = Math.max(Number(income || 0) - totalAllocated, 0);

    const handleAllocationChange = (category, value) => {
        setAllocations(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmitBudget = async () => {
        try {
            // Create a budget entry for each category allocation
            for (const [category, amount] of Object.entries(allocations)) {
                if (amount && amount > 0) {
                    await addEntry({
                        type: 'budget',
                        note: category,
                        amount: parseFloat(amount),
                        month: currentMonth,
                        year: currentYear,
                    });
                }
            }

            // Optionally create a savings entry for leftover
            if (allocateToSavings && remaining > 0) {
                await addEntry({
                    type: 'saving',
                    note: 'Remaining from budget',
                    amount: parseFloat(remaining),
                    month: currentMonth,
                    year: currentYear,
                });
            }

            // Reset UI state
            setIsBudgeting(false);
            setIncome('');
            setAllocations({});
            setAllocateToSavings(false);

            fetchEntries();
        } catch (err) {
            console.error('Failed to submit budget:', err);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Monthly Budgeting</h2>

            {totalByCategory.length === 0 ? (
                <p className="text-gray-500 italic">No expenses recorded this month.</p>
            ) : (
                <>
                    <div className="space-y-4 mb-6">
                        {totalByCategory.map(({ category, total }) => (
                            <div key={category}>
                                <div className="flex justify-between mb-1">
                                    <span>{category}</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                                <div className="h-4 bg-gray-200 rounded">
                                    <div
                                        className="h-4 bg-blue-500 rounded"
                                        style={{ width: `${Math.min((total / 1000) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsBudgeting(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Start Budgeting Session
                    </button>
                </>
            )}

            {/* Budgeting Modal */}
            {isBudgeting && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
                        <h3 className="text-lg font-semibold mb-4">New Budgeting Session</h3>

                        <label className="block mb-3">
                            <span className="text-sm font-medium">Total Monthly Income:</span>
                            <input
                                type="number"
                                value={income}
                                onChange={e => setIncome(e.target.value)}
                                placeholder="Enter your monthly income"
                                className="w-full mt-1 border border-gray-300 rounded p-2"
                            />
                        </label>

                        {categories.map(cat => (
                            <div key={cat} className="mb-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">{cat}</span>
                                    <input
                                        type="number"
                                        value={allocations[cat] || ''}
                                        onChange={e => handleAllocationChange(cat, e.target.value)}
                                        placeholder="0"
                                        className="w-24 text-right border border-gray-300 rounded p-1"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center mt-4">
                            <span className="font-medium">Remaining:</span>
                            <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${remaining.toFixed(2)}
                            </span>
                        </div>

                        {remaining > 0 && (
                            <label className="flex items-center mt-3">
                                <input
                                    type="checkbox"
                                    checked={allocateToSavings}
                                    onChange={e => setAllocateToSavings(e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm">Allocate remaining ${remaining.toFixed(2)} to Savings</span>
                            </label>
                        )}

                        <div className="flex justify-end mt-6 space-x-2">
                            <button
                                onClick={() => setIsBudgeting(false)}
                                className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBudget}
                                disabled={!income}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                Save Budget
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
