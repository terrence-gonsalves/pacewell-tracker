"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import { 
    Search, 
    Edit2, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    UtensilsCrossed, 
    Scale, 
    Target, 
    Dumbbell, 
    TrendingUp 
} from 'lucide-react';

// mock data
const mockMetrics = {
    avgDailyCalories: 2145,
    avgDailyCaloriesChange: 4,
    weightChange: -1.2,
    completionRate: 94,
    proteinDaysAchieved: 8,
};

const mockLogEntries = [
    {
        id: '1',
        date: 'Oct 24, 2024',
        time: '12:45 PM',
        type: 'meal',
        typeLabel: 'Meal',
        summary: 'Grilled Salmon with Quinoa and Avocado',
        calories: 520,
        protein: { value: 42, target: 60 },
        carbs: { value: 35, target: 100 },
        fats: { value: 18, target: 70 },
        notes: 'Felt very satiated. Good post-workout meal.',
    },
    {
        id: '2',
        date: 'Oct 24, 2024',
        time: '07:15 AM',
        type: 'weight',
        typeLabel: 'Weight',
        summary: '185.4 lbs (Daily Weight-in)',
        weight: 185.4,
        bodyFat: 22.1,
    },
    {
        id: '3',
        date: 'Oct 23, 2024',
        time: '07:30 PM',
        type: 'meal',
        typeLabel: 'Meal',
        summary: 'Lean Beef Stir-fry with Broccoli',
        calories: 410,
        protein: { value: 38, target: 60 },
        carbs: { value: 28, target: 100 },
        fats: { value: 12, target: 70 },
    },
    {
        id: '4',
        date: 'Oct 23, 2024',
        time: '01:00 PM',
        type: 'meal',
        typeLabel: 'Meal',
        summary: 'Mediterranean Hummus Wrap',
        calories: 380,
        protein: { value: 12, target: 60 },
        carbs: { value: 52, target: 100 },
        fats: { value: 14, target: 70 },
    },
    {
        id: '5',
        date: 'Oct 22, 2024',
        time: '09:00 AM',
        type: 'bodyFat',
        typeLabel: 'Body Fat',
        summary: '18.2% (Home Sensor)',
        weight: 186.2,
        bodyFat: 18.2,
    },
    {
        id: '6',
        date: 'Oct 22, 2024',
        time: '06:30 AM',
        type: 'exercise',
        typeLabel: 'Exercise',
        summary: 'Morning Strength Training - Upper Body',
        duration: 45,
    },
];

const mockMilestones = [
    {
        id: '1',
        icon: 'target',
        title: 'Weekly Goal Met',
        description: "You've logged meals for 7 days straight!",
        time: '2H AGO',
    },
    {
        id: '2',
        icon: 'scale',
        title: 'Weight Drop',
        description: 'New personal best: 184.5 lbs reached.',
        time: 'YESTERDAY',
    },
    {
        id: '3',
        icon: 'protein',
        title: 'Macro Master',
        description: 'Hit your protein target for 3 days.',
        time: '2 DAYS AGO',
    },
];

const filterOptions = ['All', 'Meal', 'Weight', 'Body Fat'];

