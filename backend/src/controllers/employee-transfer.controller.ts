import { Request, Response } from 'express';
import { employeeTransferService } from '../services/employee-transfer.service';

export const employeeTransferController = {
  // Create new transfer
  async createTransfer(req: Request, res: Response) {
    try {
      const {
        employeeId,
        fromDepartmentId,
        toDepartmentId,
        fromLocation,
        toLocation,
        transferDate,
        transferReason,
        initiatedBy,
        transferOrder,
      } = req.body;

      // Validation
      if (!employeeId || !fromDepartmentId || !toDepartmentId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, fromDepartmentId, toDepartmentId',
        });
      }

      const transfer = await employeeTransferService.createTransfer({
        employeeId,
        fromDepartmentId,
        toDepartmentId,
        fromLocation,
        toLocation,
        transferDate: transferDate ? new Date(transferDate) : new Date(),
        transferReason,
        initiatedBy,
        transferOrder,
      });

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'Transfer created successfully',
      });
    } catch (error: any) {
      console.error('Error creating transfer:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to create transfer',
      });
    }
  },

  // Get all transfers
  async getTransfers(req: Request, res: Response) {
    try {
      const { employeeId, status, fromDepartmentId, toDepartmentId, page, limit } = req.query;

      const { data, total } = await employeeTransferService.getTransfers(
        {
          employeeId: employeeId as string,
          status: status as any,
          fromDepartmentId: fromDepartmentId as string,
          toDepartmentId: toDepartmentId as string,
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
      console.error('Error fetching transfers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch transfers',
      });
    }
  },

  // Get transfer by ID
  async getTransferById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transfer = await employeeTransferService.getTransferById(id);

      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: 'Transfer not found',
        });
      }

      res.json({
        success: true,
        data: transfer,
      });
    } catch (error: any) {
      console.error('Error fetching transfer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch transfer',
      });
    }
  },

  // Update transfer
  async updateTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.transferDate !== undefined) {
        updateData.transferDate = new Date(updateData.transferDate);
      }

      if (updateData.approvalDate !== undefined) {
        updateData.approvalDate = new Date(updateData.approvalDate);
      }

      const transfer = await employeeTransferService.updateTransfer(id, updateData);

      res.json({
        success: true,
        data: transfer,
        message: 'Transfer updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating transfer:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update transfer',
      });
    }
  },

  // Delete transfer
  async deleteTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await employeeTransferService.deleteTransfer(id);

      res.json({
        success: true,
        message: 'Transfer deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting transfer:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete transfer',
      });
    }
  },

  // Get all transfers for employee
  async getEmployeeTransfers(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const transfers = await employeeTransferService.getEmployeeTransfers(employeeId);

      res.json({
        success: true,
        data: transfers,
      });
    } catch (error: any) {
      console.error('Error fetching employee transfers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employee transfers',
      });
    }
  },

  // Get latest transfer for employee
  async getLatestTransfer(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const transfer = await employeeTransferService.getLatestTransfer(employeeId);

      if (!transfer) {
        return res.status(404).json({
          success: false,
          error: 'No transfer found for employee',
        });
      }

      res.json({
        success: true,
        data: transfer,
      });
    } catch (error: any) {
      console.error('Error fetching latest transfer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch latest transfer',
      });
    }
  },

  // Get pending transfers
  async getPendingTransfers(req: Request, res: Response) {
    try {
      const transfers = await employeeTransferService.getPendingTransfers();

      res.json({
        success: true,
        data: transfers,
      });
    } catch (error: any) {
      console.error('Error fetching pending transfers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch pending transfers',
      });
    }
  },

  // Approve transfer
  async approveTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approvedById } = req.body;

      if (!approvedById) {
        return res.status(400).json({
          success: false,
          error: 'Approved by ID is required',
        });
      }

      const transfer = await employeeTransferService.approveTransfer(id, approvedById);

      res.json({
        success: true,
        data: transfer,
        message: 'Transfer approved successfully',
      });
    } catch (error: any) {
      console.error('Error approving transfer:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to approve transfer',
      });
    }
  },

  // Reject transfer
  async rejectTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transfer = await employeeTransferService.rejectTransfer(id);

      res.json({
        success: true,
        data: transfer,
        message: 'Transfer rejected successfully',
      });
    } catch (error: any) {
      console.error('Error rejecting transfer:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to reject transfer',
      });
    }
  },

  // Get transfers by date range
  async getTransfersByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: startDate, endDate',
        });
      }

      const transfers = await employeeTransferService.getTransfersByDateRange(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: transfers,
      });
    } catch (error: any) {
      console.error('Error fetching transfers by date range:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch transfers by date range',
      });
    }
  },

  // Get incoming and outgoing transfers for department
  async getDepartmentTransfers(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;

      const transfers = await employeeTransferService.getDepartmentTransfers(departmentId);

      res.json({
        success: true,
        data: transfers,
      });
    } catch (error: any) {
      console.error('Error fetching department transfers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch department transfers',
      });
    }
  },

  // Get transfer statistics by department
  async getTransferStatsByDepartment(req: Request, res: Response) {
    try {
      const stats = await employeeTransferService.getTransferStatsByDepartment();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching transfer stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch transfer stats',
      });
    }
  },
};
