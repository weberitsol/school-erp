/**
 * Meal Variant Matcher Utilities
 * Handles matching students to safe meal variants based on dietary preferences and allergies
 */

export interface StudentDietaryProfile {
  studentId: string;
  variantPreference: 'VEG' | 'NON_VEG' | 'VEGAN' | 'ANY';
  verifiedAllergyIds: string[];
  severeAllergyIds: string[];
  anaphylaxisAllergyIds: string[];
  customRestrictions?: string[];
}

export interface VariantOption {
  variantId: string;
  variantType: 'VEG' | 'NON_VEG' | 'VEGAN';
  recipeName: string;
  cost: number;
  allergens: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MatchResult {
  studentId: string;
  recommended: VariantOption[];
  safe: VariantOption[];
  warning: VariantOption[];
  blocked: VariantOption[];
}

class MealVariantMatcher {
  /**
   * Match student profile to available variants
   */
  static matchStudent(
    studentProfile: StudentDietaryProfile,
    availableVariants: VariantOption[]
  ): MatchResult {
    const recommended: VariantOption[] = [];
    const safe: VariantOption[] = [];
    const warning: VariantOption[] = [];
    const blocked: VariantOption[] = [];

    availableVariants.forEach(variant => {
      // Check for anaphylaxis allergens (absolute block)
      const hasAnaphylaxis = variant.allergens.some(allergen =>
        studentProfile.anaphylaxisAllergyIds.includes(allergen)
      );

      if (hasAnaphylaxis) {
        blocked.push(variant);
        return;
      }

      // Check for severe allergens (warning)
      const hasSevere = variant.allergens.some(allergen =>
        studentProfile.severeAllergyIds.includes(allergen)
      );

      if (hasSevere) {
        warning.push(variant);
        return;
      }

      // Check for any verified allergies
      const hasAllergy = variant.allergens.some(allergen =>
        studentProfile.verifiedAllergyIds.includes(allergen)
      );

      if (hasAllergy) {
        warning.push(variant);
        return;
      }

      // Check dietary preference match
      const isPreferredType =
        studentProfile.variantPreference === 'ANY' ||
        studentProfile.variantPreference === variant.variantType;

      if (isPreferredType) {
        recommended.push(variant);
      } else {
        safe.push(variant);
      }
    });

    return {
      studentId: studentProfile.studentId,
      recommended,
      safe,
      warning,
      blocked,
    };
  }

  /**
   * Match multiple students and detect conflicts
   */
  static matchBatch(
    studentProfiles: StudentDietaryProfile[],
    variants: VariantOption[]
  ): {
    matches: MatchResult[];
    unblocked: number;
    blocked: number;
    warnings: number;
  } {
    const matches = studentProfiles.map(profile => this.matchStudent(profile, variants));

    const unblocked = matches.reduce(
      (sum, match) => sum + match.recommended.length + match.safe.length,
      0
    );

    const blocked = matches.reduce(
      (sum, match) => sum + match.blocked.length,
      0
    );

    const warnings = matches.reduce(
      (sum, match) => sum + match.warning.length,
      0
    );

    return { matches, unblocked, blocked, warnings };
  }

