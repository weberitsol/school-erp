import { Decimal } from '@prisma/client/runtime/library';
import { MessEnrollment, MealAttendance, ExtraMealBooking } from '@prisma/client';

/**
 * Billing Calculator Utility
 * PHASE 5: Provides pro-rata calculation functions for mess billing
 *
 * CRITICAL: All financial calculations use Decimal for precision
 * CRITICAL: Pro-rata formula: (monthlyPrice / daysInMonth) × enrolledDays
 */

/**
 * Get number of days in a given month
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Number of days in month (28-31)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculate the number of days a student was enrolled in a specific month
 * Accounts for:
 * - Full month enrollment (1st to last day)
 * - Mid-month enrollment start (e.g., 15th onwards)
 * - Mid-month enrollment end (e.g., until 20th)
 *
 * @param enrollment - MessEnrollment with startDate and endDate
 * @param year - Billing year
 * @param month - Billing month (1-12)
 * @returns Number of enrolled days in the month
 *
 * @example
 * // Student enrolled from 15th to 30th of 30-day month
 * calculateEnrolledDays(enrollment, 2025, 1) // Returns 16 (15th, 16th, ..., 30th)
 *
 * @example
 * // Student enrolled full month
 * calculateEnrolledDays(enrollment, 2025, 3) // Returns 31 (all days)
 */
