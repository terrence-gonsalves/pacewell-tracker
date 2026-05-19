import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { calculateAllTargets } from '@/lib/calculations';
import { createResponse, validateWeight, validateDate } from '@/lib/utils';
import { parseWeight, parseHeight } from '@/lib/conversions';
import type { UnitPreference } from '@/lib/conversions';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // extract required fields
        const {
            email,
            password,

            // weight/height can be in metric or imperial depending on unit_preference
            weight,
            height_value1, // for metric: cm; for imperial: feet
            height_value2, // for imperial only: inches
            age,
            sex,
            activity_multiplier,
            measured_body_fat_pct,
            target_body_fat_pct,
            current_goal = 'Fat Loss',
            current_intensity = 'Moderate',
            preferred_unit = 'metric', // 'metric' or 'imperial'
        } = body

        // validate required fields
        if (!email || !password) {
            return NextResponse.json(
                createResponse(false, null, 'Email and password are required'),
                { status: 400 }
            );
        }

        if (
            !weight ||
            !height_value1 ||
            !age ||
            !sex ||
            !activity_multiplier
        ) {
            return NextResponse.json(
                createResponse(false, null, 'Missing required biometric data'),
                { status: 400 }
            );
        }

        // validate unit preference
        if (!['metric', 'imperial'].includes(preferred_unit)) {
            return NextResponse.json(
                createResponse(false, null, 'Invalid unit preference'),
                { status: 400 }
            );
        }

        // convert input to metric (database standard)
        const weight_kg = parseWeight(weight, preferred_unit as UnitPreference);
        const height_cm = parseHeight(
            height_value1,
            height_value2 || 0,
            preferred_unit as UnitPreference
        );

        // validate converted weight
        const weightValidation = validateWeight(weight_kg);

        if (!weightValidation.valid) {
            return NextResponse.json(
                createResponse(false, null, weightValidation.error),
                { status: 400 }
            );
        }

        // validate height, age
        if (height_cm < 100 || height_cm > 250) {
            return NextResponse.json(
                createResponse(false, null, 'Height must be between 100-250 cm (3\'3"-8\'2")'),
                { status: 400 }
            );
        }

        if (age < 15 || age > 120) {
            return NextResponse.json(
                createResponse(false, null, 'Age must be between 15-120'),
                { status: 400 }
            );
        }

        if (!['M', 'F'].includes(sex)) {
            return NextResponse.json(
                createResponse(false, null, 'Sex must be M or F'),
                { status: 400 }
            );
        }

        // create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError || !authData.user) {
            return NextResponse.json(
                createResponse(false, null, authError?.message || 'Failed to create account'),
                { status: 400 }
            );
        }

        const userId = authData.user.id;

        // calculate initial targets using metric values
        const targets = calculateAllTargets(
            weight_kg,
            height_cm,
            age,
            sex as 'M' | 'F',
            activity_multiplier,
            current_goal as 'Fat Loss' | 'Muscle Gain',
            current_intensity as 'Slow' | 'Moderate' | 'Aggressive' | 'Extreme' | 'Insane'
        );

        // create user profile in database using service role (bypasses RLS)
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .insert([
                {
                    id: userId,
                    weight_kg,
                    height_cm,
                    age,
                    sex,
                    activity_multiplier,
                    original_weight_kg: weight_kg,
                    measured_body_fat_pct: measured_body_fat_pct ? measured_body_fat_pct / 100 : null,
                    target_body_fat_pct: target_body_fat_pct ? target_body_fat_pct / 100 : null,
                    current_goal,
                    current_intensity,
                    use_custom_macro_ratios: false,
                    preferred_unit,
                },
            ])
            .select()
            .single();

        if (userError) {
            console.error('Supabase insert error:', userError);

            // clean up auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);

            return NextResponse.json(
                createResponse(false, null, 'Failed to create user profile'),
                { status: 400 }
            );
        }

        // return success with targets
        return NextResponse.json(
            createResponse(true, {
                user: {
                    id: userId,
                    email,
                    preferred_unit,
                    ...userData,
                },
                targets,
                message: 'Account created successfully',
            }),
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}