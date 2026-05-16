// Wrap app with AuthProvider for authentication state

import type { Metadata } from 'next';
import "./globals.css";
import { AuthProvider } from './context/AuthContext';

export const metadata: Metadata = {
    title: "Pacewell Tracker",
    description: "Dynamic calorie tracking with real-time weight-based calculations",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-gray-50">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}