export function calculateEnrolledDays(
  enrollment: MessEnrollment,
  year: number,
  month: number
): number {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = getDaysInMonth(year, month);

  // Normalize enrollment dates to the month being calculated
  let enrollmentStart = new Date(enrollment.startDate);
  let enrollmentEnd = enrollment.endDate ? new Date(enrollment.endDate) : null;

  // If enrollment starts before this month, start from 1st of month
  if (enrollmentStart < monthStart) {
    enrollmentStart = monthStart;
  }

  // If enrollment ends before this month's end, use end date; otherwise use last day of month
  if (enrollmentEnd && enrollmentEnd < monthEnd) {
    // If end date is before this month, return 0
    if (enrollmentEnd < monthStart) {
      return 0;
    }
  } else {
    enrollmentEnd = monthEnd;
  }

  // If enrollment start is after month end, return 0
  if (enrollmentStart > monthEnd) {
    return 0;
  }

  // Calculate enrolled days (inclusive of both start and end dates)
  const daysDiff =
    Math.floor(
      (enrollmentEnd.getTime() - enrollmentStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  return Math.max(0, daysDiff);
}

/**
 * Check if student was enrolled for the full month
 * @param enrollment - MessEnrollment
 * @param year - Billing year
 * @param month - Billing month (1-12)
 * @returns true if enrolled for entire month (1st to last day)
 */
export function isFullMonth(
  enrollment: MessEnrollment,
  year: number,
  month: number
): boolean {
  const daysInMonth = getDaysInMonth(year, month);
  const enrolledDays = calculateEnrolledDays(enrollment, year, month);
  return enrolledDays === daysInMonth;
}

/**
 * Calculate pro-rata base meal plan cost
 *
 * CRITICAL: This formula ensures fair billing for partial-month enrollments
 *
 * @param monthlyPrice - Full monthly meal plan cost
 * @param totalDaysInMonth - Days in the billing month (28-31)
 * @param enrolledDays - Days the student was enrolled in the month
 * @returns Pro-rata cost for the enrolled period
 *
 * @formula baseCost = (monthlyPrice / totalDaysInMonth) × enrolledDays
 *
 * @example
 * // Student enrolled from 15th-30th of March (16 days out of 31)
 * const baseCost = calculateProRataBaseCost(
 *   new Decimal(3000), // ₹3000/month
 *   31,                // March has 31 days
 *   16                 // Enrolled for 16 days
 * )
 * // Result: ₹1548.39 (3000 × 16 / 31)
 */
export function calculateProRataBaseCost(
  monthlyPrice: Decimal,
  totalDaysInMonth: number,
  enrolledDays: number
): Decimal {
  if (totalDaysInMonth === 0 || enrolledDays === 0) {
    return new Decimal(0);
  }

  // Formula: (monthlyPrice / totalDaysInMonth) × enrolledDays
  const dailyRate = monthlyPrice.dividedBy(new Decimal(totalDaysInMonth));
  const proRataCost = dailyRate.times(new Decimal(enrolledDays));

  return proRataCost;
}

/**
 * Aggregate variant costs from meal attendance records
 * Variant costs are added charges when student chooses premium variants
 *
 * @param attendances - Array of MealAttendance records with variant information
 * @returns Total additional cost from variant choices
 *
 * @example
 * // Student marked attendance for 5 meals, 3 with premium variants
 * // Premium variant costs: ₹50, ₹75, ₹50 (Veg premium, Non-veg, Veg premium)
 * aggregateVariantCosts(attendances) // Returns ₹175
 */
export function aggregateVariantCosts(
  attendances: (MealAttendance & { variant?: { variantCost: Decimal | number } | null })[]
): Decimal {
  return attendances.reduce((sum, attendance) => {
    if (attendance.variant) {
      const variantCost = attendance.variant.variantCost;
      const costDecimal =
        variantCost instanceof Decimal ? variantCost : new Decimal(variantCost);
      return sum.plus(costDecimal);
    }
    return sum;
  }, new Decimal(0));
}

/**
 * Aggregate costs from extra meal bookings
 * Extra meals are meals booked outside the regular meal plan
 *
 * @param extraMeals - Array of ExtraMealBooking records
 * @returns Total cost from extra meal bookings
 *
 * @example
 * // Student booked 3 extra meals: ₹100, ₹150, ₹100
 * aggregateExtraMealCosts(extraMeals) // Returns ₹350
 */
export function aggregateExtraMealCosts(
  extraMeals: (ExtraMealBooking & { totalCost: Decimal | number })[]
): Decimal {
  return extraMeals.reduce((sum, booking) => {
    const costDecimal =
      booking.totalCost instanceof Decimal
        ? booking.totalCost
        : new Decimal(booking.totalCost);
    return sum.plus(costDecimal);
  }, new Decimal(0));
}

/**
 * Calculate total bill amount from all cost components
 *
 * CRITICAL: Used to generate final bill amount for a student's enrollment
 *
 * @param baseCost - Pro-rated meal plan cost
 * @param variantCosts - Additional cost from premium variant choices
 * @param extraMealCosts - Cost from extra meal bookings
 * @param discount - Discount to apply (if any)
 * @returns Final bill total to charge student
 *
 * @formula totalAmount = baseCost + variantCosts + extraMealCosts - discount
 *
 * @example
 * // Complete billing example for mid-month enrollment
 * const baseCost = new Decimal(1500);           // Pro-rated plan cost
 * const variantCosts = new Decimal(200);        // Premium variants
 * const extraMealCosts = new Decimal(150);      // Extra meals
 * const discount = new Decimal(100);            // 10% discount
 * const total = calculateTotalBill(baseCost, variantCosts, extraMealCosts, discount);
 * // Result: ₹1750 (1500 + 200 + 150 - 100)
 */
export function calculateTotalBill(
  baseCost: Decimal,
  variantCosts: Decimal,
  extraMealCosts: Decimal,
  discount: Decimal
): Decimal {
  return baseCost
    .plus(variantCosts)
    .plus(extraMealCosts)
    .minus(discount);
}

/**
 * Get last day of month (convenience function)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date object representing last day of month
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0);
}

/**
 * Get first day of month (convenience function)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date object representing first day of month
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

/**
 * Validate if month/year are within reasonable bounds
 * @param year - Year to validate
 * @param month - Month to validate (1-12)
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateMonthYear(year: number, month: number): void {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12');
  }
  if (year < 2020 || year > 2100) {
    throw new Error('Year must be between 2020 and 2100');
  }
}
