import { Request, Response } from 'express';
import { leaveBalanceService } from '../services/leave-balance.service';

export const leaveBalanceController = {
  // Create new leave balance
  async createLeaveBalance(req: Request, res: Response) {
    try {
      const {
        employeeId,
        academicYear,
        casualLeave,
        earnedLeave,
        medicalLeave,
        unpaidLeave,
        studyLeave,
        maternityLeave,
        paternityLeave,
        bereavementLeave,
      } = req.body;

      // Validation
      if (!employeeId || !academicYear) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, academicYear',
        });
      }

      const balance = await leaveBalanceService.createLeaveBalance({
        employeeId,
        academicYear,
        casualLeave: casualLeave ? parseInt(casualLeave) : 0,
        earnedLeave: earnedLeave ? parseInt(earnedLeave) : 0,
        medicalLeave: medicalLeave ? parseInt(medicalLeave) : 0,
        unpaidLeave: unpaidLeave ? parseInt(unpaidLeave) : 0,
        studyLeave: studyLeave ? parseInt(studyLeave) : 0,
        maternityLeave: maternityLeave ? parseInt(maternityLeave) : 0,
        paternityLeave: paternityLeave ? parseInt(paternityLeave) : 0,
        bereavementLeave: bereavementLeave ? parseInt(bereavementLeave) : 0,
      });

      res.status(201).json({
        success: true,
        data: balance,
        message: 'Leave balance created successfully',
      });
    } catch (error: any) {
      console.error('Error creating leave balance:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create leave balance',
      });
    }
  },

  // Get all leave balances
  async getLeaveBalances(req: Request, res: Response) {
    try {
      const { employeeId, academicYear, page, limit } = req.query;

      const { data, total } = await leaveBalanceService.getLeaveBalances(
        {
          employeeId: employeeId as string,
          academicYear: academicYear as string,
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
      console.error('Error fetching leave balances:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch leave balances',
      });
    }
  },

  // Get leave balance by ID
  async getLeaveBalanceById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const balance = await leaveBalanceService.getLeaveBalanceById(id);

      if (!balance) {
        return res.status(404).json({
          success: false,
          error: 'Leave balance not found',
        });
      }

      res.json({
        success: true,
        data: balance,
      });
    } catch (error: any) {
      console.error('Error fetching leave balance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch leave balance',
      });
    }
  },

  // Update leave balance
  async updateLeaveBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse numeric fields if present
      const integerFields = [
        'casualLeave',
        'earnedLeave',
        'medicalLeave',
        'unpaidLeave',
        'studyLeave',
        'maternityLeave',
        'paternityLeave',
        'bereavementLeave',
      ];

      integerFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = parseInt(updateData[field]);
        }
      });

      const balance = await leaveBalanceService.updateLeaveBalance(id, updateData);

      res.json({
        success: true,
        data: balance,
        message: 'Leave balance updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating leave balance:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update leave balance',
      });
    }
  },

  // Delete leave balance
  async deleteLeaveBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await leaveBalanceService.deleteLeaveBalance(id);

      res.json({
        success: true,
        message: 'Leave balance deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting leave balance:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete leave balance',
      });
    }
  },

  // Deduct leave
  async deductLeave(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { leaveType, days } = req.body;

      if (!leaveType || days === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: leaveType, days',
        });
      }

      const balance = await leaveBalanceService.deductLeave(id, {
        leaveType,
        days: parseInt(days),
      });

      res.json({
        success: true,
        data: balance,
        message: 'Leave deducted successfully',
      });
    } catch (error: any) {
      console.error('Error deducting leave:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to deduct leave',
      });
    }
  },

  // Restore leave
  async restoreLeave(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { leaveType, days } = req.body;

      if (!leaveType || days === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: leaveType, days',
        });
      }

      const balance = await leaveBalanceService.restoreLeave(id, {
        leaveType,
        days: parseInt(days),
      });

      res.json({
        success: true,
        data: balance,
        message: 'Leave restored successfully',
      });
    } catch (error: any) {
      console.error('Error restoring leave:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to restore leave',
      });
    }
  },

  // Get available leave for type
  async getAvailableLeave(req: Request, res: Response) {
    try {
      const { id, leaveType } = req.params;

      if (!leaveType) {
        return res.status(400).json({
          success: false,
          error: 'Leave type is required',
        });
      }

      const available = await leaveBalanceService.getAvailableLeave(id, leaveType as any);

      res.json({
        success: true,
        data: { availableDays: available },
      });
    } catch (error: any) {
      console.error('Error fetching available leave:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch available leave',
      });
    }
  },

  // Get current leave balance for employee
  async getCurrentLeaveBalance(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const balance = await leaveBalanceService.getCurrentLeaveBalance(employeeId);

      if (!balance) {
        return res.status(404).json({
          success: false,
          error: 'No current leave balance found for employee',
        });
      }

      res.json({
        success: true,
        data: balance,
      });
    } catch (error: any) {
      console.error('Error fetching current leave balance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch current leave balance',
      });
    }
  },

  // Process carry-over
  async processCarryOver(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const balance = await leaveBalanceService.processCarryOver(id);

      res.json({
        success: true,
        data: balance,
        message: 'Carry-over processed successfully',
      });
    } catch (error: any) {
      console.error('Error processing carry-over:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to process carry-over',
      });
    }
  },
};