  /**
   * Get optimal variant combination for a meal considering all students
   */
  static getOptimalVariantSet(
    studentProfiles: StudentDietaryProfile[],
    availableVariants: VariantOption[]
  ): {
    optimal: VariantOption[];
    coverage: { percentage: number; details: Record<string, number> };
    recommendations: string[];
  } {
    const matches = studentProfiles.map(profile => this.matchStudent(profile, availableVariants));

    // Count how many students can eat each variant
    const variantCoverage: Record<string, Set<string>> = {};
    availableVariants.forEach(variant => {
      variantCoverage[variant.variantId] = new Set();
    });

    matches.forEach(match => {
      [...match.recommended, ...match.safe].forEach(variant => {
        variantCoverage[variant.variantId].add(match.studentId);
      });
    });

    // Sort variants by coverage
    const sortedVariants = availableVariants.sort((a, b) => {
      return (
        (variantCoverage[b.variantId]?.size || 0) -
        (variantCoverage[a.variantId]?.size || 0)
      );
    });

    // Select top N variants (usually 3: VEG, NON_VEG, VEGAN)
    const selected = new Set<string>();
    const types = new Set<string>();

    const optimal = sortedVariants.filter(variant => {
      if (types.has(variant.variantType)) return false;

      types.add(variant.variantType);
      selected.add(variant.variantId);

      return types.size <= 3; // Limit to 3 types
    });

    // Calculate coverage percentage
    const coveredStudents = new Set<string>();
    optimal.forEach(variant => {
      variantCoverage[variant.variantId]?.forEach(studentId => {
        coveredStudents.add(studentId);
      });
    });

    const coverage = {
      percentage:
        studentProfiles.length > 0
          ? Math.round((coveredStudents.size / studentProfiles.length) * 100)
          : 0,
      details: {},
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (coverage.percentage < 100) {
      const uncovered = studentProfiles.filter(
        p => !coveredStudents.has(p.studentId)
      );

      const allergyReasons = uncovered.filter(
        u => u.verifiedAllergyIds.length > 0 || u.severeAllergyIds.length > 0
      ).length;

      const preferenceReasons = uncovered.length - allergyReasons;

      if (allergyReasons > 0) {
        recommendations.push(
          `${allergyReasons} student(s) cannot eat optimal variants due to allergies. Consider adding alternative recipes.`
        );
      }

      if (preferenceReasons > 0) {
        recommendations.push(
          `${preferenceReasons} student(s) have dietary preference mismatches. Current selection may not accommodate all preferences.`
        );
      }
    } else {
      recommendations.push('All students can safely eat at least one variant.');
    }

    return {
      optimal,
      coverage,
      recommendations,
    };
  }

  /**
   * Analyze variant popularity and preferences
   */
  static analyzeVariantPreferences(
    studentProfiles: StudentDietaryProfile[]
  ): {
    vegPreference: number;
    nonVegPreference: number;
    veganPreference: number;
    anyPreference: number;
    percentages: Record<string, number>;
  } {
    let veg = 0;
    let nonVeg = 0;
    let vegan = 0;
    let any = 0;

    studentProfiles.forEach(profile => {
      switch (profile.variantPreference) {
        case 'VEG':
          veg++;
          break;
        case 'NON_VEG':
          nonVeg++;
          break;
        case 'VEGAN':
          vegan++;
          break;
        case 'ANY':
          any++;
          break;
      }
    });

    const total = studentProfiles.length;

    return {
      vegPreference: veg,
      nonVegPreference: nonVeg,
      veganPreference: vegan,
      anyPreference: any,
      percentages: {
        VEG: total > 0 ? Math.round((veg / total) * 100) : 0,
        NON_VEG: total > 0 ? Math.round((nonVeg / total) * 100) : 0,
        VEGAN: total > 0 ? Math.round((vegan / total) * 100) : 0,
        ANY: total > 0 ? Math.round((any / total) * 100) : 0,
      },
    };
  }

  /**
   * Find allergen-safe variants for a specific allergen
   */
  static findAllergenSafeVariants(
    variants: VariantOption[],
    allergenIds: string[]
  ): {
    safe: VariantOption[];
    unsafe: VariantOption[];
  } {
    const safe: VariantOption[] = [];
    const unsafe: VariantOption[] = [];

    variants.forEach(variant => {
      const hasConflict = variant.allergens.some(allergen =>
        allergenIds.includes(allergen)
      );

      if (hasConflict) {
        unsafe.push(variant);
      } else {
        safe.push(variant);
      }
    });

    return { safe, unsafe };
  }

  /**
   * Suggest variants based on nutritional targets
   */
  static suggestByNutrition(
    variants: VariantOption[],
    targetNutrition: { calories: number; protein: number; carbs: number; fat: number },
    tolerancePercent: number = 10
  ): {
    exactMatch: VariantOption[];
    closeMatch: VariantOption[];
    otherOptions: VariantOption[];
  } {
    const exactMatch: VariantOption[] = [];
    const closeMatch: VariantOption[] = [];
    const otherOptions: VariantOption[] = [];

    const tolerance = {
      calories: (targetNutrition.calories * tolerancePercent) / 100,
      protein: (targetNutrition.protein * tolerancePercent) / 100,
      carbs: (targetNutrition.carbs * tolerancePercent) / 100,
      fat: (targetNutrition.fat * tolerancePercent) / 100,
    };

    variants.forEach(variant => {
      const nutrition = variant.nutrition;

      const isExact =
        Math.abs(nutrition.calories - targetNutrition.calories) <= tolerance.calories &&
        Math.abs(nutrition.protein - targetNutrition.protein) <= tolerance.protein &&
        Math.abs(nutrition.carbs - targetNutrition.carbs) <= tolerance.carbs &&
        Math.abs(nutrition.fat - targetNutrition.fat) <= tolerance.fat;

      if (isExact) {
        exactMatch.push(variant);
        return;
      }

      const calorieMatch = Math.abs(nutrition.calories - targetNutrition.calories) <= tolerance.calories * 1.5;
      const proteinMatch = Math.abs(nutrition.protein - targetNutrition.protein) <= tolerance.protein * 1.5;

      if (calorieMatch && proteinMatch) {
        closeMatch.push(variant);
        return;
      }

      otherOptions.push(variant);
    });

    // Sort by how close they are to target
    closeMatch.sort((a, b) => {
      const aDiff =
        Math.abs(a.nutrition.calories - targetNutrition.calories) +
        Math.abs(a.nutrition.protein - targetNutrition.protein);

      const bDiff =
        Math.abs(b.nutrition.calories - targetNutrition.calories) +
        Math.abs(b.nutrition.protein - targetNutrition.protein);

      return aDiff - bDiff;
    });

    return { exactMatch, closeMatch, otherOptions };
  }

  /**
   * Calculate cost-effectiveness of variant selection
   */
  static analyzeCostEffectiveness(
    studentProfiles: StudentDietaryProfile[],
    variants: VariantOption[]
  ): {
    totalCost: number;
    avgCostPerStudent: number;
    costPerVariant: Record<string, number>;
    recommendations: string[];
  } {
    const matches = this.matchBatch(studentProfiles, variants);

    let totalCost = 0;
    const costPerVariant: Record<string, number> = {};

    matches.matches.forEach(match => {
      [...match.recommended, ...match.safe].forEach(variant => {
        costPerVariant[variant.variantId] =
          (costPerVariant[variant.variantId] || 0) + variant.cost;
      });

      totalCost += match.recommended.reduce((sum, v) => sum + v.cost, 0);
      totalCost += match.safe.reduce((sum, v) => sum + v.cost, 0);
    });

    const avgCostPerStudent =
      studentProfiles.length > 0
        ? Math.round((totalCost / studentProfiles.length) * 100) / 100
        : 0;

    const recommendations: string[] = [];

    // Find most cost-effective variants
    const sortedByEffectiveness = Object.entries(costPerVariant)
      .sort(([, costA], [, costB]) => costA - costB);

    const mostExpensive = sortedByEffectiveness[sortedByEffectiveness.length - 1];
    const mostCheap = sortedByEffectiveness[0];

    if (mostExpensive && mostCheap) {
      const costDiff = (mostExpensive[1] - mostCheap[1]).toFixed(2);
      recommendations.push(
        `Cost difference between variants: ₹${costDiff}. Consider most economical options.`
      );
    }

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      avgCostPerStudent,
      costPerVariant,
      recommendations,
    };
  }

