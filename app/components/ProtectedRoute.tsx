"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {

        // redirect to login if not logged in or no user exist
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pacewell-dark to-pacewell-darker flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // user is authenticated, show the protected content
    if (user) {
        return <>{children}</>;
    }

    // if not authenticated and not loading, the useEffect will redirect
    return null;
}