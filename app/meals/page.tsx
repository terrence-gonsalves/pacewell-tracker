"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import { 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { 
    Search, 
    Plus, 
    Flame, 
    Egg, 
    Wheat, 
    Droplet, 
    Check, 
    Star, 
    UtensilsCrossed 
} from 'lucide-react';

// mock data
const mockMealsData = {
    today: {
        calories: 1840,
        protein_g: 142,
        carbs_g: 210,
        fat_g: 52,
    },
    targets: {
        calories: 2400,
        protein_g: 180,
        carbs_g: 250,
        fat_g: 70,
    },
    meals_logged: 3,
};

const macroData = [
    { name: 'Protein', value: 142, fill: '#2D6A4F' },
    { name: 'Carbs', value: 210, fill: '#40916C' },
    { name: 'Fats', value: 52, fill: '#95D5B2' },
];

const quickAddFavorites = [
    { name: 'Greek Yogurt (200g)', calories: 120, protein: 18, carbs: 8, fat: 4 },
    { name: 'Grilled Salmon', calories: 240, protein: 28, carbs: 0, fat: 14 },
    { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Whey Shake', calories: 150, protein: 25, carbs: 5, fat: 2 },
    { name: 'Boiled Eggs (2)', calories: 140, protein: 12, carbs: 1, fat: 10 },
    { name: 'Mixed Nuts (30g)', calories: 180, protein: 5, carbs: 6, fat: 16 },
    { name: 'Quinoa Bowl', calories: 220, protein: 8, carbs: 39, fat: 4 },
    { name: 'Skyr (Natural)', calories: 110, protein: 19, carbs: 4, fat: 0.5 },
];

const recentActivity = [
    { name: 'Oatmeal with Blueberries', calories: 340, protein: '12g', carbs: '60g', fat: '5g', time: '08:15 AM', meal: 'Breakfast' },
    { name: 'Grilled Salmon & Asparagus', calories: 420, protein: '38g', carbs: '20g', fat: '15g', time: '12:45 PM', meal: 'Lunch' },
    { name: 'Black Coffee', calories: 5, protein: '0g', carbs: '1g', fat: '0g', time: '02:30 PM', meal: 'Snacks' },
    { name: 'Post-Workout Whey Shake', calories: 150, protein: '25g', carbs: '5g', fat: '2g', time: '05:00 PM', meal: 'Snacks' },
];

const mealTimings = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function MealsTrackerPage() {
    const { user } = useAuth();
    const [selectedMealTiming, setSelectedMealTiming] = useState('Breakfast');
    const [formData, setFormData] = useState({
        foodName: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogMeal = () => {
        console.log('Logging meal:', { ...formData, mealTiming: selectedMealTiming });
        
        setFormData({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });
    };

    const handleAddQuickFavorite = (favorite: typeof quickAddFavorites[0]) => {
        setFormData({
            foodName: favorite.name,
            calories: favorite.calories.toString(),
            protein: favorite.protein.toString(),
            carbs: favorite.carbs.toString(),
            fat: favorite.fat.toString(),
        });
    };

    const caloriesRemaining = mockMealsData.targets.calories - mockMealsData.today.calories;
    const energyPercent = (mockMealsData.today.calories / mockMealsData.targets.calories) * 100;

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
                                                    className={`px-4 py-2 rounded-lg transition font-medium ${
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
                                        <button className="px-6 py-3 text-gray-700 hover:text-gray-900 transition font-semibold">
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleLogMeal}
                                            className="px-6 py-3 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker transition font-semibold flex items-center gap-2"
                                        >
                                            <span>Confirm & Log Item</span>
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
                                        {quickAddFavorites.map((favorite, index) => (
                                            <button
                                                key={index}
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
                                                    <p className="mb-1">{favorite.calories} kcal  {favorite.protein}g Protein</p>
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
                                            {mockMealsData.today.calories}
                                            <span className="text-lg text-gray-600">/{mockMealsData.targets.calories} kcal</span>
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
                                            <p className="text-lg font-bold text-gray-900">{mockMealsData.today.protein_g}g</p>
                                            <p className="text-xs text-gray-600">{mockMealsData.targets.protein_g - mockMealsData.today.protein_g}g left</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Carbs</p>
                                            <p className="text-lg font-bold text-gray-900">{mockMealsData.today.carbs_g}g</p>
                                            <p className="text-xs text-gray-600">{mockMealsData.targets.carbs_g - mockMealsData.today.carbs_g}g left</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Fats</p>
                                            <p className="text-lg font-bold text-gray-900">{mockMealsData.today.fat_g}g</p>
                                            <p className="text-xs text-gray-600">{mockMealsData.targets.fat_g - mockMealsData.today.fat_g}g left</p>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 text-pacewell-dark hover:text-pacewell-darker font-semibold text-sm">
                                        Detailed Nutrients Analysis →
                                    </button>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Recent Activity</h3>
                                    <div className="space-y-3">
                                        {recentActivity.map((activity, index) => (
                                            <div key={index} className="bg-white rounded-lg shadow p-4 flex gap-3">
                                                <div className="w-8 h-8 bg-pacewell-dark rounded flex items-center justify-center flex-shrink-0">
                                                    <UtensilsCrossed size={18} className="text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="font-semibold text-gray-900 text-base">{activity.name}</p>
                                                        <p className="text-sm text-gray-600">{activity.calories} kcal</p>
                                                        <p className="text-xs text-gray-600">{activity.time}</p>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                        <span>Protein: {activity.protein}</span>
                                                        <span>Carbs: {activity.carbs}</span>
                                                        <span>Fat: {activity.fat}</span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-pacewell-dark">{activity.meal}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-4 text-center py-2 text-pacewell-dark hover:text-pacewell-darker font-semibold text-sm">
                                        View Full Journal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}