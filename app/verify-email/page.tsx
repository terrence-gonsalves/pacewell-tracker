"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const router = useRouter();
    const { verifyEmail, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!code.trim()) {
            setError('Verification code is required');
            return;
        }

        try {
            await verifyEmail(email, code);
            setSuccess('Email verified successfully! Redirecting to login...');

            // redirect to login after a brief delay
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pacewell-dark to-pacewell-darker flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-pacewell-dark mb-2">Verify Email</h1>
                    <p className="text-gray-600">Enter the code sent to your email</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Verification Code
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            placeholder="e.g., ABC123"
                            maxLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pacewell-dark focus:border-transparent text-center tracking-widest"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Check your email for the 6-character code
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-pacewell-dark hover:bg-pacewell-darker text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t pt-6">
                    <p className="text-gray-600 text-sm mb-3">
                        Didn't receive a code?
                    </p>
                    <button
                        type="button"
                        className="text-pacewell-dark hover:text-pacewell-darker font-semibold text-sm"
                    >
                        Resend Code
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-gray-600 text-sm">
                        Already verified?{' '}
                        <Link href="/login" className="text-pacewell-dark hover:text-pacewell-darker font-semibold">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}