  /**
   * Get compatibility matrix (which students can safely eat which variants)
   */
  static generateCompatibilityMatrix(
    studentProfiles: StudentDietaryProfile[],
    variants: VariantOption[]
  ): {
    matrix: Record<string, Record<string, boolean>>;
    summary: { safe: number; unsafe: number; percent: number };
  } {
    const matrix: Record<string, Record<string, boolean>> = {};

    studentProfiles.forEach(student => {
      matrix[student.studentId] = {};

      variants.forEach(variant => {
        // Check if student can safely eat this variant
        const hasAnaphylaxis = variant.allergens.some(allergen =>
          student.anaphylaxisAllergyIds.includes(allergen)
        );

        const hasSevere = variant.allergens.some(allergen =>
          student.severeAllergyIds.includes(allergen)
        );

        const hasAllergy = variant.allergens.some(allergen =>
          student.verifiedAllergyIds.includes(allergen)
        );

        matrix[student.studentId][variant.variantId] = !hasAnaphylaxis && !hasSevere && !hasAllergy;
      });
    });

    // Calculate summary
    let safe = 0;
    let total = 0;

    Object.values(matrix).forEach(studentMatrix => {
      Object.values(studentMatrix).forEach(isSafe => {
        if (isSafe) safe++;
        total++;
      });
    });

    return {
      matrix,
      summary: {
        safe,
        unsafe: total - safe,
        percent: total > 0 ? Math.round((safe / total) * 100) : 0,
      },
    };
  }
}

export default MealVariantMatcher;
