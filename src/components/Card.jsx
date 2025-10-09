import React from 'react';

export default function Card({ title, value, icon: Icon, color = 'bg-white' }) {
  return (
    <div
      className={`p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between transition-transform hover:scale-[1.02] ${color}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-600">{title}</h2>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      </div>

      {Icon && (
        <div className="text-gray-500 text-4xl opacity-60">
          <Icon />
        </div>
      )}
    </div>
  );
}
