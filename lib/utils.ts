// Utility functions

import { supabase } from './supabase'

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Not authenticated');
    }

    return user;
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        throw new Error('Failed to fetch user profile');
    }

    return data;
}

/**
 * Validate weight input
 */
export function validateWeight(weight: number): { valid: boolean; error?: string } {
    if (!weight || weight <= 0) {
        return { valid: false, error: 'Weight must be greater than 0' };
    }
    if (weight > 500) {
        return { valid: false, error: 'Weight seems invalid (too high)' };
    }
    if (weight < 30) {
        return { valid: false, error: 'Weight seems invalid (too low)' };
    }

    return { valid: true };
}

/**
 * Validate body fat percentage
 */
export function validateBodyFatPct(bodyFatPct: number): { valid: boolean; error?: string } {
    if (bodyFatPct < 0 || bodyFatPct > 1) {
        return { valid: false, error: 'Body fat % must be between 0 and 100%' };
    }

    return { valid: true };
}

/**
 * Validate calorie input
 */
export function validateCalories(calories: number): { valid: boolean; error?: string } {
    if (!calories || calories <= 0) {
        return { valid: false, error: 'Calories must be greater than 0' };
    }

    if (calories > 10000) {
        return { valid: false, error: 'Calories seem too high for a single meal' };
    }

    return { valid: true };
}

/**
 * Validate macro input
 */
export function validateMacro(value: number, name: string): { valid: boolean; error?: string } {
    if (value === undefined || value === null) {
        return { valid: false, error: `${name} is required` };
    }

    if (value < 0) {
        return { valid: false, error: `${name} cannot be negative` };
    }

    if (value > 500) {
        return { valid: false, error: `${name} seems too high` };
    }

    return { valid: true };
}

/**
 * Validate date
 */
export function validateDate(dateStr: string): { valid: boolean; error?: string } {
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
        return { valid: false, error: 'Invalid date format' };
    }

    if (date > new Date()) {
        return { valid: false, error: 'Cannot log data for future dates' };
    }

    return { valid: true };
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Format number to 1 decimal place
 */
export function roundToDecimal(num: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);

    return Math.round(num * factor) / factor;
}

/**
 * Convert decimal body fat to percentage string
 * Example: 0.254 -> "25.4%"
 */
export function formatBodyFatPct(decimal: number): string {
    return `${roundToDecimal(decimal * 100, 1)}%`;
}

/**
 * Create response object for API endpoints
 */
export function createResponse<T>(
    success: boolean,
    data?: T,
    error?: string,
    statusCode: number = success ? 200 : 400
) {
    return {
        status: statusCode,
        body: {
            success,
            data: success ? data : null,
            error: error || null,
        },
    };
}

/**
 * Get daily totals for a user on a specific date
 */
export async function getDailyTotals(userId: string, date: string) {
    const { data, error } = await supabase
        .from('macro_logs')
        .select('calories, protein_g, fat_g, carbs_g')
        .eq('user_id', userId)
        .eq('date', date);

    if (error) {
        throw new Error('Failed to fetch daily totals');
    }

    if (!data || data.length === 0) {
        return {
            calories: 0,
            protein_g: 0,
            fat_g: 0,
            carbs_g: 0,
        };
    }

    return {
        calories: data.reduce((sum, log) => sum + log.calories, 0),
        protein_g: roundToDecimal(data.reduce((sum, log) => sum + log.protein_g, 0), 1),
        fat_g: roundToDecimal(data.reduce((sum, log) => sum + log.fat_g, 0), 1),
        carbs_g: roundToDecimal(data.reduce((sum, log) => sum + log.carbs_g, 0), 1),
    };
}

/**
 * Get weekly summary
 * Returns average metrics for the last 7 days
 */
export async function getWeeklySummary(userId: string) {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: macros, error: macroError } = await supabase
        .from('macro_logs')
        .select('calories, protein_g, fat_g, carbs_g')
        .eq('user_id', userId)
        .gte('date', formatDate(sevenDaysAgo))
        .lte('date', formatDate(today));
    const { data: weights, error: weightError } = await supabase
        .from('weight_entries')
        .select('weight_kg')
        .eq('user_id', userId)
        .gte('date', formatDate(sevenDaysAgo))
        .lte('date', formatDate(today));

    if (macroError || weightError) {
        throw new Error('Failed to fetch weekly summary');
    }

    const avgCalories = macros?.length
        ? roundToDecimal(macros.reduce((sum, m) => sum + m.calories, 0) / macros.length, 0)
        : 0;
    const avgProtein = macros?.length
        ? roundToDecimal(macros.reduce((sum, m) => sum + m.protein_g, 0) / macros.length, 1)
        : 0;
    const avgFat = macros?.length
        ? roundToDecimal(macros.reduce((sum, m) => sum + m.fat_g, 0) / macros.length, 1)
        : 0;
    const avgCarbs = macros?.length
        ? roundToDecimal(macros.reduce((sum, m) => sum + m.carbs_g, 0) / macros.length, 1)
        : 0;
    const avgWeight = weights?.length
        ? roundToDecimal(weights.reduce((sum, w) => sum + w.weight_kg, 0) / weights.length, 2)
        : 0;

    return {
        avg_calories: avgCalories,
        avg_protein_g: avgProtein,
        avg_fat_g: avgFat,
        avg_carbs_g: avgCarbs,
        avg_weight_kg: avgWeight,
        days_logged: macros?.length || 0,
    };
}

/**
 * Calculate macro adherence percentage
 */
export function calculateAdherence(
    actual: number,
    target: number,
    tolerance: number = 0.1 // 10% tolerance
): number {
    if (target === 0) return 0;

    const difference = Math.abs(actual - target) / target;
    const adherence = Math.max(0, 1 - difference) * 100;

    return roundToDecimal(adherence, 0);
}