export default function HistoryLogsPage() {
    const { user } = useAuth();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [expandedId, setExpandedId] = useState<string | null>('1');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageWindow, setPageWindow] = useState(1);

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
                entry.summary.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredEntries = getFilteredEntries();
    const totalEntries = 124;
    const entriesPerPage = 6;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'meal':
                return <UtensilsCrossed size={16} />;
            case 'weight':
                return <Scale size={16} />;
            case 'bodyFat':
                return <Target size={16} />;
            case 'exercise':
                return <Dumbbell size={16} />;
            default:
                return null;
        }
    };

    const getMilestoneIcon = (icon: string) => {
        switch (icon) {
            case 'target':
                return <Target size={20} />;
            case 'scale':
                return <Scale size={20} />;
            case 'protein':
                return <UtensilsCrossed size={20} />;
            default:
                return null;
        }
    };

    const MacroProgressBar = ({ value, target }: { value: number; target: number }) => {
        const percentage = (value / target) * 100;
        return (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                    className="bg-pacewell-dark h-2 rounded-full"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        );
    };

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                
                <main className="ml-56 flex-1">
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-8 py-6">
                            <h1 className="text-3xl font-bold text-gray-900">History & Logs</h1>
                            <p className="text-gray-600 mt-1">Review and manage your health journey data.</p>
                        </div>
                    </header>
                    
                    <div className="p-8">
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Daily Calories</h3>
                                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg">
                                        <span className="text-red-600 text-sm font-semibold" style={{ transform: 'rotate(-20deg)', display: 'inline-block' }}>↑</span>
                                        <span className="text-red-600 text-sm font-semibold">{mockMetrics.avgDailyCaloriesChange}%</span>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{mockMetrics.avgDailyCalories}</div>
                                <p className="text-sm text-gray-600 mt-2">Last 7 days</p>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Weight Change</h3>
                                    <span className="text-gray-900 text-sm font-semibold">Progress</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{mockMetrics.weightChange} lbs</div>
                                <p className="text-sm text-gray-600 mt-2">Current Week</p>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Completion Rate</h3>
                                <div className="text-3xl font-bold text-gray-900">{mockMetrics.completionRate}%</div>
                                <p className="text-sm text-gray-600 mt-2">Logging Consistency</p>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Protein Target</h3>
                                <div className="text-3xl font-bold text-gray-900">{mockMetrics.proteinDaysAchieved}/10</div>
                                <p className="text-sm text-gray-600 mt-2">Days Achieved</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-8">
                            <div className="col-span-2 space-y-4">
                                <div className="bg-white rounded-lg shadow p-6 flex items-center gap-6">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search logs (e.g. 'Chicken Salad')..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent text-sm"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        {filterOptions.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => setSelectedFilter(option)}
                                                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                                                    selectedFilter === option
                                                        ? 'bg-pacewell-dark text-white'
                                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-6 grid grid-cols-12 gap-4">
                                    <div className="col-span-3 text-sm font-semibold text-gray-600 uppercase tracking-wide">Date & Time</div>
                                    <div className="col-span-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">Type</div>
                                    <div className="col-span-5 text-sm font-semibold text-gray-600 uppercase tracking-wide">Summary</div>
                                    <div className="col-span-2 text-sm font-semibold text-gray-600 uppercase tracking-wide text-right">Actions</div>
                                </div>
                                
                                <div className="space-y-4">
                                    {filteredEntries.map((entry) => (
                                        <div key={entry.id} className="bg-white rounded-lg shadow overflow-hidden">
                                            <div className="p-6 grid grid-cols-12 gap-4 items-start border-b border-gray-200">
                                                <div className="col-span-3">
                                                    <div className="text-gray-900 font-semibold">{entry.date}</div>
                                                    <div className="text-sm text-gray-600">{entry.time}</div>
                                                </div>
                                                
                                                <div className="col-span-2">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                                        <span className="text-gray-700">{getTypeIcon(entry.type)}</span>
                                                        <span className="text-sm font-semibold text-gray-700">{entry.typeLabel}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="col-span-5">
                                                    <div className="text-gray-900 font-semibold">{entry.summary}</div>
                                                </div>
                                                
                                                <div className="col-span-2 flex items-center justify-end gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button className="p-2 text-red-400 hover:text-red-600 transition">
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpand(entry.id)}
                                                        className="p-2 text-gray-400 hover:text-gray-600 transition"
                                                    >
                                                        {expandedId === entry.id ? (
                                                            <ChevronUp size={18} />
                                                        ) : (
                                                            <ChevronDown size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {expandedId === entry.id && (
                                                <div className="px-6 py-4 bg-gray-50 space-y-6 border-t border-gray-200">
                                                    {entry.type === 'meal' && 'calories' in entry && 'protein' in entry && 'carbs' in entry && 'fats' in entry && (
                                                        <>
                                                            <div className="grid grid-cols-4 gap-4">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Calories</p>
                                                                    <p className="text-xl font-bold text-pacewell-dark">{(entry as any).calories} kcal</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Protein</p>
                                                                    <p className="text-xl font-bold text-gray-900">{(entry as any).protein.value}g</p>
                                                                    <MacroProgressBar value={(entry as any).protein.value} target={(entry as any).protein.target} />
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Carbs</p>
                                                                    <p className="text-xl font-bold text-gray-900">{(entry as any).carbs.value}g</p>
                                                                    <MacroProgressBar value={(entry as any).carbs.value} target={(entry as any).carbs.target} />
                                                                </div>
                                                                
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Fats</p>
                                                                    <p className="text-xl font-bold text-gray-900">{(entry as any).fats.value}g</p>
                                                                    <MacroProgressBar value={(entry as any).fats.value} target={(entry as any).fats.target} />
                                                                </div>
                                                            </div>
                                                            
                                                            {'notes' in entry && (entry as any).notes && (
                                                                <div className="border-t border-gray-200 pt-4">
                                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Notes</p>
                                                                    <p className="text-gray-700 italic">"{(entry as any).notes}"</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {entry.type === 'weight' && (
                                                        <div>
                                                            <p className="text-sm text-gray-700">
                                                                <span className="font-semibold">Weight:</span> {entry.weight} lbs | <span className="font-semibold">Body Fat:</span> {entry.bodyFat}%
                                                            </p>
                                                        </div>
                                                    )}

                                                    {entry.type === 'bodyFat' && (
                                                        <div>
                                                            <p className="text-sm text-gray-700">
                                                                <span className="font-semibold">Weight:</span> {entry.weight} lbs | <span className="font-semibold">Body Fat:</span> {entry.bodyFat}%
                                                            </p>
                                                        </div>
                                                    )}

                                                    {entry.type === 'exercise' && (
                                                        <div>
                                                            <p className="text-sm text-gray-700">
                                                                <span className="font-semibold">Duration:</span> {entry.duration} minutes
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex items-center justify-between mt-8">
                                    <p className="text-sm text-gray-600">Showing 1-6 of {totalEntries} entries</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (pageWindow > 1) {
                                                    setPageWindow(pageWindow - 1);
                                                    setCurrentPage(pageWindow - 1);
                                                }
                                            }}
                                            disabled={pageWindow === 1}
                                            className={`px-4 py-2 border border-gray-300 rounded-lg transition ${pageWindow === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: 3 }, (_, i) => pageWindow + i).filter(page => page <= totalPages).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-lg transition ${
                                                    currentPage === page
                                                        ? 'bg-pacewell-dark text-white'
                                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => {
                                                if (pageWindow + 3 <= totalPages) {
                                                    setPageWindow(pageWindow + 1);
                                                    setCurrentPage(pageWindow + 3);
                                                }
                                            }}
                                            disabled={pageWindow + 3 > totalPages}
                                            className={`px-4 py-2 border border-gray-300 rounded-lg transition ${pageWindow + 3 > totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Feed</h2>
                                    <p className="text-gray-600 mb-6">Your recent accomplishments</p>

                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Recent Milestones</h3>
                                        <button className="text-pacewell-dark hover:text-pacewell-darker font-semibold text-sm">
                                            View Insights
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {mockMilestones.map((milestone) => (
                                            <div key={milestone.id} className="flex gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-pacewell-dark">
                                                    {getMilestoneIcon(milestone.icon)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">{milestone.title}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                                    <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">{milestone.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-green-100 rounded-lg p-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center mx-auto mb-4 text-pacewell-dark">
                                        <UtensilsCrossed size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Log Suggestion</h3>
                                    <p className="text-sm text-gray-700 mb-4">It's almost lunch time. Based on your goals, a high-protein salad would be perfect.</p>
                                    <button className="w-full bg-pacewell-dark text-white font-semibold py-2 rounded-lg hover:bg-pacewell-darker transition">
                                        Log Common Meal
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