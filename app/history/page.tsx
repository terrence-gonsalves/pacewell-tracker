/**
 * History & Logs Page - app/history-logs/page.tsx
 * Displays meal logs, weight entries, and body fat measurements from the database
 * Shows logs from the last 30 days with filtering and expandable details
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Search, ChevronDown, ChevronUp, UtensilsCrossed, Scale, Target, AlertCircle } from 'lucide-react';

interface MealLog {
    id: string
    type: 'Meal'
    date: string
    meal_type: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    food_description: string | null
    created_at: string
}

interface WeightLog {
    id: string
    type: 'Weight'
    date: string
    weight_kg: number
    measured_body_fat_pct: number | null
    calculated_body_fat_pct: number | null
    lean_fat_kg?: number
    notes: string | null
    created_at: string
}

interface BodyFatLog {
    id: string
    type: 'Body Fat'
    date: string
    measured_body_fat_pct: number
    notes: string | null
    created_at: string
}

type LogEntry = MealLog | WeightLog | BodyFatLog;

const filterOptions = ['All', 'Meal', 'Weight', 'Body Fat'];
const entriesPerPage = 6;

export default function HistoryLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageWindow, setPageWindow] = useState(1);

    // fetch logs from API
    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = localStorage.getItem('pacewell_token');

            if (!token) {
                setError('No active session. Please log in again.');
                return;
            }

            const response = await fetch('/api/history-logs', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('API Error - Status:', response.status, 'Error:', data.error);
                throw new Error(data.error || 'Failed to fetch logs');
            }

            setLogs(data.data || []);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load your logs. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getFilteredEntries = () => {
        let filtered = logs;

        if (selectedFilter !== 'All') {
            filtered = filtered.filter((entry) => entry.type === selectedFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter((entry) => {
                if (entry.type === 'Meal') {
                    return entry.food_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.meal_type.toLowerCase().includes(searchTerm.toLowerCase());
                }

                return true;
            });
        }

        return filtered;
    };

    const filteredEntries = getFilteredEntries();
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const paginatedEntries = filteredEntries.slice(startIndex, startIndex + entriesPerPage);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Meal':
                return <UtensilsCrossed size={16} />;
            case 'Weight':
                return <Scale size={16} />;
            case 'Body Fat':
                return <Target size={16} />;
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handlePreviousPage = () => {
        if (pageWindow > 1) {
            setPageWindow(pageWindow - 1);
            setCurrentPage((pageWindow - 1) * 3);
        }
    };

    const handleNextPage = () => {
        if (pageWindow * 3 < totalPages) {
            setPageWindow(pageWindow + 1);
            setCurrentPage(pageWindow * 3 + 1);
        }
    };

    const getPageNumbers = () => {
            const start = (pageWindow - 1) * 3 + 1;
            const end = Math.min(start + 2, totalPages);
            const pages = [];

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            return pages;
    };

    const pageNumbers = getPageNumbers();

    const MacroBar = ({ value, label, color }: { value: number; label: string; color: string }) => {
        return (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{value}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className={`${color} h-1.5 rounded-full`}
                        style={{ width: `${Math.min((value / 50) * 100, 100)}%` }}
                    />
                </div>
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
                            <p className="text-gray-600 mt-1">View and manage your complete tracking history.</p>
                        </div>
                    </header>
                    
                    <div className="p-8">

                        {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                        </div>
                        )}

                        {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-pacewell-dark border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Loading your logs...</p>
                            </div>
                        </div>
                        ) : (
                        <>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2 space-y-6">
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <div className="mb-6">
                                            <div className="relative">
                                                <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search meals or notes..."
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setCurrentPage(1);
                                                        setPageWindow(1);
                                                    }}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 flex-wrap">

                                            {filterOptions.map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => {
                                                    setSelectedFilter(filter);
                                                    setCurrentPage(1);
                                                    setPageWindow(1);
                                                }}
                                                className={`px-4 py-2 rounded-lg font-semibold transition ${
                                                selectedFilter === filter
                                                    ? 'bg-pacewell-dark text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {filter}
                                            </button>
                                            ))}

                                        </div>
                                    </div>
                                    
                                    {filteredEntries.length === 0 ? (
                                    <div className="bg-white rounded-lg shadow p-12 text-center">
                                        <p className="text-gray-600">No logs found for the selected filters.</p>
                                    </div>
                                    ) : (
                                    <div className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 border-b border-gray-200 font-semibold text-sm text-gray-700">
                                            <div>DATE & TIME</div>
                                            <div>TYPE</div>
                                            <div>SUMMARY</div>
                                            <div>ACTIONS</div>
                                        </div>
                                        
                                        {paginatedEntries.map((entry) => (
                                        <div key={entry.id} className="border-b border-gray-200 last:border-b-0">
                                            <div className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50 transition items-center">
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(entry.date)}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <div className="text-pacewell-dark">{getTypeIcon(entry.type)}</div>
                                                    <span className="text-sm font-medium">{entry.type}</span>
                                                </div>
                                                <div className="text-sm text-gray-600">

                                                    {entry.type === 'Meal' && (
                                                    <span className="capitalize">{(entry as MealLog).meal_type} - {(entry as MealLog).food_description || 'No description'}</span>
                                                    )}

                                                    {entry.type === 'Weight' && (
                                                    <span>{(entry as WeightLog).weight_kg} kg</span>
                                                    )}

                                                    {entry.type === 'Body Fat' && (
                                                    <span>{(entry as BodyFatLog).measured_body_fat_pct}% body fat</span>
                                                    )}

                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => toggleExpand(entry.id)}
                                                        className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-600"
                                                    >
                                                        
                                                        {expandedId === entry.id ? (
                                                        <ChevronUp size={20} />
                                                        ) : (
                                                        <ChevronDown size={20} />
                                                        )}

                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {expandedId === entry.id && (
                                            <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-4">

                                                {entry.type === 'Meal' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-600 uppercase mb-2">Calories</p>
                                                            <p className="text-2xl font-bold text-gray-900">{(entry as MealLog).calories} kcal</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-600 uppercase mb-2">Meal Type</p>
                                                            <p className="text-lg font-semibold text-gray-900 capitalize">{(entry as MealLog).meal_type}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-lg space-y-3">
                                                        <p className="text-xs font-bold text-gray-600 uppercase">Macro Breakdown</p>
                                                        <MacroBar value={(entry as MealLog).protein_g} label="Protein" color="bg-pacewell-dark" />
                                                        <MacroBar value={(entry as MealLog).carbs_g} label="Carbs" color="bg-yellow-500" />
                                                        <MacroBar value={(entry as MealLog).fat_g} label="Fats" color="bg-orange-500" />
                                                    </div>
                                                </>
                                                )}

                                                {entry.type === 'Weight' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-600 uppercase mb-2">Weight</p>
                                                            <p className="text-2xl font-bold text-gray-900">{(entry as WeightLog).weight_kg} kg</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-600 uppercase mb-2">Body Fat</p>
                                                            <p className="text-2xl font-bold text-gray-900">                                                            
                                                                {(entry as WeightLog).measured_body_fat_pct || (entry as WeightLog).calculated_body_fat_pct || '-'}%                                                            
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-lg space-y-3">
                                                        <p className="text-xs font-bold text-gray-600 uppercase mb-3">Composition</p>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-semibold text-gray-700">Body Fat</span>
                                                                <span className="text-xs font-bold text-gray-900">
                                                                    {(entry as WeightLog).measured_body_fat_pct || (entry as WeightLog).calculated_body_fat_pct || '-'}%                                                                
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-orange-500 h-2 rounded-full"
                                                                    style={{
                                                                        width: `${Math.min(((entry as WeightLog).measured_body_fat_pct || (entry as WeightLog).calculated_body_fat_pct || 0) * 2, 100)}%`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-semibold text-gray-700">Lean Mass</span>
                                                                <span className="text-xs font-bold text-gray-900">{(entry as WeightLog).lean_fat_kg} kg</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-pacewell-dark h-2 rounded-full"
                                                                    style={{
                                                                    width: `${Math.min(((entry as WeightLog).lean_fat_kg || 0) / 100 * 100, 100)}%`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {(entry as WeightLog).notes && (
                                                    <div className="bg-white p-4 rounded-lg">
                                                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Notes</p>
                                                        <p className="text-sm text-gray-700">{(entry as WeightLog).notes}</p>
                                                    </div>
                                                    )}

                                                </>
                                                )}

                                                {entry.type === 'Body Fat' && (
                                                <>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Body Fat %</p>
                                                        <p className="text-3xl font-bold text-gray-900">{(entry as BodyFatLog).measured_body_fat_pct}%</p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-lg">
                                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                                            <div
                                                                className="bg-orange-500 h-3 rounded-full"
                                                                style={{ width: `${Math.min((entry as BodyFatLog).measured_body_fat_pct * 2, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {(entry as BodyFatLog).notes && (
                                                    <div className="bg-white p-4 rounded-lg">
                                                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Notes</p>
                                                        <p className="text-sm text-gray-700">{(entry as BodyFatLog).notes}</p>
                                                    </div>
                                                    )}

                                                </>
                                                )}

                                            </div>
                                            )}

                                        </div>
                                        ))}

                                    </div>
                                    )}
                                    
                                    {totalPages > 0 && (
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={pageWindow === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex gap-2">

                                            {pageNumbers.map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-10 h-10 rounded-lg font-semibold transition ${
                                                        currentPage === page
                                                        ? 'bg-pacewell-dark text-white'
                                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            
                                        </div>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={pageWindow * 3 >= totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    )}

                                </div>
                                
                                <div className="space-y-6">
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Milestones</h3>
                                        <div className="space-y-4">
                                            <div className="pb-4 border-b border-gray-200 last:border-b-0">
                                                <p className="text-sm font-semibold text-gray-900">Weekly Logging Streak</p>
                                                <p className="text-xs text-gray-600 mt-1">You're on a 7-day streak!</p>
                                                <p className="text-xs text-gray-500 mt-2">2h ago</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-pacewell-light rounded-lg p-6">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Tip</h3>
                                        <p className="text-sm text-gray-700">Logging consistently helps you track progress. Keep it up!</p>
                                    </div>
                                </div>
                            </div>
                        </>
                        )}

                    </div>
                    
                    <Footer />
                </main>
            </div>
        </ProtectedRoute>
    );
}