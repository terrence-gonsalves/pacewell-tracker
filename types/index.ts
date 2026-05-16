export interface User {
    id: string
    weight_kg: number
    height_cm: number
    age: number
    sex: 'M' | 'F'
    activity_multiplier: string
    original_weight_kg: number
    measured_body_fat_pct?: number
    target_body_fat_pct?: number
    current_goal: 'Fat Loss' | 'Muscle Gain'
    current_intensity: 'Slow' | 'Moderate' | 'Aggressive' | 'Extreme' | 'Insane'
    created_at: string
    updated_at: string
}

export interface WeightEntry {
    id: string
    user_id: string
    date: string
    weight_kg: number
    measured_body_fat_pct?: number
    calculated_body_fat_pct?: number
    notes?: string
    created_at: string
}

export interface MacroLog {
    id: string
    user_id: string
    date: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    calories: number
    protein_g: number
    fat_g: number
    carbs_g: number
    food_description?: string
    created_at: string
}
