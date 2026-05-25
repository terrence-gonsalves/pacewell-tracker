/**
 * Personal Goals Page - app/personal-goals/page.tsx
 * Allows users to set and manage their fitness and nutrition goals
 * Integrates with Supabase to store goals and calculate projected milestones
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Zap, Dumbbell, Scale, Info, RotateCcw, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface Milestone {
    date: string;
    milestone_label: string;
    weeks: number;
    projected_weight: number;
    projected_body_fat_percentage: number;
}

interface ActiveGoal {
    id: string;
    goal_strategy: string;
    target_weight: number;
    target_body_fat_percentage: number;
    daily_calorie_target: number;
    protein_percentage: number;
    carbs_percentage: number;
    fats_percentage: number;
    projected_milestones: Milestone[];
    created_at: string;
}

// default values for form reset
const DEFAULT_VALUES = {
    goalStrategy: 'Weight Loss',
    bodyTargets: {
        targetWeight: 0,
        bodyFatPercentage: 0,
    },
    dailyCalories: 0,
    macros: {
        protein: 0,
        carbs: 0,
        fats: 0,
    },
};

const MOCK_CURRENT_DATA = {
    currentWeight: 198,
    currentBodyFat: 24,
    age: 45,
    weeklyActivity: 'moderate',
};

export default function PersonalGoalsPage() {
    const { user } = useAuth();

    // form state
    const [goalStrategy, setGoalStrategy] = useState<'Weight Loss' | 'Muscle Gain' | 'Maintenance'>('Weight Loss');
    const [bodyTargets, setBodyTargets] = useState({
        targetWeight: 0,
        bodyFatPercentage: 0,
    });
    const [dailyCalories, setDailyCalories] = useState(0);
    const [macros, setMacros] = useState({
        protein: 0,
        carbs: 0,
        fats: 0,
    });

    // loading and error states
    const [isLoadingGoal, setIsLoadingGoal] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeGoal, setActiveGoal] = useState<ActiveGoal | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // calculate macros total
    const totalMacros = macros.protein + macros.carbs + macros.fats;

    const getBalanceStatus = () => {
        if (totalMacros === 100) return 'Perfectly Balanced';
        if (totalMacros > 100) return 'Slightly Over';
        return 'Unbalanced';
    };

    const getBalanceStatusColor = () => {
        if (totalMacros === 100) return 'text-green-600';
        if (totalMacros > 100) return 'text-yellow-600';
        return 'text-red-600';
    };

    const handleMacroChange = (macro: 'protein' | 'carbs' | 'fats', value: number) => {
        setMacros(prev => ({
            ...prev,
            [macro]: Math.max(0, Math.min(100, value)),
        }));
    };

    // fetch active goal on mount
    const fetchActiveGoal = useCallback(async () => {
        try {
            setIsLoadingGoal(true);
            setError(null);

            const token = localStorage.getItem('pacewell_token');

            if (!token) {
                setError('No active session. Please log in again.');

                return;
            }

            const response = await fetch('/api/personal-goals', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch active goal');
            }

            const data = await response.json();

            if (data.data) {
                setActiveGoal(data.data);
            } else {
                setActiveGoal(null);
            }
        } catch (err) {
            console.error('Error fetching active goal:', err);
            setError('Failed to load your active goal. Please try again.');
        } finally {
            setIsLoadingGoal(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchActiveGoal();
        }
    }, [user, fetchActiveGoal]);

    // handle save
    const handleSave = async () => {
        try {

            // validate macros
            if (Math.abs(totalMacros - 100) > 0.1) {
                setError(`Macro percentages must total 100%. Current total: ${totalMacros.toFixed(1)}%`);

                return;
            }

            // validate target weight
            if (bodyTargets.targetWeight <= 0) {
                setError('Target weight must be greater than 0');

                return;
            }

            // validate calorie target
            if (dailyCalories < 1200 || dailyCalories > 10000) {
                setError('Daily calorie target must be between 1200 and 10,000');

                return;
            }

            setIsSaving(true);
            setError(null);
            setSuccessMessage(null);

            const token = localStorage.getItem('pacewell_token');

            if (!token) {
                setError('No active session. Please log in again.');

                return;
            }

            const response = await fetch('/api/personal-goals', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goal_strategy: goalStrategy,
                    target_weight: bodyTargets.targetWeight,
                    target_body_fat_percentage: bodyTargets.bodyFatPercentage,
                    daily_calorie_target: dailyCalories,
                    protein_percentage: macros.protein,
                    carbs_percentage: macros.carbs,
                    fats_percentage: macros.fats,
                    current_weight: MOCK_CURRENT_DATA.currentWeight,
                    current_body_fat_percentage: MOCK_CURRENT_DATA.currentBodyFat,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(errorData.error || 'Failed to save goal');
            }

            const data = await response.json();

            setActiveGoal(data.data);
            setSuccessMessage('Goal saved successfully!');

            // clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save goal. Please try again.';

            setError(errorMessage);            
            console.error('Error saving goal:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // handle reset
    const handleReset = () => {
        setGoalStrategy('Weight Loss');
        setBodyTargets(DEFAULT_VALUES.bodyTargets);
        setDailyCalories(DEFAULT_VALUES.dailyCalories);
        setMacros(DEFAULT_VALUES.macros);
        setError(null);
        setSuccessMessage(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                
                <main className="ml-56 flex-1">
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-8 py-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Personal Goals</h1>
                                <p className="text-gray-600 mt-1">Configure your physiological targets and nutritional roadmap.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    disabled={isSaving}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RotateCcw size={18} />
                                    <span>Reset Changes</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span>{isSaving ? 'Saving...' : 'Save & Apply'}</span>
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    {error && (
                        <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-green-800">{successMessage}</p>
                        </div>
                    )}
                    
                    <div className="p-8">

                        {isLoadingGoal ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-pacewell-dark border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Loading your goals...</p>
                            </div>
                        </div>
                        ) : (
                        <div className="grid grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={20} className="text-pacewell-dark" />
                                        <h2 className="text-xl font-bold text-gray-900">Goal Strategy</h2>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-6">Select your primary focus to optimize recommendations.</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button
                                            onClick={() => setGoalStrategy('Weight Loss')}
                                            disabled={isSaving}
                                            className={`p-6 rounded-lg border-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                            goalStrategy === 'Weight Loss'
                                                ? 'border-pacewell-dark bg-green-50'
                                                : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                        >
                                            <div className="flex justify-center mb-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goalStrategy === 'Weight Loss' ? 'bg-pacewell-dark' : 'bg-gray-200'}`}>
                                                <Scale size={24} className={goalStrategy === 'Weight Loss' ? 'text-white' : 'text-gray-600'} />
                                            </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">Weight Loss</h3>
                                            <p className="text-sm text-gray-600">Prioritize fat reduction</p>
                                        </button>
                                        <button
                                            onClick={() => setGoalStrategy('Muscle Gain')}
                                            disabled={isSaving}
                                            className={`p-6 rounded-lg border-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                            goalStrategy === 'Muscle Gain'
                                                ? 'border-pacewell-dark bg-green-50'
                                                : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                        >
                                            <div className="flex justify-center mb-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goalStrategy === 'Muscle Gain' ? 'bg-pacewell-dark' : 'bg-gray-200'}`}>
                                                <Dumbbell size={24} className={goalStrategy === 'Muscle Gain' ? 'text-white' : 'text-gray-600'} />
                                            </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">Muscle Gain</h3>
                                            <p className="text-sm text-gray-600">Anabolic surplus focus</p>
                                        </button>
                                        
                                        <button
                                            onClick={() => setGoalStrategy('Maintenance')}
                                            disabled={isSaving}
                                            className={`p-6 rounded-lg border-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                            goalStrategy === 'Maintenance'
                                                ? 'border-pacewell-dark bg-green-50'
                                                : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                        >
                                            <div className="flex justify-center mb-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goalStrategy === 'Maintenance' ? 'bg-pacewell-dark' : 'bg-gray-200'}`}>
                                                <Zap size={24} className={goalStrategy === 'Maintenance' ? 'text-white' : 'text-gray-600'} />
                                            </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">Maintenance</h3>
                                            <p className="text-sm text-gray-600">Stable metabolic balance</p>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <Scale size={20} className="text-pacewell-dark" />
                                            <h2 className="text-lg font-bold text-gray-900">Body Targets</h2>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Target Weight</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={bodyTargets.targetWeight || ''}
                                                        onChange={(e) => setBodyTargets(prev => ({ ...prev, targetWeight: parseFloat(e.target.value) || 0 }))}
                                                        disabled={isSaving}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-4 top-2 text-gray-600 font-semibold">lbs</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Body Fat Percentage</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={bodyTargets.bodyFatPercentage || ''}
                                                        onChange={(e) => setBodyTargets(prev => ({ ...prev, bodyFatPercentage: parseFloat(e.target.value) || 0 }))}
                                                        disabled={isSaving}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-4 top-2 text-gray-600 font-semibold">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <Zap size={20} className="text-pacewell-dark" />
                                            <h2 className="text-lg font-bold text-gray-900">Daily Energy</h2>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Daily Calorie Target</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={dailyCalories || ''}
                                                        onChange={(e) => setDailyCalories(parseInt(e.target.value) || 0)}
                                                        disabled={isSaving}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-4 top-2 text-gray-600 font-semibold">kcal</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <Info size={16} className="flex-shrink-0 text-blue-600 mt-0.5" />
                                                <p>Based on your age ({MOCK_CURRENT_DATA.age}) and {MOCK_CURRENT_DATA.weeklyActivity} weekly activity, {dailyCalories || 0} kcal is a sustainable deficit for fat loss.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <Dumbbell size={20} className="text-pacewell-dark" />
                                            <h2 className="text-lg font-bold text-gray-900">Macro Nutrient Breakdown</h2>
                                        </div>
                                        <span className={`text-sm font-semibold ${getBalanceStatusColor()}`}>{getBalanceStatus()}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-6">Adjust your daily intake percentages.</p>
                                    
                                    <div className="space-y-6 mb-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-semibold text-gray-900">Protein</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={macros.protein || ''}
                                                        onChange={(e) => handleMacroChange('protein', parseInt(e.target.value) || 0)}
                                                        disabled={isSaving}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full relative">
                                                    <div
                                                        className="h-full bg-pacewell-dark rounded-full"
                                                        style={{ width: `${macros.protein}%` }}
                                                    />
                                                    <div
                                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-pacewell-dark rounded-full"
                                                        style={{ left: `calc(${macros.protein}% - 8px)` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-semibold text-gray-900">Carbohydrates</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={macros.carbs || ''}
                                                        onChange={(e) => handleMacroChange('carbs', parseInt(e.target.value) || 0)}
                                                        disabled={isSaving}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full relative">
                                                    <div
                                                        className="h-full bg-yellow-500 rounded-full"
                                                        style={{ width: `${macros.carbs}%` }}
                                                    />
                                                    <div
                                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-yellow-500 rounded-full"
                                                        style={{ left: `calc(${macros.carbs}% - 8px)` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-semibold text-gray-900">Fats</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={macros.fats || ''}
                                                        onChange={(e) => handleMacroChange('fats', parseInt(e.target.value) || 0)}
                                                        disabled={isSaving}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full relative">
                                                    <div
                                                        className="h-full bg-orange-500 rounded-full"
                                                        style={{ width: `${macros.fats}%` }}
                                                    />
                                                    <div
                                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-orange-500 rounded-full"
                                                        style={{ left: `calc(${macros.fats}% - 8px)` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 pt-4 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fuel Visualization</p>
                                        <div className="flex h-3 gap-0 rounded-full overflow-hidden bg-gray-200">
                                            <div
                                                className="bg-pacewell-dark"
                                                style={{ width: `${(macros.protein / 100) * 100}%` }}
                                            />
                                            <div
                                                className="bg-yellow-500"
                                                style={{ width: `${(macros.carbs / 100) * 100}%` }}
                                            />
                                            <div
                                                className="bg-orange-500"
                                                style={{ width: `${(macros.fats / 100) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <p className="text-xs font-semibold text-gray-600">TOTAL: {totalMacros}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Goal Summary</h3>
                                    <p className="text-sm text-gray-600 mb-6">Current vs. Your New Target</p>

                                    {activeGoal ? (
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Weight</p>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-gray-900">{MOCK_CURRENT_DATA.currentWeight}</p>
                                                    <p className="text-xs text-gray-600">Now</p>
                                                </div>
                                                <p className="text-gray-400 px-3">→</p>
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-pacewell-dark">{activeGoal.target_weight}</p>
                                                    <p className="text-xs text-gray-600">Goal</p>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-gray-300 rounded-full mt-3"></div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Body Fat</p>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-gray-900">{MOCK_CURRENT_DATA.currentBodyFat}%</p>
                                                    <p className="text-xs text-gray-600">Now</p>
                                                </div>
                                                <p className="text-gray-400 px-3">→</p>
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-pacewell-dark">{activeGoal.target_body_fat_percentage}%</p>
                                                    <p className="text-xs text-gray-600">Goal</p>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-gray-300 rounded-full mt-3"></div>
                                        </div>
                                        
                                        <div className="border-t border-gray-200 pt-4">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Weekly Rate</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {activeGoal.goal_strategy === 'Weight Loss' && '-1 lbs/week'}
                                                {activeGoal.goal_strategy === 'Muscle Gain' && '+0.5 lbs/week'}
                                                {activeGoal.goal_strategy === 'Maintenance' && '±5-10 lbs/year'}
                                            </p>
                                        </div>
                                    </div>
                                    ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-gray-600 mb-2">No active goal yet</p>
                                        <p className="text-sm text-gray-500">Create a goal to see your summary here</p>
                                    </div>
                                    )}

                                </div>
                                
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Calendar size={20} className="text-pacewell-dark" />
                                        <h3 className="text-lg font-bold text-gray-900">Projected Timeline</h3>
                                    </div>

                                    {activeGoal ? (
                                    <div className="space-y-0">

                                        {activeGoal.projected_milestones.map((milestone, index) => (
                                        <div key={index} className={`flex gap-4 ${index < activeGoal.projected_milestones.length - 1 ? 'pb-6' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 bg-white border-2 border-pacewell-dark rounded-full"></div>

                                                {index < activeGoal.projected_milestones.length - 1 && (
                                                <div className="w-0.5 h-12 bg-gray-300"></div>
                                                )}

                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-pacewell-dark">{formatDate(milestone.date)}</p>
                                                <p className="text-xs text-gray-600">{milestone.milestone_label}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Weight: {milestone.projected_weight} lbs | Body Fat: {milestone.projected_body_fat_percentage}%
                                                </p>
                                            </div>
                                        </div>
                                        ))}

                                    </div>
                                    ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-gray-600 mb-2">No projected timeline</p>
                                        <p className="text-sm text-gray-500">Create a goal to see your timeline here</p>
                                    </div>
                                    )}

                                    <p className="text-xs text-gray-600 mt-6 pt-6 border-t border-gray-200">Timeline is estimated based on your metabolic TDEE and is subject to daily output. Individual results may vary.</p>
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Pro Tip for Over 40s</h3>
                                    <p className="text-sm text-gray-700">At 40, lean muscle retention is vital. We recommend keeping Protein at least 30% of your macros to support metabolic health while in a deficit.</p>
                                </div>
                            </div>
                        </div>
                        )}

                    </div>

                    <Footer />
                </main>
            </div>
        </ProtectedRoute>
    );
}