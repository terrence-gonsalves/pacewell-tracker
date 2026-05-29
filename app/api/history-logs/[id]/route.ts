/**
 * API Routes: /api/history-logs/[id]
 * Handles PUT (update) and DELETE operations for meal, weight, and body fat logs
 * Location: app/api/history-logs/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

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
        );

        const body = await request.json();
        const { table, data } = body;

        if (!table || !data) {
            return NextResponse.json(
                { error: 'Missing table or data in request body' },
                { status: 400 }
            );
        }

        // validate table name
        const validTables = ['macro_logs', 'weight_entries', 'body_fat_logs'];

        if (!validTables.includes(table)) {
            return NextResponse.json(
                { error: 'Invalid table name' },
                { status: 400 }
            );
        }

        // update the record
        const { data: updatedData, error: updateError } = await supabaseAuth
            .from(table)
            .update(data)
            .eq('id', params.id)
            .select()
            .single();

        if (updateError) {
            console.error(`Error updating ${table}:`, updateError);
            
            return NextResponse.json(
                { error: 'Failed to update log' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                data: updatedData,
                message: 'Log updated successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('PUT /api/history-logs/[id] error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];

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
        );

        const body = await request.json();
        const { table } = body;

        if (!table) {
            return NextResponse.json(
                { error: 'Missing table in request body' },
                { status: 400 }
            );
        }

        // validate table name
        const validTables = ['macro_logs', 'weight_entries', 'body_fat_logs'];

        if (!validTables.includes(table)) {
            return NextResponse.json(
                { error: 'Invalid table name' },
                { status: 400 }
            );
        }

        // delete the record
        const { error: deleteError } = await supabaseAuth
            .from(table)
            .delete()
            .eq('id', params.id);

        if (deleteError) {
            console.error(`Error deleting from ${table}:`, deleteError);

            return NextResponse.json(
                { error: 'Failed to delete log' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Log deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('DELETE /api/history-logs/[id] error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}