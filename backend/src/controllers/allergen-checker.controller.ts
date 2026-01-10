import { Request, Response } from 'express';
import { allergenCheckerService } from '../services/allergen-checker.service';

/**
 * ⚠️ CRITICAL CONTROLLER
 * Handles all allergen checking operations.
 * A single validation error could result in severe allergic reaction or death.
 */

export const allergenCheckerController = {
  /**
   * PRIMARY ENDPOINT - CHECK IF MEAL VARIANT IS SAFE FOR STUDENT
   * CRITICAL: Returns 403 if unsafe, 200 if safe
   */
  async checkMealVariant(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { studentId, variantId } = req.body;
      if (!studentId || !variantId) {
        return res.status(400).json({
          success: false,
          error: 'studentId and variantId are required'
        });
      }

      const result = await allergenCheckerService.checkMealVariant(
        studentId,
        variantId,
        schoolId
      );

      if (!result.safe) {
        // CRITICAL: Return 403 (Forbidden) for unsafe meals
        return res.status(403).json({
          success: false,
          data: result,
          error: result.blockReason || 'Meal contains conflicting allergens',
          requiresOverride: result.requiresManagerOverride,
        });
      }

      // Safe to serve
      res.json({
        success: true,
        data: result,
        message: 'Meal safe to serve - allergen check passed'
      });
    } catch (error: any) {
      // FAIL SAFE: Block on any error
      res.status(500).json({
        success: false,
        error: 'Allergen check service error - blocking as safety precaution',
        details: error.message
      });
    }
  },

  /**
   * Check multiple variants for a student
   */
  async checkMultipleVariants(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { studentId, variantIds } = req.body;
      if (!studentId || !Array.isArray(variantIds)) {
        return res.status(400).json({
          success: false,
          error: 'studentId and variantIds array are required'
        });
      }

      const results = await allergenCheckerService.checkMultipleVariants(
        studentId,
        variantIds,
        schoolId
      );

      const unsafeVariants = results.filter(r => !r.safe);
      const safeVariants = results.filter(r => r.safe);

      res.json({
        success: true,
        data: {
          total: results.length,
          safe: safeVariants.length,
          unsafe: unsafeVariants.length,
          results
        },
        message: `${safeVariants.length} safe, ${unsafeVariants.length} unsafe`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get safe meal variants for student
   */
  async getSafeMealVariants(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { studentId } = req.params;
      const safeVariants = await allergenCheckerService.getSafeMealVariants(studentId, schoolId);

      res.json({
        success: true,
        data: safeVariants,
        message: `Found ${safeVariants.length} safe meal variants for student`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get check history for audit
   */
  async getCheckHistory(req: Request, res: Response) {
    try {
      const { studentId } = req.query;
      const limit = parseInt(req.query.limit as string) || 100;

      const history = await allergenCheckerService.getCheckHistory(
        studentId as string,
        limit
      );

      res.json({
        success: true,
        data: history,
        message: `Retrieved ${history.length} allergy check records`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Manager override for severe allergens
   * CRITICAL: Logs who authorized the override for accountability
   */
  async overrideCheck(req: Request, res: Response) {
    try {
      const { studentId, variantId, reason } = req.body;
      if (!studentId || !variantId || !reason) {
        return res.status(400).json({
          success: false,
          error: 'studentId, variantId, and reason are required'
        });
      }

      const managerUserId = req.user?.id;
      if (!managerUserId) {
        return res.status(401).json({ success: false, error: 'User context required' });
      }

      const result = await allergenCheckerService.overrideCheck(
        studentId,
        variantId,
        managerUserId,
        reason
      );

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.message });
      }

      res.json({
        success: true,
        message: result.message,
        warning: '⚠️ Manager override recorded. Student served with understanding of allergy risk.',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
