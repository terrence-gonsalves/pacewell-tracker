"use client";

import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <div>
                {/* Dashboard content goes here */}
            </div>
        </ProtectedRoute>
    );
}