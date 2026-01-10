/**
 * Menu Planning Utilities
 * Handles menu generation, optimization, and meal planning logic
 */

export interface MenuPlanRequest {
  messId: string;
  schoolId: string;
  startDate: Date;
  endDate: Date;
  mealsPerDay: ('BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK')[];
  mealPlanId?: string;
  includeVariants: boolean;
  targetNutrition?: {
    caloriesPerMeal: number;
    proteinPerMeal: number;
  };
}

export interface MenuPlanSuggestion {
  date: Date;
  dayOfWeek: string;
  meals: Array<{
    type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    suggestedRecipes: Array<{
      id: string;
      name: string;
      cost: number;
      estimatedCalories: number;
      type: 'VEG' | 'NON_VEG' | 'VEGAN';
    }>;
    serveTimeStart: string;
    serveTimeEnd: string;
  }>;
}

class MenuPlanner {
  /**
   * Generate standard meal times based on meal types
   */
  static getMealTimes(mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'): {
    start: string;
    end: string;
  } {
    const times: Record<string, { start: string; end: string }> = {
      BREAKFAST: { start: '07:00', end: '09:00' },
      LUNCH: { start: '12:00', end: '14:00' },
      DINNER: { start: '19:00', end: '21:00' },
      SNACK: { start: '16:00', end: '17:00' },
    };

    return times[mealType] || times.LUNCH;
  }

  /**
   * Get day of week name
   */
  static getDayOfWeek(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Check if date is likely holiday based on standard Indian holidays
   * Note: This is a simplified check - actual implementation should use holiday calendar
   */
  static isLikelyHoliday(date: Date): boolean {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Common Indian holidays (simplified)
    const holidays = [
      { month: 1, day: 26 }, // Republic Day
      { month: 3, day: 8 }, // Maha Shivaratri (approximate)
      { month: 4, day: 21 }, // Ram Navami (approximate)
      { month: 4, day: 29 }, // Easter (approximate)
      { month: 5, day: 23 }, // Buddha Purnima (approximate)
      { month: 7, day: 17 }, // Muharram (approximate)
      { month: 8, day: 15 }, // Independence Day
      { month: 8, day: 26 }, // Janmashtami (approximate)
      { month: 9, day: 16 }, // Milad-un-Nabi (approximate)
      { month: 9, day: 29 }, // Dussehra (approximate)
      { month: 10, day: 2 }, // Gandhi Jayanti
      { month: 10, day: 24 }, // Diwali (approximate)
      { month: 11, day: 1 }, // Diwali (Day after - approximate)
      { month: 12, day: 25 }, // Christmas
    ];

    return holidays.some(holiday => holiday.month === month && holiday.day === day);
  }

  /**
   * Calculate date range
   */
  static getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Get week number of a date
   */
  static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Generate menu structure for a date range
   */
  static generateMenuStructure(
    startDate: Date,
    endDate: Date,
    mealsPerDay: ('BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK')[]
  ): MenuPlanSuggestion[] {
    const dates = this.getDateRange(startDate, endDate);

    return dates
      .filter(date => {
        // Skip weekends and holidays
        // Comment out if you want to include them
        // return !this.isWeekend(date) && !this.isLikelyHoliday(date);
        return true; // Include all dates
      })
      .map(date => ({
        date,
        dayOfWeek: this.getDayOfWeek(date),
        meals: mealsPerDay.map(mealType => ({
          type: mealType,
          suggestedRecipes: [],
          serveTimeStart: this.getMealTimes(mealType).start,
          serveTimeEnd: this.getMealTimes(mealType).end,
        })),
      }));
  }

  /**
   * Suggest menu variants (VEG, NON_VEG, VEGAN distribution)
   */
  static getVariantSuggestion(dayOfWeek: string, mealType: string): {
    primary: 'VEG' | 'NON_VEG' | 'VEGAN';
    alternates: ('VEG' | 'NON_VEG' | 'VEGAN')[];
  } {
    // Suggest variant distribution based on meal type and day
    const suggestions: Record<string, { primary: 'VEG' | 'NON_VEG' | 'VEGAN'; alternates: ('VEG' | 'NON_VEG' | 'VEGAN')[] }> = {
      BREAKFAST: {
        primary: 'VEG',
        alternates: ['VEGAN'],
      },
      LUNCH: {
        primary: 'NON_VEG',
        alternates: ['VEG', 'VEGAN'],
      },
      DINNER: {
        primary: 'VEG',
        alternates: ['NON_VEG', 'VEGAN'],
      },
      SNACK: {
        primary: 'VEG',
        alternates: ['VEGAN'],
      },
    };

    return suggestions[mealType] || suggestions.LUNCH;
  }

  /**
   * Calculate nutritional targets for a meal
   */
  static calculateNutritionTarget(
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  ): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    // Daily target: 2000 calories, 65g protein, 250g carbs, 65g fat
    // Distribute based on meal type
    const targets: Record<string, any> = {
      BREAKFAST: { calories: 400, protein: 15, carbs: 60, fat: 12 },
      LUNCH: { calories: 700, protein: 25, carbs: 95, fat: 20 },
      DINNER: { calories: 600, protein: 20, carbs: 80, fat: 18 },
      SNACK: { calories: 300, protein: 10, carbs: 45, fat: 10 },
    };

    return targets[mealType] || targets.LUNCH;
  }

