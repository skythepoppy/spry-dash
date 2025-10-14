import React, { useState, useEffect } from 'react';
import { useEntries } from '../context/EntriesContext';

export default function ExpensesTab() {
    const { filteredEntries, addEntry, deleteEntry, currentMonth, setCurrentMonth, currentYear, setCurrentYear, fetchEntries } = useEntries();
    const [form, setForm] = useState({ category: '', amount: '' });
    const [submitting, setSubmitting] = useState(false);

    // Fetch entries when month or year changes
    useEffect(() => {
        fetchEntries(currentMonth, currentYear);
    }, [currentMonth, currentYear, fetchEntries]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category.trim() || !form.amount) return;

        try {
            setSubmitting(true);
            await addEntry({
                type: 'expense',
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
        if (!window.confirm('Delete this expense?')) return;
        await deleteEntry(id);
    };

    return (
        <div>
            <div className="flex gap-4 mb-4">
                <select value={currentMonth} onChange={e => setCurrentMonth(Number(e.target.value))}>
                    {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                </select>
                <input
                    type="number"
                    value={currentYear}
                    onChange={e => setCurrentYear(Number(e.target.value))}
                    className="w-24 border p-1 rounded"
                />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Category"
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
                <button type="submit" disabled={submitting} className="bg-blue-500 text-white px-4 py-2 rounded">
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            <div className="space-y-3">
                {filteredEntries.filter(e => e.type === 'expense').map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 border rounded bg-red-50 border-red-200">
                        <span>{entry.note} — ${Number(entry.amount).toFixed(2)}</span>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
