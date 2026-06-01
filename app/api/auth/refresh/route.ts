/**
 * API Route: /api/auth/refresh
 * Refreshes an expired access token using the refresh token
 * Location: app/api/auth/refresh/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return NextResponse.json(
                { error: 'Refresh token required' },
                { status: 400 }
            );
        }

        // create Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // refresh the session using the refresh token
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refresh_token,
        });

        if (error) {
            console.error('Token refresh error:', error);

            return NextResponse.json(
                { error: 'Failed to refresh token' },
                { status: 401 }
            );
        }

        if (!data.session) {
            return NextResponse.json(
                { error: 'No session returned from refresh' },
                { status: 401 }
            );
        }

        // return new access token and refresh token
        return NextResponse.json(
            {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                token: data.session.access_token, // Also include 'token' for compatibility
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Token refresh error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}