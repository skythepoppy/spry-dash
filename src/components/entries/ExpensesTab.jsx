import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpensesContext';

export default function ExpensesTab() {
    const { expenses, addExpense, deleteExpense, fetchExpenses } = useExpenses();
    const [form, setForm] = useState({ category: '', amount: '' });
    const [month, setMonth] = useState(new Date().getMonth() + 1); // current month
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchExpenses(month, year);
    }, [month, year]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;
        await addExpense({ category: form.category, amount: Number(form.amount), month, year });
        setForm({ category: '', amount: '' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        await deleteExpense(id);
    };

    return (
        <div>
            {/* Month Selector */}
            <div className="flex gap-4 mb-4">
                <input
                    type="month"
                    value={`${year}-${month.toString().padStart(2, '0')}`}
                    onChange={(e) => {
                        const [y, m] = e.target.value.split('-');
                        setYear(Number(y));
                        setMonth(Number(m));
                    }}
                    className="border p-2 rounded"
                />
            </div>

            {/* Add Expense Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="border p-2 rounded flex-1"
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="border p-2 rounded w-32"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    Add
                </button>
            </form>

            {/* Expense List */}
            {expenses.length === 0 ? (
                <p className="text-gray-500 italic">No expenses this month.</p>
            ) : (
                <div className="space-y-2">
                    {expenses.map((e) => (
                        <div key={e.id} className="flex justify-between p-3 border rounded">
                            <span>{e.category} — ${e.amount.toFixed(2)}</span>
                            <button
                                onClick={() => handleDelete(e.id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
