"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import Link from 'next/link';

export default function LandingPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        
        // if user is logged in, redirect to dashboard
        if (!isLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pacewell-dark to-pacewell-darker flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pacewell-dark to-pacewell-darker flex items-center justify-center p-4">
            <div className="max-w-md text-center text-white">
                <h1 className="text-5xl font-bold mb-4">Pacewell Tracker</h1>

                <p className="text-lg text-gray-200 mb-8">
                    Track your calories dynamically based on your real-time weight. Achieve your fitness goals with personalized macro targets and progress insights.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="block w-full bg-white text-pacewell-dark font-semibold py-3 rounded-lg hover:bg-gray-100 transition"
                    >
                        Login
                    </Link>

                    <p className="text-gray-300">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-white font-semibold hover:underline">
                        Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}