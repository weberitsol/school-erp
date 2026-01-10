/**
 * ⚠️ CRITICAL FOOD SAFETY CHECKER UTILITY
 *
 * Enforces daily hygiene verification before meal service.
 * No food can be served if today's hygiene check is not passed.
 *
 * Critical rules:
 * 1. Minimum score: 50/100 for meal service approval
 * 2. All 10 items must be checked (none can be 0 unless failed)
 * 3. Failed checks require documented corrections
 * 4. Daily check must be completed before breakfast
 */

export class FoodSafetyChecker {
  /**
   * Hygiene item scoring rubric (0-5 scale)
   */
  static readonly HYGIENE_RUBRIC = {
    kitchenCleanliness: {
      0: 'Visibly dirty, filthy, contaminated surfaces',
      1: 'Dirty, needs immediate cleaning',
      2: 'Partially clean, some dirt visible',
      3: 'Generally clean, minor spots',
      4: 'Clean, well-maintained',
      5: 'Immaculate, regularly inspected',
    },
    handHygiene: {
      0: 'Staff not washing hands, visible contamination',
      1: 'Irregular hand washing',
      2: 'Hand washing at intervals',
      3: 'Good hand washing practices',
      4: 'Excellent, with hand sanitizer available',
      5: 'Perfect compliance, double-checked',
    },
    foodStorage: {
      0: 'Food stored incorrectly, contamination risk',
      1: 'Improper storage, temperature concerns',
      2: 'Partially correct storage',
      3: 'Proper storage for most items',
      4: 'Correct storage, proper labeling',
      5: 'Perfect FIFO rotation, all labeled with dates',
    },
    cookingArea: {
      0: 'Hazardous, dangerous surfaces',
      1: 'Dirty, needs cleaning',
      2: 'Partially clean',
      3: 'Generally clean',
      4: 'Clean and organized',
      5: 'Spotless, perfectly organized',
    },
    wasteManagement: {
      0: 'No waste management, trash overflowing',
      1: 'Inadequate waste handling',
      2: 'Basic waste management',
      3: 'Proper waste segregation',
      4: 'Good waste management system',
      5: 'Excellent system with regular disposal',
    },
    equipmentMaintenance: {
      0: 'Equipment broken or non-functional',
      1: 'Equipment dirty, poor maintenance',
      2: 'Equipment functional but needs cleaning',
      3: 'Equipment clean and functional',
      4: 'Well-maintained equipment',
      5: 'Perfect maintenance, documented checks',
    },
    temperatureControl: {
      0: 'No temperature control',
      1: 'Irregular temperature monitoring',
      2: 'Basic temperature control',
      3: 'Regular monitoring',
      4: 'Good monitoring with records',
      5: 'Perfect monitoring with log, proper storage temps',
    },
    pestControl: {
      0: 'Evidence of pests',
      1: 'No preventive measures',
      2: 'Minimal pest control',
      3: 'Basic pest control measures',
      4: 'Regular pest control program',
      5: 'Comprehensive pest control with documentation',
    },
    staffUniforms: {
      0: 'No uniforms, dirty clothes',
      1: 'Uniforms not used or very dirty',
      2: 'Basic uniforms, some cleanliness issues',
      3: 'Uniforms worn, generally clean',
      4: 'Clean uniforms regularly replaced',
      5: 'Perfect uniforms, changed daily, impeccable',
    },
    waterQuality: {
      0: 'Contaminated water',
      1: 'Water quality not checked',
      2: 'Occasional water testing',
      3: 'Regular water testing',
      4: 'Good water quality verification',
      5: 'Daily testing with records, perfect standards',
    },
  };

