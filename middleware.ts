// Authentication middleware for API routes

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './lib/supabase';

// routes that don't require authentication
const publicRoutes = ['/api/auth/signup', '/api/auth/login'];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // allow public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // for protected routes, verify authentication
    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                {
                    success: false,
                    data: null,
                    error: 'Unauthorized - please log or register in first',
                },
                { status: 401 }
            );
        }

        // attach user to request headers for access in route handlers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', user.id);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                data: null,
                error: 'Authentication error',
            },
            { status: 401 }
        );
    }
}

// apply middleware to all /api/* routes except public ones
export const config = {
    matcher: '/api/:path*',
};