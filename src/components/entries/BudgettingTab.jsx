import React, { useState, useEffect, useMemo } from 'react';
import { useEntries } from '../../context/EntriesContext';
import { useSavingsGoals } from '../../context/SavingsGoalsContext';

export default function BudgetingTab() {
    const {
        filteredEntries,
        fetchEntries,
        addEntry,
        currentMonth,
        currentYear,
        budgetAllocations = {},
        updateBudgetAllocations = () => {},
        clearBudgetAllocations = () => {},
        addToAvailableSavings = () => {},
    } = useEntries();

    const { activeGoals, fetchGoals } = useSavingsGoals();

    const [isBudgeting, setIsBudgeting] = useState(false);
    const [income, setIncome] = useState('');
    const [allocations, setAllocations] = useState({});
    const [allocateToSavings, setAllocateToSavings] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [savingsTitle, setSavingsTitle] = useState('');

    // Only use categories that already have recorded expenses
    const expenseEntries = filteredEntries.filter(e => e.type === 'expense');
    const recordedCategories = useMemo(
        () => [...new Set(expenseEntries.map(e => e.category))],
        [expenseEntries]
    );

    useEffect(() => {
        fetchEntries();
        fetchGoals();
    }, [fetchEntries, fetchGoals]);

    // Prefill modal when editing existing budget
    useEffect(() => {
        if (isBudgeting && Object.keys(budgetAllocations).length > 0) {
            setAllocations({ ...budgetAllocations });
            const totalIncome = Object.values(budgetAllocations).reduce(
                (sum, val) => sum + Number(val || 0),
                0
            );
            setIncome(totalIncome);
        }
    }, [isBudgeting, budgetAllocations]);

    // Calculate progress bars (planned vs allocated)
    const totalByCategory = recordedCategories.map(cat => {
        const allocated = Number(allocations[cat] ?? budgetAllocations[cat] ?? 0);
        const progress = allocated > 0 ? 100 : 0; // fully planned
        return { category: cat, allocated, progress };
    });

    const hasExistingBudget = Object.keys(budgetAllocations).length > 0;
    const totalAllocated = Object.values(allocations).reduce((sum, a) => sum + Number(a || 0), 0);
    const remaining = Math.max(Number(income || 0) - totalAllocated, 0);

    const handleAllocationChange = (category, value) => {
        setAllocations(prev => ({ ...prev, [category]: Number(value) }));
    };

    const handleSubmitBudget = async () => {
        if (!income) return;
        try {
            updateBudgetAllocations({ ...allocations });

            if (remaining > 0) {
                if (allocateToSavings && selectedGoalId) {
                    await addEntry({
                        type: 'saving',
                        category: 'savingsgoal',
                        amount: remaining,
                        note: savingsTitle || `Auto-saved $${remaining.toFixed(2)}`,
                        title: savingsTitle || `Auto-saved $${remaining.toFixed(2)}`,
                        goal_id: selectedGoalId,
                        month: currentMonth,
                        year: currentYear,
                    });
                } else {
                    await addToAvailableSavings(remaining);
                }
            }

            // Reset modal
            setIsBudgeting(false);
            setIncome('');
            setAllocations({});
            setAllocateToSavings(false);
            setSavingsTitle('');
            setSelectedGoalId(null);
        } catch (err) {
            console.error('Failed to submit budget:', err);
        }
    };

    const handleDeleteBudget = () => {
        if (window.confirm('Are you sure you want to delete this budget for this month?')) {
            clearBudgetAllocations();
            setAllocations({});
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Monthly Budgeting</h2>

            {totalByCategory.length === 0 ? (
                <p className="text-gray-500 italic">No recorded expenses yet.</p>
            ) : (
                <div className="space-y-4 mb-6">
                    {totalByCategory.map(({ category, allocated, progress }) => (
                        <div key={category}>
                            <div className="flex justify-between mb-1">
                                <span>{category}</span>
                                <span>${allocated.toFixed(2)} / ${allocated.toFixed(2)}</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded">
                                <div
                                    className="h-4 bg-blue-500 rounded"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!hasExistingBudget ? (
                <button
                    onClick={() => setIsBudgeting(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Start Budgeting Session
                </button>
            ) : (
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsBudgeting(true)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                        Edit Budget
                    </button>
                    <button
                        onClick={handleDeleteBudget}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Delete Budget
                    </button>
                </div>
            )}

            {isBudgeting && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
                        <h3 className="text-lg font-semibold mb-4">
                            {hasExistingBudget ? 'Edit Budget' : 'New Budgeting Session'}
                        </h3>

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

                        {recordedCategories.map(cat => (
                            <div key={cat} className="mb-3 flex items-center space-x-2">
                                <span className="w-24 text-sm">{cat}</span>
                                <input
                                    type="number"
                                    value={allocations[cat] ?? budgetAllocations[cat] ?? ''}
                                    onChange={e => handleAllocationChange(cat, e.target.value)}
                                    placeholder="Allocate"
                                    className="w-20 text-right border border-gray-300 rounded p-1 text-sm"
                                />
                            </div>
                        ))}

                        <div className="flex justify-between items-center mt-4">
                            <span className="font-medium">Remaining:</span>
                            <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${remaining.toFixed(2)}
                            </span>
                        </div>

                        {remaining > 0 && activeGoals.length > 0 && (
                            <div className="mt-3">
                                <label className="flex items-center mb-1">
                                    <input
                                        type="checkbox"
                                        checked={allocateToSavings}
                                        onChange={e => setAllocateToSavings(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">
                                        Allocate remaining ${remaining.toFixed(2)} to a specific Savings Goal
                                    </span>
                                </label>

                                {allocateToSavings && (
                                    <div className="flex flex-col space-y-2 mt-2">
                                        <select
                                            value={selectedGoalId || ''}
                                            onChange={e => setSelectedGoalId(Number(e.target.value))}
                                            className="border border-gray-300 rounded p-1 text-sm w-full"
                                        >
                                            <option value="" disabled>
                                                Select a Goal
                                            </option>
                                            {activeGoals.map(g => (
                                                <option key={g.id} value={g.id}>
                                                    {g.note} — ${Number(g.remaining || 0).toFixed(2)} remaining
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={savingsTitle}
                                            onChange={e => setSavingsTitle(e.target.value)}
                                            placeholder="Title for savings entry"
                                            className="border border-gray-300 rounded p-1 text-sm w-full"
                                        />
                                    </div>
                                )}
                            </div>
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
                                {hasExistingBudget ? 'Save Changes' : 'Save Budget'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
