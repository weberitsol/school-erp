import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

/**
 * Recipe Calculator Utility
 * Handles recipe cost and nutritional calculations
 */

export interface IngredientInfo {
  foodItemId: string;
  quantity: number;
  unit: string;
}

export interface RecipeCostResult {
  totalCost: number;
  costPerServing: number;
  ingredients: {
    foodItemId: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
  }[];
}

export interface RecipeNutritionResult {
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  totalServings: number;
}

class RecipeCalculator {
  /**
   * Calculate total recipe cost based on ingredients
   */
  async calculateRecipeCost(
    ingredients: IngredientInfo[],
    servings: number = 100
  ): Promise<RecipeCostResult> {
    const ingredientDetails = await Promise.all(
      ingredients.map(async ing => {
        const foodItem = await prisma.foodItem.findUnique({
          where: { id: ing.foodItemId },
        });

        if (!foodItem) {
          throw new Error(`Food item ${ing.foodItemId} not found`);
        }

        const totalCost = parseFloat(foodItem.costPerUnit.toString()) * ing.quantity;

        return {
          foodItemId: ing.foodItemId,
          name: foodItem.name,
          quantity: ing.quantity,
          unit: ing.unit,
          costPerUnit: parseFloat(foodItem.costPerUnit.toString()),
          totalCost,
        };
      })
    );

    const totalCost = ingredientDetails.reduce((sum, ing) => sum + ing.totalCost, 0);
    const costPerServing = totalCost / servings;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costPerServing: Math.round(costPerServing * 100) / 100,
      ingredients: ingredientDetails,
    };
  }

  /**
   * Calculate nutritional information for recipe
   */
  async calculateNutrition(
    ingredients: IngredientInfo[],
    servings: number = 100
  ): Promise<RecipeNutritionResult> {
    const nutritionData = await Promise.all(
      ingredients.map(async ing => {
        const foodItem = await prisma.foodItem.findUnique({
          where: { id: ing.foodItemId },
        });

        if (!foodItem) {
          throw new Error(`Food item ${ing.foodItemId} not found`);
        }

        const quantityInGrams = this.convertToGrams(ing.quantity, ing.unit);

        return {
          calories: (parseFloat(foodItem.caloriesPer100g?.toString() || '0') / 100) * quantityInGrams,
          protein: (parseFloat(foodItem.proteinPer100g?.toString() || '0') / 100) * quantityInGrams,
          carbs: (parseFloat(foodItem.carbsPer100g?.toString() || '0') / 100) * quantityInGrams,
          fat: (parseFloat(foodItem.fatPer100g?.toString() || '0') / 100) * quantityInGrams,
        };
      })
    );

    const totalCalories = nutritionData.reduce((sum, n) => sum + n.calories, 0);
    const totalProtein = nutritionData.reduce((sum, n) => sum + n.protein, 0);
    const totalCarbs = nutritionData.reduce((sum, n) => sum + n.carbs, 0);
    const totalFat = nutritionData.reduce((sum, n) => sum + n.fat, 0);

    return {
      caloriesPerServing: Math.round((totalCalories / servings) * 100) / 100,
      proteinPerServing: Math.round((totalProtein / servings) * 100) / 100,
      carbsPerServing: Math.round((totalCarbs / servings) * 100) / 100,
      fatPerServing: Math.round((totalFat / servings) * 100) / 100,
      totalServings: servings,
    };
  }

  /**
   * Convert quantity to grams for nutritional calculation
   */
  private convertToGrams(quantity: number, unit: string): number {
    const unitMap: Record<string, number> = {
      'gram': 1,
      'g': 1,
      'kilogram': 1000,
      'kg': 1000,
      'milligram': 0.001,
      'mg': 0.001,
      'liter': 1000, // Assuming 1L = 1000g (approximate)
      'l': 1000,
      'milliliter': 1,
      'ml': 1,
      'cup': 240, // 1 cup ≈ 240g
      'tablespoon': 15, // 1 tbsp ≈ 15g
      'tbsp': 15,
      'teaspoon': 5, // 1 tsp ≈ 5g
      'tsp': 5,
      'piece': 1, // Will need manual override for specific foods
      'pieces': 1,
    };

    const multiplier = unitMap[unit.toLowerCase()] || 1;
    return quantity * multiplier;
  }

  /**
   * Estimate cost per serving for quick reference
   */
  async estimateCostPerServing(recipeId: string): Promise<number> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: true },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const totalCost = parseFloat(recipe.totalRecipeCost.toString());
    const costPerServing = totalCost / recipe.servings;

    return Math.round(costPerServing * 100) / 100;
  }

  /**
   * Validate recipe ingredients for common allergens
   */
  async validateAllergensInRecipe(recipeId: string, studentId: string): Promise<{
    isafe: boolean;
    allergenMatches: string[];
    recommendations: string[];
  }> {
    // Get recipe with ingredients
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: { foodItem: true },
        },
      },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    // Get student allergies
    const studentAllergies = await prisma.studentAllergy.findMany({
      where: {
        studentId,
        isVerified: true,
        isActive: true,
      },
      include: { allergen: true },
    });

    const allergenMatches: string[] = [];

    // Check for allergens in ingredients
    recipe.ingredients.forEach(ing => {
      const allergenIds = (ing.foodItem.allergenIds || []) as string[];
      studentAllergies.forEach(allergy => {
        if (allergenIds.includes(allergy.allergenId)) {
          allergenMatches.push(`${ing.foodItem.name} contains ${allergy.allergen.name}`);
        }
      });
    });

    const recommendations = allergenMatches.length > 0
      ? [
        'This recipe contains allergens for this student',
        'Consider preparing an alternative meal',
        'Ensure kitchen staff is aware before preparation',
      ]
      : ['This recipe is safe for the student'];

    return {
      isafe: allergenMatches.length === 0,
      allergenMatches,
      recommendations,
    };
  }

  /**
   * Generate recipe cost summary for menu planning
   */
  async generateRecipeSummary(recipeId: string): Promise<any> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: { foodItem: true },
        },
      },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const totalCost = parseFloat(recipe.totalRecipeCost.toString());
    const costPerServing = totalCost / recipe.servings;

    return {
      name: recipe.name,
      variantType: recipe.mealVariantType,
      cuisineType: recipe.cuisineType,
      servings: recipe.servings,
      totalRecipeCost: Math.round(totalCost * 100) / 100,
      costPerServing: Math.round(costPerServing * 100) / 100,
      caloriesPerServing: recipe.caloriesPerServing,
      ingredientCount: recipe.ingredients.length,
      cookingTime: recipe.cookingTimeMinutes,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.foodItem.name,
        quantity: ing.quantity,
        unit: ing.unit,
        cost: Math.round(parseFloat(ing.ingredientCost.toString()) * 100) / 100,
      })),
    };
  }
}

export const recipeCalculator = new RecipeCalculator();
