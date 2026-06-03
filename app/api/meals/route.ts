/**
 * API Route: /api/meals
 * Handles meal logging and retrieval
 * Location: app/api/meals/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtDecode } from 'jwt-decode';

interface MealData {
    meal_type: string
    food_description: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
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
        )

        // get today's date
        const today = new Date().toISOString().split('T')[0];

        // fetch today's meals
        const { data: meals, error: mealsError } = await supabaseAuth
            .from('macro_logs')
            .select('*')
            .eq('date', today)
            .order('created_at', { ascending: false });

        if (mealsError && mealsError.code !== 'PGRST116') {
            console.error('Error fetching meals:', mealsError);

            return NextResponse.json(
                { error: 'Failed to fetch meals' },
                { status: 500 }
            );
        }

        // fetch active personal goal to get targets
        const { data: goal, error: goalError } = await supabaseAuth
            .from('personal_goals')
            .select('*')
            .eq('status', 'active')
            .single();

        if (goalError && goalError.code !== 'PGRST116') {
            console.error('Error fetching goal:', goalError);
        }

        // calculate totals
        const mealsArray = meals || []
        const totalCalories = mealsArray.reduce((sum, meal) => sum + meal.calories, 0);
        const totalProtein = mealsArray.reduce((sum, meal) => sum + meal.protein_g, 0);
        const totalCarbs = mealsArray.reduce((sum, meal) => sum + meal.carbs_g, 0);
        const totalFats = mealsArray.reduce((sum, meal) => sum + meal.fat_g, 0);

        // get targets from personal goal or use defaults
        const targets = {
        calories: goal?.daily_calorie_target || 2400,
            protein_g: goal
                ? Math.round((goal.daily_calorie_target * (goal.protein_percentage / 100)) / 4)
                : 180,
            carbs_g: goal
                ? Math.round((goal.daily_calorie_target * (goal.carbs_percentage / 100)) / 4)
                : 250,
            fat_g: goal
                ? Math.round((goal.daily_calorie_target * (goal.fats_percentage / 100)) / 9)
                : 70,
        }

        return NextResponse.json(
            {
                today: {
                calories: totalCalories,
                protein_g: totalProtein,
                carbs_g: totalCarbs,
                fat_g: totalFats,
                },
                targets,
                meals: mealsArray,
                mealsLogged: mealsArray.length,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/meals error:', error);

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
        const { meal_type, food_description, calories, protein_g, carbs_g, fat_g } = body;

        // validate required fields
        if (!meal_type || !food_description || calories === undefined) {
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

        // get today's date
        const today = new Date().toISOString().split('T')[0];

        // insert meal
        const { data: newMeal, error: insertError } = await supabaseAuth
            .from('macro_logs')
            .insert([
                {
                    user_id: userId,
                    date: today,
                    meal_type,
                    food_description,
                    calories: parseInt(calories),
                    protein_g: parseFloat(protein_g) || 0,
                    carbs_g: parseFloat(carbs_g) || 0,
                    fat_g: parseFloat(fat_g) || 0,
                },
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting meal:', insertError);

            return NextResponse.json(
                { error: 'Failed to log meal' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                data: newMeal,
                message: 'Meal logged successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /api/meals error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}