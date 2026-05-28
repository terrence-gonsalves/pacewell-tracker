import { NextRequest, NextResponse } from 'next/server';

// routes that don't require authentication
const publicRoutes = ['/api/auth/signup', '/api/auth/login', '/api/personal-goals', '/api/history-logs'];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // allow public routes
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // for protected routes, check for authorization header
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                {
                    success: false,
                    data: null,
                    error: 'Unauthorized - please log or register in first',
                },
                { status: 401 }
            );
        }

        // token is present - let the route handler verify it
        return NextResponse.next();
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