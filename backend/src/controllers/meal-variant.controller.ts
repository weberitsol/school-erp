import { Request, Response } from 'express';
import { mealVariantService } from '../services/meal-variant.service';

export class MealVariantController {
  /**
   * Get all meal variants with optional filters
   * GET /api/v1/mess/meal-variants
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { mealId, variantType, recipeId } = req.query;

      const result = await mealVariantService.getAll({
        mealId: mealId as string | undefined,
        variantType: variantType as string | undefined,
        recipeId: recipeId as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meal variants',
      });
    }
  }

  /**
   * Get meal variant by ID
   * GET /api/v1/mess/meal-variants/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const variant = await mealVariantService.getById(id);
      if (!variant) {
        res.status(404).json({
          success: false,
          error: 'Meal variant not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meal variant',
      });
    }
  }

  /**
   * Get variants for a meal
   * GET /api/v1/mess/meal-variants/by-meal/:mealId
   */
  static async getByMeal(req: Request, res: Response): Promise<void> {
    try {
      const { mealId } = req.params;

      const variants = await mealVariantService.getByMeal(mealId);

      res.status(200).json({
        success: true,
        data: variants,
        total: variants.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meal variants',
      });
    }
  }

  /**
   * Create new meal variant
   * POST /api/v1/mess/meal-variants
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { mealId, recipeId, variantType, variantCost, description, schoolId } = req.body;

      // Validate required fields
      if (!mealId || !recipeId || !variantType || !schoolId) {
        res.status(400).json({
          success: false,
          error: 'mealId, recipeId, variantType, and schoolId are required',
        });
        return;
      }

      const validTypes = ['VEG', 'NON_VEG', 'VEGAN'];
      if (!validTypes.includes(variantType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid variantType. Must be VEG, NON_VEG, or VEGAN',
        });
        return;
      }

      const variant = await mealVariantService.create({
        mealId,
        recipeId,
        variantType,
        variantCost,
        description,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: variant,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('already exists') || error.message.includes('Recipe type')
        ? 400
        : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create meal variant',
      });
    }
  }

  /**
   * Update meal variant
   * PUT /api/v1/mess/meal-variants/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { recipeId, variantType, variantCost, description } = req.body;

      if (variantType && !['VEG', 'NON_VEG', 'VEGAN'].includes(variantType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid variantType',
        });
        return;
      }

      const variant = await mealVariantService.update(id, {
        recipeId,
        variantType,
        variantCost,
        description,
      });

      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update meal variant',
      });
    }
  }

  /**
   * Delete meal variant
   * DELETE /api/v1/mess/meal-variants/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await mealVariantService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Meal variant deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('chosen')
        ? 400
        : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete meal variant',
      });
    }
  }

  /**
   * Get variant with allergen information
   * GET /api/v1/mess/meal-variants/:id/allergens
   */
  static async getVariantWithAllergens(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await mealVariantService.getVariantWithAllergens(id);

      res.status(200).json({
        success: true,
        data: {
          variant: result.variant,
          allergens: result.allergens,
        },
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch variant allergens',
      });
    }
  }

  /**
   * Get variants for meal grouped by type
   * GET /api/v1/mess/meal-variants/grouped/:mealId
   */
  static async getVariantsByMealGrouped(req: Request, res: Response): Promise<void> {
    try {
      const { mealId } = req.params;

      const grouped = await mealVariantService.getVariantsByMealGrouped(mealId);

      res.status(200).json({
        success: true,
        data: grouped,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch grouped variants',
      });
    }
  }

  /**
   * Get variant statistics
   * GET /api/v1/mess/meal-variants/:id/statistics
   */
  static async getVariantStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const stats = await mealVariantService.getVariantStatistics(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch variant statistics',
      });
    }
  }

  /**
   * Clone variant to another meal
   * POST /api/v1/mess/meal-variants/:id/clone-to-meal
   */
  static async cloneToMeal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { toMealId, schoolId } = req.body;

      if (!toMealId || !schoolId) {
        res.status(400).json({
          success: false,
          error: 'toMealId and schoolId are required',
        });
        return;
      }

      const newVariant = await mealVariantService.cloneToMeal(id, toMealId, schoolId);

      res.status(201).json({
        success: true,
        data: newVariant,
        message: 'Variant cloned successfully to target meal',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('already exists')
        ? 400
        : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to clone variant',
      });
    }
  }
}
