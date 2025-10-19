import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useEntries } from '../../context/EntriesContext';
import { useSavingsGoals } from '../../context/SavingsGoalsContext';
import { BudgetContext } from '../../context/BudgetContext';

export default function BudgetingTab() {
  const { filteredEntries, fetchEntries, addEntry, currentMonth, currentYear, setAvailableSavings } = useEntries();
  const { activeGoals, fetchGoals } = useSavingsGoals();
  const { budget, updateBudget, loading } = useContext(BudgetContext);

  const [isBudgeting, setIsBudgeting] = useState(false);
  const [income, setIncome] = useState('');
  const [allocations, setAllocations] = useState({});
  const [allocateToSavings, setAllocateToSavings] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [savingsTitle, setSavingsTitle] = useState('');

  useEffect(() => {
    fetchEntries();
    fetchGoals();
  }, []);

  const expenseEntries = useMemo(
    () => filteredEntries.filter(e => e.type === 'expense'),
    [filteredEntries]
  );

  const recordedCategories = useMemo(
    () => [...new Set(expenseEntries.map(e => e.category))],
    [expenseEntries]
  );

  // prefill allocations when opening budgeting modal
  useEffect(() => {
    if (isBudgeting) {
      const prefill = {};
      recordedCategories.forEach(cat => {
        prefill[cat] = budget?.allocations?.[cat] ?? 0;
      });
      setAllocations(prefill);

      if (!income) {
        const totalAllocated = Object.values(prefill).reduce((sum, val) => sum + Number(val), 0);
        setIncome(budget?.totalIncome ?? totalAllocated);
      }
    }
  }, [isBudgeting, budget, recordedCategories, income]);

  // Calculate total per category + progress bar
  const totalByCategory = recordedCategories.map(cat => {
    const spent = expenseEntries
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    let allocated = 0;

    if (allocations[cat]) {
      allocated = Number(allocations[cat]);
    } else if (budget?.allocations && Array.isArray(budget.allocations)) {
      const match = budget.allocations.find(a => {
        const entry = expenseEntries.find(e => e.id === a.entry_id);
        return entry && entry.category === cat;
      });
      allocated = match ? Number(match.amount_allocated) : 0;
    }

    const progress = spent > 0 ? Math.min((allocated / spent) * 100, 100) : 0;
    const overBudget = allocated > spent;

    return { category: cat, spent, allocated, progress, overBudget };
  });

  // remaining income + per-category remaining
  const totalAllocatedSoFar = Object.values(budget?.allocations || {}).reduce(
    (sum, val) => sum + Number(val.amount_allocated || val),
    0
  );
  const remainingIncome = Math.max((budget?.totalIncome || 0) - totalAllocatedSoFar, 0);

  const remainingByCategory = {};
  recordedCategories.forEach(cat => {
    const spent = expenseEntries
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const allocated = budget?.allocations?.find(a => {
      const entry = expenseEntries.find(e => e.id === a.entry_id);
      return entry && entry.category === cat;
    })?.amount_allocated || 0;

    remainingByCategory[cat] = Math.max(spent - allocated, 0);
  });

  const hasExistingBudget = budget?.allocations && Object.keys(budget.allocations).length > 0;
  const totalAllocated = Object.values(allocations).reduce((sum, a) => sum + Number(a || 0), 0);
  const remaining = Math.max(Number(income || budget?.totalIncome || 0) - totalAllocated, 0);

  // prevent over-allocating beyond income
  const handleAllocationChange = (category, value) => {
    const numeric = Number(value);
    if (numeric < 0) return;

    const totalAfter = Object.entries(allocations).reduce((sum, [cat, val]) => {
      return sum + (cat === category ? numeric : Number(val || 0));
    }, 0);

    if (totalAfter > Number(income || budget?.totalIncome || 0)) {
      alert("You cannot allocate more than your total income.");
      return;
    }

    setAllocations(prev => ({ ...prev, [category]: numeric }));
  };

  const handleSubmitBudget = async () => {
    if (!income) return;

    try {
      const formattedAllocations = expenseEntries
        .map(entry => ({
          entry_id: entry.id,
          amount_allocated: Number(allocations[entry.category]) || 0,
        }))
        .filter(a => a.amount_allocated > 0);

      await updateBudget({
        allocations: formattedAllocations,
        totalIncome: Number(income),
      });

      if (remaining > 0) {
        if (allocateToSavings && selectedGoalId) {
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
        } else {
          setAvailableSavings(prev => Number(prev) + Number(remaining));
        }
      }

      setIsBudgeting(false);
      setIncome("");
      setAllocations({});
      setAllocateToSavings(false);
      setSavingsTitle("");
      setSelectedGoalId(null);
    } catch (err) {
      console.error("Failed to submit budget:", err);
    }
  };

  const handleDeleteBudget = async () => {
    if (window.confirm('Are you sure you want to delete this budget for this month?')) {
      await updateBudget({ allocations: {}, totalIncome: 0 });
      setAllocations({});
      setIncome('');
    }
  };

  if (loading) return <p>Loading budget...</p>;

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

            {/* Remaining Income Display */}
            <div className="flex justify-between text-sm mb-3">
              <span>Remaining income balance:</span>
              <span className={remainingIncome <= 0 ? "text-red-600" : "text-green-600"}>
                ${remainingIncome.toFixed(2)}
              </span>
            </div>

            {recordedCategories.map(cat => {
              const currentAlloc = allocations[cat] ?? (
                Array.isArray(budget?.allocations)
                  ? budget.allocations.find(a => {
                      const entry = expenseEntries.find(e => e.id === a.entry_id);
                      return entry && entry.category === cat;
                    })?.amount_allocated || 0
                  : 0
              );

              const remainingAllowed = remainingByCategory[cat] ?? 0;

              return (
                <div key={cat} className="mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{cat}</span>
                    <span className="text-xs text-gray-600">
                      Remaining allocatable: ${remainingAllowed.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={currentAlloc}
                    onChange={e => handleAllocationChange(cat, e.target.value)}
                    placeholder="Allocate"
                    max={remainingAllowed + Number(currentAlloc)}
                    className="w-full mt-1 text-right border border-gray-300 rounded p-1 text-sm"
                  />
                </div>
              );
            })}

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
