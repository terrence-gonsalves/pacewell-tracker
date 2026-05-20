"use client";

import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();

        router.push('/login');
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-pacewell-dark to-pacewell-darker">
                <header className="bg-pacewell-dark shadow">
                    <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                        <h1 className="text-white text-2xl font-bold">Pacewell Tracker</h1>
                        <div className="flex items-center gap-4">
                            <p className="text-white">{user?.email}</p>
                            <button
                                onClick={handleLogout}
                                className="bg-white text-pacewell-dark px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>
                
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h2 className="text-white text-3xl font-bold mb-2">Welcome, {user?.email?.split('@')[0]}</h2>
                        <p className="text-gray-300">Dashboard coming soon...</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-pacewell-dark mb-2">Stats Card 1</h3>
                            <p className="text-gray-600">Dashboard stats will appear here</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-pacewell-dark mb-2">Stats Card 2</h3>
                            <p className="text-gray-600">Dashboard stats will appear here</p>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}