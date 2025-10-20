import React, { useState, useEffect } from 'react';
import { useEntries } from '../../context/EntriesContext';

export default function SavingsTab() {
    const { 
        filteredEntries, 
        addEntry, 
        deleteEntry, 
        fetchEntries, 
        currentMonth, 
        currentYear, 
        availableSavings, 
        setAvailableSavings 
    } = useEntries();

    const [form, setForm] = useState({ category: '', amount: '', title: '' });
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const savingCategories = ['emergency', 'roth ira', 'stocks', '401k', 'savingsgoal'];

    // Fetch latest entries when month/year changes
    useEffect(() => {
        fetchEntries();
    }, [fetchEntries, currentMonth, currentYear]);

    // Filter and sort saving entries (latest first)
    const savingsSorted = filteredEntries
        .filter(e => e.type === 'saving')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Handle submission of a new savings allocation
    const handleSubmit = async (e) => {
        e.preventDefault();
        const amountNum = Number(form.amount);

        if (!form.category || !amountNum) return;
        if (amountNum > availableSavings) {
            setErrorMsg(`You cannot allocate more than $${availableSavings.toFixed(2)} of unallocated savings.`);
            return;
        }

        try {
            setSubmitting(true);
            setErrorMsg('');
            setSuccessMsg('');

            await addEntry({
                type: 'saving',
                category: form.category,
                amount: amountNum,
                note: form.category,
                title: form.title || '',
                month: currentMonth,
                year: currentYear,
            });

            // Update available savings (subtract the amount allocated)
            setAvailableSavings(prev => Math.max(prev - amountNum, 0));
            setForm({ category: '', amount: '', title: '' });
            setSuccessMsg(`Successfully allocated $${amountNum.toFixed(2)} to ${form.category}.`);
        } catch (err) {
            setErrorMsg('Failed to add saving. Please try again.');
        } finally {
            setSubmitting(false);
            // Clear success message after a few seconds
            setTimeout(() => setSuccessMsg(''), 4000);
        }
    };

    // Handle deletion of a savings entry (adds back the amount)
    const handleDelete = async (id, amount) => {
        if (!window.confirm('Delete this savings entry?')) return;
        await deleteEntry(id);
        setAvailableSavings(prev => prev + Number(amount));
    };

    // Handle finishing allocation
    const handleFinishAllocation = () => {
        if (availableSavings > 0) {
            alert(`You still have $${availableSavings.toFixed(2)} unallocated. Please distribute it into your savings categories before finishing.`);
            return;
        }
        alert('All unallocated savings have been successfully distributed. Great job!');
    };

    return (
        <div className="p-4">
            {/* Display unallocated savings */}
            {availableSavings > 0 ? (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <span>You currently have <strong>${availableSavings.toFixed(2)}</strong> available from your budget allocation.</span>
                </div>
            ) : (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <span>All budgeted savings have been allocated for this month!</span>
                </div>
            )}

            {/* Error or success messages */}
            {errorMsg && <div className="mb-2 text-red-600 font-medium">{errorMsg}</div>}
            {successMsg && <div className="mb-2 text-green-600 font-medium">{successMsg}</div>}

            {/* Form for new saving entry */}
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-6">
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
                    placeholder="Title / Description"
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
                    min="0"
                    max={availableSavings}
                />
                <button
                    type="submit"
                    disabled={submitting || !form.category || !form.amount || availableSavings <= 0}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            {/* Savings entries list */}
            <div className="space-y-3 mb-4">
                {savingsSorted.length === 0 ? (
                    <div className="text-gray-500 italic">No savings entries yet.</div>
                ) : (
                    savingsSorted.map(entry => (
                        <div 
                            key={entry.id} 
                            className="flex justify-between items-center p-3 border rounded bg-green-50 border-green-200"
                        >
                            <span>
                                {entry.title ? `${entry.title} — ` : ''}
                                ${Number(entry.amount).toFixed(2)} 
                                <span className="text-gray-600"> ({entry.note})</span>
                            </span>
                            <button 
                                onClick={() => handleDelete(entry.id, entry.amount)} 
                                className="text-red-600 hover:underline"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Finish allocation button */}
            <button
                onClick={handleFinishAllocation}
                className={`w-full mt-4 py-2 rounded text-white ${
                    availableSavings > 0 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={availableSavings > 0}
            >
                Finish Allocating Savings
            </button>
        </div>
    );
}
