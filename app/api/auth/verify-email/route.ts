import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: 'Email and verification code are required' },
                { status: 400 }
            );
        }

        // verify the email using Supabase
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: 'email',
        });

        if (error) {
            return NextResponse.json(
                { error: 'Invalid or expired verification code' },
                { status: 400 }
            );
        }

        // update user's email_confirmed_at if not already done
        const { error: updateError } = await supabase
            .from('users')
            .update({ email_verified: true })
            .eq('auth_id', data.user?.id);

        if (updateError) {
            console.error('Error updating user verification status:', updateError);
        }

        return NextResponse.json(
            { message: 'Email verified successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Email verification error:', error);
        
        return NextResponse.json(
            { error: 'Email verification failed' },
            { status: 500 }
        );
    }
}