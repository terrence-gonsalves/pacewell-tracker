// Calculation utilities

export type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active';
export type Goal = 'Fat Loss' | 'Muscle Gain';
export type Intensity = 'Slow' | 'Moderate' | 'Aggressive' | 'Extreme' | 'Insane';
export type Sex = 'M' | 'F';

// activity multiplier mappings
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extremely Active': 1.9,
}

// deficit/surplus amounts (kcal)
const INTENSITY_AMOUNTS: Record<Intensity, number> = {
    'Slow': 200,
    'Moderate': 500,
    'Aggressive': 750,
    'Extreme': 1000,
    'Insane': 1200,
}

// protein targets (g per kg of body weight)
const PROTEIN_TARGETS: Record<Goal, number> = {
    'Fat Loss': 2.0,
    'Muscle Gain': 1.8,
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor formula
 * @param weight_kg Body weight in kilograms
 * @param height_cm Height in centimeters
 * @param age Age in years
 * @param sex 'M' for male, 'F' for female
 * @returns BMR in calories
 */
export function calculateBMR(
    weight_kg: number,
    height_cm: number,
    age: number,
    sex: Sex
): number {
    const baseCalc = 10 * weight_kg + 6.25 * height_cm - 5 * age;
    const sexAdjustment = sex === 'M' ? 5 : -161;

    return Math.round(baseCalc + sexAdjustment);
}

/**
 * Calculate Total Daily Energy Expenditure
 * @param bmr Basal Metabolic Rate (from calculateBMR)
 * @param activityLevel Activity level string
 * @returns TDEE in calories
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];

    return Math.round(bmr * multiplier);
}

/**
 * Calculate daily calorie target based on goal and intensity
 * @param tdee Total Daily Energy Expenditure
 * @param goal 'Fat Loss' or 'Muscle Gain'
 * @param intensity Deficit/surplus intensity
 * @returns Daily calorie target
 */
export function calculateDailyCalorieTarget(
    tdee: number,
    goal: Goal,
    intensity: Intensity
): number {
    const amount = INTENSITY_AMOUNTS[intensity];

    if (goal === 'Fat Loss') {
        return Math.round(tdee - amount);
    } else {
        return Math.round(tdee + amount);
    }
}

/**
 * Calculate protein target based on goal
 * @param weight_kg Body weight in kilograms
 * @param goal 'Fat Loss' or 'Muscle Gain'
 * @returns Protein target in grams
 */
export function calculateProteinTarget(weight_kg: number, goal: Goal): number {
    const ratio = PROTEIN_TARGETS[goal];

    return Math.round(weight_kg * ratio * 10) / 10; // round to 1 decimal
}

/**
 * Calculate fat and carb targets
 * @param calories Daily calorie target
 * @param proteinGrams Protein target in grams
 * @param useCustomRatios Whether to use custom fat/carb ratios
 * @param customFatRatio Custom fat ratio (0-1) if enabled
 * @param customCarbRatio Custom carb ratio (0-1) if enabled
 * @returns { fat_g, carbs_g }
 */
export function calculateMacroTargets(
    calories: number,
    proteinGrams: number,
    useCustomRatios: boolean = false,
    customFatRatio?: number,
    customCarbRatio?: number
): { fat_g: number; carbs_g: number } {
    const proteinCalories = proteinGrams * 4;

    if (useCustomRatios && customFatRatio && customCarbRatio) {
        const fatCalories = calories * customFatRatio;
        const carbCalories = calories * customCarbRatio;

        return {
            fat_g: Math.round(fatCalories / 9 * 10) / 10,
            carbs_g: Math.round(carbCalories / 4 * 10) / 10,
        };
    }

    // default: 25% fat, rest carbs (after protein)
    const defaultFatRatio = 0.25;   
    const fatCalories = calories * defaultFatRatio;
    const carbCalories = calories - proteinCalories - fatCalories;

    return {
        fat_g: Math.round(fatCalories / 9 * 10) / 10,
        carbs_g: Math.round(carbCalories / 4 * 10) / 10,
    };
}

/**
 * Calculate weekly weight loss/gain projection
 * @param dailyDeficitOrSurplus Deficit (negative) or surplus (positive) kcal
 * @param currentWeight Current body weight in kg
 * @param goal 'Fat Loss' or 'Muscle Gain'
 * @returns { weekly_kg, weekly_pct, weeks_to_goal, projected_weekly_weight_change }
 */
export function calculateWeeklyProjection(
    dailyDeficitOrSurplus: number,
    currentWeight: number,
    goal: Goal
): {
    weekly_kg: number;
    weekly_pct: number;
    projected_weekly_weight_change: string;
} {
    if (goal === 'Fat Loss') {

        // 7,700 kcal = ~1 kg of fat loss
        const weeklyCalories = Math.abs(dailyDeficitOrSurplus) * 7;
        const weekly_kg = Math.round((weeklyCalories / 7700) * 100) / 100;
        const weekly_pct = Math.round((weekly_kg / currentWeight) * 1000) / 10; // as percentage

        return {
            weekly_kg,
            weekly_pct,
            projected_weekly_weight_change: `~${weekly_kg.toFixed(2)} kg (~${weekly_pct.toFixed(1)}%) per week`,
        };
    } else {

        // muscle Gain: ~5,600 kcal = 0.5 kg muscle (conservative 50% conversion)
        const weeklyCalories = dailyDeficitOrSurplus * 7;   
        const weekly_kg = Math.round((weeklyCalories / 5600) * 100) / 100;
        const weekly_pct = Math.round((weekly_kg / currentWeight) * 1000) / 10;

        return {
            weekly_kg,
            weekly_pct,
            projected_weekly_weight_change: `~${weekly_kg.toFixed(2)} kg (~${weekly_pct.toFixed(1)}%) per week`,
        };
    }
}

/**
 * Calculate estimated body fat percentage
 * Used when user hasn't manually measured body fat
 * @param lastMeasuredBodyFatPct Last measured body fat %
 * @param lastMeasuredWeight Weight at last measurement (kg)
 * @param currentWeight Current weight (kg)
 * @param goal Current goal
 * @returns Estimated body fat %
 */
export function calculateEstimatedBodyFat(
    lastMeasuredBodyFatPct: number,
    lastMeasuredWeight: number,
    currentWeight: number,
    goal: Goal
): number {
    if (lastMeasuredWeight === currentWeight) {
        return lastMeasuredBodyFatPct;
    }

    const weightChange = lastMeasuredWeight - currentWeight;

    // assume 50% of weight change is fat (conservative estimate)
    // adjust based on goal
    const fatLossRatio = goal === 'Fat Loss' ? 0.5 : 0.3; // muscle gain has less fat loss per kg

    const estimatedFatChange = weightChange * fatLossRatio;
    const lastMeasuredFatMass = lastMeasuredWeight * lastMeasuredBodyFatPct;
    const currentEstimatedFatMass = lastMeasuredFatMass - estimatedFatChange;
    const estimatedBodyFatPct = currentEstimatedFatMass / currentWeight;

    // clamp between 0 and 1
    return Math.max(0, Math.min(1, Math.round(estimatedBodyFatPct * 10000) / 10000));
}

/**
 * Get activity multiplier value from activity level string
 */
export function getActivityMultiplier(activityLevel: ActivityLevel): number {
    return ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Calculate all user targets in one function
 * Useful for signup and when user updates settings
 */
export function calculateAllTargets(
    weight_kg: number,
    height_cm: number,
    age: number,
    sex: Sex,
    activityLevel: ActivityLevel,
    goal: Goal,
    intensity: Intensity,
    useCustomRatios?: boolean,
    customFatRatio?: number,
    customCarbRatio?: number
) {
    const bmr = calculateBMR(weight_kg, height_cm, age, sex);
    const tdee = calculateTDEE(bmr, activityLevel);
    const calorieTarget = calculateDailyCalorieTarget(tdee, goal, intensity);
    const proteinTarget = calculateProteinTarget(weight_kg, goal);
    const macroTargets = calculateMacroTargets(
        calorieTarget,
        proteinTarget,
        useCustomRatios,
        customFatRatio,
        customCarbRatio
    );
    const dailyDeficit = goal === 'Fat Loss'
        ? INTENSITY_AMOUNTS[intensity]
        : -INTENSITY_AMOUNTS[intensity];
    const projection = calculateWeeklyProjection(dailyDeficit, weight_kg, goal);

    return {
        bmr,
        tdee,
        calorie_target: calorieTarget,
        protein_target: proteinTarget,
        fat_target: macroTargets.fat_g,
        carbs_target: macroTargets.carbs_g,
        weekly_projection: projection.projected_weekly_weight_change,
        weekly_kg: projection.weekly_kg,
        weekly_pct: projection.weekly_pct,
    };
}