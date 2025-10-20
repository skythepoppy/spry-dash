import React, { useState, useEffect } from 'react';
import { useEntries } from '../../context/EntriesContext';
import { useBudget } from '../../context/BudgetContext';

export default function SavingsTab() {
    const { filteredEntries, addEntry, deleteEntry, fetchEntries, currentMonth, currentYear } = useEntries();
    const { budget, unallocatedIncome, setUnallocatedIncome } = useBudget();

    const [form, setForm] = useState({ category: '', amount: '', title: '' });
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const savingCategories = ['emergency', 'roth ira', 'stocks', '401k', 'savingsgoal'];

    // Fetch 
    useEffect(() => {
    fetchEntries().then(() => {
        // Calculate remaining savings after fetching current entries
        const allocated = filteredEntries
            .filter(e => e.type === 'saving')
            .reduce((sum, e) => sum + Number(e.amount), 0);

        if (budget?.monthly_income != null) {
            setUnallocatedIncome(Math.max(budget.monthly_income - allocated, 0));
        }
    });
}, [fetchEntries, filteredEntries, budget]);

    // Sort savings entries
    const savingsSorted = filteredEntries
        .filter(e => e.type === 'saving')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amountNum = Number(form.amount);

        if (!form.category || !amountNum) {
            setErrorMsg('Please fill in all fields.');
            return;
        }
        if (amountNum > unallocatedIncome) {
            setErrorMsg(`You only have $${unallocatedIncome.toFixed(2)} available to allocate.`);
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

            // Subtract from unallocatedIncome
            setUnallocatedIncome(prev => Math.max(prev - amountNum, 0));

            setForm({ category: '', amount: '', title: '' });
            setSuccessMsg(`Allocated $${amountNum.toFixed(2)} to ${form.category}.`);
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to add saving. Please try again.');
        } finally {
            setSubmitting(false);
            setTimeout(() => setSuccessMsg(''), 4000);
        }
    };

    const handleDelete = async (id, amount) => {
        if (!window.confirm('Delete this savings entry?')) return;
        try {
            await deleteEntry(id);
            setUnallocatedIncome(prev => prev + Number(amount));
        } catch {
            alert('Failed to delete entry.');
        }
    };

    const handleFinishAllocation = () => {
        if (unallocatedIncome > 0) {
            alert(`You still have $${unallocatedIncome.toFixed(2)} unallocated. Please distribute it before finishing.`);
            return;
        }
        alert('All leftover income has been successfully allocated to savings!');
    };

    return (
        <div className="p-4">
            {/* AVAILABLE SAVINGS INFO */}
            {unallocatedIncome > 0 ? (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    You currently have <strong>${unallocatedIncome.toFixed(2)}</strong> available to allocate from your budget.
                </div>
            ) : (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    All budgeted savings have been allocated for this month!
                </div>
            )}

            {/* ERROR / SUCCESS */}
            {errorMsg && <div className="mb-2 text-red-600 font-medium">{errorMsg}</div>}
            {successMsg && <div className="mb-2 text-green-600 font-medium">{successMsg}</div>}

            {/* ALLOCATION FORM */}
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
                    max={unallocatedIncome}
                />

                <button
                    type="submit"
                    disabled={submitting || !form.category || !form.amount || unallocatedIncome <= 0}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                    {submitting ? 'Adding...' : 'Allocate'}
                </button>
            </form>

            {/* SAVINGS ENTRIES */}
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
                                <span className="text-gray-600"> ({entry.category})</span>
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

            {/* FINISH BUTTON */}
            <button
                onClick={handleFinishAllocation}
                className={`w-full mt-4 py-2 rounded text-white ${unallocatedIncome > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={unallocatedIncome > 0}
            >
                Finish Allocating Savings
            </button>
        </div>
    );
}