  /**
   * Validate hygiene score
   */
  static validateScore(scores: number[]): {
    valid: boolean;
    total: number;
    percentage: number;
    passed: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (scores.length !== 10) {
      errors.push(`Expected 10 items, got ${scores.length}`);
    }

    // Check each score is in valid range
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] < 0 || scores[i] > 5) {
        errors.push(`Item ${i + 1}: Score must be 0-5, got ${scores[i]}`);
      }
    }

    const total = scores.reduce((a, b) => a + b, 0);
    const percentage = (total / 50) * 100; // Max score is 10 items * 5 = 50
    const passed = percentage >= 50;

    return {
      valid: errors.length === 0,
      total,
      percentage: Math.round(percentage),
      passed,
      errors,
    };
  }

  /**
   * Generate detailed issue report
   */
  static generateIssueReport(
    scores: {
      [key: string]: number;
    },
    itemNames: string[]
  ): string {
    let report = '\n=== KITCHEN HYGIENE ISSUES REPORT ===\n';

    const entries = Object.entries(scores);
    let criticalIssues = 0;
    let minorIssues = 0;

    for (let i = 0; i < entries.length; i++) {
      const [item, score] = entries[i];
      if (score < 3) {
        const severity = score <= 1 ? 'CRITICAL' : 'MAJOR';
        report += `${severity}: ${item} (Score: ${score}/5)\n`;
        if (score <= 1) criticalIssues++;
        else minorIssues++;
      }
    }

    report += `\nTotal Critical Issues: ${criticalIssues}\n`;
    report += `Total Minor Issues: ${minorIssues}\n`;

    if (criticalIssues > 0) {
      report += '\n⚠️ CRITICAL ISSUES FOUND - MEAL SERVICE MUST BE HALTED\n';
    } else if (minorIssues > 0) {
      report += '\n⚠️ Issues found - Corrections must be made\n';
    } else {
      report += '\n✓ No issues found - Meal service approved\n';
    }

    report += '=== END REPORT ===\n';
    return report;
  }

  /**
   * Create correction checklist
   */
  static createCorrectionChecklist(issues: string[]): string {
    let checklist = '\n=== CORRECTIONS REQUIRED ===\n';
    issues.forEach((issue, idx) => {
      checklist += `[ ] ${idx + 1}. ${issue}\n`;
    });
    checklist += '\nManager Signature: _________ Date: _________\n';
    checklist += '=== END CHECKLIST ===\n';
    return checklist;
  }

  /**
   * Determine meal service permission
   */
  static determineMealServicePermission(
    checkExists: boolean,
    checkPassed: boolean,
    percentage: number
  ): {
    allowed: boolean;
    reason: string;
    action: string;
  } {
    if (!checkExists) {
      return {
        allowed: false,
        reason: 'No hygiene check completed today',
        action: 'BLOCK - Complete daily hygiene check before meal service',
      };
    }

    if (!checkPassed) {
      return {
        allowed: false,
        reason: `Hygiene check failed with score ${percentage}%`,
        action: `BLOCK - Score must be at least 50%. Current: ${percentage}%. Fix issues and recheck.`,
      };
    }

    return {
      allowed: true,
      reason: `Hygiene check passed with score ${percentage}%`,
      action: 'ALLOW - Meal service approved',
    };
  }

  /**
   * Format alert for kitchen staff
   */
  static formatKitchenAlert(
    messName: string,
    checkStatus: 'PASSED' | 'FAILED' | 'PENDING'
  ): string {
    let alert = `\n${'='.repeat(50)}\n`;

    if (checkStatus === 'PASSED') {
      alert += `✓ ${messName} - CLEARED FOR MEAL SERVICE\n`;
      alert += `Today's hygiene check passed. Safe to serve food.\n`;
    } else if (checkStatus === 'FAILED') {
      alert += `⚠️ ${messName} - MEAL SERVICE BLOCKED\n`;
      alert += `Today's hygiene check FAILED. Cannot serve food.\n`;
      alert += `Manager must review and approve corrections.\n`;
    } else {
      alert += `⏳ ${messName} - PENDING\n`;
      alert += `Hygiene check not completed. Cannot serve food.\n`;
      alert += `Complete check before meal service begins.\n`;
    }

    alert += `${'='.repeat(50)}\n`;
    return alert;
  }

  /**
   * Calculate compliance trend
   */
  static calculateComplianceTrend(
    scores: Array<{ percentage: number; date: Date }>
  ): {
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'CRITICAL';
    message: string;
    averageScore: number;
  } {
    if (scores.length === 0) {
      return { trend: 'STABLE', message: 'No data available', averageScore: 0 };
    }

    const avg = scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length;

    if (scores.length < 3) {
      return { trend: 'STABLE', message: 'Insufficient data for trend analysis', averageScore: avg };
    }

    // Check recent vs older scores
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));

    const recentAvg = recent.reduce((sum, s) => sum + s.percentage, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.percentage, 0) / older.length;

    const difference = recentAvg - olderAvg;

    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'CRITICAL' = 'STABLE';
    let message = 'Compliance trend is stable';

    if (recentAvg < 50) {
      trend = 'CRITICAL';
      message = 'CRITICAL: Multiple failed checks - Immediate action required';
    } else if (difference > 5) {
      trend = 'IMPROVING';
      message = 'Compliance is improving';
    } else if (difference < -5) {
      trend = 'DECLINING';
      message = 'Compliance is declining - Investigate issues';
    }

    return { trend, message, averageScore: avg };
  }

  /**
   * Validate hygiene check date/time
   */
  static validateCheckTiming(checkDate: Date): {
    valid: boolean;
    isToday: boolean;
    message: string;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDateOnly = new Date(checkDate);
    checkDateOnly.setHours(0, 0, 0, 0);

    const isToday = checkDateOnly.getTime() === today.getTime();

    if (!isToday) {
      return {
        valid: false,
        isToday: false,
        message: 'Check date must be today',
      };
    }

    return {
      valid: true,
      isToday: true,
      message: 'Check date is valid',
    };
  }
}

export default FoodSafetyChecker;
