/**
 * API Route: /api/meals/favorites
 * Manages user's favorite foods
 * Location: app/api/meals/favorites/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
    sub: string
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwtDecode<JWTPayload>(token);
        const userId = decoded.sub;

        // create authenticated Supabase client
        const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                },
            }
        )

        // fetch user's favorites
        const { data: favorites, error } = await supabaseAuth
            .from('food_favorites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching favorites:', error);

            return NextResponse.json(
                { error: 'Failed to fetch favorites' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { data: favorites || [] },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/meals/favorites error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwtDecode<JWTPayload>(token);
        const userId = decoded.sub;

        const body = await request.json();
        const { name, calories, protein_g, carbs_g, fat_g } = body;

        if (!name || calories === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // create authenticated Supabase client
        const supabaseAuth = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                },
            }
        )

        // insert favorite
        const { data: newFavorite, error } = await supabaseAuth
            .from('food_favorites')
            .insert([
                {
                user_id: userId,
                name,
                calories: parseInt(calories),
                protein_g: parseFloat(protein_g) || 0,
                carbs_g: parseFloat(carbs_g) || 0,
                fat_g: parseFloat(fat_g) || 0,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating favorite:', error);

            return NextResponse.json(
                { error: 'Failed to create favorite' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { data: newFavorite },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /api/meals/favorites error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}