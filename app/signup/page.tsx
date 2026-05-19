"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const { signup, isLoading } = useAuth();

    const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>('metric');
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // step 1: Email/Password, step 2: Biometrics, step 3: Optional

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        weight: '',
        height_metric: '',
        height_feet: '',
        height_inches: '',
        age: '',
        sex: 'M',
        activity_multiplier: 'Moderately Active',
        measured_body_fat_pct: '',
        target_body_fat_pct: '',
        current_goal: 'Fat Loss',
        current_intensity: 'Moderate',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const validateStep1 = () => {
        if (!formData.email) {
            setError('Email is required');

            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email');

            return false;
        }

        if (!formData.password) {
            setError('Password is required');

            return false;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');

            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');

            return false;
        }

        return true;
    }

    const validateStep2 = () => {
        if (!formData.weight) {
            setError('Weight is required');

            return false;
        }
        if (unitPreference === 'metric' && !formData.height_metric) {
            setError('Height is required');

            return false;
        }
        if (unitPreference === 'imperial' && (!formData.height_feet || !formData.height_inches)) {
            setError('Height is required');

            return false;
        }
        if (!formData.age) {
            setError('Age is required');

            return false;
        }

        return true;
    }

    const handleStep1 = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleStep2 = () => {
        if (validateStep2()) {
            setStep(3);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setError('');

        try {
            const biometrics = {
                weight: parseFloat(formData.weight),
                height_value1: unitPreference === 'metric'
                    ? parseFloat(formData.height_metric)
                    : parseFloat(formData.height_feet),
                height_value2: unitPreference === 'imperial'
                    ? parseFloat(formData.height_inches)
                    : undefined,
                age: parseInt(formData.age),
                sex: formData.sex,
                activity_multiplier: formData.activity_multiplier,
                preferred_unit: unitPreference,
                measured_body_fat_pct: formData.measured_body_fat_pct
                    ? parseFloat(formData.measured_body_fat_pct)
                    : undefined,
                target_body_fat_pct: formData.target_body_fat_pct
                    ? parseFloat(formData.target_body_fat_pct)
                    : undefined,
                current_goal: formData.current_goal,
                current_intensity: formData.current_intensity,
            };

            await signup(formData.email, formData.password, biometrics);

            // redirect to email verification
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pacewell-dark to-pacewell-darker flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-pacewell-dark mb-2">Pacewell Tracker</h1>
                    <p className="text-gray-600">Create your account and start tracking</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="At least 8 characters"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Confirm your password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleStep1}
                            disabled={isLoading}
                            className="w-full bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                        >
                            Next: Biometrics
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="space-y-4">
                        <div className="flex gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => setUnitPreference('metric')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                                    unitPreference === 'metric'
                                        ? 'bg-pacewell-dark text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Metric (kg/cm)
                            </button>
                            <button
                                type="button"
                                onClick={() => setUnitPreference('imperial')}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                                    unitPreference === 'imperial'
                                        ? 'bg-pacewell-dark text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Imperial (lbs/ft-in)
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Weight ({unitPreference === 'metric' ? 'kg' : 'lbs'})
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                name="weight"
                                value={formData.weight}
                                onChange={handleInputChange}
                                placeholder="e.g., 90"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            />
                        </div>

                        {unitPreference === 'metric' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    name="height_metric"
                                    value={formData.height_metric}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 191"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Height (feet)
                                    </label>
                                    <input
                                        type="number"
                                        name="height_feet"
                                        value={formData.height_feet}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 6"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Inches
                                    </label>
                                    <input
                                        type="number"
                                        name="height_inches"
                                        value={formData.height_inches}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Age
                            </label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                placeholder="e.g., 53"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sex
                            </label>
                            <select
                                name="sex"
                                value={formData.sex}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            >
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Activity Level
                            </label>
                            <select
                                name="activity_multiplier"
                                value={formData.activity_multiplier}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            >
                                <option value="Sedentary">Sedentary</option>
                                <option value="Lightly Active">Lightly Active</option>
                                <option value="Moderately Active">Moderately Active</option>
                                <option value="Very Active">Very Active</option>
                                <option value="Extremely Active">Extremely Active</option>
                            </select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 text-pacewell-dark hover:text-pacewell-darker font-semibold py-2 border border-pacewell-dark rounded-lg transition"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleStep2}
                                disabled={isLoading}
                                className="flex-1 bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                            >
                                Next: Goals (Optional)
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Optional: Set your body composition and intensity goals
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Body Fat (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="measured_body_fat_pct"
                                    value={formData.measured_body_fat_pct}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 25"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Body Fat (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="target_body_fat_pct"
                                    value={formData.target_body_fat_pct}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 15"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Goal
                            </label>
                            <select
                                name="current_goal"
                                value={formData.current_goal}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            >
                                <option value="Fat Loss">Fat Loss</option>
                                <option value="Muscle Gain">Muscle Gain</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Intensity Level
                            </label>
                            <select
                                name="current_intensity"
                                value={formData.current_intensity}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                            >
                                <option value="Slow">Slow</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Aggressive">Aggressive</option>
                                <option value="Extreme">Extreme</option>
                                <option value="Insane">Insane</option>
                            </select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 text-pacewell-dark hover:text-pacewell-darker font-semibold py-2 border border-pacewell-dark rounded-lg transition"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                            >
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="text-pacewell-dark hover:text-pacewell-darker font-semibold">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}