import { Request, Response } from 'express';
import { performanceReviewService } from '../services/performance-review.service';

export const performanceReviewController = {
  // Create new performance review
  async createPerformanceReview(req: Request, res: Response) {
    try {
      const {
        employeeId,
        reviewCycleId,
        reviewPeriod,
        year,
        technicalSkills,
        communication,
        teamwork,
        initiative,
        reliability,
        customerService,
        reviewedById,
        reviewDate,
        promotionEligible,
        raisesPercentage,
        remarks,
      } = req.body;

      // Validation
      if (
        !employeeId ||
        !reviewCycleId ||
        technicalSkills === undefined ||
        !reviewedById
      ) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, reviewCycleId, technicalSkills, reviewedById',
        });
      }

      const review = await performanceReviewService.createPerformanceReview({
        employeeId,
        reviewCycleId,
        reviewPeriod,
        year: year ? parseInt(year) : new Date().getFullYear(),
        technicalSkills: parseInt(technicalSkills),
        communication: communication ? parseInt(communication) : undefined,
        teamwork: teamwork ? parseInt(teamwork) : undefined,
        initiative: initiative ? parseInt(initiative) : undefined,
        reliability: reliability ? parseInt(reliability) : undefined,
        customerService: customerService ? parseInt(customerService) : undefined,
        reviewedById,
        reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
        promotionEligible: promotionEligible === true || promotionEligible === 'true',
        raisesPercentage: raisesPercentage ? parseFloat(raisesPercentage) : undefined,
        remarks,
      });

      res.status(201).json({
        success: true,
        data: review,
        message: 'Performance review created successfully',
      });
    } catch (error: any) {
      console.error('Error creating performance review:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create performance review',
      });
    }
  },

  // Get all performance reviews
  async getPerformanceReviews(req: Request, res: Response) {
    try {
      const { employeeId, reviewCycleId, year, page, limit } = req.query;

      const { data, total } = await performanceReviewService.getPerformanceReviews(
        {
          employeeId: employeeId as string,
          reviewCycleId: reviewCycleId as string,
          year: year ? parseInt(year as string) : undefined,
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
      console.error('Error fetching performance reviews:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch performance reviews',
      });
    }
  },

  // Get performance review by ID
  async getPerformanceReviewById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const review = await performanceReviewService.getPerformanceReviewById(id);

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Performance review not found',
        });
      }

      res.json({
        success: true,
        data: review,
      });
    } catch (error: any) {
      console.error('Error fetching performance review:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch performance review',
      });
    }
  },

  // Update performance review
  async updatePerformanceReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse numeric fields if present
      const integerFields = ['technicalSkills', 'communication', 'teamwork', 'initiative', 'reliability', 'customerService'];
      integerFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = parseInt(updateData[field]);
        }
      });

      if (updateData.raisesPercentage !== undefined) {
        updateData.raisesPercentage = parseFloat(updateData.raisesPercentage);
      }

      if (updateData.reviewDate !== undefined) {
        updateData.reviewDate = new Date(updateData.reviewDate);
      }

      const review = await performanceReviewService.updatePerformanceReview(id, updateData);

      res.json({
        success: true,
        data: review,
        message: 'Performance review updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating performance review:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update performance review',
      });
    }
  },

  // Delete performance review
  async deletePerformanceReview(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await performanceReviewService.deletePerformanceReview(id);

      res.json({
        success: true,
        message: 'Performance review deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting performance review:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete performance review',
      });
    }
  },

  // Get promotion eligible employees
  async getPromotionEligibleEmployees(req: Request, res: Response) {
    try {
      const employees = await performanceReviewService.getPromotionEligibleEmployees();

      res.json({
        success: true,
        data: employees,
      });
    } catch (error: any) {
      console.error('Error fetching promotion eligible employees:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch promotion eligible employees',
      });
    }
  },

  // Get cycle performance statistics
  async getCyclePerformanceStats(req: Request, res: Response) {
    try {
      const { cycleId } = req.params;

      if (!cycleId) {
        return res.status(400).json({
          success: false,
          error: 'Cycle ID is required',
        });
      }

      const stats = await performanceReviewService.getCyclePerformanceStats(cycleId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching cycle performance stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch cycle performance stats',
      });
    }
  },

  // Get department performance statistics
  async getDepartmentPerformanceStats(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;

      if (!departmentId) {
        return res.status(400).json({
          success: false,
          error: 'Department ID is required',
        });
      }

      const stats = await performanceReviewService.getDepartmentPerformanceStats(
        departmentId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching department performance stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch department performance stats',
      });
    }
  },
};
