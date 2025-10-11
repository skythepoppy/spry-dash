// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        // TEMP: clears session later
        navigate('/');
    };

    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div className="flex space-x-4">
                <Link
                    to="/dashboard"
                    className={`px-3 py-1 rounded ${location.pathname === '/dashboard'
                            ? 'bg-gray-600'
                            : 'hover:bg-gray-700'
                        }`}
                >
                    Dashboard
                </Link>
                <Link
                    to="/entries"
                    className={`px-3 py-1 rounded ${location.pathname === '/entries'
                            ? 'bg-gray-600'
                            : 'hover:bg-gray-700'
                        }`}
                >
                    Entries
                </Link>
                <Link
                    to="/savings-goals"
                    className={`px-3 py-1 rounded ${location.pathname === '/savings-goals' ? 'bg-gray-600' : 'hover:bg-gray-700'
                        }`}
                >
                    Goals
                </Link>

            </div>
            <button
                onClick={handleLogout}
                className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 transition"
            >
                Logout
            </button>
        </nav>
    );
}
