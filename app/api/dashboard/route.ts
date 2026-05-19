import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createResponse } from '@/lib/utils';
import { calculateBMR, calculateTDEE, calculateDailyCalorieTarget, calculateProteinTarget, calculateMacroTargets } from '@/lib/calculations';

export async function GET(request: NextRequest) {
    try {

        // get user ID from middleware header
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                createResponse(false, null, 'Unauthorized'),
                { status: 401 }
            );
        }

        // fetch user profile
        const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !userProfile) {
            return NextResponse.json(
                createResponse(false, null, 'User profile not found'),
                { status: 404 }
            );
        }

        // get today's date
        const today = new Date().toISOString().split('T')[0];

        // fetch today's weight entries
        const { data: weightEntries } = await supabase
            .from('weight_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .order('created_at', { ascending: false });

        // fetch today's macro logs
        const { data: macroLogs } = await supabase
            .from('macro_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today);

        // fetch today's body fat logs
        const { data: bodyFatLogs } = await supabase
            .from('body_fat_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .order('created_at', { ascending: false });

        // calculate macro totals for today
        const macrosConsumed = {
            calories: macroLogs?.reduce((sum, log) => sum + log.calories, 0) || 0,
            protein_g: macroLogs?.reduce((sum, log) => sum + (log.protein_g || 0), 0) || 0,
            fat_g: macroLogs?.reduce((sum, log) => sum + (log.fat_g || 0), 0) || 0,
            carbs_g: macroLogs?.reduce((sum, log) => sum + (log.carbs_g || 0), 0) || 0,
        };

        // calculate daily targets
        const bmr = calculateBMR(
            userProfile.weight_kg,
            userProfile.height_cm,
            userProfile.age,
            userProfile.sex as 'M' | 'F'
        );

        const tdee = calculateTDEE(bmr, userProfile.activity_multiplier as any);

        const dailyCalorieTarget = calculateDailyCalorieTarget(
            tdee,
            userProfile.current_goal,
            userProfile.current_intensity
        );

        const proteinTarget = calculateProteinTarget(userProfile.weight_kg, userProfile.current_goal);

        const macroTargets = calculateMacroTargets(dailyCalorieTarget, proteinTarget);

        // calculate remaining calories
        const remainingCalories = dailyCalorieTarget - macrosConsumed.calories;

        // get current weight (latest entry today, or last recorded weight)
        const currentWeight = weightEntries?.[0]?.weight_kg || userProfile.weight_kg;

        // get current body fat (latest entry today, or measured value from profile)
        const currentBodyFat = bodyFatLogs?.[0]?.measured_body_fat_pct || userProfile.measured_body_fat_pct;

        // calculate estimated goal date
        let estimatedGoalDate = null;
        if (userProfile.target_body_fat_pct && currentBodyFat) {
            const bodyFatToLose = currentBodyFat - userProfile.target_body_fat_pct;
            if (bodyFatToLose > 0) {

                // estimate ~0.5-1% body fat loss per week (conservative estimate)
                const weeksNeeded = bodyFatToLose / 0.75;
                const daysNeeded = Math.ceil(weeksNeeded * 7);
                estimatedGoalDate = new Date();
                estimatedGoalDate.setDate(estimatedGoalDate.getDate() + daysNeeded);
            }
        }

        // build response
        return NextResponse.json(
            createResponse(true, {
                user: {
                    id: userProfile.id,
                    email: userProfile.email || 'N/A',
                },
                profile: {
                    weight_kg: userProfile.weight_kg,
                    height_cm: userProfile.height_cm,
                    age: userProfile.age,
                    sex: userProfile.sex,
                    activity_multiplier: userProfile.activity_multiplier,
                    preferred_unit: userProfile.preferred_unit,
                },
                targets: {
                    daily_calories: Math.round(dailyCalorieTarget),
                    protein_g: Math.round(proteinTarget),
                    carbs_g: Math.round(macroTargets.carbs_g),
                    fat_g: Math.round(macroTargets.fat_g),
                },
                today: {
                    macros_consumed: {
                        calories: Math.round(macrosConsumed.calories),
                        protein_g: Math.round(macrosConsumed.protein_g),
                        carbs_g: Math.round(macrosConsumed.carbs_g),
                        fat_g: Math.round(macrosConsumed.fat_g),
                    },
                    meals_logged: (macroLogs?.length) || 0,
                    weight_logged: (weightEntries?.length || 0) > 0,
                    body_fat_logged: (bodyFatLogs?.length || 0) > 0,
                },
                stats: {
                    current_weight: currentWeight,
                    current_body_fat_pct: currentBodyFat,
                    target_body_fat_pct: userProfile.target_body_fat_pct,
                    remaining_calories: Math.round(remainingCalories),
                    estimated_goal_date: estimatedGoalDate?.toISOString().split('T')[0] || null,
                    progress_to_goal: userProfile.target_body_fat_pct && currentBodyFat
                        ? Math.round(((currentBodyFat - userProfile.target_body_fat_pct) / (userProfile.measured_body_fat_pct - userProfile.target_body_fat_pct)) * 100)
                        : null,
                },
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}