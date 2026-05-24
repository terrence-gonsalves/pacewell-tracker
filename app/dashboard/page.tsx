"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useRouter } from 'next/navigation';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { FileBarChart, Plus, Calendar, Clock, UtensilsCrossed, Scale, Flame } from 'lucide-react';

// mock data
const mockDashboardData = {
    user: {
        email: 'terrence.a.gonsalves@proton.me',
        firstName: 'Marcus',
    },
    targets: {
        daily_calories: 2400,
        protein_g: 180,
        carbs_g: 250,
        fat_g: 70,
    },
    today: {
        macros_consumed: {
            calories: 1860,
            protein_g: 142,
            carbs_g: 210,
            fat_g: 52,
        },
        meals_logged: 3,
        weight_logged: true,
        body_fat_logged: true,
    },
    stats: {
        current_weight: 81.5,
        current_body_fat_pct: 14.2,
        target_body_fat_pct: 12.0,
        lean_body_mass: 69.8,
        fat_mass: 11.7,
        target_weight: 78.0,
        weight_change: -0.3,
        weight_change_monthly: 0.2,
        estimated_goal_date: '2026-10-24',
        progress_to_goal: 50,
    },
};

// weight trend data (7 days)
const weightTrendData = [
    { date: 'Tue', weight: 82.1 },
    { date: 'Wed', weight: 81.9 },
    { date: 'Thu', weight: 81.7 },
    { date: 'Fri', weight: 81.6 },
    { date: 'Sat', weight: 81.5 },
    { date: 'Sun', weight: 81.4 },
    { date: 'Mon', weight: 81.5 },
];

// macro breakdown data
const macroData = [
    { name: 'Protein', value: 142, target: 180, fill: '#2D6A4F' },
    { name: 'Carbs', value: 210, target: 250, fill: '#40916C' },
    { name: 'Fats', value: 52, target: 70, fill: '#95D5B2' },
];

