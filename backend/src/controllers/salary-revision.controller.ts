import { Request, Response } from 'express';
import { salaryRevisionService } from '../services/salary-revision.service';

export const salaryRevisionController = {
  // Create new salary revision
  async createSalaryRevision(req: Request, res: Response) {
    try {
      const {
        employeeId,
        previousBasicSalary,
        newBasicSalary,
        revisionReason,
        effectiveFrom,
        approvedById,
        remarks,
      } = req.body;

      // Validation
      if (!employeeId || previousBasicSalary === undefined || newBasicSalary === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, previousBasicSalary, newBasicSalary',
        });
      }

      const revision = await salaryRevisionService.createSalaryRevision({
        employeeId,
        previousBasicSalary: parseFloat(previousBasicSalary),
        newBasicSalary: parseFloat(newBasicSalary),
        revisionReason: revisionReason as any,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        approvedById,
        remarks,
      });

      res.status(201).json({
        success: true,
        data: revision,
        message: 'Salary revision created successfully',
      });
    } catch (error: any) {
      console.error('Error creating salary revision:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to create salary revision',
      });
    }
  },

  // Get all salary revisions
  async getSalaryRevisions(req: Request, res: Response) {
    try {
      const { employeeId, revisionReason, page, limit } = req.query;

      const { data, total } = await salaryRevisionService.getSalaryRevisions(
        {
          employeeId: employeeId as string,
          revisionReason: revisionReason as any,
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
      console.error('Error fetching salary revisions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch salary revisions',
      });
    }
  },

  // Get salary revision by ID
  async getSalaryRevisionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const revision = await salaryRevisionService.getSalaryRevisionById(id);

      if (!revision) {
        return res.status(404).json({
          success: false,
          error: 'Salary revision not found',
        });
      }

      res.json({
        success: true,
        data: revision,
      });
    } catch (error: any) {
      console.error('Error fetching salary revision:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch salary revision',
      });
    }
  },

  // Update salary revision
  async updateSalaryRevision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse numeric fields if present
      if (updateData.newBasicSalary !== undefined) {
        updateData.newBasicSalary = parseFloat(updateData.newBasicSalary);
      }

      if (updateData.effectiveFrom !== undefined) {
        updateData.effectiveFrom = new Date(updateData.effectiveFrom);
      }

      const revision = await salaryRevisionService.updateSalaryRevision(id, updateData);

      res.json({
        success: true,
        data: revision,
        message: 'Salary revision updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating salary revision:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update salary revision',
      });
    }
  },

  // Delete salary revision
  async deleteSalaryRevision(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await salaryRevisionService.deleteSalaryRevision(id);

      res.json({
        success: true,
        message: 'Salary revision deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting salary revision:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete salary revision',
      });
    }
  },

  // Get latest salary revision for employee
  async getLatestSalaryRevision(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const revision = await salaryRevisionService.getLatestSalaryRevision(employeeId);

      if (!revision) {
        return res.status(404).json({
          success: false,
          error: 'No salary revision found for employee',
        });
      }

      res.json({
        success: true,
        data: revision,
      });
    } catch (error: any) {
      console.error('Error fetching latest salary revision:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch latest salary revision',
      });
    }
  },

  // Calculate total salary increase for employee
  async calculateTotalSalaryIncrease(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const increase = await salaryRevisionService.calculateTotalSalaryIncrease(employeeId);

      res.json({
        success: true,
        data: increase,
      });
    } catch (error: any) {
      console.error('Error calculating total salary increase:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate total salary increase',
      });
    }
  },

  // Get revision statistics by reason
  async getRevisionStatsByReason(req: Request, res: Response) {
    try {
      const stats = await salaryRevisionService.getRevisionStatsByReason();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching revision stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch revision stats',
      });
    }
  },
};
