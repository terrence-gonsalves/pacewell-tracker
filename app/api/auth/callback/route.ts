import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');

    // handle errors from Supabase
    if (error) {
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    // exchange the code for a session
    if (code) {
        try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
                return NextResponse.redirect(
                    new URL('/login?error=Invalid verification code', request.url)
                );
            }

            if (data.user) {

                // email verified and user has a session redirect to dashboard
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        } catch (error) {
            console.error('Callback error:', error);
            return NextResponse.redirect(
                new URL('/login?error=Authentication failed', request.url)
            );
        }
    }

    // no code provided
    return NextResponse.redirect(new URL('/login', request.url));
}