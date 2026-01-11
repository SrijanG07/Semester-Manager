import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <h1
                                className="text-2xl font-bold text-gray-900 cursor-pointer"
                                onClick={() => navigate('/dashboard')}
                            >
                                📚 Semester Manager
                            </h1>

                            <div className="hidden md:flex items-center gap-1">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className={`px-4 py-2 rounded-lg transition ${isActive('/dashboard')
                                            ? 'bg-blue-100 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/subjects')}
                                    className={`px-4 py-2 rounded-lg transition ${isActive('/subjects')
                                            ? 'bg-blue-100 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    Subjects
                                </button>
                                <button
                                    onClick={() => navigate('/study')}
                                    className={`px-4 py-2 rounded-lg transition ${isActive('/study')
                                            ? 'bg-blue-100 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    Study
                                </button>
                                <button
                                    onClick={() => navigate('/deadlines')}
                                    className={`px-4 py-2 rounded-lg transition ${isActive('/deadlines')
                                            ? 'bg-blue-100 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    Deadlines
                                </button>
                                <button
                                    onClick={() => navigate('/analytics')}
                                    className={`px-4 py-2 rounded-lg transition ${isActive('/analytics')
                                            ? 'bg-blue-100 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    Analytics
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 hidden sm:block">
                                Welcome, <strong>{user?.name}</strong>
                            </span>
                            <button onClick={handleLogout} className="btn btn-secondary">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto">{children}</main>
        </div>
    );
};

export default DashboardLayout;
