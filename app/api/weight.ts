// Log weight entry endpoint

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
    calculateAllTargets,
    calculateEstimatedBodyFat,
} from '@/lib/calculations';
import {
    createResponse,
    getCurrentUser,
    getUserProfile,
    validateWeight,
    validateBodyFatPct,
    validateDate,
    formatDate,
    roundToDecimal,
} from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {

        // authenticate user
        const user = await getCurrentUser();

        const body = await request.json();
        const { weight_kg, measured_body_fat_pct, notes, date } = body;

        // validate required fields
        if (!weight_kg) {
            return NextResponse.json(
                createResponse(false, null, 'Weight is required'),
                { status: 400 }
            );
        }

        // validate weight
        const weightValidation = validateWeight(weight_kg);

        if (!weightValidation.valid) {
            return NextResponse.json(
                createResponse(false, null, weightValidation.error),
                { status: 400 }
            );
        }

        // validate date if provided
        if (date) {
            const dateValidation = validateDate(date);

            if (!dateValidation.valid) {
                return NextResponse.json(
                    createResponse(false, null, dateValidation.error),
                    { status: 400 }
                );
            }
        }

        // validate body fat % if provided
        let validBodyFat = null;

        if (measured_body_fat_pct !== undefined && measured_body_fat_pct !== null) {
            const bodyFatValidation = validateBodyFatPct(measured_body_fat_pct);

            if (!bodyFatValidation.valid) {
                return NextResponse.json(
                    createResponse(false, null, bodyFatValidation.error),
                    { status: 400 }
                );
            }

            validBodyFat = measured_body_fat_pct;
        }

        // get user profile
        const userProfile = await getUserProfile(user.id);

        // calculate targets with new weight
        const updatedTargets = calculateAllTargets(
            weight_kg,
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

        // Calculate estimated body fat if not measured
        let calculatedBodyFat = null

        if (!validBodyFat) {

            // get last measured body fat entry
            const { data: lastEntry } = await supabase
                .from('weight_entries')
                .select('weight_kg, measured_body_fat_pct')
                .eq('user_id', user.id)
                .not('measured_body_fat_pct', 'is', null)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (lastEntry && lastEntry.measured_body_fat_pct) {
                calculatedBodyFat = calculateEstimatedBodyFat(
                    lastEntry.measured_body_fat_pct,
                    lastEntry.weight_kg,
                    weight_kg,
                    userProfile.current_goal
                )
            } else if (userProfile.measured_body_fat_pct) {

                // use initial measured body fat if available
                calculatedBodyFat = calculateEstimatedBodyFat(
                    userProfile.measured_body_fat_pct,
                    userProfile.original_weight_kg,
                    weight_kg,
                    userProfile.current_goal
                );
            }
        }

        // insert weight entry
        const { data: entry, error: insertError } = await supabase
          .from('weight_entries')
          .insert([
              {
                  user_id: user.id,
                  date: date || formatDate(new Date()),
                  weight_kg,
                  measured_body_fat_pct: validBodyFat,
                  calculated_body_fat_pct: calculatedBodyFat,
                  notes: notes || null,
              },
          ])
          .select()
          .single();

        if (insertError) {
            console.error('Insert error:', insertError);

            return NextResponse.json(
                createResponse(false, null, 'Failed to log weight'),
                { status: 400 }
            );
        }

        // return success with updated targets
        return NextResponse.json(
            createResponse(true, {
                entry,
                targets: updatedTargets,
                body_fat_type: validBodyFat ? 'measured' : 'estimated',
                message: `Weight logged successfully. Your calorie target updated to ${updatedTargets.calorie_target} kcal.`,
            }),
            { status: 201 }
        );
    } catch (error) {
        console.error('Weight log error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // get all weight entries for this user
        const { data: entries, error } = await supabase
            .from('weight_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) {
            return NextResponse.json(
                createResponse(false, null, 'Failed to fetch weight entries'),
                { status: 400 }
            );
        }

        return NextResponse.json(
            createResponse(true, {
                entries,
                count: entries?.length || 0,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Get weight error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}