import { Request, Response } from 'express';
import { mealService } from '../services/meal.service';

export class MealController {
  /**
   * Get all meals with optional filters
   * GET /api/v1/mess/meals
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { menuId, mealType, schoolId, isServing } = req.query;

      const result = await mealService.getAll({
        menuId: menuId as string | undefined,
        mealType: mealType as string | undefined,
        schoolId: schoolId as string | undefined,
        isServing: isServing === 'true' ? true : isServing === 'false' ? false : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meals',
      });
    }
  }

  /**
   * Get meal by ID
   * GET /api/v1/mess/meals/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const meal = await mealService.getById(id);
      if (!meal) {
        res.status(404).json({
          success: false,
          error: 'Meal not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: meal,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meal',
      });
    }
  }

  /**
   * Get meals by menu ID
   * GET /api/v1/mess/meals/by-menu/:menuId
   */
  static async getByMenu(req: Request, res: Response): Promise<void> {
    try {
      const { menuId } = req.params;

      const meals = await mealService.getByMenu(menuId);

      res.status(200).json({
        success: true,
        data: meals,
        total: meals.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meals',
      });
    }
  }

  /**
   * Create new meal
   * POST /api/v1/mess/meals
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { menuId, name, mealType, serveTimeStart, serveTimeEnd } = req.body;
      const schoolId = (req as any).schoolId;

      // Validate required fields
      if (!menuId || !name || !mealType || !serveTimeStart || !serveTimeEnd) {
        res.status(400).json({
          success: false,
          error: 'menuId, name, mealType, serveTimeStart, and serveTimeEnd are required',
        });
        return;
      }

      const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
      if (!validMealTypes.includes(mealType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mealType. Must be BREAKFAST, LUNCH, DINNER, or SNACK',
        });
        return;
      }

      const meal = await mealService.create({
        menuId,
        name,
        mealType,
        serveTimeStart,
        serveTimeEnd,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: meal,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('Menu not found')
        ? 404
        : error.message.includes('already exists') || error.message.includes('Invalid')
        ? 400
        : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create meal',
      });
    }
  }

  /**
   * Update meal
   * PUT /api/v1/mess/meals/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, mealType, serveTimeStart, serveTimeEnd } = req.body;

      if (mealType && !['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(mealType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mealType',
        });
        return;
      }

      const meal = await mealService.update(id, {
        name,
        mealType,
        serveTimeStart,
        serveTimeEnd,
      });

      res.status(200).json({
        success: true,
        data: meal,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update meal',
      });
    }
  }

  /**
   * Update meal serving status
   * PUT /api/v1/mess/meals/:id/serving-status
   */
  static async updateServingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isServing } = req.body;

      if (typeof isServing !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'isServing must be a boolean',
        });
        return;
      }

      const meal = await mealService.updateServingStatus(id, isServing);

      res.status(200).json({
        success: true,
        data: meal,
        message: isServing ? 'Meal now serving' : 'Meal serving stopped',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('unapproved') || error.message.includes('hygiene') || error.message.includes('required')
        ? 403
        : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update meal serving status',
      });
    }
  }

  /**
   * Delete meal
   * DELETE /api/v1/mess/meals/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await mealService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Meal deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('attendance')
        ? 400
        : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete meal',
      });
    }
  }

  /**
   * Get meal statistics
   * GET /api/v1/mess/meals/:id/statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const stats = await mealService.getStatistics(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch meal statistics',
      });
    }
  }

  /**
   * Get meal serving window
   * GET /api/v1/mess/meals/:id/serving-window
   */
  static async getServingWindow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const window = await mealService.getServingWindow(id);

      res.status(200).json({
        success: true,
        data: window,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch serving window',
      });
    }
  }

  /**
   * Get meals by date range and optional meal type
   * GET /api/v1/mess/meals/date-range/:messId?startDate=&endDate=&mealType=
   */
  static async getMealsByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { messId } = req.params;
      const { startDate, endDate, mealType } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const meals = await mealService.getMealsByDateRange(
        messId,
        new Date(startDate as string),
        new Date(endDate as string),
        mealType as string | undefined
      );

      res.status(200).json({
        success: true,
        data: meals,
        total: meals.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch meals',
      });
    }
  }
}
