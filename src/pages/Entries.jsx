import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useEntries } from '../context/EntriesContext';

export default function Entries() {
    const { entries, addEntry, deleteEntry, fetchEntries, loading, error } = useEntries();
    const [form, setForm] = useState({ category: '', amount: '', type: 'expense' });
    const [submitting, setSubmitting] = useState(false);

    // Optional: refresh data on mount or after any submission
    useEffect(() => {
        if (entries.length === 0) fetchEntries();
    }, [fetchEntries]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category.trim() || !form.amount) return;

        try {
            setSubmitting(true);
            await addEntry({
                type: form.type,
                amount: Number(form.amount),
                note: form.category.trim(),
            });
            setForm({ category: '', amount: '', type: 'expense' });
        } catch (err) {
            alert('Failed to add entry. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await deleteEntry(id);
        } catch (err) {
            alert('Failed to delete entry.');
            console.error(err);
        }
    };

    // Categorize entries into time windows
    const categorizeEntries = () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);

        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const thisWeek = [];
        const lastWeek = [];
        const lastMonth = [];

        entries.forEach((entry) => {
            const entryDate = entry.created_at ? new Date(entry.created_at) : new Date();
            if (entryDate >= startOfWeek) {
                thisWeek.push(entry);
            } else if (entryDate >= startOfLastWeek && entryDate < startOfWeek) {
                lastWeek.push(entry);
            } else if (entryDate >= startOfLastMonth) {
                lastMonth.push(entry);
            }
        });

        return { thisWeek, lastWeek, lastMonth };
    };

    const { thisWeek, lastWeek, lastMonth } = categorizeEntries();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Entries</h1>

                {/* Error & Loading States */}
                {loading && <p className="text-gray-500 italic mb-4">Loading entries...</p>}
                {error && <p className="text-red-500 italic mb-4">{error}</p>}

                {/* Entry Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row items-center gap-4"
                >
                    <input
                        type="text"
                        placeholder="Category (e.g. Groceries)"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="flex-1 border p-2 rounded w-full focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Amount"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="w-32 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                    >
                        <option value="expense">Expense</option>
                        <option value="saving">Saving</option>
                    </select>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`bg-blue-500 text-white px-5 py-2 rounded transition ${
                            submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                        }`}
                    >
                        {submitting ? 'Adding...' : 'Add'}
                    </button>
                </form>

                {/* Entries List */}
                <div className="space-y-8">
                    {[
                        { title: 'This Week', data: thisWeek },
                        { title: 'Last Week', data: lastWeek },
                        { title: 'Last Month', data: lastMonth },
                    ].map(({ title, data }) => (
                        <div key={title}>
                            <h2 className="text-xl font-semibold text-gray-700 mb-3">{title}</h2>
                            {data.length === 0 ? (
                                <p className="text-gray-500 italic">No entries for this period.</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`flex justify-between items-center p-4 rounded-xl border ${
                                                entry.type === 'expense'
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-green-50 border-green-200'
                                            }`}
                                        >
                                            <div>
                                                <span className="font-semibold capitalize block">
                                                    {entry.note} — ${Number(entry.amount).toFixed(2)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {entry.created_at
                                                        ? new Date(entry.created_at).toLocaleString()
                                                        : 'Just now'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-sm text-gray-500 hover:text-red-600 transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
