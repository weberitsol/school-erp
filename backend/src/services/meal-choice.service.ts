import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface StudentMealChoice {
  id: string;
  studentId: string;
  variantId: string;
  allergyVerified: boolean;
  verificationNotes?: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMealChoiceDto {
  studentId: string;
  variantId: string;
  schoolId: string;
  allergyVerified?: boolean;
  verificationNotes?: string;
}

class MealChoiceService {
  async getAll(filters?: {
    studentId?: string;
    variantId?: string;
    schoolId?: string;
  }): Promise<{ data: StudentMealChoice[]; total: number }> {
    const where: Prisma.StudentMealChoiceWhereInput = {};

    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.variantId) where.variantId = filters.variantId;
    if (filters?.schoolId) where.schoolId = filters.schoolId;

    const [data, total] = await Promise.all([
      prisma.studentMealChoice.findMany({
        where,
        include: {
          variant: {
            include: {
              recipe: true,
              meal: {
                include: {
                  menu: true,
                },
              },
            },
          },
          student: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studentMealChoice.count({ where }),
    ]);

    return { data: data as any, total };
  }

  async getById(id: string): Promise<StudentMealChoice | null> {
    const choice = await prisma.studentMealChoice.findUnique({
      where: { id },
      include: {
        variant: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    foodItem: {
                      include: {
                        allergens: true,
                      },
                    },
                  },
                },
              },
            },
            meal: {
              include: {
                menu: {
                  include: {
                    mess: true,
                    approvals: true,
                  },
                },
              },
            },
          },
        },
        student: true,
      },
    });
    return choice as any;
  }

  async getByStudent(studentId: string, schoolId: string): Promise<StudentMealChoice[]> {
    const choices = await prisma.studentMealChoice.findMany({
      where: { studentId, schoolId },
      include: {
        variant: {
          include: {
            recipe: true,
            meal: {
              include: {
                menu: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return choices as any;
  }

  /**
   * Get available variants for a student (safe variants only)
   */
  async getAvailableVariants(
    studentId: string,
    variantIds: string[]
  ): Promise<{
    safe: StudentMealChoice[];
    warning: StudentMealChoice[];
    blocked: StudentMealChoice[];
  }> {
    const safe: StudentMealChoice[] = [];
    const warning: StudentMealChoice[] = [];
    const blocked: StudentMealChoice[] = [];

    // Get student allergies
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { safe, warning, blocked };
    }

    const studentAllergies = await prisma.studentAllergy.findMany({
      where: { studentId, isVerified: true, isActive: true },
      include: { allergen: true },
    });

    // Check each variant
    for (const variantId of variantIds) {
      const variant = await prisma.mealVariant.findUnique({
        where: { id: variantId },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  foodItem: {
                    include: {
                      allergens: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!variant) continue;

      // Check allergen conflicts
      let hasAnaphylaxis = false;
      let hasSevere = false;

      for (const allergy of studentAllergies) {
        for (const ingredient of variant.recipe.ingredients) {
          for (const allergenLink of ingredient.foodItem.allergens) {
            if (allergenLink.allergenId === allergy.allergenId) {
              if (allergy.allergen.severity === 'ANAPHYLAXIS') {
                hasAnaphylaxis = true;
              } else if (allergy.allergen.severity === 'SEVERE') {
                hasSevere = true;
              }
            }
          }
        }
      }

      // Categorize variant
      if (hasAnaphylaxis) {
        blocked.push({ id: variantId } as any);
      } else if (hasSevere) {
        warning.push({ id: variantId } as any);
      } else {
        safe.push({ id: variantId } as any);
      }
    }

    return { safe, warning, blocked };
  }

  /**
   * Create a meal choice with allergen safety validation
   */
  async create(data: CreateMealChoiceDto): Promise<StudentMealChoice> {
    // Validate variant exists
    const variant = await prisma.mealVariant.findUnique({
      where: { id: data.variantId },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                foodItem: {
                  include: {
                    allergens: true,
                  },
                },
              },
            },
          },
        },
        meal: true,
      },
    });

    if (!variant) {
      throw new Error('Meal variant not found');
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get student allergies
    const studentAllergies = await prisma.studentAllergy.findMany({
      where: { studentId: data.studentId, isVerified: true, isActive: true },
      include: { allergen: true },
    });

    // Check if choice already exists for this student-variant combo
    const existingChoice = await prisma.studentMealChoice.findFirst({
      where: {
        studentId: data.studentId,
        variantId: data.variantId,
      },
    });

    if (existingChoice) {
      throw new Error('Student has already chosen this variant');
    }

    // CRITICAL: Allergen safety validation
    const allergenConflicts: Array<{
      allergenId: string;
      allergenName: string;
      severity: string;
    }> = [];

    // Extract all allergens from variant recipe
    const variantAllergens = new Map<string, string>();
    for (const ingredient of variant.recipe.ingredients) {
      for (const allergen of ingredient.foodItem.allergens) {
        variantAllergens.set(allergen.allergenId, ingredient.foodItem.name);
      }
    }

    // Check for allergen conflicts
    for (const allergy of studentAllergies) {
      if (variantAllergens.has(allergy.allergenId)) {
        allergenConflicts.push({
          allergenId: allergy.allergen.id,
          allergenName: allergy.allergen.name,
          severity: allergy.allergen.severity,
        });
      }
    }

    // CRITICAL: Block ANAPHYLAXIS reactions
    const anaphylaxisConflicts = allergenConflicts.filter(
      a => a.severity === 'ANAPHYLAXIS'
    );

    if (anaphylaxisConflicts.length > 0) {
      const error = new Error(
        `CRITICAL: Meal contains life-threatening allergen(s): ${anaphylaxisConflicts
          .map(a => a.allergenName)
          .join(', ')}. Cannot serve this variant to student.`
      ) as any;
      error.critical = true;
      throw error;
    }

    // Log severe conflicts (may require override)
    const severeConflicts = allergenConflicts.filter(a => a.severity === 'SEVERE');
    if (severeConflicts.length > 0) {
      console.warn(
        `SEVERE allergen conflict for student ${data.studentId}: ${severeConflicts
          .map(a => a.allergenName)
          .join(', ')}`
      );
    }

    // Create the meal choice
    const choice = await prisma.studentMealChoice.create({
      data: {
        studentId: data.studentId,
        variantId: data.variantId,
        schoolId: data.schoolId,
        allergyVerified: data.allergyVerified || false,
        verificationNotes: data.verificationNotes,
      },
      include: {
        variant: {
          include: {
            recipe: true,
          },
        },
        student: true,
      },
    });

    // Log choice for audit trail
    console.log(
      `Meal choice created: Student ${data.studentId} chose variant ${data.variantId}`
    );

    return choice as any;
  }

  /**
   * Update meal choice
   */
  async update(
    id: string,
    data: Partial<CreateMealChoiceDto>
  ): Promise<StudentMealChoice> {
    const choice = await prisma.studentMealChoice.findUnique({
      where: { id },
    });

    if (!choice) {
      throw new Error('Meal choice not found');
    }

    // If variant is being changed, validate allergens
    if (data.variantId && data.variantId !== choice.variantId) {
      // Get student allergies
      const studentAllergies = await prisma.studentAllergy.findMany({
        where: { studentId: choice.studentId, isVerified: true, isActive: true },
        include: { allergen: true },
      });

      const newVariant = await prisma.mealVariant.findUnique({
        where: { id: data.variantId },
        include: {
          recipe: {
            include: {
              ingredients: {
                include: {
                  foodItem: {
                    include: {
                      allergens: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (newVariant) {
        const variantAllergens = new Set<string>();
        for (const ingredient of newVariant.recipe.ingredients) {
          for (const allergenLink of ingredient.foodItem.allergens) {
            variantAllergens.add(allergenLink.allergenId);
          }
        }

        // Check for ANAPHYLAXIS
        for (const allergy of studentAllergies) {
          if (variantAllergens.has(allergy.allergenId) && allergy.allergen.severity === 'ANAPHYLAXIS') {
            const error = new Error('CRITICAL: New variant contains life-threatening allergen') as any;
            error.critical = true;
            throw error;
          }
        }
      }
    }

    const updated = await prisma.studentMealChoice.update({
      where: { id },
      data: {
        variantId: data.variantId,
        allergyVerified: data.allergyVerified,
        verificationNotes: data.verificationNotes,
      },
      include: {
        variant: {
          include: {
            recipe: true,
          },
        },
        student: true,
      },
    });

    return updated as any;
  }

  /**
   * Delete meal choice
   */
  async delete(id: string): Promise<void> {
    await prisma.studentMealChoice.delete({
      where: { id },
    });
  }

  /**
   * Mark choice as allergy verified
   */
  async verifyAllergy(id: string, verificationNotes?: string): Promise<StudentMealChoice> {
    const choice = await prisma.studentMealChoice.update({
      where: { id },
      data: {
        allergyVerified: true,
        verificationNotes,
      },
    });

    return choice as any;
  }
}

export const mealChoiceService = new MealChoiceService();
