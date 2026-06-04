/**
 * Meal Planner Page - app/meals-tracker/page.tsx
 * Track macros to hit daily 40+ vitality goals
 *
 * UPDATES:
 * - Error messages clear on Clear button
 * - Status badge shows "Optimal" (85-100%), "Exceeded" (100%+), or hidden (<85%)
 * - Energy bar turns red when over 100%
 * - Search field for previously logged meals
 * - "Save to Favorites" checkbox
 * - Quick Adds limited to 12 items with "View Library" modal
 * - Recent Activity limited to 6 items with "View Full Journal"
 * - Removed "Custom Item" and "Detailed Nutrients Analysis" buttons
 * - All macro fields required
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
    AlertCircle,
    X
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
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [showFullJournalModal, setShowFullJournalModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMealTiming, setSelectedMealTiming] = useState('breakfast');
    const [formData, setFormData] = useState({
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
    });
    const [saveToFavorites, setSaveToFavorites] = useState(false);

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

        // validate all required fields
        if (!formData.foodName || !formData.calories || !formData.protein || !formData.carbs || !formData.fat) {
            setError('Please fill in all fields (Food Name, Calories, Protein, Carbs, Fat)');
            
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
                    protein_g: parseFloat(formData.protein),
                    carbs_g: parseFloat(formData.carbs),
                    fat_g: parseFloat(formData.fat),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to log meal');
            }

            // if user selected "Save to Favorites", add it
            if (saveToFavorites) {
                await fetchWithAuth('/api/meals/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.foodName,
                        calories: parseInt(formData.calories),
                        protein_g: parseFloat(formData.protein),
                        carbs_g: parseFloat(formData.carbs),
                        fat_g: parseFloat(formData.fat),
                    }),
                });
            }

            // reset form and refresh data
            handleClear();
            setSaveToFavorites(false);

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
        setError(null);
        setSaveToFavorites(false);
    };

    const handleClear = () => {
        setFormData({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });
        setError(null);
        setSaveToFavorites(false);
    };

    const getStatusBadge = (calories: number, target: number) => {
        const percentage = (calories / target) * 100;

        if (percentage >= 85 && percentage <= 100) {
            return { label: 'Optimal', bgColor: 'bg-green-100', textColor: 'text-green-800' };
        } else if (percentage > 100) {
            return { label: 'Exceeded', bgColor: 'bg-red-100', textColor: 'text-red-800' };
        }

        return null;
    };

    const getEnergyBarColor = (percentage: number) => {
        if (percentage > 100) {
            return 'bg-red-600';
        }

        return 'bg-pacewell-dark';
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
    const statusBadge = getStatusBadge(dailyData.today.calories, dailyData.targets.calories);

    // display only database favorites (max 12 for quick add)
    const displayFavorites = favorites.slice(0, 12);

    // filter meals by search term
    const filteredMeals = dailyData.meals.filter(meal =>
        meal.food_description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // recent Activity limited to 6 items
    const recentActivityMeals = dailyData.meals.slice(0, 6);
    const hasMoreMeals = dailyData.meals.length > 6;

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
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-red-800">{error}</p>
                            </div>
                        </div>
                        )}

                        <div className="grid grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative">
                                            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search your meals..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    
                                    {searchTerm && (
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">
                                            Search Results ({filteredMeals.length})
                                        </h3>

                                        {filteredMeals.length > 0 ? (
                                        <div className="space-y-3">

                                            {filteredMeals.map((meal) => (
                                            <div
                                                key={meal.id}
                                                onClick={() => handleAddQuickFavorite({
                                                    id: meal.id,
                                                    name: meal.food_description,
                                                    calories: meal.calories,
                                                    protein_g: meal.protein_g,
                                                    carbs_g: meal.carbs_g,
                                                    fat_g: meal.fat_g,
                                                })}
                                                className="bg-gray-50 rounded-lg p-4 hover:bg-pacewell-light transition cursor-pointer border border-gray-200 hover:border-pacewell-dark"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{meal.food_description}</p>
                                                        <p className="text-xs text-gray-500 capitalize mt-1">{meal.meal_type}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900">{meal.calories} kcal</p>
                                                </div>
                                                <div className="flex gap-4 text-xs text-gray-600 mt-2">
                                                    <span>Protein: {meal.protein_g}g</span>
                                                    <span>Carbs: {meal.carbs_g}g</span>
                                                    <span>Fat: {meal.fat_g}g</span>
                                                </div>
                                            </div>
                                            ))}

                                        </div>
                                        ) : (
                                        <p className="text-gray-600 text-center py-4">No meals found matching "{searchTerm}"</p>
                                        )}

                                    </div>
                                    )}

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

                                    <div className="mb-6 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="saveToFavorites"
                                            checked={saveToFavorites}
                                            onChange={(e) => setSaveToFavorites(e.target.checked)}
                                            className="w-4 h-4 accent-pacewell-dark rounded"
                                        />
                                        <label htmlFor="saveToFavorites" className="text-sm font-semibold text-gray-700">
                                            Save to Favorites
                                        </label>
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

                                        {favorites.length > 12 && (
                                        <button
                                            onClick={() => setShowLibraryModal(true)}
                                            className="text-pacewell-dark hover:text-pacewell-darker font-semibold"
                                        >
                                            View Library
                                        </button>
                                        )}

                                    </div>

                                    {displayFavorites.length > 0 ? (
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
                                    ) : (
                                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                                        <p className="text-gray-600">No favorites yet. Check the "Save to Favorites" box when logging a meal to add it here!</p>
                                    </div>
                                    )}

                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase">Today's Progress</h3>

                                        {statusBadge && (
                                        <span className={`px-2 py-1 ${statusBadge.bgColor} ${statusBadge.textColor} text-xs font-semibold rounded`}>
                                            {statusBadge.label}
                                        </span>
                                        )}

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
                                            <span className={energyPercent > 100 ? 'text-red-600 font-bold' : ''}>
                                                {energyPercent.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`${getEnergyBarColor(energyPercent)} h-2 rounded-full`}
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
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-gray-700 uppercase">Recent Activity</h3>

                                        {hasMoreMeals && (
                                        <button
                                            onClick={() => setShowFullJournalModal(true)}
                                            className="text-pacewell-dark hover:text-pacewell-darker font-semibold text-sm"
                                        >
                                            View Full Journal
                                        </button>
                                        )}

                                    </div>
                                    <div className="space-y-3">

                                        {recentActivityMeals.map((meal) => (
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

                                        {recentActivityMeals.length === 0 && (
                                        <p className="text-sm text-gray-600 text-center py-4">No meals logged yet. Start by logging your first meal!</p>
                                        )}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {showLibraryModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Food Library</h2>
                                <button
                                    onClick={() => setShowLibraryModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-4">

                                {favorites.map((favorite) => (
                                <button
                                    key={favorite.id}
                                    onClick={() => {
                                        handleAddQuickFavorite(favorite);
                                        setShowLibraryModal(false);
                                    }}
                                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition text-left"
                                >
                                    <p className="font-semibold text-gray-900 mb-2">{favorite.name}</p>
                                    <p className="text-sm text-gray-600">{favorite.calories} kcal • {favorite.protein_g}g protein</p>
                                </button>
                                ))}

                            </div>
                        </div>
                    </div>
                    )}
                    
                    {showFullJournalModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Full Journal</h2>
                                <button
                                    onClick={() => setShowFullJournalModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">

                                {dailyData.meals.map((meal) => (
                                <div key={meal.id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-semibold text-gray-900">{meal.food_description}</p>
                                        <p className="text-sm text-gray-600">{meal.calories} kcal</p>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                                        <span>Protein: {meal.protein_g}g</span>
                                        <span>Carbs: {meal.carbs_g}g</span>
                                        <span>Fat: {meal.fat_g}g</span>
                                    </div>
                                    <p className="text-xs font-semibold text-pacewell-dark capitalize">{meal.meal_type}</p>
                                </div>
                                ))}

                            </div>
                        </div>
                    </div>
                    )}

                    <Footer />
                </main>
            </div>
        </ProtectedRoute>
    );
}