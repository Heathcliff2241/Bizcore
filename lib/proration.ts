/**
 * Proration calculation utilities for subscription upgrades/downgrades
 * Handles pro-rata billing for mid-cycle changes
 */

export interface ProratedPrice {
  currentCycleDays: number
  totalCycleDays: number
  dailyRate: number
  remainingBalance: number
  newPlanDailyRate: number
  creditApplied: number
  amountDue: number
  description: string
}

/**
 * Calculate prorated pricing for an upgrade or downgrade
 * @param currentPrice Current plan's monthly price in PHP
 * @param newPrice New plan's monthly price in PHP
 * @param cycleStartDate Start of current billing cycle
 * @param cycleEndDate End of current billing cycle
 * @returns Proration details including amount due or credit
 */
export function calculateProration(
  currentPrice: number,
  newPrice: number,
  cycleStartDate: Date,
  cycleEndDate: Date
): ProratedPrice {
  // Calculate days in current cycle and days used
  const totalCycleDays = Math.ceil(
    (cycleEndDate.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentDate = new Date();
  const daysUsed = Math.ceil(
    (currentDate.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.max(0, totalCycleDays - daysUsed);

  // Calculate daily rates
  const currentDailyRate = currentPrice / totalCycleDays;
  const newDailyRate = newPrice / totalCycleDays;

  // Calculate what was already paid (current plan for used days)
  const paidAmount = currentDailyRate * daysUsed;

  // Calculate new plan cost for remaining days
  const newPlanCost = newDailyRate * remainingDays;

  // Calculate credit or amount due
  const creditApplied = paidAmount - newPlanCost > 0 ? paidAmount - newPlanCost : 0;
  const amountDue = newPlanCost - paidAmount > 0 ? newPlanCost - paidAmount : 0;

  return {
    currentCycleDays: totalCycleDays,
    totalCycleDays: totalCycleDays,
    dailyRate: currentDailyRate,
    remainingBalance: creditApplied > 0 ? creditApplied : amountDue,
    newPlanDailyRate: newDailyRate,
    creditApplied,
    amountDue,
    description:
      creditApplied > 0
        ? `You'll receive ₱${creditApplied.toFixed(2)} credit applied to your next invoice`
        : `You'll be charged ₱${amountDue.toFixed(2)} today for the pro-rated difference`
  };
}

/**
 * Calculate refund amount for cancellation
 * @param currentPrice Current plan's monthly price in PHP
 * @param cycleStartDate Start of current billing cycle
 * @param cycleEndDate End of current billing cycle
 * @returns Refund amount and explanation
 */
export function calculateCancellationRefund(
  currentPrice: number,
  cycleStartDate: Date,
  cycleEndDate: Date
): { refundAmount: number; explanation: string } {
  const totalCycleDays = Math.ceil(
    (cycleEndDate.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentDate = new Date();
  const daysUsed = Math.ceil(
    (currentDate.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.max(0, totalCycleDays - daysUsed);

  const dailyRate = currentPrice / totalCycleDays;
  const refundAmount = dailyRate * remainingDays;

  return {
    refundAmount,
    explanation:
      refundAmount > 0
        ? `You have ${remainingDays} days remaining. We'll refund ₱${refundAmount.toFixed(2)}.`
        : 'Your current cycle has ended. No refund applies.'
  };
}

/**
 * Format proration details for display
 */
export function formatProratedPrice(proration: ProratedPrice): string {
  if (proration.creditApplied > 0) {
    return `−₱${proration.creditApplied.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credit`;
  }
  if (proration.amountDue > 0) {
    return `+₱${proration.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due today`;
  }
  return 'No charge';
}
