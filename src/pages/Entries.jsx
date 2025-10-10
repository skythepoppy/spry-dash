import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useEntries } from '../context/EntriesContext';

export default function Entries() {
    const { entries, addEntry, deleteEntry } = useEntries();
    const [form, setForm] = useState({ category: '', amount: '', type: 'expense' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;

        addEntry(form); 
        setForm({ category: '', amount: '', type: 'expense' });
    };

    const categorizeEntries = () => {
        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        const lastWeekStart = new Date(currentWeekStart);
        lastWeekStart.setDate(currentWeekStart.getDate() - 7);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const thisWeek = [];
        const lastWeek = [];
        const lastMonth = [];

        entries.forEach((entry) => {
            const entryDate = new Date(entry.timestamp);
            if (entryDate >= currentWeekStart) {
                thisWeek.push(entry);
            } else if (entryDate >= lastWeekStart && entryDate < currentWeekStart) {
                lastWeek.push(entry);
            } else if (entryDate >= lastMonthStart) {
                lastMonth.push(entry);
            }
        });

        return { thisWeek, lastWeek, lastMonth };
    };

    const { thisWeek, lastWeek, lastMonth } = categorizeEntries();

    const handleDelete = (id) => {
        deleteEntry(id); 
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Entries</h1>

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
                        className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition"
                    >
                        Add
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
                                                    {entry.category} — ${entry.amount}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(entry.timestamp).toLocaleString()}
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
