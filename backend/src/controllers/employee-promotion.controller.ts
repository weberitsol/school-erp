import { Request, Response } from 'express';
import { employeePromotionService } from '../services/employee-promotion.service';

export const employeePromotionController = {
  // Create new promotion
  async createPromotion(req: Request, res: Response) {
    try {
      const {
        employeeId,
        previousDesignationId,
        newDesignationId,
        newSalary,
        promotionDate,
        promotionReason,
        effectiveFrom,
        approvedById,
        remarks,
      } = req.body;

      // Validation
      if (!employeeId || !previousDesignationId || !newDesignationId || newSalary === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, previousDesignationId, newDesignationId, newSalary',
        });
      }

      const promotion = await employeePromotionService.createPromotion({
        employeeId,
        previousDesignationId,
        newDesignationId,
        newSalary: parseFloat(newSalary),
        promotionDate: promotionDate ? new Date(promotionDate) : new Date(),
        promotionReason,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        approvedById,
        remarks,
      });

      res.status(201).json({
        success: true,
        data: promotion,
        message: 'Promotion created successfully',
      });
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create promotion',
      });
    }
  },

  // Get all promotions
  async getPromotions(req: Request, res: Response) {
    try {
      const { employeeId, status, page, limit } = req.query;

      const { data, total } = await employeePromotionService.getPromotions(
        {
          employeeId: employeeId as string,
          status: status as any,
        },
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        },
      });
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch promotions',
      });
    }
  },

  // Get promotion by ID
  async getPromotionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const promotion = await employeePromotionService.getPromotionById(id);

      if (!promotion) {
        return res.status(404).json({
          success: false,
          error: 'Promotion not found',
        });
      }

      res.json({
        success: true,
        data: promotion,
      });
    } catch (error: any) {
      console.error('Error fetching promotion:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch promotion',
      });
    }
  },

  // Update promotion
  async updatePromotion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse numeric fields if present
      if (updateData.newSalary !== undefined) {
        updateData.newSalary = parseFloat(updateData.newSalary);
      }

      if (updateData.promotionDate !== undefined) {
        updateData.promotionDate = new Date(updateData.promotionDate);
      }

      if (updateData.effectiveFrom !== undefined) {
        updateData.effectiveFrom = new Date(updateData.effectiveFrom);
      }

      const promotion = await employeePromotionService.updatePromotion(id, updateData);

      res.json({
        success: true,
        data: promotion,
        message: 'Promotion updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update promotion',
      });
    }
  },

  // Delete promotion
  async deletePromotion(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await employeePromotionService.deletePromotion(id);

      res.json({
        success: true,
        message: 'Promotion deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete promotion',
      });
    }
  },

  // Approve promotion
  async approvePromotion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approvedById } = req.body;

      if (!approvedById) {
        return res.status(400).json({
          success: false,
          error: 'Approved by ID is required',
        });
      }

      const promotion = await employeePromotionService.approvePromotion(id, approvedById);

      res.json({
        success: true,
        data: promotion,
        message: 'Promotion approved successfully',
      });
    } catch (error: any) {
      console.error('Error approving promotion:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to approve promotion',
      });
    }
  },

  // Get promotions by date range
  async getPromotionsByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: startDate, endDate',
        });
      }

      const promotions = await employeePromotionService.getPromotionsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: promotions,
      });
    } catch (error: any) {
      console.error('Error fetching promotions by date range:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch promotions by date range',
      });
    }
  },

  // Get promotion statistics by designation
  async getPromotionStatsByDesignation(req: Request, res: Response) {
    try {
      const stats = await employeePromotionService.getPromotionStatsByDesignation();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching promotion stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch promotion stats',
      });
    }
  },
};
