// Log macro entry endpoint

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
    createResponse,
    getCurrentUser,
    getUserProfile,
    validateCalories,
    validateMacro,
    validateDate,
    formatDate,
    getDailyTotals,
} from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const body = await request.json();

        const {
            meal_type,
            calories,
            protein_g,
            fat_g,
            carbs_g,
            food_description,
            date,
        } = body;

        // validate required fields
        if (!meal_type) {
            return NextResponse.json(
                createResponse(false, null, 'Meal type is required'),
                { status: 400 }
            );
        }

        // validate meal type
        if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(meal_type)) {
            return NextResponse.json(
                createResponse(false, null, 'Invalid meal type'),
                { status: 400 }
            );
        }

        // validate calories
        const calorieValidation = validateCalories(calories);

        if (!calorieValidation.valid) {
            return NextResponse.json(
                createResponse(false, null, calorieValidation.error),
                { status: 400 }
            );
        }

        // validate macros
        const proteinValidation = validateMacro(protein_g, 'Protein');

        if (!proteinValidation.valid) {
            return NextResponse.json(
                createResponse(false, null, proteinValidation.error),
                { status: 400 }
            );
        }

        const fatValidation = validateMacro(fat_g, 'Fat');

        if (!fatValidation.valid) {
            return NextResponse.json(
                createResponse(false, null, fatValidation.error),
                { status: 400 }
            );
        }

        const carbValidation = validateMacro(carbs_g, 'Carbs');

        if (!carbValidation.valid) {
            return NextResponse.json(
                createResponse(false, null, carbValidation.error),
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

        const logDate = date || formatDate(new Date());

        // check if entry already exists for this meal type on this date
        const { data: existingEntry } = await supabase
            .from('macro_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', logDate)
            .eq('meal_type', meal_type)
            .single();

        if (existingEntry) {

            // update existing entry
            const { data: entry, error: updateError } = await supabase
                .from('macro_logs')
                .update({
                    calories,
                    protein_g,
                    fat_g,
                    carbs_g,
                    food_description: food_description || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingEntry.id)
                .select()
                .single()

            if (updateError) {
                return NextResponse.json(
                    createResponse(false, null, 'Failed to update macro log'),
                    { status: 400 }
                );
            }

            // get daily totals
            const dailyTotals = await getDailyTotals(user.id, logDate);
            const userProfile = await getUserProfile(user.id);

            return NextResponse.json(
                createResponse(true, {
                    entry,
                    daily_totals: dailyTotals,
                    targets: {
                        calorie_target: userProfile.calorie_target,
                        protein_target: userProfile.protein_target,
                        fat_target: userProfile.fat_target,
                        carbs_target: userProfile.carbs_target,
                    },
                    message: 'Meal updated successfully',
                }),
                { status: 200 }
            );
        }

        // insert new entry
        const { data: entry, error: insertError } = await supabase
            .from('macro_logs')
            .insert([
                {
                    user_id: user.id,
                    date: logDate,
                    meal_type,
                    calories,
                    protein_g,
                    fat_g,
                    carbs_g,
                    food_description: food_description || null,
                },
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);

            return NextResponse.json(
                createResponse(false, null, 'Failed to log macro'),
                { status: 400 }
            );
        }

        // get daily totals and user targets
        const dailyTotals = await getDailyTotals(user.id, logDate);
        const userProfile = await getUserProfile(user.id);

        return NextResponse.json(
            createResponse(true, {
                entry,
                daily_totals: dailyTotals,
                targets: {
                    calorie_target: userProfile.calorie_target,
                    protein_target: userProfile.protein_target,
                    fat_target: userProfile.fat_target,
                    carbs_target: userProfile.carbs_target,
                },
                message: 'Meal logged successfully',
            }),
            { status: 201 }
        );
    } catch (error) {
        console.error('Macro log error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // get date from query params (optional)
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        let query = supabase
            .from('macro_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (date) {
            query = query.eq('date', date);
        }

        const { data: entries, error } = await query;

        if (error) {
            return NextResponse.json(
                createResponse(false, null, 'Failed to fetch macro logs'),
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
        console.error('Get macro logs error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const { searchParams } = new URL(request.url);
        const entryId = searchParams.get('id');

        if (!entryId) {
            return NextResponse.json(
                createResponse(false, null, 'Entry ID is required'),
                { status: 400 }
            );
        }

        // verify ownership before deleting
        const { data: entry } = await supabase
            .from('macro_logs')
            .select('user_id')
            .eq('id', entryId)
            .single();

        if (!entry || entry.user_id !== user.id) {
            return NextResponse.json(
                createResponse(false, null, 'Entry not found or unauthorized'),
                { status: 403 }
            );
        }

        const { error } = await supabase
            .from('macro_logs')
            .delete()
            .eq('id', entryId);

        if (error) {
            return NextResponse.json(
                createResponse(false, null, 'Failed to delete macro log'),
                { status: 400 }
            );
        }

        return NextResponse.json(
            createResponse(true, null, 'Macro log deleted successfully'),
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete macro log error:', error);

        return NextResponse.json(
            createResponse(false, null, 'Internal server error'),
            { status: 500 }
        );
    }
}