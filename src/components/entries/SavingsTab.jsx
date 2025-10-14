import React, { useState, useEffect } from 'react';
import { useSavings } from '../context/SavingsContext';

export default function SavingsTab() {
    const { savings, addSaving, fetchSavings } = useSavings();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [form, setForm] = useState({ category: '', amount: '' });

    useEffect(() => {
        fetchSavings(month, year);
    }, [month, year]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;
        await addSaving({ category: form.category, amount: Number(form.amount), month, year });
        setForm({ category: '', amount: '' });
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

            {/* Add Saving */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Category (e.g., 401k)"
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

            {/* Savings List */}
            {savings.length === 0 ? (
                <p className="text-gray-500 italic">No savings entries this month.</p>
            ) : (
                <div className="space-y-2">
                    {savings.map((s) => (
                        <div key={s.id} className="flex justify-between p-3 border rounded">
                            <span>{s.category} — ${s.amount.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts can go here */}
            <div className="mt-6">
                <p className="text-gray-400 italic">Charts coming soon...</p>
            </div>
        </div>
    );
}
