import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createResponse } from '@/lib/utils';
import { getUserProfile } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // validate required fields
        if (!email || !password) {
            return NextResponse.json(
                createResponse(false, null, 'Email and password are required'),
                { status: 400 }
            );
        }

        // sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            return NextResponse.json(
                createResponse(false, null, authError?.message || 'Invalid email or password'),
                { status: 401 }
            );
        }

        // get user profile from database
        let userProfile = null;

        try {
            userProfile = await getUserProfile(authData.user.id);
        } catch (error) {
            console.error('Error fetching user profile:', error);

            // user exists in auth but not in database - this shouldn't happen
            return NextResponse.json(
                createResponse(false, null, 'User profile not found'),
                { status: 400 }
            );
        }

        // return success with session and user data
        return NextResponse.json(
            createResponse(true, {
                session: {
                    access_token: authData.session?.access_token,
                    user_id: authData.user.id,
                },
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    ...userProfile,
                },
                message: 'Login successful',
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}