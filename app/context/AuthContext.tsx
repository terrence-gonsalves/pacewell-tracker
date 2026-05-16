// Authentication state management with localStorage persistence

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, biometrics: any) => Promise<void>
    logout: () => void
    setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // initialize from localStorage on mount
    useEffect(() => {
        const storedAuth = localStorage.getItem('pacewell_auth');
        const storedUser = localStorage.getItem('pacewell_user');

        if (storedAuth && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('pacewell_auth');
                localStorage.removeItem('pacewell_user');
            }
        }

        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();

                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();

            if (data.success) {

                // store auth token and user data
                localStorage.setItem('pacewell_auth', data.data.session.access_token);
                localStorage.setItem('pacewell_user', JSON.stringify(data.data.user));

                setUser(data.data.user);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } finally {
            setIsLoading(false);
        }
    }

    const signup = async (email: string, password: string, biometrics: any) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, ...biometrics }),
            })

            if (!response.ok) {
                const error = await response.json();

                throw new Error(error.error || 'Signup failed');
            }

            const data = await response.json();

            if (data.success) {

                // after signup, user needs to verify email
                // store email for verification page
                localStorage.setItem('pacewell_pending_email', email);
            } else {
                throw new Error(data.error || 'Signup failed');
            }
        } finally {
            setIsLoading(false);
        }
    }

    const logout = () => {
        localStorage.removeItem('pacewell_auth');
        localStorage.removeItem('pacewell_user');

        setUser(null);
    }

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        setUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}
