import { Request, Response } from 'express';
import { mealChoiceService } from '../services/meal-choice.service';

export class MealChoiceController {
  /**
   * Get all meal choices with optional filters
   * GET /api/v1/mess/meal-choices
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, variantId, schoolId } = req.query;

      const result = await mealChoiceService.getAll({
        studentId: studentId as string | undefined,
        variantId: variantId as string | undefined,
        schoolId: schoolId as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meal choices',
      });
    }
  }

  /**
   * Get meal choice by ID
   * GET /api/v1/mess/meal-choices/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const choice = await mealChoiceService.getById(id);
      if (!choice) {
        res.status(404).json({
          success: false,
          error: 'Meal choice not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: choice,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meal choice',
      });
    }
  }

  /**
   * Get student's meal choices
   * GET /api/v1/mess/meal-choices/by-student/:studentId
   */
  static async getByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          error: 'schoolId is required',
        });
        return;
      }

      const choices = await mealChoiceService.getByStudent(
        studentId,
        schoolId as string
      );

      res.status(200).json({
        success: true,
        data: choices,
        total: choices.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch student meal choices',
      });
    }
  }

  /**
   * Get available variants for a student (filters by allergen safety)
   * GET /api/v1/mess/meal-choices/available-variants/:studentId
   */
  static async getAvailableVariants(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { variantIds } = req.body;

      if (!variantIds || !Array.isArray(variantIds)) {
        res.status(400).json({
          success: false,
          error: 'variantIds array is required',
        });
        return;
      }

      const result = await mealChoiceService.getAvailableVariants(
        studentId,
        variantIds
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch available variants',
      });
    }
  }

  /**
   * Create meal choice with allergen safety validation
   * POST /api/v1/mess/meal-choices
   * CRITICAL: This endpoint validates allergens and blocks unsafe choices
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { variantId, studentId, schoolId, allergyVerified, verificationNotes } = req.body;

      // Validate required fields
      if (!variantId || !studentId || !schoolId) {
        res.status(400).json({
          success: false,
          error: 'variantId, studentId, and schoolId are required',
        });
        return;
      }

      const choice = await mealChoiceService.create({
        studentId,
        variantId,
        schoolId,
        allergyVerified: allergyVerified || false,
        verificationNotes,
      });

      res.status(201).json({
        success: true,
        data: choice,
      });
    } catch (error: any) {
      // Check if it's a critical allergen error
      if (error.message?.includes('CRITICAL')) {
        res.status(403).json({
          success: false,
          error: error.message,
          critical: true,
        });
        return;
      }

      // Check for duplicate choice error
      if (error.message?.includes('already chosen')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create meal choice',
      });
    }
  }

  /**
   * Update meal choice
   * PUT /api/v1/mess/meal-choices/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { variantId, allergyVerified, verificationNotes } = req.body;

      const choice = await mealChoiceService.update(id, {
        variantId,
        allergyVerified,
        verificationNotes,
      });

      res.status(200).json({
        success: true,
        data: choice,
      });
    } catch (error: any) {
      // Check if it's a critical allergen error
      if (error.message?.includes('CRITICAL')) {
        res.status(403).json({
          success: false,
          error: error.message,
          critical: true,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update meal choice',
      });
    }
  }

  /**
   * Delete meal choice
   * DELETE /api/v1/mess/meal-choices/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await mealChoiceService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Meal choice deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete meal choice',
      });
    }
  }

  /**
   * Verify allergy for meal choice
   * POST /api/v1/mess/meal-choices/:id/verify-allergy
   */
  static async verifyAllergy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { verificationNotes } = req.body;

      const choice = await mealChoiceService.verifyAllergy(id, verificationNotes);

      res.status(200).json({
        success: true,
        data: choice,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify allergy',
      });
    }
  }
}
