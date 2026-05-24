"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Zap, Dumbbell, Scale, Info, RotateCcw, Calendar } from 'lucide-react';

// mock data
const mockUserData = {
    currentWeight: 198,
    currentBodyFat: 24,
    age: 45,
    weeklyActivity: 'moderate',
};

export default function PersonalGoalsPage() {
    const { user } = useAuth();
    const [goalStrategy, setGoalStrategy] = useState('weight-loss');
    const [bodyTargets, setBodyTargets] = useState({
        targetWeight: 185,
        bodyFatPercentage: 18,
    });
    const [dailyCalories, setDailyCalories] = useState(2250);
    const [macros, setMacros] = useState({
        protein: 30,
        carbs: 40,
        fats: 30,
    });

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

    // calculate projected timeline
    const weightToLose = mockUserData.currentWeight - bodyTargets.targetWeight;
    const weeklyRate = 1.2; // lbs per week
    const weeksToGoal = Math.ceil(weightToLose / weeklyRate);

    const startDate = new Date(2024, 10, 15); // NOV 15, 2024
    const firstMilestoneDate = new Date(startDate);
    firstMilestoneDate.setDate(firstMilestoneDate.getDate() + Math.ceil((5 / weightToLose) * weeksToGoal * 7));

    const halfwayDate = new Date(startDate);
    halfwayDate.setDate(halfwayDate.getDate() + Math.ceil(weeksToGoal * 3.5));

    const goalDate = new Date(startDate);
    goalDate.setDate(goalDate.getDate() + weeksToGoal * 7);

    const formatDate = (date: Date) => {
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
                                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center gap-2">
                                    <RotateCcw size={18} />
                                    <span>Reset Changes</span>
                                </button>
                                <button className="px-6 py-2 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker transition font-semibold">
                                    Save & Apply
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <div className="p-8">
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
                                            onClick={() => setGoalStrategy('weight-loss')}
                                            className={`p-6 rounded-lg border-2 transition ${
                                                goalStrategy === 'weight-loss'
                                                    ? 'border-pacewell-dark bg-green-50'
                                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                        >
                                            <div className="flex justify-center mb-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goalStrategy === 'weight-loss' ? 'bg-pacewell-dark' : 'bg-gray-200'}`}>
                                                    <Scale size={24} className={goalStrategy === 'weight-loss' ? 'text-white' : 'text-gray-600'} />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">Weight Loss</h3>
                                            <p className="text-sm text-gray-600">Prioritize fat reduction</p>
                                        </button>
                                        <button
                                            onClick={() => setGoalStrategy('muscle-gain')}
                                            className={`p-6 rounded-lg border-2 transition ${
                                                goalStrategy === 'muscle-gain'
                                                    ? 'border-pacewell-dark bg-green-50'
                                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                        >
                                            <div className="flex justify-center mb-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goalStrategy === 'muscle-gain' ? 'bg-pacewell-dark' : 'bg-gray-200'}`}>
                                                    <Dumbbell size={24} className={goalStrategy === 'muscle-gain' ? 'text-white' : 'text-gray-600'} />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">Muscle Gain</h3>
                                            <p className="text-sm text-gray-600">Anabolic surplus focus</p>
                                        </button>
                                        
                                        <button
                                            onClick={() => setGoalStrategy('maintenance')}
                                            className={`p-6 rounded-lg border-2 transition ${
                                                goalStrategy === 'maintenance'
                                                    ? 'border-pacewell-dark bg-green-50'
                                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                            }`}
                                        >
                                            <div className="flex justify-center mb-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goalStrategy === 'maintenance' ? 'bg-pacewell-dark' : 'bg-gray-200'}`}>
                                                    <Zap size={24} className={goalStrategy === 'maintenance' ? 'text-white' : 'text-gray-600'} />
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
                                                        value={bodyTargets.targetWeight}
                                                        onChange={(e) => setBodyTargets(prev => ({ ...prev, targetWeight: parseInt(e.target.value) || 0 }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                    />
                                                    <span className="absolute right-4 top-2 text-gray-600 font-semibold">lbs</span>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 block mb-2">Body Fat Percentage</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={bodyTargets.bodyFatPercentage}
                                                        onChange={(e) => setBodyTargets(prev => ({ ...prev, bodyFatPercentage: parseInt(e.target.value) || 0 }))}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
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
                                                        value={dailyCalories}
                                                        onChange={(e) => setDailyCalories(parseInt(e.target.value) || 0)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                    />
                                                    <span className="absolute right-4 top-2 text-gray-600 font-semibold">kcal</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <Info size={16} className="flex-shrink-0 text-blue-600 mt-0.5" />
                                                <p>Based on your age ({mockUserData.age}) and {mockUserData.weeklyActivity} weekly activity, {dailyCalories} kcal is a sustainable deficit for fat loss.</p>
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
                                                        value={macros.protein}
                                                        onChange={(e) => handleMacroChange('protein', parseInt(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
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
                                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-pacewell-dark rounded-full cursor-pointer"
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
                                                        value={macros.carbs}
                                                        onChange={(e) => handleMacroChange('carbs', parseInt(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
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
                                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-yellow-500 rounded-full cursor-pointer"
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
                                                        value={macros.fats}
                                                        onChange={(e) => handleMacroChange('fats', parseInt(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
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
                                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-orange-500 rounded-full cursor-pointer"
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

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Weight</p>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-gray-900">{mockUserData.currentWeight}</p>
                                                    <p className="text-xs text-gray-600">Now</p>
                                                </div>
                                                <p className="text-gray-400 px-3">→</p>
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-pacewell-dark">{bodyTargets.targetWeight}</p>
                                                    <p className="text-xs text-gray-600">Goal</p>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-gray-300 rounded-full mt-3"></div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Body Fat</p>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-gray-900">{mockUserData.currentBodyFat}%</p>
                                                    <p className="text-xs text-gray-600">Now</p>
                                                </div>
                                                <p className="text-gray-400 px-3">→</p>
                                                <div className="text-center flex-1">
                                                    <p className="text-2xl font-bold text-pacewell-dark">{bodyTargets.bodyFatPercentage}%</p>
                                                    <p className="text-xs text-gray-600">Goal</p>
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-gray-300 rounded-full mt-3"></div>
                                        </div>
                                        
                                        <div className="border-t border-gray-200 pt-4">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Est. Weekly Rate</p>
                                            <p className="text-lg font-bold text-gray-900">-{weeklyRate} lbs/week</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Calendar size={20} className="text-pacewell-dark" />
                                        <h3 className="text-lg font-bold text-gray-900">Projected Timeline</h3>
                                    </div>

                                    <div className="space-y-0">
                                        <div className="flex gap-4 pb-6">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 bg-white border-2 border-pacewell-dark rounded-full"></div>
                                                <div className="w-0.5 h-12 bg-gray-300"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-pacewell-dark">NOV 15, 2024</p>
                                                <p className="text-xs text-gray-600">Plan Commencement</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-4 pb-6">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 bg-white border-2 border-pacewell-dark rounded-full"></div>
                                                <div className="w-0.5 h-12 bg-gray-300"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-pacewell-dark">{formatDate(firstMilestoneDate)}</p>
                                                <p className="text-xs text-gray-600">First 5 lbs Milestone</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-4 pb-6">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 bg-white border-2 border-pacewell-dark rounded-full"></div>
                                                <div className="w-0.5 h-12 bg-gray-300"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-pacewell-dark">{formatDate(halfwayDate)}</p>
                                                <p className="text-xs text-gray-600">Halfway Point Achieved</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 bg-white border-2 border-pacewell-dark rounded-full"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-pacewell-dark">{formatDate(goalDate)}</p>
                                                <p className="text-xs text-gray-600">Goal Weight Target Reached</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-600 mt-6 pt-6 border-t border-gray-200">Timeline is estimated based on your metabolic TDEE and is subject to daily output. Individual results may vary.</p>
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Pro Tip for Over 40s</h3>
                                    <p className="text-sm text-gray-700">At 40, lean muscle retention is vital. We recommend keeping Protein at least 30% of your macros to support metabolic health while in a deficit.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Footer />
                </main>
            </div>
        </ProtectedRoute>
    );
}