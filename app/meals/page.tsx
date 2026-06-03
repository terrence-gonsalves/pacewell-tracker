/**
 * Meal Planner Page - app/meals-tracker/page.tsx
 * Track macros to hit daily 40+ vitality goals
 *
 * UPDATES:
 * - Uses fetchWithAuth for automatic token refresh
 * - Loads daily targets from personal goals
 * - Logs meals to database
 * - Loads user favorites from food_favorites table
 * - Real-time progress calculation
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import {
    Search,
    Plus,
    Flame,
    Egg,
    Wheat,
    Droplet,
    Star,
    UtensilsCrossed,
    AlertCircle
} from 'lucide-react';

interface Meal {
    id: string;
    date: string;
    meal_type: string;
    food_description: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    created_at: string;
}

interface Favorite {
    id: string;
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

interface DailyData {
    today: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
    };
    targets: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
    };
    meals: Meal[];
    mealsLogged: number;
}

const mealTimings = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealsTrackerPage() {
    const [dailyData, setDailyData] = useState<DailyData | null>(null);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedMealTiming, setSelectedMealTiming] = useState('breakfast');
    const [formData, setFormData] = useState({
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
    });

    // fetch daily data and favorites
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // fetch daily meals and targets
            const mealsResponse = await fetchWithAuth('/api/meals', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!mealsResponse.ok) {
                throw new Error('Failed to fetch meal data');
            }

            const mealsData = await mealsResponse.json();
            setDailyData(mealsData);

            // fetch user's favorites
            const favoritesResponse = await fetchWithAuth('/api/meals/favorites', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!favoritesResponse.ok) {
                console.warn('Failed to fetch favorites');
                setFavorites([]);
            } else {
                const favoritesData = await favoritesResponse.json();
                setFavorites(favoritesData.data || []);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load meal data';

            setError(message);
            console.error('Error fetching data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogMeal = async () => {
        if (!formData.foodName || !formData.calories) {
            setError('Please enter food name and calories');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            const response = await fetchWithAuth('/api/meals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        meal_type: selectedMealTiming,
                        food_description: formData.foodName,
                        calories: parseInt(formData.calories),
                        protein_g: parseFloat(formData.protein) || 0,
                        carbs_g: parseFloat(formData.carbs) || 0,
                        fat_g: parseFloat(formData.fat) || 0,
                    }),
            });

            if (!response.ok) {
                    throw new Error('Failed to log meal');
            }

            // reset form and refresh data
            setFormData({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });

            await fetchData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to log meal';

            setError(message);
            console.error('Error logging meal:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddQuickFavorite = (favorite: Favorite) => {
        setFormData({
            foodName: favorite.name,
            calories: favorite.calories.toString(),
            protein: favorite.protein_g.toString(),
            carbs: favorite.carbs_g.toString(),
            fat: favorite.fat_g.toString(),
        });
    };

    const handleClear = () => {
        setFormData({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });
    };

    if (isLoading) {
        return (
            <ProtectedRoute>
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />

                    <main className="ml-56 flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-pacewell-dark border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Loading meal data...</p>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    if (!dailyData) {
        return (
            <ProtectedRoute>
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />

                    <main className="ml-56 flex-1">
                        <header className="bg-white shadow-sm border-b border-gray-200">
                            <div className="px-8 py-6">
                                <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
                                <p className="text-gray-600 mt-1">Track your macros to hit your daily 40+ vitality goals.</p>
                            </div>
                        </header>
                        <div className="p-8">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                                <AlertCircle className="text-red-600 flex-shrink-0" />
                                <p className="text-red-800">Unable to load meal data. Please try again later.</p>
                            </div>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    const caloriesRemaining = Math.max(0, dailyData.targets.calories - dailyData.today.calories);
    const energyPercent = (dailyData.today.calories / dailyData.targets.calories) * 100;

    // use favorites if available, otherwise use quick add defaults
    const displayFavorites = favorites.length > 0 ? favorites : [
        { id: '1', name: 'Greek Yogurt (200g)', calories: 120, protein_g: 18, carbs_g: 8, fat_g: 4 },
        { id: '2', name: 'Grilled Salmon', calories: 240, protein_g: 28, carbs_g: 0, fat_g: 14 },
        { id: '3', name: 'Chicken Breast', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
        { id: '4', name: 'Whey Shake', calories: 150, protein_g: 25, carbs_g: 5, fat_g: 2 },
        { id: '5', name: 'Boiled Eggs (2)', calories: 140, protein_g: 12, carbs_g: 1, fat_g: 10 },
        { id: '6', name: 'Mixed Nuts (30g)', calories: 180, protein_g: 5, carbs_g: 6, fat_g: 16 },
        { id: '7', name: 'Quinoa Bowl', calories: 220, protein_g: 8, carbs_g: 39, fat_g: 4 },
        { id: '8', name: 'Skyr (Natural)', calories: 110, protein_g: 19, carbs_g: 4, fat_g: 0.5 },
    ];

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />

                <main className="ml-56 flex-1">
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-8 py-6">
                            <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
                            <p className="text-gray-600 mt-1">Track your macros to hit your daily 40+ vitality goals.</p>
                        </div>
                    </header>

                    <div className="p-8">

                        {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                        </div>
                        )}

                        <div className="grid grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-8">
                                <div className="flex gap-4">
                                    <button className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
                                        <Search size={20} />
                                        <span>Search Database</span>
                                    </button>
                                    <button className="flex items-center gap-2 px-6 py-2 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker transition font-semibold">
                                        <Plus size={20} />
                                        <span>Custom Item</span>
                                    </button>
                                </div>

                                <div className="bg-white rounded-lg shadow p-8">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-6 h-6 bg-pacewell-dark rounded flex items-center justify-center">
                                            <Plus size={16} className="text-white" />
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900">Log New Entry</h2>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">Meal Timing</label>
                                        <div className="flex gap-3 border-b border-gray-200 bg-gray-100 p-1 rounded-lg w-fit">

                                            {mealTimings.map((timing) => (
                                            <button
                                                key={timing}
                                                onClick={() => setSelectedMealTiming(timing)}
                                                className={`px-4 py-2 rounded-lg transition font-medium capitalize ${
                                                    selectedMealTiming === timing
                                                        ? 'bg-white text-pacewell-dark'
                                                        : 'bg-gray-100 text-gray-600 hover:text-gray-700'
                                                }`}
                                            >
                                                {timing}
                                            </button>
                                            ))}

                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Food or Drink Name
                                        </label>
                                        <input
                                            type="text"
                                            name="foodName"
                                            value={formData.foodName}
                                            onChange={handleInputChange}
                                            placeholder="What are you feeling with?"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                                                    <Flame size={14} className="text-white" />
                                                </div>
                                                Calories
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="calories"
                                                    value={formData.calories}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                />
                                                <span className="absolute right-3 top-2 text-sm text-gray-500">kcal</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <div className="w-5 h-5 bg-pacewell-dark rounded flex items-center justify-center">
                                                    <Egg size={14} className="text-white" />
                                                </div>
                                                Protein
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="protein"
                                                    value={formData.protein}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                />
                                                <span className="absolute right-3 top-2 text-sm text-gray-500">g</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <div className="w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
                                                    <Wheat size={14} className="text-white" />
                                                </div>
                                                Carbs
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="carbs"
                                                    value={formData.carbs}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                />
                                                <span className="absolute right-3 top-2 text-sm text-gray-500">g</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                                                    <Droplet size={14} className="text-white" />
                                                </div>
                                                Fats
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="fat"
                                                    value={formData.fat}
                                                    onChange={handleInputChange}
                                                    placeholder="0"
                                                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                />
                                                <span className="absolute right-3 top-2 text-sm text-gray-500">g</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 justify-end">
                                        <button
                                            onClick={handleClear}
                                            className="px-6 py-3 text-gray-700 hover:text-gray-900 transition font-semibold"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleLogMeal}
                                            disabled={isSaving}
                                            className="px-6 py-3 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker transition font-semibold flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <span>{isSaving ? 'Logging...' : 'Confirm & Log Item'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-pacewell-dark rounded flex items-center justify-center">
                                                <Star size={16} className="text-white" />
                                            </div>
                                            <h2 className="text-lg font-bold text-gray-900">Quick Add: High-Protein Favorites</h2>
                                        </div>
                                        <button className="text-pacewell-dark hover:text-pacewell-darker font-semibold">
                                            View Library
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">

                                        {displayFavorites.map((favorite) => (
                                        <button
                                            key={favorite.id}
                                            onClick={() => handleAddQuickFavorite(favorite)}
                                            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex flex-col"
                                        >
                                            <div className="flex justify-start mb-3">
                                                <div className="w-8 h-8 bg-pacewell-dark rounded flex items-center justify-center">
                                                    <UtensilsCrossed size={18} className="text-white" />
                                                </div>
                                            </div>
                                            <p className="font-semibold text-gray-900 text-sm mb-3 text-left">{favorite.name}</p>
                                            <div className="text-xs text-gray-600 text-left">
                                                <p className="mb-1">{favorite.calories} kcal  {favorite.protein_g}g Protein</p>
                                            </div>
                                        </button>
                                        ))}

                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase">Today's Progress</h3>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                            Optimal
                                        </span>
                                    </div>

                                    <div className="text-center mb-4">
                                        <p className="text-3xl font-bold text-gray-900">
                                            {dailyData.today.calories}
                                            <span className="text-lg text-gray-600">/{dailyData.targets.calories} kcal</span>
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                                            <span>Energy Target</span>
                                            <span>{energyPercent.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-pacewell-dark h-2 rounded-full"
                                                style={{ width: `${Math.min(energyPercent, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Protein</p>
                                            <p className="text-lg font-bold text-gray-900">{dailyData.today.protein_g}g</p>
                                            <p className="text-xs text-gray-600">{Math.max(0, dailyData.targets.protein_g - dailyData.today.protein_g)}g left</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Carbs</p>
                                            <p className="text-lg font-bold text-gray-900">{dailyData.today.carbs_g}g</p>
                                            <p className="text-xs text-gray-600">{Math.max(0, dailyData.targets.carbs_g - dailyData.today.carbs_g)}g left</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Fats</p>
                                            <p className="text-lg font-bold text-gray-900">{dailyData.today.fat_g}g</p>
                                            <p className="text-xs text-gray-600">{Math.max(0, dailyData.targets.fat_g - dailyData.today.fat_g)}g left</p>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 text-pacewell-dark hover:text-pacewell-darker font-semibold text-sm">
                                        Detailed Nutrients Analysis →
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Recent Activity</h3>
                                    <div className="space-y-3">

                                        {dailyData.meals.map((meal) => (
                                        <div key={meal.id} className="bg-white rounded-lg shadow p-4 flex gap-3">
                                            <div className="w-8 h-8 bg-pacewell-dark rounded flex items-center justify-center flex-shrink-0">
                                                <UtensilsCrossed size={18} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-semibold text-gray-900 text-base">{meal.food_description}</p>
                                                    <p className="text-sm text-gray-600">{meal.calories} kcal</p>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                    <span>Protein: {meal.protein_g}g</span>
                                                    <span>Carbs: {meal.carbs_g}g</span>
                                                    <span>Fat: {meal.fat_g}g</span>
                                                </div>
                                                <p className="text-xs font-semibold text-pacewell-dark capitalize">{meal.meal_type}</p>
                                            </div>
                                        </div>
                                        ))}

                                        {dailyData.meals.length === 0 && (
                                        <p className="text-sm text-gray-600 text-center py-4">No meals logged yet. Start by logging your first meal!</p>
                                        )}

                                    </div>
                                    <button className="w-full mt-4 text-center py-2 text-pacewell-dark hover:text-pacewell-darker font-semibold text-sm">
                                        View Full Journal
                                    </button>
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