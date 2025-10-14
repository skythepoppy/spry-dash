import React, { useState, useEffect } from 'react';
import { useEntries } from '../context/EntriesContext';

export default function SavingsTab() {
    const { filteredEntries, addEntry, deleteEntry, currentMonth, currentYear, fetchEntries } = useEntries();
    const [form, setForm] = useState({ category: '', amount: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEntries(currentMonth, currentYear);
    }, [currentMonth, currentYear, fetchEntries]);

    const savings = filteredEntries.filter(e => e.type === 'saving');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category.trim() || !form.amount) return;

        try {
            setSubmitting(true);
            await addEntry({
                type: 'saving',
                note: form.category.trim(),
                amount: Number(form.amount),
                created_at: new Date().toISOString()
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
                <input
                    type="text"
                    placeholder="Saving Type (Stocks, 401k, etc.)"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="flex-1 border p-2 rounded"
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-32 border p-2 rounded"
                />
                <button type="submit" disabled={submitting} className="bg-green-500 text-white px-4 py-2 rounded">
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            <div className="space-y-3">
                {savings.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 border rounded bg-green-50 border-green-200">
                        <span>{entry.note} — ${Number(entry.amount).toFixed(2)}</span>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
