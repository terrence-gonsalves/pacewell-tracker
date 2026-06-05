/**
 * API Route: /api/weight-entries
 * Handles weight tracking and retrieval
 * Location: app/api/weight-entries/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { lbsToKg, bodyFatPercentageToDecimal } from '../../utils/unit-utils';

interface WeightEntry {
    id: string
    date: string
    weight_kg: number
    measured_body_fat_pct: number | null
    calculated_body_fat_pct: number | null
    notes: string | null
    created_at: string
    updated_at: string
}

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
        );

        // fetch last 30 days of weight entries
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const { data: entries, error: entriesError } = await supabaseAuth
            .from('weight_entries')
            .select('*')
            .gte('date', thirtyDaysAgoStr)
            .order('date', { ascending: false });

        if (entriesError && entriesError.code !== 'PGRST116') {
            console.error('Error fetching weight entries:', entriesError);

            return NextResponse.json(
                { error: 'Failed to fetch weight entries' },
                { status: 500 }
            );
        }

        const entriesArray = (entries as WeightEntry[]) || [];

        // fetch user data for current weight and preferred unit
        const { data: userData, error: userError } = await supabaseAuth
            .from('users')
            .select('weight_kg, preferred_unit, target_body_fat_pct')
            .single();

        if (userError && userError.code !== 'PGRST116') {
            console.error('Error fetching user data:', userError);  

            return NextResponse.json(
                { error: 'Failed to fetch user data' },
                { status: 500 }
            );
        }

        const preferredUnit = userData?.preferred_unit || 'metric';
        const currentWeight = userData?.weight_kg || 0;

        // fetch active personal goal
        const { data: goal, error: goalError } = await supabaseAuth
            .from('personal_goals')
            .select('target_weight, target_body_fat_percentage')
            .eq('status', 'active')
            .single();

        if (goalError && goalError.code !== 'PGRST116') {
            console.error('Error fetching goal:', goalError);
        }

        // calculate metrics
        const metrics = calculateMetrics(entriesArray, goal, currentWeight, preferredUnit);

        return NextResponse.json(
            {
                data: entriesArray,
                currentWeight,
                preferredUnit,
                metrics,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/weight-entries error:', error);

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
        const { weight, unit, date, bodyFat, notes } = body;

        // validate required fields
        if (!weight || !unit || !date) {
            return NextResponse.json(
                { error: 'Missing required fields: weight, unit, date' },
                { status: 400 }
            );
        }

        // convert weight to kg if needed
        const weightKg = unit === 'imperial' ? lbsToKg(parseFloat(weight)) : parseFloat(weight);

        // convert body fat from percentage to decimal if provided
        const bodyFatDecimal = bodyFat ? bodyFatPercentageToDecimal(parseFloat(bodyFat)) : null;

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
        );

        // check if entry for this date already exists
        const { data: existing } = await supabaseAuth
            .from('weight_entries')
            .select('id')
            .eq('date', date)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Weight entry already exists for this date' },
                { status: 409 }
            );
        }

        // insert weight entry
        const { data: newEntry, error: insertError } = await supabaseAuth
            .from('weight_entries')
            .insert([
                {
                user_id: userId,
                date,
                weight_kg: weightKg,
                measured_body_fat_pct: bodyFatDecimal,
                notes: notes || null,
                },
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting weight entry:', insertError);

            return NextResponse.json(
                { error: 'Failed to log weight entry' },
                { status: 500 }
            );
        }

        // update user's current weight
        await supabaseAuth
            .from('users')
            .update({ weight_kg: weightKg })
            .eq('id', userId);

        return NextResponse.json(
            {
                data: newEntry,
                message: 'Weight entry logged successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /api/weight-entries error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function calculateMetrics(
    entries: WeightEntry[],
    goal: any,
    currentWeight: number,
    preferredUnit: string
) {
    if (entries.length === 0) {
        return {
            goalProgress: 0,
            thirtyDayChange: 0,
            avgWeeklyChange: 0,
            weightToGoal: goal?.target_weight ? goal.target_weight : 0,
            projectedGoalDate: null,
            entriesThisMonth: 0,
        };
    }

    const goalWeight = goal?.target_weight || 0;
    const latestEntry = entries[0];
    const oldestEntry = entries[entries.length - 1];

    // calculate goal progress
    const originalWeight = currentWeight + Math.abs(latestEntry.weight_kg - currentWeight);
    const weightLost = originalWeight - latestEntry.weight_kg;
    const totalToLose = originalWeight - goalWeight;
    const goalProgress = totalToLose > 0 ? Math.round((weightLost / totalToLose) * 100) : 0;

    // calculate 30-day change
    const thirtyDayChange = oldestEntry.weight_kg - latestEntry.weight_kg;

    // calculate average weekly change
    const daysSpan = Math.max(1, entries.length - 1);
    const avgWeeklyChange = (thirtyDayChange / daysSpan) * 7;

    // calculate weight to goal
    const weightToGoal = latestEntry.weight_kg - goalWeight;

    // calculate projected goal date
    let projectedGoalDate: string | null = null;

    if (avgWeeklyChange < -0.1) {
        const weeksToGoal = Math.abs(weightToGoal / avgWeeklyChange);
        const goalDate = new Date();

        goalDate.setDate(goalDate.getDate() + weeksToGoal * 7);

        projectedGoalDate = goalDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    return {
        goalProgress: Math.max(0, Math.min(100, goalProgress)),
        thirtyDayChange,
        avgWeeklyChange,
        weightToGoal,
        projectedGoalDate,
        entriesThisMonth: entries.length,
    };
}