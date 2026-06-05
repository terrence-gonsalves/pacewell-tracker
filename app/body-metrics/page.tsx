"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Footer from '../components/Footer';
import { TrendingDown, TrendingUp, Lightbulb, Scale, TrendingUp as TrendingUpIcon, Calendar, CheckCircle, X } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { formatWeight, formatBodyFat, kgToLbs, lbsToKg, getUnitLabel, PreferredUnit } from '../utils/unit-utils';

interface WeightEntry {
    id: string;
    date: string;
    weight_kg: number;
    measured_body_fat_pct: number | null;
    calculated_body_fat_pct: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface FormData {
    weight: string;
    unit: 'metric' | 'imperial';
    date: string;
    bodyFat: string;
    notes: string;
}

interface Metrics {
    goalProgress: number;
    thirtyDayChange: number;
    avgWeeklyChange: number;
    weightToGoal: number;
    projectedGoalDate: string | null;
    entriesThisMonth: number;
}

export default function BodyMetricsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [entries, setEntries] = useState<WeightEntry[]>([]);
    const [currentWeight, setCurrentWeight] = useState(0);
    const [preferredUnit, setPreferredUnit] = useState<PreferredUnit>('metric');
    const [goalWeight, setGoalWeight] = useState(0);
    const [metrics, setMetrics] = useState<Metrics>({
        goalProgress: 0,
        thirtyDayChange: 0,
        avgWeeklyChange: 0,
        weightToGoal: 0,
        projectedGoalDate: null,
        entriesThisMonth: 0,
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        weight: '',
        unit: 'metric',
        date: new Date().toISOString().split('T')[0],
        bodyFat: '',
        notes: '',
    });

    // load weight entries
    useEffect(() => {
        loadWeightEntries();
    }, []);

