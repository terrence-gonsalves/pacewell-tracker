/**
 * Unit Conversion Utilities
 * Handles conversion between metric (kg) and imperial (lbs)
 */

export type PreferredUnit = 'metric' | 'imperial';

/**
 * Convert kg to lbs
 */
export const kgToLbs = (kg: number): number => {
    return kg * 2.20462;
}

/**
 * Convert lbs to kg
 */
export const lbsToKg = (lbs: number): number => {
    return lbs / 2.20462;
}

/**
 * Convert weight value from one unit to another
 */
export const convertWeight = (
    value: number,
    fromUnit: PreferredUnit,
    toUnit: PreferredUnit
): number => {
    if (fromUnit === toUnit) return value;

    if (fromUnit === 'metric' && toUnit === 'imperial') {
        return kgToLbs(value);
    }

    if (fromUnit === 'imperial' && toUnit === 'metric') {
        return lbsToKg(value);
    }

    return value;
}

/**
 * Get display unit label
 */
export const getUnitLabel = (preferredUnit: PreferredUnit): string => {
    return preferredUnit === 'metric' ? 'kg' : 'lbs';
}

/**
 * Get storage unit (always kg in database)
 */
export const getStorageUnit = (): string => {
    return 'kg';
}

/**
 * Format weight for display with unit
 */
export const formatWeight = (
    value: number,
    preferredUnit: PreferredUnit,
    decimals: number = 1
): string => {

    // value is stored in kg, convert if needed
    const displayValue = preferredUnit === 'metric' ? value : kgToLbs(value);

    return `${displayValue.toFixed(decimals)} ${getUnitLabel(preferredUnit)}`;
}

/**
 * Format body fat percentage for display
 */
export const formatBodyFat = (value: number | null, decimals: number = 1): string => {
    if (value === null) return 'N/A';

    // body fat is stored as decimal (0.185 = 18.5%)
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Convert body fat from percentage to decimal
 */
export const bodyFatPercentageToDecimal = (percentage: number): number => {
    return percentage / 100;
}

/**
 * Convert body fat from decimal to percentage
 */
export const bodyFatDecimalToPercentage = (decimal: number): number => {
    return decimal * 100;
}