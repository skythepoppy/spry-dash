import React, { useState } from 'react';
import { useSavings } from '../context/SavingsContext';

export default function SavingsTab() {
    const { savings, addSaving, deleteSaving, loading, error } = useSavings();
    const [form, setForm] = useState({ category: '', amount: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;
        try { await addSaving({ category: form.category, amount: Number(form.amount) }); setForm({ category: '', amount: '' }); }
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

            {savings.map(s => (
                <div key={s.id} className="flex justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <span>{s.category} — ${s.amount.toFixed(2)}</span>
                    <button onClick={() => deleteSaving(s.id)} className="text-red-600 hover:underline">Delete</button>
                </div>
            ))}
        </div>
    );
}
