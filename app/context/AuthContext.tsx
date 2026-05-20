'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    unit_preference: 'metric' | 'imperial';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signup: (email: string, password: string, biometrics: any) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // initialize user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('pacewell_user');

        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('pacewell_user');
            }
        }
    }, []);

    const signup = async (email: string, password: string, biometrics: any) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, ...biometrics }),
            });

            if (!response.ok) {
                const data = await response.json();
                console.log('Signup error details:', data);

                throw new Error(data.error || 'Signup failed');
            }

            // user is redirected to verify email page, so no need to set user here
        } finally {
            setIsLoading(false);
        }
    };

    const verifyEmail = async (email: string, code: string) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Verification failed');
            }

            // verification successful - user can now login
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }

            const data = await response.json();

            // store user data and token
            localStorage.setItem('pacewell_token', data.body.data.session.access_token);
            localStorage.setItem('pacewell_user', JSON.stringify(data.body.data.user));

            setUser(data.body.data.user);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('pacewell_token');
        localStorage.removeItem('pacewell_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signup, login, verifyEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    
    return context;
}