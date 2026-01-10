import { Request, Response } from 'express';
import { recipeService } from '../services/recipe.service';

export const recipeController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, mealVariantType, description, cuisineType, cookingInstructions, cookingTimeMinutes, servings } = req.body;

      if (!name || !mealVariantType) {
        return res.status(400).json({ success: false, error: 'Name and mealVariantType are required' });
      }

      const result = await recipeService.create({
        name,
        mealVariantType,
        schoolId,
        description,
        cuisineType,
        cookingInstructions,
        cookingTimeMinutes: cookingTimeMinutes ? parseInt(cookingTimeMinutes) : undefined,
        servings: servings ? parseInt(servings) : undefined,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Recipe created successfully',
      });
    } catch (error: any) {
      console.error('Error creating recipe:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { mealVariantType, isActive } = req.query;

      const result = await recipeService.getAll({
        schoolId: schoolId!,
        mealVariantType: mealVariantType as any,
        isActive: isActive === 'true',
      });

      res.json({ success: true, data: result, total: result.length });
    } catch (error: any) {
      console.error('Error fetching recipes:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await recipeService.getById(id);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Recipe not found' });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching recipe:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await recipeService.update(id, req.body);

      res.json({ success: true, data: result, message: 'Recipe updated successfully' });
    } catch (error: any) {
      console.error('Error updating recipe:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await recipeService.delete(id);

      res.json({ success: true, message: 'Recipe deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting recipe:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addIngredient(req: Request, res: Response) {
    try {
      const { recipeId } = req.params;
      const { foodItemId, quantity, unit, ingredientCost } = req.body;

      const result = await recipeService.addIngredient({
        recipeId,
        foodItemId,
        quantity: parseFloat(quantity),
        unit,
        ingredientCost: parseFloat(ingredientCost),
      });

      // Recalculate recipe cost
      await recipeService.calculateRecipeCost(recipeId);

      res.json({
        success: true,
        data: result,
        message: 'Ingredient added successfully',
      });
    } catch (error: any) {
      console.error('Error adding ingredient:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async calculateCost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const totalCost = await recipeService.calculateRecipeCost(id);

      res.json({
        success: true,
        data: { totalCost },
        message: 'Recipe cost calculated',
      });
    } catch (error: any) {
      console.error('Error calculating recipe cost:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async search(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { search } = req.query;

      const result = await recipeService.searchByName(schoolId!, search as string);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error searching recipes:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
