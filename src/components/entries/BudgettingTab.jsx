import React, { useState, useEffect } from 'react';
import { useBudgets } from '../context/BudgetsContext';
import { useExpenses } from '../context/ExpensesContext';

export default function BudgetingTab() {
    const { expenses, fetchExpenses } = useExpenses();
    const { budgets, updateBudget, fetchBudgets } = useBudgets();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchExpenses(month, year);
        fetchBudgets(month, year);
    }, [month, year]);

    const handleAllocation = async (expenseId, value) => {
        await updateBudget(expenseId, { allocated: Number(value), month, year });
    };

    return (
        <div>
            {/* Month Selector */}
            <input
                type="month"
                value={`${year}-${month.toString().padStart(2, '0')}`}
                onChange={(e) => {
                    const [y, m] = e.target.value.split('-');
                    setYear(Number(y));
                    setMonth(Number(m));
                }}
                className="border p-2 rounded mb-4"
            />

            {/* Budget Allocation */}
            {expenses.length === 0 ? (
                <p className="text-gray-500 italic">No expenses to budget this month.</p>
            ) : (
                <div className="space-y-3">
                    {expenses.map((e) => {
                        const budget = budgets.find((b) => b.expenseId === e.id) || { allocated: 0 };
                        const progress = Math.min((budget.allocated / e.amount) * 100, 100);
                        return (
                            <div key={e.id} className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span>{e.category} — ${e.amount.toFixed(2)}</span>
                                    <input
                                        type="number"
                                        value={budget.allocated}
                                        onChange={(ev) => handleAllocation(e.id, ev.target.value)}
                                        className="border p-1 w-24 rounded"
                                    />
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full">
                                    <div
                                        className="h-3 bg-green-500 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
