
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useSavingsGoals } from '../context/SavingsGoalsContext';

export default function SavingsGoals() {
  const { goals, addGoal, deleteGoal, markAchieved } = useSavingsGoals();
  const [form, setForm] = useState({ title: '', target: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.target) return;
    addGoal({ title: form.title, target_amount: Number(form.target) });
    setForm({ title: '', target: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Savings Goals</h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row gap-4 items-center"
        >
          <input
            type="text"
            placeholder="Goal Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="number"
            placeholder="Target Amount"
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            className="w-32 border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600 transition"
          >
            Add Goal
          </button>
        </form>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-gray-500 italic">No savings goals yet.</p>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className={`flex justify-between items-center p-4 rounded-xl border ${
                  goal.achieved ? 'bg-green-100 border-green-300' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div>
                  <p className="font-semibold">{goal.title}</p>
                  <p className="text-sm text-gray-500">Target: ${goal.target_amount}</p>
                </div>
                <div className="flex gap-2">
                  {!goal.achieved && (
                    <button
                      onClick={() => markAchieved(goal.id)}
                      className="text-sm text-green-600 hover:underline"
                    >
                      Mark Achieved
                    </button>
                  )}
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
