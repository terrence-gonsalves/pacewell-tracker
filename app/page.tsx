"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {

        // if user is logged in, redirect to dashboard
        if (!isLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    // show landing page only if not logged in
    if (isLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pacewell-dark mx-auto"></div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold">Pacewell Tracker</h1>
            <p className="mt-4 text-lg text-gray-600">
                Dynamic calorie tracking coming soon...
            </p>
        </main>
    );
}