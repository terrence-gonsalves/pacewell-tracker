"use client";

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// mock data - will be replaced with real API data later
const mockWeightData = {
    currentWeight: 184.2,
    goalWeight: 175,
    goalProgress: 68,
    thirtyDayChange: -4.3,
    unit: 'lbs',
    trendData: [
        { date: 'May 1', weight: 188.5, bodyFat: 24.2 },
        { date: 'May 5', weight: 187.8, bodyFat: 24.0 },
        { date: 'May 10', weight: 186.9, bodyFat: 23.8 },
        { date: 'May 14', weight: 186.1, bodyFat: 23.6 },
        { date: 'May 17', weight: 185.4, bodyFat: 23.4 },
        { date: 'May 20', weight: 184.7, bodyFat: 23.2 },
        { date: 'May 21', weight: 184.2, bodyFat: 23.1 },
    ],
    recentEntries: [
        { id: 1, date: 'May 21, 2026', weight: 184.2, bodyFat: 23.1, trend: 'down', notes: 'Morning weight, fasted' },
        { id: 2, date: 'May 20, 2026', weight: 184.7, bodyFat: 23.2, trend: 'down', notes: 'Post-workout' },
        { id: 3, date: 'May 17, 2026', weight: 185.4, bodyFat: 23.4, trend: 'down', notes: 'Morning weight' },
        { id: 4, date: 'May 14, 2026', weight: 186.1, bodyFat: 23.6, trend: 'down', notes: 'Morning weight' },
    ],
};

interface FormData {
    weight: string;
    unit: 'lbs' | 'kg';
    date: string;
    bodyFat: string;
    notes: string;
}

export default function BodyMetricsPage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        weight: '',
        unit: 'lbs',
        date: new Date().toISOString().split('T')[0],
        bodyFat: '',
        notes: '',
    });

    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleClear = () => {
        setFormData({
            weight: '',
            unit: 'lbs',
            date: new Date().toISOString().split('T')[0],
            bodyFat: '',
            notes: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // TODO: Connect to API endpoint when ready
        console.log('Weight entry submitted:', formData);
        setSuccessMessage('Weight entry logged successfully!');
        setTimeout(() => {
            handleClear();
            setSuccessMessage('');
        }, 2000);
    };

    const getTrendColor = (trend: string) => {
        return trend === 'down' ? 'text-green-600' : 'text-red-600';
    };

    const getTrendIcon = (trend: string) => {
        return trend === 'down' ? '📉' : '📈';
    };

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                
                <main className="ml-56 flex-1">
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-8 py-6">
                            <h1 className="text-3xl font-bold text-pacewell-dark mb-1">Weight Tracker</h1>
                            <p className="text-gray-600">Monitor your body composition and track progress toward your {mockWeightData.goalWeight}{mockWeightData.unit} goal.</p>
                        </div>
                    </header>
                    
                    <div className="max-w-7xl mx-auto px-8 py-6">
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Current Weight</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-pacewell-dark">{mockWeightData.currentWeight}</span>
                                    <span className="text-lg text-gray-600 font-semibold">{mockWeightData.unit}</span>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Goal Progress</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-pacewell-dark">{mockWeightData.goalProgress}</span>
                                    <span className="text-lg text-gray-600 font-semibold">%</span>
                                </div>
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-pacewell-dark h-2 rounded-full"
                                        style={{ width: `${mockWeightData.goalProgress}%` }}
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">30-Day Change</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-bold ${mockWeightData.thirtyDayChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {mockWeightData.thirtyDayChange > 0 ? '+' : ''}{mockWeightData.thirtyDayChange}
                                    </span>
                                    <span className="text-lg text-gray-600 font-semibold">{mockWeightData.unit}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2">
                                <div className="bg-white rounded-lg shadow p-8">
                                    <h2 className="text-2xl font-bold text-pacewell-dark mb-6">Log New Weight</h2>

                                    {successMessage && (
                                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                            {successMessage}
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
                                                    <option value="lbs">LB</option>
                                                    <option value="kg">KG</option>
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
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Body Fat % <span className="text-gray-500 text-sm font-normal">(Optional)</span></label>
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
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes <span className="text-gray-500 text-sm font-normal">(Optional)</span></label>
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
                                            <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Accurate Measurements</h4>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                <li>• Weigh yourself at the same time each day (morning is best)</li>
                                                <li>• Weigh yourself on an empty stomach and after using the bathroom</li>
                                                <li>• Use the same scale for consistency</li>
                                                <li>• Track body fat percentage for better insights into body composition</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="flex gap-4">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-3 rounded-lg transition"
                                            >
                                                Save Weight Entry
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClear}
                                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Weight to Goal</h3>
                                    <div className="text-2xl font-bold text-pacewell-dark mb-1">
                                        {(mockWeightData.currentWeight - mockWeightData.goalWeight).toFixed(1)} {mockWeightData.unit}
                                    </div>
                                    <p className="text-sm text-gray-600">Remaining to reach your goal</p>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Avg. Weekly Loss</h3>
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {(Math.abs(mockWeightData.thirtyDayChange) / 4).toFixed(1)} {mockWeightData.unit}
                                    </div>
                                    <p className="text-sm text-gray-600">Based on 30-day trend</p>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Projected Goal Date</h3>
                                    <div className="text-lg font-bold text-pacewell-dark mb-1">
                                        ~July 20, 2026
                                    </div>
                                    <p className="text-sm text-gray-600">At current pace</p>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Entries This Month</h3>
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {mockWeightData.recentEntries.length}
                                    </div>
                                    <p className="text-sm text-gray-600">Weight logs recorded</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 bg-white rounded-lg shadow p-8">
                            <h2 className="text-2xl font-bold text-pacewell-dark mb-6">30-Day Trend</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={mockWeightData.trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        domain={['dataMin - 1', 'dataMax + 1']}
                                        tick={{ fontSize: 12 }}
                                        label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
                                        formatter={(value) => [`${value} lbs`, 'Weight']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#2D6A4F"
                                        dot={{ fill: '#2D6A4F', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        strokeWidth={2}
                                        name="Weight"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-8 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-pacewell-dark">Recent Entries</h2>
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
                                        {mockWeightData.recentEntries.map((entry) => (
                                            <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                                <td className="px-8 py-4 text-sm text-gray-900">{entry.date}</td>
                                                <td className="px-8 py-4 text-sm font-semibold text-gray-900">{entry.weight} {mockWeightData.unit}</td>
                                                <td className="px-8 py-4 text-sm text-gray-900">{entry.bodyFat}%</td>
                                                <td className="px-8 py-4">
                                                    <span className={`flex items-center gap-2 text-sm font-semibold ${getTrendColor(entry.trend)}`}>
                                                        {getTrendIcon(entry.trend)} {entry.trend === 'down' ? 'Down' : 'Up'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-sm text-gray-600">{entry.notes}</td>
                                                <td className="px-8 py-4 text-sm">
                                                    <button className="text-pacewell-dark hover:text-pacewell-darker font-semibold">
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}