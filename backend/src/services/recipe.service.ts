import { PrismaClient, Recipe, MealVariantType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class RecipeService {
  async create(data: {
    name: string;
    schoolId: string;
    mealVariantType: MealVariantType;
    description?: string;
    cuisineType?: string;
    cookingInstructions?: string;
    cookingTimeMinutes?: number;
    servings?: number;
  }): Promise<Recipe> {
    return prisma.recipe.create({
      data: {
        ...data,
        totalRecipeCost: new Prisma.Decimal('0'), // Will be calculated when ingredients are added
        servings: data.servings || 100,
      },
      include: { ingredients: { include: { foodItem: true } } },
    });
  }

  async getAll(filters: {
    schoolId: string;
    mealVariantType?: MealVariantType;
    isActive?: boolean;
  }): Promise<Recipe[]> {
    const where: any = { schoolId: filters.schoolId };

    if (filters.mealVariantType) {
      where.mealVariantType = filters.mealVariantType;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.recipe.findMany({
      where,
      include: { ingredients: { include: { foodItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<
    (Recipe & { ingredients: any[] }) | null
  > {
    return prisma.recipe.findUnique({
      where: { id },
      include: { ingredients: { include: { foodItem: true } } },
    });
  }

  async update(id: string, data: Partial<Recipe>): Promise<Recipe> {
    return prisma.recipe.update({
      where: { id },
      data: {
        ...data,
        totalRecipeCost: data.totalRecipeCost
          ? new Prisma.Decimal(data.totalRecipeCost.toString())
          : undefined,
      },
      include: { ingredients: { include: { foodItem: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.recipe.delete({ where: { id } });
  }

  async addIngredient(data: {
    recipeId: string;
    foodItemId: string;
    quantity: number;
    unit: string;
    ingredientCost: number;
  }): Promise<any> {
    return prisma.recipeIngredient.create({
      data: {
        ...data,
        quantity: new Prisma.Decimal(data.quantity.toString()),
        ingredientCost: new Prisma.Decimal(data.ingredientCost.toString()),
      },
      include: { foodItem: true },
    });
  }

  async removeIngredient(ingredientId: string): Promise<void> {
    await prisma.recipeIngredient.delete({
      where: { id: ingredientId },
    });
  }

  async calculateRecipeCost(recipeId: string): Promise<number> {
    const ingredients = await prisma.recipeIngredient.findMany({
      where: { recipeId },
    });

    const totalCost = ingredients.reduce(
      (sum, ing) => sum + parseFloat(ing.ingredientCost.toString()),
      0
    );

    // Update recipe with calculated cost
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { totalRecipeCost: new Prisma.Decimal(totalCost.toString()) },
    });

    return totalCost;
  }

  async getRecipesByVariant(
    schoolId: string,
    variantType: MealVariantType
  ): Promise<Recipe[]> {
    return prisma.recipe.findMany({
      where: { schoolId, mealVariantType: variantType, isActive: true },
      include: { ingredients: { include: { foodItem: true } } },
    });
  }

  async searchByName(schoolId: string, search: string): Promise<Recipe[]> {
    return prisma.recipe.findMany({
      where: {
        schoolId,
        name: { contains: search, mode: 'insensitive' },
        isActive: true,
      },
      include: { ingredients: { include: { foodItem: true } } },
    });
  }
}

export const recipeService = new RecipeService();
