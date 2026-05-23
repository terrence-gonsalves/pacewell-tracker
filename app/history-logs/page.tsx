"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import { 
    Search, 
    ChevronDown, 
    ChevronUp, 
    Edit2, 
    Trash2, 
    UtensilsCrossed, 
    Scale, 
    TrendingUp, 
    CheckCircle } from 'lucide-react';


// mock data
const mockMetrics = {
    avgDailyCalories: 2145,
    weightChange: -2.3,
    completionRate: 87,
    proteinTarget: 165,
};

const mockLogEntries = [
    {
        id: '1',
        type: 'meal',
        summary: 'Grilled Salmon & Asparagus',
        date: '2026-05-22',
        time: '12:45 PM',
        calories: 420,
        macros: { protein: 38, carbs: 20, fat: 15 },
        notes: 'Post-workout meal',
        mealTiming: 'Lunch',
    },
    {
        id: '2',
        type: 'weight',
        summary: 'Weight Entry',
        date: '2026-05-22',
        time: '07:30 AM',
        weight: 195.5,
        bodyFat: 22.3,
        notes: 'Morning weigh-in',
        unit: 'lbs',
    },
    {
        id: '3',
        type: 'meal',
        summary: 'Oatmeal with Blueberries',
        date: '2026-05-22',
        time: '08:15 AM',
        calories: 340,
        macros: { protein: 12, carbs: 60, fat: 5 },
        notes: '',
        mealTiming: 'Breakfast',
    },
    {
        id: '4',
        type: 'bodyFat',
        summary: 'Body Fat Measurement',
        date: '2026-05-21',
        time: '07:30 AM',
        weight: 196.0,
        bodyFat: 22.5,
        notes: 'Measured with caliper',
        unit: 'lbs',
    },
    {
        id: '5',
        type: 'meal',
        summary: 'Post-Workout Whey Shake',
        date: '2026-05-21',
        time: '05:00 PM',
        calories: 150,
        macros: { protein: 25, carbs: 5, fat: 2 },
        notes: '',
        mealTiming: 'Snacks',
    },
    {
        id: '6',
        type: 'weight',
        summary: 'Weight Entry',
        date: '2026-05-21',
        time: '07:30 AM',
        weight: 196.0,
        bodyFat: 22.5,
        notes: '',
        unit: 'lbs',
    },
];

const mockMilestones = [
    { id: '1', title: 'Reached 2000 calorie milestone', date: '2026-05-20', icon: 'flame' },
    { id: '2', title: 'Hit daily protein goal (5 days streak)', date: '2026-05-19', icon: 'target' },
    { id: '3', title: 'Lost 5 pounds', date: '2026-05-15', icon: 'scale' },
];

const filterOptions = ['All', 'Meal', 'Weight', 'Body Fat'];

