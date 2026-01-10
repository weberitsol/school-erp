/**
 * ⚠️ CRITICAL ALLERGEN VALIDATION UTILITY
 *
 * This utility provides helper functions for allergen validation.
 * Used by AllergenCheckerService and MenuApprovalService.
 *
 * A single validation error could result in severe allergic reaction.
 * Zero tolerance for false negatives.
 */

export class AllergyValidator {
  /**
   * Severity levels and their risk profiles
   */
  static readonly SEVERITY_LEVELS = {
    MILD: {
      level: 1,
      description: 'Mild reaction (itching, minor swelling)',
      blocksService: false,
      requiresOverride: false,
    },
    MODERATE: {
      level: 2,
      description: 'Moderate reaction (rash, swelling, breathing difficulty)',
      blocksService: false,
      requiresOverride: false,
    },
    SEVERE: {
      level: 3,
      description: 'Severe reaction (anaphylaxis risk, hospitalization risk)',
      blocksService: true,
      requiresOverride: true,
    },
    ANAPHYLAXIS: {
      level: 4,
      description: 'Life-threatening (death risk without immediate treatment)',
      blocksService: true,
      requiresOverride: false, // Cannot override under any circumstances
    },
  };

  /**
   * Validate if a student can consume a specific ingredient
   */
  static validateIngredient(
    studentAllergenIds: string[],
    ingredientAllergenIds: string[]
  ): {
    safe: boolean;
    conflicts: string[];
  } {
    const conflicts = studentAllergenIds.filter(id => ingredientAllergenIds.includes(id));

    return {
      safe: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * Validate if ingredients contain any critical allergens
   */
  static validateRecipeIngredients(
    studentCriticalAllergens: Array<{ id: string; severity: string }>,
    recipeIngredients: Array<{ allergenIds: string[] }>
  ): {
    safe: boolean;
    anaphylaxisRisk: boolean;
    severeRisk: boolean;
    conflicts: Array<{
      allergenId: string;
      severity: string;
    }>;
  } {
    const conflicts: Array<{ allergenId: string; severity: string }> = [];
    let anaphylaxisRisk = false;
    let severeRisk = false;

    // Collect all allergens in recipe
    const recipeAllergens = new Set<string>();
    for (const ingredient of recipeIngredients) {
      ingredient.allergenIds.forEach(id => recipeAllergens.add(id));
    }

    // Check against student allergies
    for (const studentAllergen of studentCriticalAllergens) {
      if (recipeAllergens.has(studentAllergen.id)) {
        conflicts.push({
          allergenId: studentAllergen.id,
          severity: studentAllergen.severity,
        });

        if (studentAllergen.severity === 'ANAPHYLAXIS') {
          anaphylaxisRisk = true;
        } else if (studentAllergen.severity === 'SEVERE') {
          severeRisk = true;
        }
      }
    }

    return {
      safe: conflicts.length === 0,
      anaphylaxisRisk,
      severeRisk,
      conflicts,
    };
  }

  /**
   * Determine if meal can be served
   * CRITICAL: Must correctly handle all severity levels
   */
  static determineMealServicePermission(
    anaphylaxisRisk: boolean,
    severeRisk: boolean,
    mildRisk: boolean
  ): {
    allowed: boolean;
    requiresOverride: boolean;
    blockReason?: string;
  } {
    // ABSOLUTE BLOCK for anaphylaxis
    if (anaphylaxisRisk) {
      return {
        allowed: false,
        requiresOverride: false,
        blockReason: 'CRITICAL: Meal contains life-threatening allergen (ANAPHYLAXIS)',
      };
    }

    // REQUIRES OVERRIDE for severe
    if (severeRisk) {
      return {
        allowed: false,
        requiresOverride: true,
        blockReason: 'Meal contains SEVERE allergen - Manager override required',
      };
    }

    // ALLOWED for mild/moderate
    return {
      allowed: true,
      requiresOverride: false,
    };
  }

  /**
   * Validate doctor verification document
   */
  static validateDoctorVerification(
    doctorName?: string,
    doctorContact?: string,
    documentUrl?: string,
    verificationDate?: Date
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!doctorName || doctorName.trim().length === 0) {
      errors.push('Doctor name is required');
    }

    if (!doctorContact || doctorContact.trim().length === 0) {
      errors.push('Doctor contact is required');
    }

    if (!documentUrl || documentUrl.trim().length === 0) {
      errors.push('Verification document URL is required');
    }

    if (!verificationDate) {
      errors.push('Verification date is required');
    } else {
      const verificationAge = new Date().getTime() - verificationDate.getTime();
      const yearsOld = verificationAge / (365 * 24 * 60 * 60 * 1000);
      // Verification older than 2 years should be renewed
      if (yearsOld > 2) {
        errors.push('Doctor verification is older than 2 years - renewal recommended');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate safety report for a student
   */
  static generateSafetyReport(
    studentName: string,
    allergies: Array<{
      allergenName: string;
      severity: string;
      isVerified: boolean;
    }>
  ): string {
    let report = `\n=== ALLERGY SAFETY REPORT ===\nStudent: ${studentName}\n`;
    report += `Total Allergies: ${allergies.length}\n`;
    report += `Verified Allergies: ${allergies.filter(a => a.isVerified).length}\n\n`;

    const critical = allergies.filter(a => a.severity === 'ANAPHYLAXIS' || a.severity === 'SEVERE');
    if (critical.length > 0) {
      report += '⚠️ CRITICAL ALLERGENS:\n';
      critical.forEach(a => {
        report += `  - ${a.allergenName} (${a.severity})${a.isVerified ? ' [VERIFIED]' : ' [UNVERIFIED]'}\n`;
      });
    }

    const moderate = allergies.filter(
      a => a.severity === 'MODERATE'
    );
    if (moderate.length > 0) {
      report += '\nMODERATE ALLERGENS:\n';
      moderate.forEach(a => {
        report += `  - ${a.allergenName}${a.isVerified ? ' [VERIFIED]' : ' [UNVERIFIED]'}\n`;
      });
    }

    const mild = allergies.filter(a => a.severity === 'MILD');
    if (mild.length > 0) {
      report += '\nMILD ALLERGENS:\n';
      mild.forEach(a => {
        report += `  - ${a.allergenName}\n`;
      });
    }

    report += '\n⚠️ IMPORTANT: Students with ANAPHYLAXIS allergies cannot be served any meal containing the allergen.\n';
    report += '⚠️ Students with SEVERE allergies require manager approval before serving.\n';
    report += '=== END REPORT ===\n';

    return report;
  }

  /**
   * Validate allergen severity level
   */
  static isValidSeverity(
    severity: string
  ): severity is 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS' {
    return ['MILD', 'MODERATE', 'SEVERE', 'ANAPHYLAXIS'].includes(severity);
  }

  /**
   * Get severity level rank (for comparison)
   */
  static getSeverityRank(severity: string): number {
    const ranking: { [key: string]: number } = {
      MILD: 1,
      MODERATE: 2,
      SEVERE: 3,
      ANAPHYLAXIS: 4,
    };
    return ranking[severity] || 0;
  }

  /**
   * Check if severity level is critical
   */
  static isCriticalSeverity(severity: string): boolean {
    return severity === 'SEVERE' || severity === 'ANAPHYLAXIS';
  }

  /**
   * Format allergen report for kitchen staff
   */
  static formatKitchenAlert(
    studentName: string,
    criticalAllergens: string[]
  ): string {
    if (criticalAllergens.length === 0) {
      return `✓ ${studentName}: No critical allergens`;
    }

    return `⚠️ ALERT: ${studentName} is allergic to:\n${criticalAllergens
      .map(a => `  🚫 ${a}`)
      .join('\n')}`;
  }
}

export default AllergyValidator;
