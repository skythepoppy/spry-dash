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
        updateBudgetAllocations = () => { },
        availableSavings = 0,
        setAvailableSavings = () => { },
    } = useEntries();

    const { activeGoals, fetchGoals } = useSavingsGoals();

    const [isBudgeting, setIsBudgeting] = useState(false);
    const [income, setIncome] = useState('');
    const [allocations, setAllocations] = useState({});
    const [titles, setTitles] = useState({});
    const [allocateToSavings, setAllocateToSavings] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [savingsTitle, setSavingsTitle] = useState('');

    // only use categories that already have recorded expenses
    const expenseEntries = filteredEntries.filter(e => e.type === 'expense');
    const recordedCategories = useMemo(() => [...new Set(expenseEntries.map(e => e.category))], [expenseEntries]);

    useEffect(() => {
        fetchEntries();
        fetchGoals();
    }, [fetchEntries, fetchGoals]);

    // calculate spent vs allocated for progress bars (non-compounding)
    const totalByCategory = recordedCategories.map(cat => {
        const spent = expenseEntries
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + Number(e.amount), 0);

        // only use saved allocations, not new modal inputs
        const allocated = Number(budgetAllocations[cat] || 0);

        const progress = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;

        return { category: cat, spent, allocated, progress };
    });

    const totalAllocated = Object.values(allocations).reduce((sum, a) => sum + Number(a || 0), 0);
    const remaining = Math.max(Number(income || 0) - totalAllocated, 0);

    const handleAllocationChange = (category, value) => {
        setAllocations(prev => ({ ...prev, [category]: Number(value) }));
    };

    const handleTitleChange = (category, value) => {
        setTitles(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmitBudget = async () => {
        try {
            // save allocations in context
            updateBudgetAllocations({ ...budgetAllocations, ...allocations });

            // create new entries for this budgeting session
            for (const cat of recordedCategories) {
                const amount = Number(allocations[cat] || 0);
                if (amount > 0) {
                    await addEntry({
                        type: 'expense',
                        category: cat,
                        amount,
                        note: titles[cat] || cat,
                        title: titles[cat] || '',
                        month: currentMonth,
                        year: currentYear,
                    });
                }
            }

            // allocate remaining to savings goal if selected
            if (allocateToSavings && remaining > 0 && selectedGoalId) {
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
            }

            // if remaining funds aren't allocated to a savings goal, store as available savings
            if (!allocateToSavings || !selectedGoalId) {
                setAvailableSavings(prev => prev + remaining);
            }

            // reset UI
            setIsBudgeting(false);
            setIncome('');
            setAllocations({});
            setTitles({});
            setAllocateToSavings(false);
            setSavingsTitle('');
            setSelectedGoalId(null);

            await fetchEntries();
            await fetchGoals();
        } catch (err) {
            console.error('Failed to submit budget:', err);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Monthly Budgeting</h2>

            {totalByCategory.length === 0 ? (
                <p className="text-gray-500 italic">No recorded expenses yet.</p>
            ) : (
                <div className="space-y-4 mb-6">
                    {totalByCategory.map(({ category, spent, allocated, progress }) => (
                        <div key={category}>
                            <div className="flex justify-between mb-1">
                                <span>{category}</span>
                                <span>
                                    ${spent.toFixed(2)} / ${allocated.toFixed(2)}
                                </span>
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

            <button
                onClick={() => setIsBudgeting(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Start Budgeting Session
            </button>

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

                        {recordedCategories.map(cat => (
                            <div key={cat} className="mb-3 flex items-center space-x-2">
                                <span className="w-24 text-sm">{cat}</span>
                                <input
                                    type="number"
                                    value={allocations[cat] || ''}
                                    onChange={e => handleAllocationChange(cat, e.target.value)}
                                    placeholder="Amount"
                                    className="w-20 text-right border border-gray-300 rounded p-1 text-sm"
                                />
                                <input
                                    type="text"
                                    value={titles[cat] || ''}
                                    onChange={e => handleTitleChange(cat, e.target.value)}
                                    placeholder="Title / Description"
                                    className="flex-1 border border-gray-300 rounded p-1 text-sm"
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
                                        Allocate remaining ${remaining.toFixed(2)} to a Savings Goal
                                    </span>
                                </label>

                                {allocateToSavings && (
                                    <div className="flex flex-col space-y-2 mt-2">
                                        <select
                                            value={selectedGoalId || ''}
                                            onChange={e => setSelectedGoalId(Number(e.target.value))}
                                            className="border border-gray-300 rounded p-1 text-sm w-full"
                                        >
                                            <option value="" disabled>Select a Goal</option>
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
                                        <span className="text-sm font-medium">${remaining.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end mt-6 space-x-2">
                            {remaining > 0 && (
                                <span className="text-red-600 text-sm mr-auto">
                                    ⚠ All income must be allocated before saving.
                                </span>
                            )}
                            <button
                                onClick={() => setIsBudgeting(false)}
                                className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBudget}
                                disabled={
                                    !income ||
                                    remaining > 0 && (!allocateToSavings || !selectedGoalId)
                                }
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