const COLORS = ['#2D6A4F', '#40916C', '#95D5B2'];

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const data = mockDashboardData;

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const caloriesRemaining = data.targets.daily_calories - data.today.macros_consumed.calories;
    const daysRemaining = Math.ceil((new Date(data.stats.estimated_goal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                
                <main className="ml-56 flex-1">
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-8 py-6 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Good morning, {data.user.firstName}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    You're {caloriesRemaining} kcal under your limit today. Keep it up!
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                                    <FileBarChart size={20} />
                                    <span>Weekly Report</span>
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker transition font-semibold">
                                    <Plus size={20} />
                                    <span>Log Meal</span>
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <div className="p-8">
                        <section className="mb-8">
                            <div className="bg-white rounded-lg shadow p-8">
                                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6 pb-6 border-b border-gray-200">
                                    Daily Nutrition Summary
                                </h2>
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-48 h-48 mb-4">
                                            <svg className="w-full h-full" viewBox="0 0 200 200">
                                                <circle
                                                    cx="100"
                                                    cy="100"
                                                    r="90"
                                                    fill="none"
                                                    stroke="#E5E7EB"
                                                    strokeWidth="12"
                                                />

                                                <circle
                                                    cx="100"
                                                    cy="100"
                                                    r="90"
                                                    fill="none"
                                                    stroke="#2D6A4F"
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(data.today.macros_consumed.calories / data.targets.daily_calories) * 565.48} 565.48`}
                                                    strokeLinecap="round"
                                                    style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}
                                                />
                                                
                                                <text
                                                    x="100"
                                                    y="100"
                                                    textAnchor="middle"
                                                    className="text-4xl font-bold"
                                                    fill="#2D6A4F"
                                                >
                                                    {data.today.macros_consumed.calories}
                                                </text>
                                                <text
                                                    x="100"
                                                    y="120"
                                                    textAnchor="middle"
                                                    className="text-sm"
                                                    fill="#6B7280"
                                                >
                                                    CALORIES CONSUMED
                                                </text>
                                            </svg>
                                        </div>
                                        <p className="text-center text-gray-600">
                                            <span className="text-2xl font-bold text-gray-900">{caloriesRemaining}</span>
                                            <span className="text-gray-600"> Remaining</span>
                                        </p>
                                    </div>
                                
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="mb-6">
                                            <ResponsiveContainer width={200} height={150}>
                                                <PieChart>
                                                    <Pie
                                                        data={macroData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={75}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                    >
                                                        {COLORS.map((color, index) => (
                                                            <Cell key={`cell-${index}`} fill={color} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="text-center text-sm font-semibold text-gray-700 mb-3">
                                            Macro Breakdown
                                        </p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-pacewell-dark rounded"></div>
                                                <span className="text-gray-600">Protein</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                                <span className="text-gray-600">Carbs</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-200 rounded"></div>
                                                <span className="text-gray-600">Fats</span>
                                            </div>
                                        </div>
                                    </div>
                                
                                    <div className="flex flex-col justify-center space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="font-semibold text-gray-900">Protein</span>
                                                <span className="text-gray-600">{data.today.macros_consumed.protein_g}g / {data.targets.protein_g}g</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-pacewell-dark h-2 rounded-full"
                                                    style={{ width: `${(data.today.macros_consumed.protein_g / data.targets.protein_g) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="font-semibold text-gray-900">Carbohydrates</span>
                                                <span className="text-gray-600">{data.today.macros_consumed.carbs_g}g / {data.targets.carbs_g}g</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full"
                                                    style={{ width: `${(data.today.macros_consumed.carbs_g / data.targets.carbs_g) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="font-semibold text-gray-900">Fats</span>
                                                <span className="text-gray-600">{data.today.macros_consumed.fat_g}g / {data.targets.fat_g}g</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-200 h-2 rounded-full"
                                                    style={{ width: `${(data.today.macros_consumed.fat_g / data.targets.fat_g) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <div className="grid grid-cols-3 gap-8 mb-8">
                            <div className="col-span-2">
                                <div className="bg-white rounded-lg shadow p-8">
                                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6 pb-6 border-b border-gray-200">
                                        Body Composition Overview
                                    </h2>
                                    <div className="grid grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-200">
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                                Current Weight
                                            </p>
                                            <p className="text-3xl font-bold text-gray-900">{data.stats.current_weight} kg</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {data.stats.weight_change > 0 ? '+' : ''}{data.stats.weight_change}kg since yesterday
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                                Body Fat %
                                            </p>
                                            <p className="text-3xl font-bold text-pacewell-dark">{data.stats.current_body_fat_pct}%</p>
                                            <p className="text-sm text-green-600 font-semibold mt-1">Status: Optimal</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                                Lean Body Mass
                                            </p>
                                            <p className="text-3xl font-bold text-gray-900">{data.stats.lean_body_mass} kg</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                +{data.stats.weight_change_monthly}kg this month
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 mb-4">Weight Trend</p>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <LineChart data={weightTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#9CA3AF"
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <YAxis
                                                    stroke="#9CA3AF"
                                                    style={{ fontSize: '12px' }}
                                                    domain={[80, 83]}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: '8px',
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="weight"
                                                    stroke="#2D6A4F"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#2D6A4F', r: 4 }}
                                                    isAnimationActive={true}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900 mb-4">Mass Distribution</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-pacewell-dark rounded-lg h-8 flex items-center px-3">
                                                <span className="text-white text-sm font-semibold">
                                                    Lean Mass ({data.stats.lean_body_mass}kg)
                                                </span>
                                            </div>
                                            <div className="flex-none bg-gray-300 rounded-lg h-8 flex items-center px-3 text-center">
                                                <span className="text-gray-700 text-sm font-semibold">
                                                    Fat ({data.stats.fat_mass}kg)
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">Total: {data.stats.current_weight} kg</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="bg-white rounded-lg shadow p-8 space-y-6">
                                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide pb-6 border-b border-gray-200">
                                        Goals & Progress
                                    </h2>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Primary: Target Weight {data.stats.target_weight} kg
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {data.stats.current_weight} kg
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {data.stats.target_weight} kg
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-pacewell-dark h-3 rounded-full transition-all"
                                                style={{
                                                    width: `${(
                                                        ((data.stats.current_weight - data.stats.target_weight) /
                                                            (data.stats.current_weight - data.stats.target_weight)) *
                                                        100
                                                    ).toFixed(0)}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-100 rounded-lg p-3 text-center">
                                        <p className="text-sm font-bold text-gray-900">
                                            {data.stats.progress_to_goal}% OF GOAL REACHED
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={18} className="text-pacewell-dark" />
                                                <p className="text-xs font-bold text-gray-600 uppercase">Est. Goal Date</p>
                                            </div>
                                            <p className="font-semibold text-gray-900">
                                                {new Date(data.stats.estimated_goal_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={18} className="text-pacewell-dark" />
                                                <p className="text-xs font-bold text-gray-600 uppercase">Days Remaining</p>
                                            </div>
                                            <p className="font-semibold text-gray-900">{daysRemaining} Days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <section>
                            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6">
                                Quick Stats
                            </h2>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <UtensilsCrossed size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase">Meals Logged Today</p>
                                            <p className="text-2xl font-bold text-gray-900">{data.today.meals_logged}/5</p>
                                            <p className="text-xs text-gray-600 mt-1">+1 vs yesterday</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Scale size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase">Weight Logged Today</p>
                                            <p className="text-xl font-bold text-pacewell-dark">Logged</p>
                                            <p className="text-xs text-gray-600 mt-1">Consistent</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileBarChart size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase">Body Fat Logged</p>
                                            <p className="text-2xl font-bold text-gray-900">{data.stats.current_body_fat_pct}%</p>
                                            <p className="text-xs text-gray-600 mt-1">Monthly Update</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Flame size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase">Current Streak</p>
                                            <p className="text-2xl font-bold text-gray-900">14 Days</p>
                                            <p className="text-xs text-gray-600 mt-1">Personal Best</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <Footer />
                </main>
            </div>
        </ProtectedRoute>
    );
}