  /**
   * Estimate menu cost for a date range
   */
  static estimateMenuCost(
    menuPlan: MenuPlanSuggestion[],
    recipeCosts: Map<string, number>,
    studentsEnrolled: number
  ): {
    totalCost: number;
    costPerStudent: number;
    costPerDay: number;
    breakdown: Record<string, number>;
  } {
    let totalCost = 0;
    const breakdown: Record<string, number> = {};

    let mealCount = 0;
    menuPlan.forEach(menu => {
      menu.meals.forEach(meal => {
        const avgRecipeCost =
          Array.from(recipeCosts.values()).reduce((a, b) => a + b, 0) /
          recipeCosts.size;
        totalCost += avgRecipeCost;
        mealCount++;

        breakdown[meal.type] = (breakdown[meal.type] || 0) + avgRecipeCost;
      });
    });

    const costPerStudent = studentsEnrolled > 0 ? totalCost / studentsEnrolled : 0;
    const costPerDay = mealCount > 0 ? totalCost / (menuPlan.length || 1) : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costPerStudent: Math.round(costPerStudent * 100) / 100,
      costPerDay: Math.round(costPerDay * 100) / 100,
      breakdown,
    };
  }

  /**
   * Check menu diversity (no repeated meals within N days)
   */
  static checkMenuDiversity(
    menuPlan: MenuPlanSuggestion[],
    minDaysBetweenRepeat: number = 7
  ): {
    isDiverse: boolean;
    repeats: Array<{ meal: string; date1: string; date2: string; daysBetween: number }>;
  } {
    const repeats: Array<any> = [];
    const mealHistory: Record<string, string[]> = {};

    menuPlan.forEach((menu, index) => {
      menu.meals.forEach(meal => {
        const key = `${meal.type}-${meal.suggestedRecipes[0]?.id || 'empty'}`;

        if (!mealHistory[key]) {
          mealHistory[key] = [];
        }

        const dates = mealHistory[key];
        if (dates.length > 0) {
          const lastDate = new Date(dates[dates.length - 1]);
          const currentDate = new Date(menu.date);
          const daysBetween = Math.floor(
            (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysBetween < minDaysBetweenRepeat) {
            repeats.push({
              meal: key,
              date1: lastDate.toISOString().split('T')[0],
              date2: currentDate.toISOString().split('T')[0],
              daysBetween,
            });
          }
        }

        dates.push(menu.date.toISOString());
      });
    });

    return {
      isDiverse: repeats.length === 0,
      repeats,
    };
  }

  /**
   * Generate menu approval checklist
   */
  static generateApprovalChecklist(menuPlan: MenuPlanSuggestion[]): {
    totalMeals: number;
    completeMeals: number;
    missingVariants: string[];
    issues: string[];
  } {
    const issues: string[] = [];
    let completeMeals = 0;
    const missingVariants: string[] = [];

    menuPlan.forEach((menu, index) => {
      menu.meals.forEach(meal => {
        if (meal.suggestedRecipes.length === 0) {
          issues.push(`No recipes suggested for ${menu.dayOfWeek} ${meal.type}`);
          missingVariants.push(`${index}:${meal.type}`);
        } else if (meal.suggestedRecipes.length >= 2) {
          completeMeals++;
        }
      });
    });

    return {
      totalMeals: menuPlan.reduce((sum, m) => sum + m.meals.length, 0),
      completeMeals,
      missingVariants,
      issues,
    };
  }

  /**
   * Clone previous week's menu pattern
   */
  static cloneWeekPattern(
    previousWeekStart: Date,
    newWeekStart: Date
  ): {
    sourceWeek: Date[];
    targetWeek: Date[];
  } {
    const sourceWeek = this.getDateRange(
      previousWeekStart,
      new Date(previousWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    );

    const targetWeek = this.getDateRange(
      newWeekStart,
      new Date(newWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    );

    return { sourceWeek, targetWeek };
  }

  /**
   * Suggest next month's menu based on patterns
   */
  static generateNextMonthSuggestions(
    currentMonth: Date,
    mealsPerDay: ('BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK')[]
  ): MenuPlanSuggestion[] {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const firstDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);

    return this.generateMenuStructure(firstDay, lastDay, mealsPerDay);
  }
}

export default MenuPlanner;
