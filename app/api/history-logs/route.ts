/**
 * API Route: /api/history-logs
 * Fetches meal logs, weight entries, and body fat logs for the authenticated user
 * Location: app/api/history-logs/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface MealLog {
    id: string
    type: 'Meal'
    date: string
    time?: string
    meal_type: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    food_description: string | null
    created_at: string
}

interface WeightLog {
    id: string
    type: 'Weight'
    date: string
    weight_kg: number
    measured_body_fat_pct: number | null
    calculated_body_fat_pct: number | null
    lean_fat_kg?: number
    notes: string | null
    created_at: string
}

interface BodyFatLog {
    id: string
    type: 'Body Fat'
    date: string
    measured_body_fat_pct: number
    notes: string | null
    created_at: string
}

type LogEntry = MealLog | WeightLog | BodyFatLog;

export async function GET(request: NextRequest) {
    try {

        // get the authorization header
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];

        // create authenticated Supabase client with user's token
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
        );

        // calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        // fetch meal logs
        const { data: mealLogs, error: mealError } = await supabaseAuth
            .from('macro_logs')
            .select('*')
            .gte('date', startDate)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (mealError && mealError.code !== 'PGRST116') {
            console.error('Error fetching meal logs:', mealError);

            return NextResponse.json(
                { error: 'Failed to fetch meal logs' },
                { status: 500 }
            );
        }

        // fetch weight entries
        const { data: weightEntries, error: weightError } = await supabaseAuth
            .from('weight_entries')
            .select('*')
            .gte('date', startDate)
            .order('date', { ascending: false });

        if (weightError && weightError.code !== 'PGRST116') {
            console.error('Error fetching weight entries:', weightError);

            return NextResponse.json(
                { error: 'Failed to fetch weight entries' },
                { status: 500 }
            );
        }

        // fetch body fat logs
        const { data: bodyFatLogs, error: bodyFatError } = await supabaseAuth
            .from('body_fat_logs')
            .select('*')
            .gte('date', startDate)
            .order('date', { ascending: false })

        if (bodyFatError && bodyFatError.code !== 'PGRST116') {
            console.error('Error fetching body fat logs:', bodyFatError);

            return NextResponse.json(
                { error: 'Failed to fetch body fat logs' },
                { status: 500 }
            );
        }

        // Combine and format all logs
        const allLogs: LogEntry[] = []

        // add meal logs
        if (mealLogs && Array.isArray(mealLogs)) {
            mealLogs.forEach((log) => {
                allLogs.push({
                    id: log.id,
                    type: 'Meal',
                    date: log.date,
                    meal_type: log.meal_type,
                    calories: log.calories,
                    protein_g: log.protein_g,
                    carbs_g: log.carbs_g,
                    fat_g: log.fat_g,
                    food_description: log.food_description,
                    created_at: log.created_at,
                });
            });
        }

        // add weight entries
        if (weightEntries && Array.isArray(weightEntries)) {
            weightEntries.forEach((log) => {
                const bodyFatPct = log.measured_body_fat_pct || log.calculated_body_fat_pct || 0;
                const leanFatKg = bodyFatPct > 0 ? log.weight_kg * (1 - bodyFatPct / 100) : 0;

                allLogs.push({
                    id: log.id,
                    type: 'Weight',
                    date: log.date,
                    weight_kg: log.weight_kg,
                    measured_body_fat_pct: log.measured_body_fat_pct,
                    calculated_body_fat_pct: log.calculated_body_fat_pct,
                    lean_fat_kg: Math.round(leanFatKg * 100) / 100,
                    notes: log.notes,
                    created_at: log.created_at,
                });
            });
        }

        // add body fat logs
        if (bodyFatLogs && Array.isArray(bodyFatLogs)) {
            bodyFatLogs.forEach((log) => {
                allLogs.push({
                    id: log.id,
                    type: 'Body Fat',
                    date: log.date,
                    measured_body_fat_pct: log.measured_body_fat_pct,
                    notes: log.notes,
                    created_at: log.created_at,
                });
            });
        }

        // sort all logs by date (newest first)
        allLogs.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();

            return dateB - dateA;
        });

        return NextResponse.json(
            { data: allLogs },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/history-logs error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}