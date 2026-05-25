/**
 * Utility function to calculate projected milestone dates and values
 * Based on standard weight loss/gain rates:
 * - Weight Loss: 1 lb/week
 * - Muscle Gain: 0.5 lb/week
 * - Maintenance: Within ±5-10 lbs of target weight
 */

interface MilestoneData {
    date: string; // ISO date string
    milestone_label: string; // "3 Months", "6 Months", etc.
    weeks: number; // 13, 26, 39, 52
    projected_weight: number;
    projected_body_fat_percentage: number;
}
  
export function calculateProjectedMilestones(
    goalStrategy: 'Weight Loss' | 'Muscle Gain' | 'Maintenance',
    currentWeight: number,
    targetWeight: number,
    currentBodyFat: number,
    targetBodyFat: number
): MilestoneData[] {
    const today = new Date();
    const milestones: MilestoneData[] = [];
  
    // define milestone points: 3, 6, 9, 12 months
    const milestoneWeeks = [13, 26, 39, 52];
    const milestoneLabels = ['3 Months', '6 Months', '9 Months', '12 Months'];
  
    if (goalStrategy === 'Weight Loss') {

        // weight Loss: 1 lb/week
        const totalWeightToLose = currentWeight - targetWeight;
        const weeksToReachGoal = Math.abs(totalWeightToLose); // 1 lb/week rate
  
        milestoneWeeks.forEach((weeks, index) => {
            const projectedWeight = weeks >= weeksToReachGoal ? targetWeight : currentWeight - weeks * 1; // 1 lb per week
    
            // calculate body fat proportionally
            const weightLossProgress = weeks >= weeksToReachGoal ? 1 : weeks / weeksToReachGoal;
            const projectedBodyFat = currentBodyFat - (currentBodyFat - targetBodyFat) * weightLossProgress;
    
            const milestoneDate = new Date(today);
            milestoneDate.setMonth(milestoneDate.getMonth() + (weeks / 4.33)); // convert weeks to approximate months
    
            milestones.push({
                date: milestoneDate.toISOString().split('T')[0],
                milestone_label: milestoneLabels[index],
                weeks,
                projected_weight: Math.round(projectedWeight * 100) / 100,
                projected_body_fat_percentage: Math.round(projectedBodyFat * 100) / 100,
            });
        });
    } else if (goalStrategy === 'Muscle Gain') {

        // muscle Gain: 0.5 lb/week
        const totalWeightToGain = targetWeight - currentWeight;
        const weeksToReachGoal = Math.abs(totalWeightToGain) / 0.5; // 0.5 lb per week rate
  
        milestoneWeeks.forEach((weeks, index) => {
            const projectedWeight = weeks >= weeksToReachGoal ? targetWeight : currentWeight + weeks * 0.5; // 0.5 lb per week
    
            // calculate body fat proportionally
            const weightGainProgress = weeks >= weeksToReachGoal ? 1 : weeks / weeksToReachGoal;
            const projectedBodyFat = currentBodyFat + (targetBodyFat - currentBodyFat) * weightGainProgress;
    
            const milestoneDate = new Date(today);
            milestoneDate.setMonth(milestoneDate.getMonth() + (weeks / 4.33));
    
            milestones.push({
                date: milestoneDate.toISOString().split('T')[0],
                milestone_label: milestoneLabels[index],
                weeks,
                projected_weight: Math.round(projectedWeight * 100) / 100,
                projected_body_fat_percentage: Math.round(projectedBodyFat * 100) / 100,
            });
        });
    } else if (goalStrategy === 'Maintenance') {

        // maintenance: weight stays within ±5-10 lbs of target, body fat gradually approaches target
        milestoneWeeks.forEach((weeks, index) => {

            // for maintenance, weight fluctuates around target but stays within ±5-10 lbs
            // project weight to gradually stabilize around target
            const maintenanceRange = 7.5; // use midpoint of 5-10 lbs range
            const stabilizationRate = Math.min(weeks / 52, 1); // full stabilization by 12 months
            const projectedWeight = targetWeight + (currentWeight - targetWeight) * (1 - stabilizationRate);
    
            // body fat gradually approaches target
            const bodyFatProgress = weeks / 52; // progress toward goal over 12 months
            const projectedBodyFat = currentBodyFat + (targetBodyFat - currentBodyFat) * bodyFatProgress;
    
            const milestoneDate = new Date(today);
            milestoneDate.setMonth(milestoneDate.getMonth() + (weeks / 4.33));
    
            milestones.push({
                date: milestoneDate.toISOString().split('T')[0],
                milestone_label: milestoneLabels[index],
                weeks,
                projected_weight: Math.round(projectedWeight * 100) / 100,
                projected_body_fat_percentage: Math.round(projectedBodyFat * 100) / 100,
            });
        });
    }
  
    return milestones;
}