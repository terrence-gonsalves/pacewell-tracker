/**
 * API Route: /api/weight-entries/[id]
 * Handles updating and deleting weight entries
 * Location: app/api/weight-entries/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { lbsToKg, bodyFatPercentageToDecimal } from '../../../utils/unit-utils';

interface JWTPayload {
  sub: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwtDecode<JWTPayload>(token)
    const userId = decoded.sub

    const body = await request.json()
    const { weight, unit, date, bodyFat, notes } = body

    // Validate required fields
    if (!weight || !unit || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: weight, unit, date' },
        { status: 400 }
      )
    }

    // Convert weight to kg if needed
    const weightKg = unit === 'imperial' ? lbsToKg(parseFloat(weight)) : parseFloat(weight)

    // Convert body fat from percentage to decimal if provided
    const bodyFatDecimal = bodyFat ? bodyFatPercentageToDecimal(bodyFat) / 100 : null

    // Create authenticated Supabase client
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

    // Verify entry belongs to user
    const { data: entry, error: fetchError } = await supabaseAuth
      .from('weight_entries')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: 'Weight entry not found' },
        { status: 404 }
      )
    }

    // Update weight entry
    const { data: updatedEntry, error: updateError } = await supabaseAuth
      .from('weight_entries')
      .update({
        weight_kg: weightKg,
        date,
        measured_body_fat_pct: bodyFatDecimal,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating weight entry:', updateError)
      return NextResponse.json(
        { error: 'Failed to update weight entry' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        data: updatedEntry,
        message: 'Weight entry updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('PUT /api/weight-entries/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwtDecode<JWTPayload>(token)
    const userId = decoded.sub

    // Create authenticated Supabase client
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

    // Verify entry belongs to user
    const { data: entry, error: fetchError } = await supabaseAuth
      .from('weight_entries')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: 'Weight entry not found' },
        { status: 404 }
      )
    }

    // Delete weight entry
    const { error: deleteError } = await supabaseAuth
      .from('weight_entries')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting weight entry:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete weight entry' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Weight entry deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/weight-entries/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}