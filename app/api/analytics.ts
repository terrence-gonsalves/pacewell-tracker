// Get analytics and weekly summaries endpoint

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
    createResponse,
    getCurrentUser,
    getUserProfile,
    getWeeklySummary,
    calculateAdherence,
    formatDate,
    roundToDecimal,
} from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const userProfile = await getUserProfile(user.id);

        // get weekly summary
        const weeklySummary = await getWeeklySummary(user.id);

        // get last 30 weight entries for trend
        const { data: weightTrend } = await supabase
            .from('weight_entries')
            .select('date, weight_kg, measured_body_fat_pct, calculated_body_fat_pct')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
            .limit(30);

        // get all-time stats
        const { data: allWeights } = await supabase
            .from('weight_entries')
            .select('weight_kg')
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        // calculate weight stats
        const weightStats = allWeights && allWeights.length > 0 ? {
            starting_weight: allWeights[0].weight_kg,
            current_weight: allWeights[allWeights.length - 1].weight_kg,
            total_change: roundToDecimal(
                allWeights[allWeights.length - 1].weight_kg - allWeights[0].weight_kg,
                2
            ),
            min_weight: Math.min(...allWeights.map((w) => w.weight_kg)),
            max_weight: Math.max(...allWeights.map((w) => w.weight_kg)),
        } : null;

        // calculate macro adherence for the week
        const adherence = {
            calories: calculateAdherence(
                weeklySummary.avg_calories,
                userProfile.calorie_target || 2000
            ),
            protein: calculateAdherence(
                weeklySummary.avg_protein_g,
                userProfile.protein_target || 160
            ),
            fat: calculateAdherence(
                weeklySummary.avg_fat_g,
                userProfile.fat_target || 70
            ),
            carbs: calculateAdherence(
                weeklySummary.avg_carbs_g,
                userProfile.carbs_target || 200
            ),
        };

        // get latest weight entry for body fat info
        const { data: latestWeight } = await supabase
            .from('weight_entries')
            .select('measured_body_fat_pct, calculated_body_fat_pct')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        return NextResponse.json(
            createResponse(true, {
                weekly_summary: {
                    avg_calories: weeklySummary.avg_calories,
                    avg_protein_g: weeklySummary.avg_protein_g,
                    avg_fat_g: weeklySummary.avg_fat_g,
                    avg_carbs_g: weeklySummary.avg_carbs_g,
                    avg_weight_kg: weeklySummary.avg_weight_kg,
                    days_logged: weeklySummary.days_logged,
                },
                targets: {
                    calorie_target: userProfile.calorie_target,
                    protein_target: userProfile.protein_target,
                    fat_target: userProfile.fat_target,
                    carbs_target: userProfile.carbs_target,
                },
                adherence,
                weight_stats: weightStats,
                body_fat: {
                    measured: latestWeight?.measured_body_fat_pct || null,
                    estimated: latestWeight?.calculated_body_fat_pct || null,
                },
                weight_trend: weightTrend || [],
                current_goal: userProfile.current_goal,
                current_intensity: userProfile.current_intensity,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Get analytics error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const userProfile = await getUserProfile(user.id);

        const body = await request.json();
        const { start_date, end_date } = body;

        if (!start_date || !end_date) {
            return NextResponse.json(
                createResponse(false, null, 'Start and end dates are required'),
                { status: 400 }
            );
        }

        // get macro logs in date range
        const { data: macros } = await supabase
            .from('macro_logs')
            .select('date, calories, protein_g, fat_g, carbs_g')
            .eq('user_id', user.id)
            .gte('date', start_date)
            .lte('date', end_date);

        // get weight entries in date range
        const { data: weights } = await supabase
            .from('weight_entries')
            .select('date, weight_kg, measured_body_fat_pct, calculated_body_fat_pct')
            .eq('user_id', user.id)
            .gte('date', start_date)
            .lte('date', end_date);

        // calculate totals and averages
        const totalCalories = macros?.reduce((sum, m) => sum + m.calories, 0) || 0;
        const totalProtein = macros?.reduce((sum, m) => sum + m.protein_g, 0) || 0;
        const totalFat = macros?.reduce((sum, m) => sum + m.fat_g, 0) || 0;
        const totalCarbs = macros?.reduce((sum, m) => sum + m.carbs_g, 0) || 0;

        const avgCalories = macros && macros.length > 0
            ? roundToDecimal(totalCalories / macros.length, 0)
            : 0;
        const avgProtein = macros && macros.length > 0
            ? roundToDecimal(totalProtein / macros.length, 1)
            : 0;
        const avgFat = macros && macros.length > 0
            ? roundToDecimal(totalFat / macros.length, 1)
            : 0;
        const avgCarbs = macros && macros.length > 0
            ? roundToDecimal(totalCarbs / macros.length, 1)
            : 0;

        const avgWeight = weights && weights.length > 0
            ? roundToDecimal(weights.reduce((sum, w) => sum + w.weight_kg, 0) / weights.length, 2)
            : 0;

        const weightChange = weights && weights.length > 1
            ? roundToDecimal(
                weights[weights.length - 1].weight_kg - weights[0].weight_kg,
                2
            )
            : 0;

        return NextResponse.json(
            createResponse(true, {
                period: {
                    start_date,
                    end_date,
                    days_in_range: Math.ceil(
                        (new Date(end_date).getTime() - new Date(start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ),
                },
                macro_data: {
                    total_calories: totalCalories,
                    total_protein_g: roundToDecimal(totalProtein, 1),
                    total_fat_g: roundToDecimal(totalFat, 1),
                    total_carbs_g: roundToDecimal(totalCarbs, 1),
                    avg_calories: avgCalories,
                    avg_protein_g: avgProtein,
                    avg_fat_g: avgFat,
                    avg_carbs_g: avgCarbs,
                    days_with_logs: macros?.length || 0,
                },
                weight_data: {
                    avg_weight_kg: avgWeight,
                    weight_change_kg: weightChange,
                    weight_entries: weights?.length || 0,
                },
                adherence: {
                    calories: calculateAdherence(
                        avgCalories,
                        userProfile.calorie_target || 2000
                    ),
                    protein: calculateAdherence(
                        avgProtein,
                        userProfile.protein_target || 160
                    ),
                    fat: calculateAdherence(
                        avgFat,
                        userProfile.fat_target || 70
                    ),
                    carbs: calculateAdherence(
                        avgCarbs,
                        userProfile.carbs_target || 200
                    ),
                },
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Detailed analytics error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}