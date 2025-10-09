
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-center space-x-4">
      <Link
        to="/dashboard"
        className={`px-3 py-1 rounded ${location.pathname === '/dashboard' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
      >
        Dashboard
      </Link>
      <Link
        to="/entries"
        className={`px-3 py-1 rounded ${location.pathname === '/entries' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
      >
        Entries
      </Link>
    </nav>
  );
}
