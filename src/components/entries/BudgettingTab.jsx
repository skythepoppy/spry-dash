import React, { useState, useEffect, useMemo, useContext } from "react";
import { useEntries } from "../../context/EntriesContext";
import { useSavingsGoals } from "../../context/SavingsGoalsContext";
import { BudgetContext } from "../../context/BudgetContext";

export default function BudgetingTab() {
    const { filteredEntries, fetchEntries, addEntry, currentMonth, currentYear, setAvailableSavings } = useEntries();
    const { activeGoals, fetchGoals } = useSavingsGoals();
    const { budget, updateBudget, deleteBudget, loading } = useContext(BudgetContext);

    const [isBudgeting, setIsBudgeting] = useState(false);
    const [income, setIncome] = useState(0);
    const [allocations, setAllocations] = useState({});
    const [unallocatedIncome, setUnallocatedIncome] = useState(0);
    const [allocateToSavings, setAllocateToSavings] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [savingsTitle, setSavingsTitle] = useState("");

    useEffect(() => {
        fetchEntries();
        fetchGoals();
    }, []);

    const expenseEntries = useMemo(
        () => filteredEntries.filter((e) => e.type === "expense"),
        [filteredEntries]
    );

    const recordedCategories = useMemo(
        () => [...new Set(expenseEntries.map((e) => e.category))],
        [expenseEntries]
    );

    // Prefill allocations + income from DB when opening budgeting modal
    useEffect(() => {
        if (isBudgeting && budget) {
            const prefill = {};
            recordedCategories.forEach((cat) => {
                let allocated = 0;
                if (budget.allocations && Array.isArray(budget.allocations)) {
                    budget.allocations.forEach((a) => {
                        const entry = expenseEntries.find((e) => e.id === a.entry_id);
                        if (entry && entry.category === cat) {
                            allocated += Number(a.amount_allocated);
                        }
                    });
                }
                prefill[cat] = allocated;
            });

            setAllocations(prefill);
            setIncome(budget.monthly_income ?? 0);
            setUnallocatedIncome(budget.unallocated_income ?? 0);
        }
    }, [isBudgeting, budget, recordedCategories, expenseEntries]);

    const totalByCategory = recordedCategories.map((cat) => {
        const spent = expenseEntries
            .filter((e) => e.category === cat)
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const allocated =
            allocations[cat] ??
            budget?.allocations?.find((a) => {
                const entry = expenseEntries.find((e) => e.id === a.entry_id);
                return entry && entry.category === cat;
            })?.amount_allocated ??
            0;

        const numericAllocated = Number(allocated) || 0;
        const progress = spent > 0 ? Math.min((numericAllocated / spent) * 100, 100) : 0;
        const overBudget = numericAllocated > spent;

        return { category: cat, spent, allocated: numericAllocated, progress, overBudget };
    });

    const totalAllocated = Object.values(allocations).reduce(
        (sum, a) => sum + Number(a || 0),
        0
    );

    const remaining = Math.max(Number(income || 0) - totalAllocated, 0);

    const handleAllocationChange = (category, value) => {
        const numeric = Number(value);
        if (numeric < 0) return;

        const totalAfter = Object.entries(allocations).reduce(
            (sum, [cat, val]) => sum + (cat === category ? numeric : Number(val || 0)),
            0
        );

        if (totalAfter > Number(income || 0)) {
            alert("You cannot allocate more than your total income.");
            return;
        }

        setAllocations((prev) => ({ ...prev, [category]: numeric }));
        setUnallocatedIncome(Math.max(Number(income) - totalAfter, 0));
    };

    const handleSubmitBudget = async () => {
        if (!income) return;

        try {
            const formattedAllocations = expenseEntries
                .map((entry) => ({
                    entry_id: entry.id,
                    amount_allocated: Number(allocations[entry.category]) || 0,
                }))
                .filter((a) => a.amount_allocated > 0);

            // If auto-allocate to savings is checked, allocate leftover to savings entry
            if (allocateToSavings && remaining > 0) {
                const savingsEntry = filteredEntries.find(
                    (e) => e.type === "saving" && e.category.toLowerCase() === "savings"
                );
                if (savingsEntry) {
                    formattedAllocations.push({
                        entry_id: savingsEntry.id,
                        amount_allocated: remaining,
                    });
                }
            }

            await updateBudget({
                allocations: formattedAllocations,
                monthly_income: Number(income),
            });

            if (remaining > 0 && !allocateToSavings && selectedGoalId) {
                await addEntry({
                    type: "saving",
                    category: "savingsgoal",
                    amount: remaining,
                    note: savingsTitle || `Auto-saved $${remaining.toFixed(2)}`,
                    title: savingsTitle || `Auto-saved $${remaining.toFixed(2)}`,
                    goal_id: selectedGoalId,
                    month: currentMonth,
                    year: currentYear,
                });
            }

            setIsBudgeting(false);
            setIncome(0);
            setAllocations({});
            setAllocateToSavings(false);
            setSavingsTitle("");
            setSelectedGoalId(null);
        } catch (err) {
            console.error("Failed to submit budget:", err);
        }
    };

    const handleDeleteBudget = async () => {
        if (window.confirm("Are you sure you want to delete this budget for this month?")) {
            try {
                await deleteBudget();
                setAllocations({});
                setIncome(0);
                setUnallocatedIncome(0);
                setIsBudgeting(false);
                setAvailableSavings(0); // reset leftover savings in EntriesContext
            } catch (err) {
                console.error("Failed to delete budget:", err);
            }
        }
    };


    if (loading) return <p>Loading budget...</p>;

    const hasExistingBudget =
        budget?.allocations && Object.keys(budget.allocations).length > 0;

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Monthly Budgeting</h2>

            {totalByCategory.map(({ category, spent, allocated, progress, overBudget }) => (
                <div key={category} className="mb-3">
                    <div className="flex justify-between mb-1">
                        <span>{category}</span>
                        <span className={overBudget ? "text-red-600 font-medium" : ""}>
                            ${spent.toFixed(2)} / ${allocated.toFixed(2)}
                        </span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded">
                        <div
                            className={`h-4 rounded ${overBudget ? "bg-red-500" : "bg-blue-500"}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            ))}

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

            {/* Modal */}
            {isBudgeting && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
                        <h3 className="text-lg font-semibold mb-4">
                            {hasExistingBudget ? "Edit Budget" : "New Budgeting Session"}
                        </h3>

                        {/* Monthly Income */}
                        <label className="block mb-3">
                            <span className="text-sm font-medium">Total Monthly Income:</span>
                            <input
                                type="number"
                                value={income}
                                onChange={(e) => {
                                    const newIncome = Number(e.target.value);
                                    setIncome(newIncome);
                                    const totalAllocated = Object.values(allocations).reduce(
                                        (sum, val) => sum + Number(val || 0),
                                        0
                                    );
                                    setUnallocatedIncome(Math.max(newIncome - totalAllocated, 0));
                                }}
                                placeholder="Enter your monthly income"
                                className="w-full mt-1 border border-gray-300 rounded p-2"
                            />
                        </label>

                        {/* Unallocated Income */}
                        <label className="block mb-3">
                            <span className="text-sm font-medium">Unallocated Income:</span>
                            <input
                                type="number"
                                value={unallocatedIncome}
                                readOnly
                                className={`w-full mt-1 p-2 rounded border ${unallocatedIncome >= 0 ? "border-green-500" : "border-red-500"
                                    }`}
                            />
                        </label>

                        {/* Expense Allocations */}
                        {recordedCategories.map((cat) => {
                            const spent = expenseEntries
                                .filter((e) => e.category === cat)
                                .reduce((sum, e) => sum + Number(e.amount), 0);

                            const currentAlloc = allocations[cat] ?? 0;
                            const remainingNeeded = Math.max(spent - currentAlloc, 0);

                            const progress = spent > 0 ? Math.min((currentAlloc / spent) * 100, 100) : 0;
                            const overBudget = currentAlloc > spent;

                            return (
                                <div key={cat} className="mb-3">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span>{cat}</span>
                                        <span>
                                            Remaining to meet expense: ${remainingNeeded.toFixed(2)}
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        value={currentAlloc}
                                        onChange={(e) => handleAllocationChange(cat, Number(e.target.value))}
                                        min={0}
                                        className="w-full mt-1 text-right border border-gray-300 rounded p-1 text-sm"
                                    />
                                    <div className="h-3 bg-gray-200 rounded mt-1">
                                        <div
                                            className={`h-3 rounded ${overBudget ? "bg-red-500" : "bg-blue-500"}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Auto-allocate checkbox */}
                        <div className="mt-4 flex items-center">
                            <input
                                type="checkbox"
                                checked={allocateToSavings}
                                onChange={(e) => setAllocateToSavings(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm">Auto-allocate remaining income (${remaining.toFixed(2)}) to Savings</span>
                        </div>

                        {/* Modal Buttons */}
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
                                {hasExistingBudget ? "Save Changes" : "Save Budget"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
