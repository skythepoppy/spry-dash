import React, { useState, useEffect } from 'react';
import { useEntries } from '../context/EntriesContext';

export default function ExpensesTab() {
    const { filteredEntries, addEntry, deleteEntry, fetchEntries, currentMonth, currentYear } = useEntries();
    const [form, setForm] = useState({ category: '', amount: '' });
    const [submitting, setSubmitting] = useState(false);

    const expenseCategories = ['rent', 'food', 'utilities', 'entertainment', 'clothing', 'other'];

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries, currentMonth, currentYear]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;

        try {
            setSubmitting(true);
            await addEntry({
                type: 'expense',
                category: form.category,
                amount: Number(form.amount),
                note: form.category, // keep note same as category for now
                month: currentMonth,
                year: currentYear,
            });
            setForm({ category: '', amount: '' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        await deleteEntry(id);
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="flex-1 border p-2 rounded"
                >
                    <option value="">Select Category</option>
                    {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-32 border p-2 rounded"
                />
                <button type="submit" disabled={submitting || !form.category || !form.amount} className="bg-blue-500 text-white px-4 py-2 rounded">
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            <div className="space-y-3">
                {filteredEntries
                    .filter(e => e.type === 'expense')
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map(entry => (
                        <div key={entry.id} className="flex justify-between items-center p-3 border rounded bg-red-50 border-red-200">
                            <span>{entry.note} — ${Number(entry.amount).toFixed(2)}</span>
                            <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:underline">
                                Delete
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
}
