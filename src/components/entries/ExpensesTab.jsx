import React, { useState } from 'react';
import { useExpenses } from '../context/ExpensesContext';

export default function ExpensesTab() {
    const { expenses, addExpense, deleteExpense, loading, error } = useExpenses();
    const [form, setForm] = useState({ category: '', amount: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;
        try { await addExpense({ category: form.category, amount: Number(form.amount) }); setForm({ category: '', amount: '' }); }
        catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-4">
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="flex gap-4 mb-4">
                <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="border p-2 rounded flex-1"/>
                <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="border p-2 rounded w-32"/>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Add</button>
            </form>

            {expenses.map(exp => (
                <div key={exp.id} className="flex justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                    <span>{exp.category} — ${exp.amount.toFixed(2)}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="text-red-600 hover:underline">Delete</button>
                </div>
            ))}
        </div>
    );
}
