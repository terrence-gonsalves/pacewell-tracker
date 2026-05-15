// Unit conversion utilities for metric/imperial support

export type UnitPreference = 'metric' | 'imperial';

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
    return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
    return Math.round(lbs / 2.20462 * 100) / 100;
}

/**
 * Convert centimeters to feet and inches
 * Returns object with feet and inches
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches % 12) * 10) / 10;

    return { feet, inches };
}

/**
 * Convert feet and inches to centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
    const totalInches = feet * 12 + inches;

    return Math.round(totalInches * 2.54);
}

/**
 * Format weight for display based on unit preference
 */
export function formatWeight(
    weightKg: number,
    preference: UnitPreference
): string {
    if (preference === 'imperial') {
        const lbs = kgToLbs(weightKg);

        return `${lbs} lbs`;
    }

    return `${weightKg} kg`;
}

/**
 * Format height for display based on unit preference
 */
export function formatHeight(
    heightCm: number,
    preference: UnitPreference
): string {
    if (preference === 'imperial') {
        const { feet, inches } = cmToFeetInches(heightCm);

        return `${feet}'${inches}"`;
    }

    return `${heightCm} cm`;
}

/**
 * Parse weight input and convert to kg
 */
export function parseWeight(
    input: number,
    preference: UnitPreference
): number {
    if (preference === 'imperial') {
        return lbsToKg(input);
    }

    return input;
}

/**
 * Parse height input and convert to cm
 */
export function parseHeight(
    feet: number,
    inches: number,
    preference: UnitPreference
): number {
    if (preference === 'imperial') {
        return feetInchesToCm(feet, inches)
    }

    // for metric, assume input is in cm directly
    return feet; // this would be the cm value
}

/**
 * Format BMR/TDEE for display
 */
export function formatCalories(calories: number): string {
    return `${Math.round(calories)} kcal`;
}

/**
 * Format macros for display
 */
export function formatMacro(grams: number, name: string): string {
    return `${Math.round(grams * 10) / 10}g ${name}`;
}

/**
 * Get unit labels based on preference
 */
export function getUnitLabels(preference: UnitPreference) {
    if (preference === 'imperial') {
        return {
            weight: 'lbs',
            height: 'ft/in',
            weight_full: 'pounds',
            height_full: 'feet and inches',
        };
    }

    return {
        weight: 'kg',
        height: 'cm',
        weight_full: 'kilograms',
        height_full: 'centimeters',
    };
}