    const loadWeightEntries = async () => {
        try {
            setLoading(true);

            const response = await fetchWithAuth('/api/weight-entries');

            // parse response if it's a Response object
            const data = response instanceof Response ? await response.json() : response;

            setEntries(data.data || []);
            setCurrentWeight(data.currentWeight);
            setPreferredUnit(data.preferredUnit || 'metric');
            setMetrics(data.metrics);

            // fetch goal
            const goalResponse = await fetchWithAuth('/api/personal-goals');
            const goals = goalResponse instanceof Response ? await goalResponse.json() : goalResponse;

            if (goals && Array.isArray(goals) && goals.length > 0) {
                const activeGoal = goals.find((g: any) => g.status === 'active');

                if (activeGoal) {
                    setGoalWeight(activeGoal.target_weight);
                }
            }
        } catch (error) {
            console.error('Error loading weight entries:', error);
            setErrorMessage('Failed to load weight data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        setErrorMessage('');
    };

    const handleClear = () => {
        setFormData({
            weight: '',
            unit: preferredUnit === 'imperial' ? 'imperial' : 'metric',
            date: new Date().toISOString().split('T')[0],
            bodyFat: '',
            notes: '',
        });
        setErrorMessage('');
        setSuccessMessage('');
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setErrorMessage('');

        if (!formData.weight || !formData.date) {
            setErrorMessage('Please enter weight and date');

            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                weight: formData.weight,
                unit: formData.unit,
                date: formData.date,
                bodyFat: formData.bodyFat || null,
                notes: formData.notes || null,
            };

            if (editingId) {

                // update existing entry
                const response = await fetchWithAuth(`/api/weight-entries/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });

                setSuccessMessage('Weight entry updated successfully!');
            } else {

                // create new entry
                const response = await fetchWithAuth('/api/weight-entries', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });

                setSuccessMessage('Weight entry logged successfully!');
            }

            setTimeout(() => {
                handleClear();
                loadWeightEntries();
            }, 1500);
        } catch (error: any) {
            console.error('Error submitting weight entry:', error);
            setErrorMessage(error.message || 'Failed to log weight entry');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: WeightEntry) => {
        const displayWeight = preferredUnit === 'imperial' ? kgToLbs(entry.weight_kg) : entry.weight_kg;
        const displayBodyFat = entry.measured_body_fat_pct ? (entry.measured_body_fat_pct * 100).toFixed(1) : '';

        setFormData({
            weight: displayWeight.toFixed(1),
            unit: preferredUnit === 'imperial' ? 'imperial' : 'metric',
            date: entry.date,
            bodyFat: displayBodyFat,
            notes: entry.notes || '',
        });

        setEditingId(entry.id);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetchWithAuth(`/api/weight-entries/${id}`, {
                method: 'DELETE',
            });

            setSuccessMessage('Weight entry deleted successfully!');
            setShowDeleteConfirm(null);
            setTimeout(() => {
                loadWeightEntries();
                setSuccessMessage('');
            }, 1500);
        } catch (error: any) {
            setErrorMessage(error.message || 'Failed to delete weight entry');
        }
    };

    const getTrendColor = (entry: WeightEntry, index: number): string => {
        if (index === entries.length - 1) return 'text-gray-600'; // most recent

        const nextEntry = entries[index + 1];

        if (!nextEntry) return 'text-gray-600';

        return entry.weight_kg < nextEntry.weight_kg ? 'text-green-600' : 'text-red-600';
    };

    const getTrendIcon = (entry: WeightEntry, index: number) => {
        if (index === entries.length - 1) return null;

        const nextEntry = entries[index + 1];

        if (!nextEntry) return null;

        return entry.weight_kg < nextEntry.weight_kg ? (
            <TrendingDown size={18} />
        ) : (
            <TrendingUp size={18} />
        );
    };

    const getTrendLabel = (entry: WeightEntry, index: number): string => {
        if (index === entries.length - 1) return 'Latest';

        const nextEntry = entries[index + 1];

        if (!nextEntry) return 'Latest';

        return entry.weight_kg < nextEntry.weight_kg ? 'Down' : 'Up';
    };

    // prepare chart data
    const chartData = entries.slice().reverse().map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: preferredUnit === 'imperial' ? kgToLbs(entry.weight_kg) : entry.weight_kg,
        bodyFat: entry.measured_body_fat_pct ? entry.measured_body_fat_pct * 100 : null,
    }));

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex min-h-screen bg-gray-50">
                    <Sidebar />

                    <main className="ml-56 flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pacewell-dark mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading weight data...</p>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />

                <main className="ml-56 flex-1">
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="px-8 py-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">Weight Tracker</h1>
                            <p className="text-gray-600">Monitor your body composition and track progress toward your {formatWeight(goalWeight, preferredUnit)} goal.</p>
                        </div>
                    </header>

                    <div className="p-8">
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Current Weight</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-900">
                                        {formatWeight(currentWeight, preferredUnit).split(' ')[0]}
                                    </span>
                                    <span className="text-lg text-gray-600 font-semibold">{getUnitLabel(preferredUnit)}</span>
                                </div>

                                {entries.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Last logged {new Date(entries[0].date).toLocaleDateString()}
                                </p>
                                )}

                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Goal Progress</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-900">{metrics.goalProgress}</span>
                                    <span className="text-lg text-gray-600 font-semibold">%</span>
                                </div>
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-pacewell-dark h-2 rounded-full"
                                        style={{ width: `${Math.min(metrics.goalProgress, 100)}%` }}
                                    />
                                </div>

                                {goalWeight > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {formatWeight(Math.abs(metrics.weightToGoal), preferredUnit)} to goal
                                </p>
                                )}

                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">30-Day Change</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-bold ${metrics.thirtyDayChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {metrics.thirtyDayChange > 0 ? '+' : ''}{formatWeight(Math.abs(metrics.thirtyDayChange), preferredUnit).split(' ')[0]}
                                    </span>
                                    <span className="text-lg text-gray-600 font-semibold">{getUnitLabel(preferredUnit)}</span>
                                </div>

                                {metrics.thirtyDayChange < 0 && (
                                <p className="text-xs text-green-600 mt-2">Steady consistent progress</p>
                                )}

                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="bg-white rounded-lg shadow p-8">
                                    <h2 className="text-2xl font-bold text-pacewell-dark mb-6">
                                        {editingId ? 'Edit Weight Entry' : 'Log New Weight'}
                                    </h2>

                                    {successMessage && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
                                        <span>{successMessage}</span>
                                    </div>
                                    )}

                                    {errorMessage && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
                                        <span>{errorMessage}</span>
                                        <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Weight Value</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="number"
                                                    name="weight"
                                                    step="0.1"
                                                    placeholder="e.g., 184.2"
                                                    value={formData.weight}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                />
                                                <select
                                                    name="unit"
                                                    value={formData.unit}
                                                    onChange={handleInputChange}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                                >
                                                    <option value="metric">KG</option>
                                                    <option value="imperial">LB</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Body Fat % <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="bodyFat"
                                                step="0.1"
                                                placeholder="e.g., 23.1"
                                                value={formData.bodyFat}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Notes <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                                            </label>
                                            <textarea
                                                name="notes"
                                                placeholder="e.g., Morning weight, fasted"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                            />
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                <Lightbulb size={18} />
                                                Tips for Accurate Measurements
                                            </h4>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                <li>Weigh yourself at the same time each day (morning is best)</li>
                                                <li>Weigh yourself on an empty stomach and after using the bathroom</li>
                                                <li>Use the same scale for consistency</li>
                                                <li>Track body fat percentage for better insights into body composition</li>
                                            </ul>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
                                            >
                                                {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Save Weight Entry'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClear}
                                                className="text-gray-700 hover:text-gray-900 transition font-semibold"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-8">
                                    <h2 className="text-2xl font-bold text-pacewell-dark mb-6">30-Day Trend</h2>

                                    {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                            <YAxis
                                            domain={['dataMin - 1', 'dataMax + 1']}
                                            tick={{ fontSize: 12 }}
                                            label={{ value: `Weight (${getUnitLabel(preferredUnit)})`, angle: -90, position: 'insideLeft' }}
                                            />
                                            <Tooltip
                                            contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
                                            formatter={(value) => [`${(value as number).toFixed(1)} ${getUnitLabel(preferredUnit)}`, 'Weight']}
                                            />
                                            <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#2D6A4F"
                                            dot={{ fill: '#2D6A4F', r: 5 }}
                                            activeDot={{ r: 7 }}
                                            strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                    ) : (
                                    <p className="text-center text-gray-500 py-8">No data yet. Log your first weight entry to see trends.</p>
                                    )}

                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg shadow p-6 flex gap-4 items-start">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Scale size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Weight to Goal</h3>
                                            <div className="text-2xl font-bold text-pacewell-dark">
                                                {formatWeight(Math.abs(metrics.weightToGoal), preferredUnit)}
                                            </div>
                                            <p className="text-sm text-gray-600">Remaining to reach your goal</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6 flex gap-4 items-start">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <TrendingUpIcon size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Avg. Weekly Change</h3>
                                            <div className={`text-2xl font-bold ${metrics.avgWeeklyChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatWeight(Math.abs(metrics.avgWeeklyChange), preferredUnit)}
                                            </div>
                                            <p className="text-sm text-gray-600">Based on 30-day trend</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6 flex gap-4 items-start">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Calendar size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Projected Goal Date</h3>
                                            <div className="text-lg font-bold text-pacewell-dark">
                                                {metrics.projectedGoalDate || 'TBD'}
                                            </div>
                                            <p className="text-sm text-gray-600">At current pace</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6 flex gap-4 items-start">
                                        <div className="w-10 h-10 bg-pacewell-dark rounded-lg flex items-center justify-center flex-shrink-0">
                                            <CheckCircle size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Entries This Month</h3>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {metrics.entriesThisMonth}
                                            </div>
                                            <p className="text-sm text-gray-600">Weight logs recorded</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-8 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-pacewell-dark">Recent Entries</h2>
                                <p className="text-sm text-gray-600 mt-1">Your last {entries.length} weight measurements</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Weight</th>
                                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Body Fat %</th>
                                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Trend</th>
                                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Notes</th>
                                            <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>

                                        {entries.length > 0 ? (
                                        entries.map((entry, index) => (
                                        <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                            <td className="px-8 py-4 text-sm text-gray-900">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="px-8 py-4 text-sm font-semibold text-gray-900">
                                                {formatWeight(entry.weight_kg, preferredUnit)}
                                            </td>
                                            <td className="px-8 py-4 text-sm text-gray-900">
                                                {formatBodyFat(entry.measured_body_fat_pct || entry.calculated_body_fat_pct)}
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`flex items-center gap-2 text-sm font-semibold ${getTrendColor(entry, index)}`}>
                                                    {getTrendIcon(entry, index)} {getTrendLabel(entry, index)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-sm text-gray-600">{entry.notes || '-'}</td>
                                            <td className="px-8 py-4 text-sm space-x-4">
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    className="text-pacewell-dark hover:text-pacewell-darker font-semibold"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(entry.id)}
                                                    className="text-red-600 hover:text-red-800 font-semibold"
                                                >
                                                    Delete
                                                </button>

                                                {showDeleteConfirm === entry.id && (
                                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                                    <div className="bg-white rounded-lg p-6 max-w-sm">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
                                                        <p className="text-gray-600 mb-6">Are you sure you want to delete this weight entry?</p>
                                                        <div className="flex gap-4">
                                                            <button
                                                                onClick={() => handleDelete(entry.id)}
                                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => setShowDeleteConfirm(null)}
                                                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                )}

                                            </td>
                                        </tr>
                                        ))
                                        ) : (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-8 text-center text-gray-500">
                                                No weight entries yet. Log your first weight to get started!
                                            </td>
                                        </tr>
                                        )}

                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <Footer />
                </main>
            </div>
        </ProtectedRoute>
    );
}