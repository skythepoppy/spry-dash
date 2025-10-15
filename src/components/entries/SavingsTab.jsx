import React, { useState, useEffect } from 'react';
import { useEntries } from '../context/EntriesContext';

export default function SavingsTab() {
    const { filteredEntries, addEntry, deleteEntry, fetchEntries, currentMonth, currentYear } = useEntries();
    const [form, setForm] = useState({ category: '', amount: '' });
    const [submitting, setSubmitting] = useState(false);

    const savingCategories = ['emergency', 'roth ira', 'stocks', '401k', 'savingsgoal'];

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries, currentMonth, currentYear]);

    const savingsSorted = filteredEntries
        .filter(e => e.type === 'saving')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;

        try {
            setSubmitting(true);
            await addEntry({
                type: 'saving',
                category: form.category,
                amount: Number(form.amount),
                note: form.category, // note same as category
                month: currentMonth,
                year: currentYear,
            });
            setForm({ category: '', amount: '' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this saving?')) return;
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
                    <option value="">Select Saving Type</option>
                    {savingCategories.map(cat => (
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
                <button type="submit" disabled={submitting || !form.category || !form.amount} className="bg-green-500 text-white px-4 py-2 rounded">
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            <div className="space-y-3">
                {savingsSorted.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 border rounded bg-green-50 border-green-200">
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
