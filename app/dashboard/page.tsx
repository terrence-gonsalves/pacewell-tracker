"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import StatCard from '../components/StatCard';
import { useRouter } from 'next/navigation';

// mock data - will be replaced with real API data later
const mockDashboardData = {
    user: {
        id: '244ea06e-ac5e-458e-bb18-46b78ea5de44',
        email: 'terrence.a.gonsalves@proton.me',
        preferred_unit: 'metric' as const,
    },
    profile: {
        weight_kg: 90.35,
        height_cm: 191,
        age: 53,
        sex: 'M',
        activity_multiplier: 'Moderately Active',
    },
    targets: {
        daily_calories: 2150,
        protein_g: 181,
        carbs_g: 239,
        fat_g: 72,
    },
    today: {
        macros_consumed: {
            calories: 1450,
            protein_g: 125,
            carbs_g: 160,
            fat_g: 42,
        },
        meals_logged: 3,
        weight_logged: true,
        body_fat_logged: false,
    },
    stats: {
        current_weight: 90.35,
        current_body_fat_pct: 23.9,
        target_body_fat_pct: 12.0,
        remaining_calories: 700,
        estimated_goal_date: '2026-09-15',
        progress_to_goal: 45,
    },
};

interface DashboardStats {
    current_weight: number;
    current_body_fat_pct: number;
    target_body_fat_pct: number;
    remaining_calories: number;
    estimated_goal_date: string;
    progress_to_goal: number;
    target_weight?: number;
    lean_body_mass?: number;
    fat_mass?: number;
    weight_to_lose?: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [unitPreference] = useState<'metric' | 'imperial'>('metric');

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // calculate derived metrics
    const stats = mockDashboardData.stats as DashboardStats;
    const profile = mockDashboardData.profile;
    const targets = mockDashboardData.targets;
    const today = mockDashboardData.today;

    // calculate body composition
    const currentWeight = stats.current_weight;
    const currentBodyFat = stats.current_body_fat_pct / 100; // convert to decimal
    const fatMass = currentWeight * currentBodyFat;
    const leanBodyMass = currentWeight - fatMass;

    // calculate weight to lose
    const targetBodyFat = stats.target_body_fat_pct / 100; // convert to decimal
    const targetWeight = leanBodyMass / (1 - targetBodyFat);
    const weightToLose = currentWeight - targetWeight;

    // format weight display based on unit preference
    const formatWeight = (kg: number) => {
        if (unitPreference === 'imperial') {
            return (kg * 2.20462).toFixed(1);
        }

        return kg.toFixed(1);
    };

    const weightUnit = unitPreference === 'metric' ? 'kg' : 'lbs';

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-pacewell-dark to-pacewell-darker">
                <header className="bg-pacewell-dark shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-white text-3xl font-bold">Pacewell Tracker</h1>
                            <p className="text-gray-300 text-sm">v0.4.0-alpha</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-white font-semibold">{user?.email?.split('@')[0]}</p>
                                <p className="text-gray-300 text-sm">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-white text-pacewell-dark px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>
                
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <div className="mb-12">
                        <h2 className="text-white text-4xl font-bold mb-2">
                            Welcome, {user?.email?.split('@')[0]}
                        </h2>
                        <p className="text-gray-300 text-lg">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <StatCard
                            label="Current Weight"
                            value={formatWeight(stats.current_weight)}
                            unit={weightUnit}
                            icon="⚖️"
                            accentColor="text-blue-500"
                        />
                        
                        <StatCard
                            label="Remaining Calories"
                            value={Math.max(0, stats.remaining_calories)}
                            unit="kcal"
                            icon="🔥"
                            accentColor="text-orange-500"
                        />
                        
                        <StatCard
                            label="Protein Consumed"
                            value={today.macros_consumed.protein_g}
                            unit={`/ ${targets.protein_g}g`}
                            icon="🥚"
                            accentColor="text-red-500"
                        />
                        
                        <StatCard
                            label="Carbs Consumed"
                            value={today.macros_consumed.carbs_g}
                            unit={`/ ${targets.carbs_g}g`}
                            icon="🌾"
                            accentColor="text-yellow-500"
                        />
                        
                        <StatCard
                            label="Fat Consumed"
                            value={today.macros_consumed.fat_g}
                            unit={`/ ${targets.fat_g}g`}
                            icon="🥑"
                            accentColor="text-green-500"
                        />
                        
                        <StatCard
                            label="Current Body Fat"
                            value={stats.current_body_fat_pct}
                            unit={`/ ${stats.target_body_fat_pct}%`}
                            icon="📊"
                            accentColor="text-purple-500"
                        />
                        
                        <StatCard
                            label="Lean Body Mass"
                            value={formatWeight(leanBodyMass)}
                            unit={weightUnit}
                            icon="💪"
                            accentColor="text-green-600"
                        />
                        
                        <StatCard
                            label="Fat Mass"
                            value={formatWeight(fatMass)}
                            unit={weightUnit}
                            icon="📈"
                            accentColor="text-pink-500"
                        />
                        
                        <StatCard
                            label="Target Weight"
                            value={formatWeight(targetWeight)}
                            unit={weightUnit}
                            icon="🎯"
                            accentColor="text-blue-600"
                        />
                        
                        <StatCard
                            label="Weight to Lose"
                            value={formatWeight(weightToLose)}
                            unit={weightUnit}
                            icon="📉"
                            accentColor="text-indigo-500"
                        />
                        
                        <StatCard
                            label="Estimated Goal Date"
                            value={new Date(stats.estimated_goal_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                            unit=""
                            icon="📅"
                            accentColor="text-teal-500"
                        />

                        <StatCard
                            label="Progress to Goal"
                            value={Math.min(100, Math.max(0, stats.progress_to_goal))}
                            unit="%"
                            icon="✨"
                            accentColor="text-amber-500"
                        />
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <h3 className="text-2xl font-bold text-pacewell-dark mb-6">Log Your Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button className="bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-3 rounded-lg transition">
                                📝 Log Weight
                            </button>
                            <button className="bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-3 rounded-lg transition">
                                🍽️ Log Meal
                            </button>
                            <button className="bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-3 rounded-lg transition">
                                📊 Log Body Fat
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}