import React from 'react';
import { useEntries } from '../context/EntriesContext';

export default function BudgetingTab() {
    const { filteredEntries } = useEntries();

    const expenses = filteredEntries.filter(e => e.type === 'expense');
    const categories = [...new Set(expenses.map(e => e.note))];

    const totalByCategory = categories.map(cat => {
        const total = expenses
            .filter(e => e.note === cat)
            .reduce((sum, e) => sum + Number(e.amount), 0);
        return { category: cat, total };
    });

    return (
        <div>
            {totalByCategory.length === 0 ? (
                <p className="text-gray-500 italic">No expenses recorded this month.</p>
            ) : (
                <div className="space-y-4">
                    {totalByCategory.map(({ category, total }) => (
                        <div key={category}>
                            <div className="flex justify-between mb-1">
                                <span>{category}</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded">
                                <div
                                    className="h-4 bg-blue-500 rounded"
                                    style={{ width: `${Math.min(total / 1000 * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
