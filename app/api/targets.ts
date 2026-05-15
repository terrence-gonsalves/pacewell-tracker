// Get user's current targets endpoint

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateAllTargets } from '@/lib/calculations';
import {
    createResponse,
    getCurrentUser,
    getUserProfile,
} from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const userProfile = await getUserProfile(user.id);

        // get latest weight for current calculations
        const { data: latestWeight } = await supabase
            .from('weight_entries')
            .select('weight_kg')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        const currentWeight = latestWeight?.weight_kg || userProfile.weight_kg;

        // calculate all targets
        const targets = calculateAllTargets(
            currentWeight,
            userProfile.height_cm,
            userProfile.age,
            userProfile.sex,
            userProfile.activity_multiplier,
            userProfile.current_goal,
            userProfile.current_intensity,
            userProfile.use_custom_macro_ratios,
            userProfile.custom_fat_ratio,
            userProfile.custom_carb_ratio
        );

        return NextResponse.json(
            createResponse(true, {
                user: {
                    id: userProfile.id,
                    weight_kg: currentWeight,
                    original_weight_kg: userProfile.original_weight_kg,
                    height_cm: userProfile.height_cm,
                    age: userProfile.age,
                    sex: userProfile.sex,
                    activity_multiplier: userProfile.activity_multiplier,
                    current_goal: userProfile.current_goal,
                    current_intensity: userProfile.current_intensity,
                },
                targets: {
                    calorie_target: targets.calorie_target,
                    protein_target: targets.protein_target,
                    fat_target: targets.fat_target,
                    carbs_target: targets.carbs_target,
                    bmr: targets.bmr,
                    tdee: targets.tdee,
                },
                projection: {
                    weekly_projection: targets.weekly_projection,
                    weekly_kg: targets.weekly_kg,
                    weekly_pct: targets.weekly_pct,
                },
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Get targets error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const userProfile = await getUserProfile(user.id);

        const body = await request.json();
        const {
            current_goal,
            current_intensity,
            use_custom_macro_ratios,
            custom_fat_ratio,
            custom_carb_ratio,
        } = body;

        // validate goal
        if (current_goal && !['Fat Loss', 'Muscle Gain'].includes(current_goal)) {
            return NextResponse.json(
                createResponse(false, null, 'Invalid goal'),
                { status: 400 }
            );
        }

        // validate intensity
        const validIntensities = ['Slow', 'Moderate', 'Aggressive', 'Extreme', 'Insane'];

        if (current_intensity && !validIntensities.includes(current_intensity)) {
            return NextResponse.json(
                createResponse(false, null, 'Invalid intensity'),
                { status: 400 }
            );
        }

        // validate custom ratios if provided
        if (use_custom_macro_ratios) {
            if (
                custom_fat_ratio === undefined ||
                custom_carb_ratio === undefined ||
                custom_fat_ratio < 0 ||
                custom_fat_ratio > 1 ||
                custom_carb_ratio < 0 ||
                custom_carb_ratio > 1
            ) {
                return NextResponse.json(
                    createResponse(false, null, 'Invalid macro ratios'),
                    { status: 400 }
                );
            }
        }

        // update user preferences
        const { data: updatedProfile, error: updateError } = await supabase
            .from('users')
            .update({
                current_goal: current_goal || userProfile.current_goal,
                current_intensity: current_intensity || userProfile.current_intensity,
                use_custom_macro_ratios:
                use_custom_macro_ratios !== undefined
                    ? use_custom_macro_ratios
                    : userProfile.use_custom_macro_ratios,
                custom_fat_ratio: custom_fat_ratio || userProfile.custom_fat_ratio,
                custom_carb_ratio: custom_carb_ratio || userProfile.custom_carb_ratio,
            })
            .eq('id', user.id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json(
                createResponse(false, null, 'Failed to update targets'),
                { status: 400 }
            );
        }

        // get latest weight
        const { data: latestWeight } = await supabase
            .from('weight_entries')
            .select('weight_kg')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        const currentWeight = latestWeight?.weight_kg || userProfile.weight_kg;

        // calculate new targets
        const targets = calculateAllTargets(
            currentWeight,
            updatedProfile.height_cm,
            updatedProfile.age,
            updatedProfile.sex,
            updatedProfile.activity_multiplier,
            updatedProfile.current_goal,
            updatedProfile.current_intensity,
            updatedProfile.use_custom_macro_ratios,
            updatedProfile.custom_fat_ratio,
            updatedProfile.custom_carb_ratio
        );

        return NextResponse.json(
            createResponse(true, {
                targets: {
                    calorie_target: targets.calorie_target,
                    protein_target: targets.protein_target,
                    fat_target: targets.fat_target,
                    carbs_target: targets.carbs_target,
                },
                projection: {
                    weekly_projection: targets.weekly_projection,
                    weekly_kg: targets.weekly_kg,
                    weekly_pct: targets.weekly_pct,
                },
                message: `Targets updated. New goal: ${updatedProfile.current_goal} (${updatedProfile.current_intensity})`,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Update targets error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}