import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ⚠️ CRITICAL SAFETY SERVICE
 *
 * This service implements life-critical allergen checking logic.
 * A single failure here could result in severe allergic reactions or death.
 *
 * Requirements:
 * 1. Get doctor-verified allergies for student
 * 2. Extract all ingredients from meal variant
 * 3. Cross-check each ingredient against allergies
 * 4. BLOCK serving if ANAPHYLAXIS severity detected
 * 5. Require manager override for SEVERE allergies
 * 6. Log all allergen checks with timestamp
 *
 * Zero tolerance for false negatives.
 */

export interface AllergenCheckResult {
  safe: boolean;
  studentId: string;
  variantId: string;
  timestamp: Date;
  conflictingAllergens?: {
    allergenId: string;
    allergenName: string;
    severity: string;
    studentSeverity: string;
    ingredientFoodItems: string[];
  }[];
  requiresManagerOverride: boolean;
  blockReason?: string;
  notes?: string;
}

export interface AllergenCheckLog {
  id: string;
  studentId: string;
  variantId: string;
  safe: boolean;
  conflictingAllergens: string;
  requiresOverride: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  checkTimestamp: Date;
  createdAt: Date;
}

class AllergenCheckerService {
  /**
   * PRIMARY SAFETY FUNCTION - CHECK IF STUDENT CAN SAFELY CONSUME A MEAL VARIANT
   *
   * This function MUST:
   * - Return false (NOT SAFE) if ANY anaphylaxis allergen is present
   * - Return false if ANY severe allergen is present (requires override)
   * - Cross-check 100% of ingredients
   * - Log all checks for audit trail
   */
  async checkMealVariant(
    studentId: string,
    variantId: string,
    schoolId: string
  ): Promise<AllergenCheckResult> {
    const startTime = new Date();

    try {
      // Step 1: Get student's doctor-verified allergies
      const studentAllergies = await prisma.studentAllergy.findMany({
        where: {
          studentId,
          schoolId,
          isActive: true,
          isVerified: true, // CRITICAL: Must be doctor-verified
        },
        include: {
          allergen: {
            select: {
              id: true,
              name: true,
              severity: true,
            },
          },
        },
      });

      // Step 2: Get meal variant details
      const variant = await prisma.mealVariant.findUnique({
        where: { id: variantId },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  foodItem: {
                    select: {
                      id: true,
                      name: true,
                      allergens: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!variant) {
        return {
          safe: false,
          studentId,
          variantId,
          timestamp: startTime,
          blockReason: 'Meal variant not found',
          requiresManagerOverride: false,
        };
      }

      // Step 3: Extract all allergens from meal ingredients
      const mealAllergens = new Set<string>();
      const allergenToFoodItems: Map<string, string[]> = new Map();

      if (variant.recipe?.ingredients) {
        for (const ingredient of variant.recipe.ingredients) {
          if (ingredient.foodItem.allergens && ingredient.foodItem.allergens.length > 0) {
            for (const allergenLink of ingredient.foodItem.allergens) {
              mealAllergens.add(allergenLink.allergenId);
              if (!allergenToFoodItems.has(allergenLink.allergenId)) {
                allergenToFoodItems.set(allergenLink.allergenId, []);
              }
              allergenToFoodItems.get(allergenLink.allergenId)?.push(ingredient.foodItem.name);
            }
          }
        }
      }

      // Step 4: Cross-check student allergies against meal allergens
      const conflictingAllergens: AllergenCheckResult['conflictingAllergens'] = [];
      let hasAnaphylaxis = false;
      let hasSevere = false;

      for (const studentAllergy of studentAllergies) {
        if (mealAllergens.has(studentAllergy.allergenId)) {
          const severity = studentAllergy.allergen.severity;

          // CRITICAL: Check for life-threatening severity
          if (severity === 'ANAPHYLAXIS') {
            hasAnaphylaxis = true;
          }
          if (severity === 'SEVERE') {
            hasSevere = true;
          }

          conflictingAllergens.push({
            allergenId: studentAllergy.allergenId,
            allergenName: studentAllergy.allergen.name,
            severity: studentAllergy.allergen.severity,
            studentSeverity: studentAllergy.severity,
            ingredientFoodItems: allergenToFoodItems.get(studentAllergy.allergenId) || [],
          });
        }
      }

      // Step 5: BLOCK if anaphylaxis detected
      if (hasAnaphylaxis) {
        await this.logCheck(
          studentId,
          variantId,
          false,
          conflictingAllergens,
          true,
          'ANAPHYLAXIS severity allergen detected - ABSOLUTE BLOCK'
        );

        return {
          safe: false,
          studentId,
          variantId,
          timestamp: startTime,
          conflictingAllergens,
          requiresManagerOverride: false,
          blockReason: 'CRITICAL: Meal contains life-threatening allergen (ANAPHYLAXIS)',
          notes: 'This meal CANNOT be served to this student under ANY circumstances',
        };
      }

      // Step 6: REQUIRE OVERRIDE if severe detected
      if (hasSevere) {
        await this.logCheck(
          studentId,
          variantId,
          false,
          conflictingAllergens,
          true,
          'SEVERE allergen detected - Requires manager override'
        );

        return {
          safe: false,
          studentId,
          variantId,
          timestamp: startTime,
          conflictingAllergens,
          requiresManagerOverride: true,
          blockReason: 'Meal contains SEVERE allergen - Manager override required',
          notes: 'Contact manager/doctor before serving',
        };
      }

      // Step 7: ALLOW if only mild/moderate
      if (conflictingAllergens.length > 0) {
        await this.logCheck(
          studentId,
          variantId,
          true,
          conflictingAllergens,
          false,
          'MILD/MODERATE allergens detected but safe to serve'
        );

        return {
          safe: true,
          studentId,
          variantId,
          timestamp: startTime,
          conflictingAllergens,
          requiresManagerOverride: false,
          notes: 'Meal safe to serve. Mild/moderate allergens present - student aware',
        };
      }

      // Step 8: SAFE - No conflicts
      await this.logCheck(studentId, variantId, true, [], false, 'No allergens detected');

      return {
        safe: true,
        studentId,
        variantId,
        timestamp: startTime,
        conflictingAllergens: [],
        requiresManagerOverride: false,
        notes: 'Meal safe to serve - no allergen conflicts',
      };

    } catch (error) {
      console.error('CRITICAL ERROR in allergen checker:', error);
      // FAIL SAFE: Block meal if checker errors
      return {
        safe: false,
        studentId,
        variantId,
        timestamp: startTime,
        blockReason: 'Allergen checker service error - blocking as safety precaution',
        requiresManagerOverride: false,
      };
    }
  }

  /**
   * Check multiple variants for a student
   */
  async checkMultipleVariants(
    studentId: string,
    variantIds: string[],
    schoolId: string
  ): Promise<AllergenCheckResult[]> {
    return Promise.all(
      variantIds.map(variantId => this.checkMealVariant(studentId, variantId, schoolId))
    );
  }

  /**
   * Get safe meal variants for a student
   */
  async getSafeMealVariants(studentId: string, schoolId: string): Promise<any[]> {
    try {
      const allVariants = await prisma.mealVariant.findMany({
        include: {
          meal: true,
          recipe: true,
        },
      });

      const safeVariants = [];
      for (const variant of allVariants) {
        const check = await this.checkMealVariant(studentId, variant.id, schoolId);
        if (check.safe) {
          safeVariants.push({ variant, check });
        }
      }

      return safeVariants;
    } catch (error) {
      console.error('Error getting safe meal variants:', error);
      return []; // FAIL SAFE: Return empty list on error
    }
  }

  /**
   * Log all allergen checks for audit trail
   */
  private async logCheck(
    studentId: string,
    variantId: string,
    safe: boolean,
    conflicts: any[],
    requiresOverride: boolean,
    reason: string
  ): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "AllergenCheck" (id, "studentId", "variantId", safe, "conflictingAllergens", "requiresOverride", reason, "createdAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      `, studentId, variantId, safe, JSON.stringify(conflicts), requiresOverride, reason);
    } catch (error) {
      console.error('Failed to log allergen check:', error);
      // Continue regardless - don't block meal service due to logging failure
    }
  }

  /**
   * Get check history for audit
   */
  async getCheckHistory(
    studentId?: string,
    limit: number = 100
  ): Promise<AllergenCheckLog[]> {
    try {
      let query = 'SELECT * FROM "AllergenCheck"';
      const params: any[] = [];

      if (studentId) {
        query += ' WHERE "studentId" = $1';
        params.push(studentId);
      }

      query += ' ORDER BY "createdAt" DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const logs = await prisma.$queryRawUnsafe(query, ...params);
      return logs as AllergenCheckLog[];
    } catch (error) {
      console.error('Error retrieving check history:', error);
      return [];
    }
  }

  /**
   * Manager override for severe allergens
   */
  async overrideCheck(
    studentId: string,
    variantId: string,
    managerUserId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Log the override for accountability
      await prisma.$executeRawUnsafe(`
        INSERT INTO "AllergenCheckOverride" (id, "studentId", "variantId", "overriddenBy", "overrideReason", "createdAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
      `, studentId, variantId, managerUserId, reason);

      return {
        success: true,
        message: 'Override recorded. Meal may be served with caution.',
      };
    } catch (error) {
      console.error('Error recording override:', error);
      return {
        success: false,
        message: 'Failed to record override',
      };
    }
  }
}

export const allergenCheckerService = new AllergenCheckerService();
