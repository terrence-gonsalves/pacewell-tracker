/**
 * API Route: /api/personal-goals
 * Handles GET (fetch active goal) and POST (save new goal)
 * Location: app/api/personal-goals/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateProjectedMilestones } from '@/lib/projected-milestones'

// GET: fetch the active goal for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
  
        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token ? 'Yes' : 'No');
    
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
        )
  
        console.log('Supabase client created');
    
        // query using authenticated client
        const { data: goal, error: queryError } = await supabaseAuth
            .from('personal_goals')
            .select('*')
            .eq('status', 'active')
            .single()
    
        console.log('Query error:', queryError);

        // it's okay if no active goal exists
        if (queryError && queryError.code === 'PGRST116') {

            // no rows returned - this is expected for new users
            return NextResponse.json(
                { data: null },
                { status: 200 }
            );
        }

        if (queryError) {
            console.error('Database error:', queryError);

            return NextResponse.json(
                { error: 'Failed to fetch goal' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { data: goal },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/personal-goals error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: save a new goal (mark previous as completed, create new as active)
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    
        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token ? 'Yes' : 'No');
    
        // extract user_id from JWT token
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const userId = payload.sub;
        
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
  
        // parse and validate request body (same as before)
        const body = await request.json();
        const {
            goal_strategy,
            target_weight,
            target_body_fat_percentage,
            daily_calorie_target,
            protein_percentage,
            carbs_percentage,
            fats_percentage,
            current_weight,
            current_body_fat_percentage,
        } = body;
  
        // validate required fields
        if (
            !goal_strategy ||
            !target_weight ||
            target_body_fat_percentage === undefined ||
            !daily_calorie_target ||
            protein_percentage === undefined ||
            carbs_percentage === undefined ||
            fats_percentage === undefined
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
    
        // validate macro percentages sum to 100
        const macroPct = protein_percentage + carbs_percentage + fats_percentage;

        if (Math.abs(macroPct - 100) > 0.1) {
            return NextResponse.json(
                { error: `Macro percentages must total 100%. Current total: ${macroPct.toFixed(1)}%` },
                { status: 400 }
            );
        }
  
        // validate numeric constraints
        if (target_weight <= 0) {
            return NextResponse.json(
                { error: 'Target weight must be greater than 0' },
                { status: 400 }
            );
        }
    
        if (daily_calorie_target < 1200 || daily_calorie_target > 10000) {
            return NextResponse.json(
                { error: 'Daily calorie target must be between 1200 and 10,000' },
                { status: 400 }
            );
        }
  
        // validate goal strategy
        if (!['Weight Loss', 'Muscle Gain', 'Maintenance'].includes(goal_strategy)) {
            return NextResponse.json(
                { error: 'Invalid goal strategy' },
                { status: 400 }
            );
        }
  
      // calculate projected milestones
      let projected_milestones;

      try {
            projected_milestones = calculateProjectedMilestones(
                goal_strategy as 'Weight Loss' | 'Muscle Gain' | 'Maintenance',
                current_weight,
                target_weight,
                current_body_fat_percentage,
                target_body_fat_percentage
            )
      } catch (calcError) {
            console.error('Milestone calculation error:', calcError);

            return NextResponse.json(
                { error: 'Failed to calculate projected milestones' },
                { status: 500 }
            );
      }
  
      // use supabaseAdmin to bypass RLS (we've verified user_id from token)
      const { supabaseAdmin } = await import('@/lib/supabase')
  
      // mark any existing active goal as completed
      const { error: updateError } = await supabaseAdmin
        .from('personal_goals')
        .update({ status: 'completed' })
        .eq('user_id', userId)
        .eq('status', 'active')
  
        if (updateError) {
            console.error('Error marking previous goal as completed:', updateError);

            return NextResponse.json(
                { error: 'Failed to update previous goal' },
                { status: 500 }
            );
        }
  
        // insert new active goal with user_id from token
        const { data: newGoal, error: insertError } = await supabaseAdmin
            .from('personal_goals')
            .insert([
                {
                    user_id: userId,
                    status: 'active',
                    goal_strategy,
                    target_weight,
                    target_body_fat_percentage,
                    daily_calorie_target,
                    protein_percentage,
                    carbs_percentage,
                    fats_percentage,
                    projected_milestones,
                },
            ])
            .select()
            .single();
    
        if (insertError) {
            console.error('Error inserting new goal:', insertError);
            
            return NextResponse.json(
                { error: 'Failed to save goal' },
                { status: 500 }
            );
        }
  
        return NextResponse.json(
            {
                data: newGoal,
                message: 'Goal saved successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /api/personal-goals error:', error);
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}