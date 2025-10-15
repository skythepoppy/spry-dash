import React, { useState, useEffect } from 'react';
import { useEntries } from '../../context/EntriesContext';

export default function SavingsTab() {
    const { filteredEntries, addEntry, deleteEntry, fetchEntries, currentMonth, currentYear, availableSavings, setAvailableSavings } = useEntries();
    const [form, setForm] = useState({ category: '', amount: '', title: '' });
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const savingCategories = ['emergency', 'roth ira', 'stocks', '401k', 'savingsgoal'];

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries, currentMonth, currentYear]);

    const savingsSorted = filteredEntries
        .filter(e => e.type === 'saving')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amountNum = Number(form.amount);

        if (!form.category || !amountNum) return;

        if (amountNum > availableSavings) {
            setErrorMsg(`Cannot use more than $${availableSavings.toFixed(2)} from unallocated savings.`);
            return;
        }

        try {
            setSubmitting(true);
            setErrorMsg('');

            await addEntry({
                type: 'saving',
                category: form.category,
                amount: amountNum,
                note: form.category, // type of savings
                title: form.title || '', // descriptor
                month: currentMonth,
                year: currentYear,
            });

            setAvailableSavings(prev => Math.max(prev - amountNum, 0));
            setForm({ category: '', amount: '', title: '' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, amount) => {
        if (!window.confirm('Delete this saving?')) return;
        await deleteEntry(id);
        setAvailableSavings(prev => prev + Number(amount));
    };

    const handleFinishAllocation = () => {
        if (availableSavings > 0) {
            alert(`You still have $${availableSavings.toFixed(2)} unallocated. Please distribute it into your savings entries before finishing.`);
            return;
        }
        alert('All unallocated savings have been distributed. You may proceed.');
        // Optionally: navigate to another tab/page here
    };

    return (
        <div>
            {availableSavings > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <span>💰 Unallocated savings from budget: ${availableSavings.toFixed(2)}</span>
                </div>
            )}

            {errorMsg && (
                <div className="mb-2 text-red-600 font-medium">{errorMsg}</div>
            )}

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
                    type="text"
                    placeholder="Title"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="flex-1 border p-2 rounded"
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-32 border p-2 rounded"
                    max={availableSavings}
                />
                <button
                    type="submit"
                    disabled={submitting || !form.category || !form.amount || availableSavings <= 0}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            <div className="space-y-3 mb-4">
                {savingsSorted.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 border rounded bg-green-50 border-green-200">
                        <span>{entry.title} — ${Number(entry.amount).toFixed(2)} ({entry.note})</span>
                        <button onClick={() => handleDelete(entry.id, entry.amount)} className="text-red-600 hover:underline">
                            Delete
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={handleFinishAllocation}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={availableSavings <= 0}
            >
                Finish Allocating Savings
            </button>
        </div>
    );
}
