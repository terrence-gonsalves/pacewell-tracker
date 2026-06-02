/**
 * History & Logs Page - app/history-logs/page.tsx
 * Displays meal logs, weight entries, and body fat measurements from the database
 * Includes metrics, edit modals, delete confirmations, and full CRUD functionality
 *
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { Search, ChevronDown, ChevronUp, UtensilsCrossed, Scale, Target, AlertCircle, Edit2, Trash2, X } from 'lucide-react';

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

interface Metrics {
    avgDailyCalories: number
    weeklyWeightChange: number
    completionRate: number
    proteinTargetDays: number
}

interface EditFormData {
    meal_type?: string
    food_description?: string
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    weight_kg?: number
    measured_body_fat_pct?: number
    notes?: string
}

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
    const [metrics, setMetrics] = useState<Metrics | null>(null);

    // modal states
    const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // fetch logs from API
    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetchWithAuth('/api/history-logs', {
                method: 'GET',
                headers: {
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

    // calculate metrics
    const calculateMetrics = useCallback(() => {
        if (logs.length === 0) {
            setMetrics({
                avgDailyCalories: 0,
                weeklyWeightChange: 0,
                completionRate: 0,
                proteinTargetDays: 0,
            });

            return;
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // average Daily Calories (last 7 days)
        const mealLogsLast7Days = logs.filter(
            (log) => log.type === 'Meal' && new Date(log.date) >= sevenDaysAgo
        ) as MealLog[];

        const totalCalories = mealLogsLast7Days.reduce((sum, log) => sum + log.calories, 0);
        const avgDailyCalories = mealLogsLast7Days.length > 0
            ? Math.round(totalCalories / 7)
            : 0;

        // weight Change (latest vs oldest from this week)
        const weightLogsThisWeek = logs.filter(
            (log) => log.type === 'Weight' && new Date(log.date) >= sevenDaysAgo
        ) as WeightLog[];

        let weeklyWeightChange = 0;

        if (weightLogsThisWeek.length >= 2) {
            const sorted = [...weightLogsThisWeek].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const latest = sorted[0];
            const oldest = sorted[sorted.length - 1];

            weeklyWeightChange = Math.round((latest.weight_kg - oldest.weight_kg) * 100) / 100;
        }

        // completion Rate (days logged out of 7)
        const daysWithLogs = new Set<string>();

        logs.forEach((log) => {
            if (new Date(log.date) >= sevenDaysAgo) {
                daysWithLogs.add(log.date);
            }
        });

        const completionRate = Math.round((daysWithLogs.size / 7) * 100);

        //pProtein Target Days (days where protein >= 30g as default, should ideally come from personal goals)
        const mealLogsByDay = new Map<string, MealLog[]>();

        mealLogsLast7Days.forEach((log) => {
            if (!mealLogsByDay.has(log.date)) {
                mealLogsByDay.set(log.date, []);
            }

            mealLogsByDay.get(log.date)!.push(log);
        });

        let proteinTargetDays = 0;

        mealLogsByDay.forEach((logs) => {
            const totalProtein = logs.reduce((sum, log) => sum + log.protein_g, 0);

            if (totalProtein >= 150) { // assuming 150g daily target for 40+ male
                proteinTargetDays++;
            }
        });

        setMetrics({
            avgDailyCalories,
            weeklyWeightChange,
            completionRate,
            proteinTargetDays,
        });
    }, [logs]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        calculateMetrics();
    }, [logs, calculateMetrics]);

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

                return false;
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

    const handleEdit = (log: LogEntry) => {
        setEditingLog(log);
        setEditFormData({
            ...(log.type === 'Meal' && {
                meal_type: (log as MealLog).meal_type,
                food_description: (log as MealLog).food_description || '',
                calories: (log as MealLog).calories,
                protein_g: (log as MealLog).protein_g,
                carbs_g: (log as MealLog).carbs_g,
                fat_g: (log as MealLog).fat_g,
            }),
            ...(log.type === 'Weight' && {
                weight_kg: (log as WeightLog).weight_kg,
                measured_body_fat_pct: (log as WeightLog).measured_body_fat_pct || undefined,
                notes: (log as WeightLog).notes || '',
            }),
            ...(log.type === 'Body Fat' && {
                measured_body_fat_pct: (log as BodyFatLog).measured_body_fat_pct,
                notes: (log as BodyFatLog).notes || '',
            }),
        });
    };

    const handleSaveEdit = async () => {
        if (!editingLog) return;

        try {
            setIsSaving(true);

            const tableMap: { [key: string]: string } = {
                'Meal': 'macro_logs',
                'Weight': 'weight_entries',
                'Body Fat': 'body_fat_logs',
            };

            const response = await fetchWithAuth(`/api/history-logs/${editingLog.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                table: tableMap[editingLog.type],
                data: editFormData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update log');
            }

            // update local logs
            setLogs(logs.map(log => log.id === editingLog.id ? { ...log, ...editFormData } : log));
            setEditingLog(null);
            setEditFormData({});
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
            console.error('Error saving edit:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            setIsDeleting(true);

            const tableMap: { [key: string]: string } = {
                'Meal': 'macro_logs',
                'Weight': 'weight_entries',
                'Body Fat': 'body_fat_logs',
            };

            const response = await fetchWithAuth(`/api/history-logs/${deleteConfirm.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                table: tableMap[deleteConfirm.type],
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete log');
            }

            // update local logs
            setLogs(logs.filter(log => log.id !== deleteConfirm.id));
            setDeleteConfirm(null);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete log');
            console.error('Error deleting:', err);
        } finally {
            setIsDeleting(false);
        }
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

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                return 'N/A';
            }

            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'N/A';
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pageWindow = Math.ceil(currentPage / 3);
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
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="ml-56 flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-8 py-6">
              <h1 className="text-3xl font-bold text-gray-900">History & Logs</h1>
              <p className="text-gray-600 mt-1">View and manage your complete tracking history.</p>
            </div>
          </header>

          {/* Content */}
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
                {/* Metric Cards */}
                {metrics && (
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Avg Daily Calories</h3>
                      <div className="text-3xl font-bold text-gray-900">{metrics.avgDailyCalories}</div>
                      <p className="text-sm text-gray-600 mt-2">Last 7 days</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Weight Change</h3>
                      <div className="text-3xl font-bold text-gray-900">
                        {metrics.weeklyWeightChange > 0 ? '+' : ''}{metrics.weeklyWeightChange} kg
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Current Week</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Completion Rate</h3>
                      <div className="text-3xl font-bold text-gray-900">{metrics.completionRate}%</div>
                      <p className="text-sm text-gray-600 mt-2">Logging Consistency</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Protein Target</h3>
                      <div className="text-3xl font-bold text-gray-900">{metrics.proteinTargetDays}</div>
                      <p className="text-sm text-gray-600 mt-2">Days Achieved</p>
                    </div>
                  </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Logs */}
                  <div className="col-span-2 space-y-6">
                    {/* Search and Filters */}
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
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Filter Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        {filterOptions.map((filter) => (
                          <button
                            key={filter}
                            onClick={() => {
                              setSelectedFilter(filter);
                              setCurrentPage(1);
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

                    {/* Log Entries Table */}
                    {filteredEntries.length === 0 ? (
                      <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-600">No logs found for the selected filters.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 border-b border-gray-200 font-semibold text-sm text-gray-700">
                          <div>DATE & TIME</div>
                          <div>TYPE</div>
                          <div>SUMMARY</div>
                          <div>ACTIONS</div>
                        </div>

                        {/* Table Rows */}
                        {paginatedEntries.map((entry) => (
                          <div key={entry.id} className="border-b border-gray-200 last:border-b-0">
                            {/* Main Row */}
                            <div className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50 transition items-center">
                              <div className="text-sm text-gray-900">
                                <div>{formatDate(entry.date)}</div>
                                <div className="text-xs text-gray-600">{formatTime(entry.created_at)}</div>
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
                                  <span>{((entry as BodyFatLog).measured_body_fat_pct * 100).toFixed(1)}% body fat</span>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(entry)}
                                  className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-600"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ id: entry.id, type: entry.type })}
                                  className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                                >
                                  <Trash2 size={18} />
                                </button>
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

                            {/* Expanded Details */}
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
                                    {(entry as MealLog).food_description && (
                                      <div className="bg-white p-4 rounded-lg">
                                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Notes</p>
                                        <p className="text-sm text-gray-700">{(entry as MealLog).food_description}</p>
                                      </div>
                                    )}
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
                                            {(((entry as WeightLog).measured_body_fat_pct ?? (entry as WeightLog).calculated_body_fat_pct ?? 0) * 100).toFixed(1)}%
                                        </p>
                                      </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg space-y-3">
                                      <p className="text-xs font-bold text-gray-600 uppercase mb-3">Composition</p>
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs font-semibold text-gray-700">Body Fat</span>
                                          <span className="text-xs font-bold text-gray-900">
                                            {(((entry as WeightLog).measured_body_fat_pct ?? (entry as WeightLog).calculated_body_fat_pct ?? 0) * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-orange-500 h-2 rounded-full"
                                            style={{
                                              width: `${Math.min(((entry as WeightLog).measured_body_fat_pct || (entry as WeightLog).calculated_body_fat_pct || 0) * 100, 100)}%`
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
                                      <p className="text-3xl font-bold text-gray-900">{((entry as BodyFatLog).measured_body_fat_pct * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg">
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                          className="bg-orange-500 h-3 rounded-full"
                                          style={{ width: `${Math.min((entry as BodyFatLog).measured_body_fat_pct * 100, 100)}%` }}
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

                    {/* Pagination */}
                    {totalPages > 0 && (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
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
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Sidebar */}
                  <div className="space-y-6">
                    {/* Feed Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Milestones</h3>
                      <div className="space-y-4">
                        <div className="pb-4 border-b border-gray-200 last:border-b-0">
                          <p className="text-sm font-semibold text-gray-900">Weekly Logging Streak</p>
                          <p className="text-xs text-gray-600 mt-1">Keep logging consistently to build momentum!</p>
                          <p className="text-xs text-gray-500 mt-2">Updated daily</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Tip */}
                    <div className="bg-pacewell-light rounded-lg p-6">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Tip</h3>
                      <p className="text-sm text-gray-700">Logging consistently helps you track progress. Keep it up!</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Edit Modal */}
          {editingLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Edit {editingLog.type}</h2>
                  <button
                    onClick={() => {
                      setEditingLog(null);
                      setEditFormData({});
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {editingLog.type === 'Meal' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Type</label>
                        <select
                          value={(editFormData.meal_type || '') as string}
                          onChange={(e) => setEditFormData({ ...editFormData, meal_type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                        >
                          <option value="">Select meal type</option>
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Food Description</label>
                        <input
                          type="text"
                          value={(editFormData.food_description || '') as string}
                          onChange={(e) => setEditFormData({ ...editFormData, food_description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          placeholder="e.g., Grilled salmon with rice"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Calories</label>
                        <input
                          type="number"
                          value={(editFormData.calories || '') as number}
                          onChange={(e) => setEditFormData({ ...editFormData, calories: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Protein (g)</label>
                          <input
                            type="number"
                            value={(editFormData.protein_g || '') as number}
                            onChange={(e) => setEditFormData({ ...editFormData, protein_g: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Carbs (g)</label>
                          <input
                            type="number"
                            value={(editFormData.carbs_g || '') as number}
                            onChange={(e) => setEditFormData({ ...editFormData, carbs_g: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Fats (g)</label>
                          <input
                            type="number"
                            value={(editFormData.fat_g || '') as number}
                            onChange={(e) => setEditFormData({ ...editFormData, fat_g: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {editingLog.type === 'Weight' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                        <input
                          type="number"
                          value={(editFormData.weight_kg || '') as number}
                          onChange={(e) => setEditFormData({ ...editFormData, weight_kg: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Body Fat % (optional)</label>
                        <input
                          type="number"
                          value={(editFormData.measured_body_fat_pct || '') as number}
                          onChange={(e) => setEditFormData({ ...editFormData, measured_body_fat_pct: parseFloat(e.target.value) || undefined })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          step="0.001"
                          min="0"
                          max="1"
                          placeholder="Enter as decimal (e.g., 0.185 for 18.5%)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={(editFormData.notes || '') as string}
                          onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          rows={3}
                          placeholder="Any notes about this measurement..."
                        />
                      </div>
                    </>
                  )}

                  {editingLog.type === 'Body Fat' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Body Fat %</label>
                        <input
                          type="number"
                          value={(editFormData.measured_body_fat_pct || '') as number}
                          onChange={(e) => setEditFormData({ ...editFormData, measured_body_fat_pct: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          step="0.001"
                          min="0"
                          max="1"
                          placeholder="Enter as decimal (e.g., 0.185 for 18.5%)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={(editFormData.notes || '') as string}
                          onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark"
                          rows={3}
                          placeholder="Any notes about this measurement..."
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setEditingLog(null);
                      setEditFormData({});
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-6 py-2 bg-pacewell-dark text-white rounded-lg hover:bg-pacewell-darker font-semibold disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Log?</h2>
                  <p className="text-gray-600 mb-6">Are you sure you want to delete this log? This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-8">
            <div className="px-8 py-6 flex items-center justify-between">
              <p className="text-xs text-gray-600">© 2024 Pacewell Tracker. Empowering fitness after 40.</p>
              <div className="flex gap-6">
                <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Privacy Policy</a>
                <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Terms of Service</a>
                <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Help Center</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </ProtectedRoute>
  );
}