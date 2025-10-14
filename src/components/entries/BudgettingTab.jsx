import React, { useState } from 'react';
import { useBudgets } from '../context/BudgetsContext';

export default function BudgetingTab() {
    const { budgets, addBudget, deleteBudget, loading, error } = useBudgets();
    const [form, setForm] = useState({ category: '', amount: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;
        try { await addBudget({ category: form.category, amount: Number(form.amount) }); setForm({ category: '', amount: '' }); }
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

            {budgets.map(b => (
                <div key={b.id} className="flex justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <span>{b.category} — ${b.amount.toFixed(2)}</span>
                    <button onClick={() => deleteBudget(b.id)} className="text-red-600 hover:underline">Delete</button>
                </div>
            ))}
        </div>
    );
}
