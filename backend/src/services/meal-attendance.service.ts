import { PrismaClient, Prisma, MealAttendanceStatus } from '@prisma/client';
import { allergenCheckerService } from './allergen-checker.service';
import { enrollmentService } from './enrollment.service';

const prisma = new PrismaClient();

export interface MarkAttendanceData {
  studentId: string;
  enrollmentId: string;
  mealId: string;
  variantId?: string;
  status: MealAttendanceStatus;
  attendanceDate: Date;
  schoolId: string;
}

export interface SafeVariant {
  id: string;
  variantType: string;
  variantCost: number;
  description?: string;
  isSafe: boolean;
  requiresOverride: boolean;
  conflictingAllergens: Array<{
    allergenName: string;
    severity: string;
  }>;
}

class MealAttendanceService {
  /**
   * Mark meal attendance for a student
   * CRITICAL: Must validate allergen safety before marking attendance
   */
  async markAttendance(data: MarkAttendanceData) {
    // Verify enrollment exists and is active by looking it up directly
    const enrollment = await prisma.messEnrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        student: true,
        mess: true,
        plan: true,
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      throw new Error(
        'Student does not have an active enrollment for this mess facility'
      );
    }

    // Verify meal exists
    const meal = await prisma.meal.findUnique({
      where: { id: data.mealId },
      include: {
        variants: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    foodItem: {
                      include: {
                        allergens: {
                          include: { allergen: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    let allergyVerified = false;

    // If variant specified, verify allergen safety
    if (data.variantId) {
      const variant = meal.variants.find((v) => v.id === data.variantId);
      if (!variant) {
        throw new Error('Meal variant not found for this meal');
      }

      // Check allergen safety for this variant
      const allergenCheck = await allergenCheckerService.checkMealVariant(
        data.studentId,
        data.variantId,
        data.schoolId
      );

      if (!allergenCheck.safe && !allergenCheck.requiresManagerOverride) {
        const allergenNames = allergenCheck.conflictingAllergens
          ?.map((a) => a.allergenName)
          .join(', ') || 'Unknown allergens';
        throw new Error(
          `CRITICAL: Meal contains life-threatening allergen(s): ${allergenNames}. Meal service BLOCKED.`
        );
      }

      allergyVerified = allergenCheck.safe;
    }

    // Check if attendance already exists for this meal on this date
    const existingAttendance = await prisma.mealAttendance.findUnique({
      where: {
        enrollmentId_mealId: {
          enrollmentId: data.enrollmentId,
          mealId: data.mealId,
        },
      },
    });

    if (existingAttendance) {
      // Update existing attendance
      const updated = await prisma.mealAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          variantId: data.variantId,
          status: data.status,
          attendanceDate: data.attendanceDate,
          allergyVerified,
          updatedAt: new Date(),
        },
        include: {
          meal: true,
          variant: true,
          enrollment: {
            include: {
              student: true,
            },
          },
        },
      });

      return updated;
    }

    // Create new attendance record
    const attendance = await prisma.mealAttendance.create({
      data: {
        enrollmentId: data.enrollmentId,
        mealId: data.mealId,
        variantId: data.variantId,
        status: data.status,
        attendanceDate: data.attendanceDate,
        allergyVerified,
        schoolId: data.schoolId,
      },
      include: {
        meal: true,
        variant: true,
        enrollment: {
          include: {
            student: true,
          },
        },
      },
    });

    return attendance;
  }

  /**
   * Get safe meal variants for a student
   * CRITICAL: Filters variants to show only those safe for student's allergies
   * Returns variants with allergen conflict information
   */
  async getSafeVariants(
    studentId: string,
    mealId: string,
    schoolId: string
  ): Promise<SafeVariant[]> {
    // Get meal with all variants
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        variants: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    foodItem: {
                      include: {
                        allergens: {
                          include: { allergen: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    // Get student's allergies
    const studentAllergies = await prisma.studentAllergy.findMany({
      where: {
        studentId,
        isVerified: true,
        isActive: true,
      },
      include: {
        allergen: true,
      },
    });

    // Check each variant for allergen conflicts
    const safeVariants: SafeVariant[] = [];

    for (const variant of meal.variants) {
      const allergenCheck = await allergenCheckerService.checkMealVariant(
        studentId,
        variant.id,
        schoolId
      );

      safeVariants.push({
        id: variant.id,
        variantType: variant.variantType,
        variantCost: Number(variant.variantCost),
        description: variant.description || undefined,
        isSafe: allergenCheck.safe,
        requiresOverride: allergenCheck.requiresManagerOverride,
        conflictingAllergens: allergenCheck.conflictingAllergens ?? [],
      });
    }

    return safeVariants;
  }

  /**
   * Get attendance by ID
   */
  async getById(id: string) {
    const attendance = await prisma.mealAttendance.findUnique({
      where: { id },
      include: {
        meal: true,
        variant: true,
        enrollment: {
          include: {
            student: true,
            mess: true,
          },
        },
      },
    });

    return attendance;
  }

  /**
   * Get all attendances with filters
   */
  async getAll(filters?: {
    enrollmentId?: string;
    mealId?: string;
    schoolId?: string;
    status?: MealAttendanceStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: any[]; total: number }> {
    const where: Prisma.MealAttendanceWhereInput = {};

    if (filters?.enrollmentId) where.enrollmentId = filters.enrollmentId;
    if (filters?.mealId) where.mealId = filters.mealId;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.status) where.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      where.attendanceDate = {};
      if (filters?.startDate) where.attendanceDate.gte = filters.startDate;
      if (filters?.endDate) where.attendanceDate.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.mealAttendance.findMany({
        where,
        include: {
          meal: true,
          variant: true,
          enrollment: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { attendanceDate: 'desc' },
      }),
      prisma.mealAttendance.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get monthly attendance summary for a student
   * Used for billing calculation
   */
  async getMonthlyAttendance(
    enrollmentId: string,
    year: number,
    month: number
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await prisma.mealAttendance.findMany({
      where: {
        enrollmentId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        variant: true,
        meal: true,
      },
      orderBy: { attendanceDate: 'asc' },
    });

    const summary = {
      enrollmentId,
      month,
      year,
      totalDays: endDate.getDate(),
      presentCount: attendances.filter((a) => a.status === 'PRESENT').length,
      absentCount: attendances.filter((a) => a.status === 'ABSENT').length,
      holidayCount: attendances.filter((a) => a.status === 'HOLIDAY').length,
      allergyVerifiedCount: attendances.filter((a) => a.allergyVerified).length,
      totalCost: attendances.reduce((sum, a) => {
        if (a.variant) {
          return sum + Number(a.variant.variantCost);
        }
        return sum;
      }, 0),
      attendances,
    };

    return summary;
  }

  /**
   * Get attendance statistics for enrollment
   */
  async getAttendanceStats(enrollmentId: string) {
    const attendances = await prisma.mealAttendance.findMany({
      where: { enrollmentId },
      include: {
        variant: true,
      },
    });

    const totalMeals = attendances.length;
    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const holidayCount = attendances.filter((a) => a.status === 'HOLIDAY').length;

    return {
      enrollmentId,
      totalMeals,
      presentCount,
      absentCount,
      holidayCount,
      attendancePercentage: totalMeals > 0 ? (presentCount / totalMeals) * 100 : 0,
      allergyVerificationRate:
        totalMeals > 0
          ? (attendances.filter((a) => a.allergyVerified).length / totalMeals) * 100
          : 0,
    };
  }

  /**
   * Update attendance record
   */
  async update(
    id: string,
    data: {
      variantId?: string;
      status?: MealAttendanceStatus;
      allergyVerified?: boolean;
    }
  ) {
    const updated = await prisma.mealAttendance.update({
      where: { id },
      data,
      include: {
        meal: true,
        variant: true,
        enrollment: {
          include: {
            student: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete attendance record
   */
  async delete(id: string) {
    await prisma.mealAttendance.delete({ where: { id } });
  }
}

export const mealAttendanceService = new MealAttendanceService();
