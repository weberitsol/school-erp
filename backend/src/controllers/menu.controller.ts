import { Request, Response } from 'express';
import { menuService } from '../services/menu.service';

export class MenuController {
  /**
   * Get all menus with optional filters
   * GET /api/v1/mess/menus
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { messId, status, startDate, endDate, schoolId } = req.query;

      const result = await menuService.getAll({
        messId: messId as string | undefined,
        status: status as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
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
        error: error.message || 'Failed to fetch menus',
      });
    }
  }

  /**
   * Get menu by ID
   * GET /api/v1/mess/menus/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const menu = await menuService.getById(id);
      if (!menu) {
        res.status(404).json({
          success: false,
          error: 'Menu not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: menu,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch menu',
      });
    }
  }

  /**
   * Get menu by date for a mess
   * GET /api/v1/mess/menus/by-date/:messId/:date
   */
  static async getByDate(req: Request, res: Response): Promise<void> {
    try {
      const { messId, date } = req.params;

      const menu = await menuService.getByDate(messId, new Date(date));
      if (!menu) {
        res.status(404).json({
          success: false,
          error: 'Menu not found for the specified date',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: menu,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch menu',
      });
    }
  }

  /**
   * Get menus by date range
   * GET /api/v1/mess/menus/range/:messId?startDate=&endDate=
   */
  static async getByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { messId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const menus = await menuService.getMenusByDateRange(
        messId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json({
        success: true,
        data: menus,
        total: menus.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch menus',
      });
    }
  }

  /**
   * Create new menu
   * POST /api/v1/mess/menus
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { messId, date, dayOfWeek, season } = req.body;
      const schoolId = (req as any).schoolId;

      // Validate required fields
      if (!messId || !date || !dayOfWeek) {
        res.status(400).json({
          success: false,
          error: 'messId, date, and dayOfWeek are required',
        });
        return;
      }

      const menu = await menuService.create({
        messId,
        date: new Date(date),
        dayOfWeek,
        season,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: menu,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create menu',
      });
    }
  }

  /**
   * Update menu
   * PUT /api/v1/mess/menus/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date, dayOfWeek, season } = req.body;

      const menu = await menuService.update(id, {
        date: date ? new Date(date) : undefined,
        dayOfWeek,
        season,
      });

      res.status(200).json({
        success: true,
        data: menu,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update menu',
      });
    }
  }

  /**
   * Update menu status
   * PUT /api/v1/mess/menus/:id/status
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'status is required',
        });
        return;
      }

      const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status value',
        });
        return;
      }

      const menu = await menuService.updateStatus(id, status, notes);

      res.status(200).json({
        success: true,
        data: menu,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update menu status',
      });
    }
  }

  /**
   * Publish menu (DRAFT → PENDING)
   * POST /api/v1/mess/menus/:id/publish
   */
  static async publish(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const menu = await menuService.publish(id);

      res.status(200).json({
        success: true,
        data: menu,
        message: 'Menu published and moved to pending approval',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('draft')
        ? 400
        : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to publish menu',
      });
    }
  }

  /**
   * Delete menu
   * DELETE /api/v1/mess/menus/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await menuService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Menu deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete menu',
      });
    }
  }

  /**
   * Get menu statistics
   * GET /api/v1/mess/menus/:id/statistics
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const stats = await menuService.getStatistics(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch menu statistics',
      });
    }
  }

  /**
   * Clone menu from another date
   * POST /api/v1/mess/menus/:id/clone-from-date
   */
  static async cloneFromDate(req: Request, res: Response): Promise<void> {
    try {
      const { messId, sourceDate, targetDate } = req.body;
      const schoolId = (req as any).schoolId;

      if (!messId || !sourceDate || !targetDate) {
        res.status(400).json({
          success: false,
          error: 'messId, sourceDate, and targetDate are required',
        });
        return;
      }

      const menu = await menuService.cloneFromDate(
        messId,
        new Date(sourceDate),
        new Date(targetDate),
        schoolId
      );

      res.status(201).json({
        success: true,
        data: menu,
        message: 'Menu cloned successfully with all meals',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to clone menu',
      });
    }
  }
}
