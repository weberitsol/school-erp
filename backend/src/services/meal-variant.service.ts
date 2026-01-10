import { PrismaClient, Prisma } from '@prisma/client';
import { recipeService } from './recipe.service';

const prisma = new PrismaClient();

export interface MealVariant {
  id: string;
  mealId: string;
  recipeId: string;
  variantType: 'VEG' | 'NON_VEG' | 'VEGAN';
  variantCost: number;
  description?: string;
  isAvailable: boolean;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMealVariantDto {
  mealId: string;
  recipeId: string;
  variantType: 'VEG' | 'NON_VEG' | 'VEGAN';
  variantCost: number;
  description?: string;
}

class MealVariantService {
  async getAll(filters?: {
    mealId?: string;
    variantType?: string;
    recipeId?: string;
  }): Promise<{ data: MealVariant[]; total: number }> {
    const where: Prisma.MealVariantWhereInput = {};

    if (filters?.mealId) where.mealId = filters.mealId;
    if (filters?.variantType) where.variantType = filters.variantType as any;
    if (filters?.recipeId) where.recipeId = filters.recipeId;

    const [data, total] = await Promise.all([
      prisma.mealVariant.findMany({
        where,
        include: {
          meal: {
            include: {
              menu: true,
            },
          },
          recipe: {
            include: {
              ingredients: true,
            },
          },
          studentMealChoices: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mealVariant.count({ where }),
    ]);

    return { data: data as any, total };
  }

  async getById(id: string): Promise<MealVariant | null> {
    const variant = await prisma.mealVariant.findUnique({
      where: { id },
      include: {
        meal: {
          include: {
            menu: true,
          },
        },
        recipe: {
          include: {
            ingredients: true,
          },
        },
        studentMealChoices: true,
      },
    });

    return variant as any;
  }

  async getByMeal(mealId: string): Promise<MealVariant[]> {
    const variants = await prisma.mealVariant.findMany({
      where: { mealId },
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
        studentMealChoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return variants as any;
  }

  /**
   * Create a meal variant with recipe type validation
   */
  async create(data: CreateMealVariantDto & { schoolId: string }): Promise<MealVariant> {
    // Validate recipe exists and matches variant type
    const recipe = await prisma.recipe.findUnique({
      where: { id: data.recipeId },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Validate recipe type matches variant type
    if (recipe.mealVariantType !== data.variantType) {
      throw new Error(
        `Recipe type ${recipe.mealVariantType} does not match variant type ${data.variantType}`
      );
    }

    // Validate meal exists
    const meal = await prisma.meal.findUnique({
      where: { id: data.mealId },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    const variant = await prisma.mealVariant.create({
      data: {
        mealId: data.mealId,
        recipeId: data.recipeId,
        variantType: data.variantType,
        variantCost: new Prisma.Decimal(data.variantCost.toString()),
        description: data.description,
        schoolId: data.schoolId,
        isAvailable: true,
      },
      include: {
        recipe: true,
        meal: true,
      },
    });

    return variant as any;
  }

  /**
   * Update a meal variant
   */
  async update(id: string, data: Partial<CreateMealVariantDto>): Promise<MealVariant> {
    const variant = await prisma.mealVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new Error('Meal variant not found');
    }

    // If variant type is changing, validate recipe compatibility
    if (data.variantType && data.variantType !== variant.variantType) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: data.recipeId || variant.recipeId },
      });

      if (recipe && recipe.mealVariantType !== data.variantType) {
        throw new Error(
          `Recipe type ${recipe.mealVariantType} does not match new variant type ${data.variantType}`
        );
      }
    }

    const updated = await prisma.mealVariant.update({
      where: { id },
      data: {
        variantType: data.variantType as any,
        variantCost: data.variantCost
          ? new Prisma.Decimal(data.variantCost.toString())
          : undefined,
        description: data.description,
      },
      include: {
        recipe: true,
        meal: true,
      },
    });

    return updated as any;
  }

  /**
   * Delete a meal variant
   */
  async delete(id: string): Promise<void> {
    // Check if any students have chosen this variant
    const choices = await prisma.studentMealChoice.findMany({
      where: { variantId: id },
    });

    if (choices.length > 0) {
      throw new Error(
        'Cannot delete variant - students have already chosen this variant'
      );
    }

    await prisma.mealVariant.delete({
      where: { id },
    });
  }

  /**
   * Get variant with allergen information
   */
  async getVariantWithAllergens(id: string): Promise<any> {
    const variant = await prisma.mealVariant.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                foodItem: {
                  include: {
                    allergens: {
                      include: {
                        allergen: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        meal: true,
      },
    });

    return variant;
  }

  /**
   * Clone variant to another meal
   */
  async cloneToMeal(variantId: string, targetMealId: string, schoolId: string): Promise<MealVariant> {
    const source = await prisma.mealVariant.findUnique({
      where: { id: variantId },
      include: {
        recipe: true,
      },
    });

    if (!source) {
      throw new Error('Source variant not found');
    }

    // Validate target meal exists
    const targetMeal = await prisma.meal.findUnique({
      where: { id: targetMealId },
    });

    if (!targetMeal) {
      throw new Error('Target meal not found');
    }

    return this.create({
      mealId: targetMealId,
      recipeId: source.recipeId,
      variantType: source.variantType,
      variantCost: source.variantCost.toNumber(),
      description: source.description || undefined,
      schoolId,
    });
  }

  /**
   * Get variant statistics
   */
  async getVariantStatistics(id: string): Promise<{
    variantId: string;
    totalChoices: number;
    ratingAverage: number;
    popularity: 'low' | 'medium' | 'high';
  }> {
    const variant = await prisma.mealVariant.findUnique({
      where: { id },
      include: {
        studentMealChoices: true,
      },
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    const totalChoices = variant.studentMealChoices.length;
    const popularity =
      totalChoices < 5 ? 'low' : totalChoices < 20 ? 'medium' : 'high';

    return {
      variantId: id,
      totalChoices,
      ratingAverage: 0, // Can be enhanced with actual rating system
      popularity,
    };
  }

  /**
   * Toggle variant availability
   */
  async toggleAvailability(id: string): Promise<MealVariant> {
    const variant = await prisma.mealVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    const updated = await prisma.mealVariant.update({
      where: { id },
      data: {
        isAvailable: !variant.isAvailable,
      },
    });

    return updated as any;
  }

  /**
   * Get variants for a meal grouped by type
   */
  async getVariantsByMealGrouped(mealId: string): Promise<{
    VEG: MealVariant[];
    NON_VEG: MealVariant[];
    VEGAN: MealVariant[];
  }> {
    const variants = await this.getByMeal(mealId);

    return {
      VEG: variants.filter(v => v.variantType === 'VEG'),
      NON_VEG: variants.filter(v => v.variantType === 'NON_VEG'),
      VEGAN: variants.filter(v => v.variantType === 'VEGAN'),
    };
  }
}

export const mealVariantService = new MealVariantService();