export default function HistoryLogsPage() {
    const { user } = useAuth();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const getFilteredEntries = () => {
        let filtered = mockLogEntries;

        if (selectedFilter !== 'All') {
            filtered = filtered.filter((entry) => {
                if (selectedFilter === 'Meal') return entry.type === 'meal';
                if (selectedFilter === 'Weight') return entry.type === 'weight';
                if (selectedFilter === 'Body Fat') return entry.type === 'bodyFat';
                return true;
            });
        }

        if (searchTerm) {
            filtered = filtered.filter((entry) =>
                entry.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.notes.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredEntries = getFilteredEntries();

    const getEntryIcon = (type: string) => {
        switch (type) {
            case 'meal':
                return <UtensilsCrossed size={20} className="text-white" />;
            case 'weight':
                return <Scale size={20} className="text-white" />;
            case 'bodyFat':
                return <TrendingUp size={20} className="text-white" />;
            default:
                return <CheckCircle size={20} className="text-white" />;
        }
    };

    const getEntryTypeLabel = (type: string) => {
        switch (type) {
            case 'meal':
                return 'Meal';
            case 'weight':
                return 'Weight';
            case 'bodyFat':
                return 'Body Fat';
            default:
                return 'Entry';
        }
    };

    const isExpanded = (id: string) => expandedId === id;

    const toggleExpand = (id: string) => {
        setExpandedId(isExpanded(id) ? null : id);
    };

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                
                <main className="ml-56 flex-1">
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-8 py-6">
                            <h1 className="text-3xl font-bold text-gray-900">History & Logs</h1>
                            <p className="text-gray-600 mt-1">View and manage your complete tracking history.</p>
                        </div>
                    </header>
                    
                    <div className="p-8">
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                                    <UtensilsCrossed size={20} className="text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Avg Daily Calories</h3>
                                <div className="text-3xl font-bold text-gray-900">{mockMetrics.avgDailyCalories}</div>
                                <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                                    <Scale size={20} className="text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Weight Change</h3>
                                <div className="text-3xl font-bold text-green-600">{mockMetrics.weightChange} lbs</div>
                                <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                                    <CheckCircle size={20} className="text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Completion Rate</h3>
                                <div className="text-3xl font-bold text-blue-600">{mockMetrics.completionRate}%</div>
                                <p className="text-xs text-gray-600 mt-1">Daily goal tracking</p>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center mb-4">
                                    <TrendingUp size={20} className="text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Protein Target</h3>
                                <div className="text-3xl font-bold text-pacewell-dark">{mockMetrics.proteinTarget}g</div>
                                <p className="text-xs text-gray-600 mt-1">Daily goal</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                    />
                                </div>
                                
                                <div className="flex gap-2">
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setSelectedFilter(option)}
                                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                                                selectedFilter === option
                                                    ? 'bg-pacewell-dark text-white'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="space-y-3">
                                    {filteredEntries.map((entry) => (
                                        <div key={entry.id} className="bg-white rounded-lg shadow overflow-hidden">
                                            <button
                                                onClick={() => toggleExpand(entry.id)}
                                                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
                                            >
                                                <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                                    {getEntryIcon(entry.type)}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">{entry.summary}</h3>
                                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {getEntryTypeLabel(entry.type)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>{entry.date}</span>
                                                        <span>{entry.time}</span>
                                                        {entry.type === 'meal' && (
                                                            <>
                                                                <span className="font-semibold text-orange-500">{entry.calories} kcal</span>
                                                                <span className="text-pacewell-dark font-semibold">{entry.macros?.protein}g Protein</span>
                                                            </>
                                                        )}
                                                        {(entry.type === 'weight' || entry.type === 'bodyFat') && (
                                                            <>
                                                                <span className="font-semibold">{entry.weight} {entry.unit}</span>
                                                                <span className="text-pacewell-dark font-semibold">{entry.bodyFat}% Body Fat</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-shrink-0">
                                                    {isExpanded(entry.id) ? (
                                                        <ChevronUp size={24} className="text-gray-400" />
                                                    ) : (
                                                        <ChevronDown size={24} className="text-gray-400" />
                                                    )}
                                                </div>
                                            </button>
                                            
                                            {isExpanded(entry.id) && (
                                                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 space-y-4">
                                                    {entry.type === 'meal' && (
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Meal Timing</p>
                                                                    <p className="text-gray-900">{entry.mealTiming}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Calories</p>
                                                                    <p className="text-gray-900 font-semibold">{entry.calories} kcal</p>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                <div className="bg-white rounded p-3 border border-gray-200">
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Protein</p>
                                                                    <p className="text-lg font-bold text-pacewell-dark">{entry.macros?.protein}g</p>
                                                                </div>
                                                                <div className="bg-white rounded p-3 border border-gray-200">
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Carbs</p>
                                                                    <p className="text-lg font-bold text-yellow-600">{entry.macros?.carbs}g</p>
                                                                </div>
                                                                <div className="bg-white rounded p-3 border border-gray-200">
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Fat</p>
                                                                    <p className="text-lg font-bold text-green-600">{entry.macros?.fat}g</p>
                                                                </div>
                                                            </div>
                                                            {entry.notes && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Notes</p>
                                                                    <p className="text-gray-900">{entry.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(entry.type === 'weight' || entry.type === 'bodyFat') && (
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Weight</p>
                                                                    <p className="text-gray-900 font-semibold">{entry.weight} {entry.unit}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Body Fat %</p>
                                                                    <p className="text-gray-900 font-semibold">{entry.bodyFat}%</p>
                                                                </div>
                                                            </div>
                                                            {entry.notes && (
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Notes</p>
                                                                    <p className="text-gray-900">{entry.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex gap-3 pt-2 border-t border-gray-200">
                                                        <button className="flex items-center gap-2 px-4 py-2 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker transition font-semibold">
                                                            <Edit2 size={16} />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
                                                            <Trash2 size={16} />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 bg-pacewell-dark rounded flex items-center justify-center">
                                            <CheckCircle size={16} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Recent Milestones</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {mockMilestones.map((milestone) => (
                                            <div key={milestone.id} className="flex gap-3 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                                                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-lg">⭐</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{milestone.title}</p>
                                                    <p className="text-xs text-gray-600">{milestone.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-pacewell-dark to-pacewell-medium rounded-lg shadow p-6 text-white">
                                    <h3 className="text-lg font-bold mb-2">Quick Log Suggestion</h3>
                                    <p className="text-sm mb-4">You haven't logged your evening meal yet. Quick add a common option?</p>
                                    <div className="space-y-2">
                                        <button className="w-full bg-white text-pacewell-dark font-semibold py-2 rounded-lg hover:bg-gray-100 transition text-sm">
                                            Dinner Plate
                                        </button>
                                        <button className="w-full border border-white text-white font-semibold py-2 rounded-lg hover:bg-white hover:text-pacewell-dark transition text-sm">
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}