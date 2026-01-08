import { Request, Response } from 'express';
import { employeeSeparationService } from '../services/employee-separation.service';

export const employeeSeparationController = {
  // Create new separation
  async createSeparation(req: Request, res: Response) {
    try {
      const {
        employeeId,
        separationDate,
        separationType,
        reason,
        reasonDescription,
        noticeDate,
        noticePeriod,
        effectiveDate,
        lastSalaryMonth,
        lastSalaryYear,
      } = req.body;

      // Validation
      if (!employeeId || !separationDate || !separationType || !effectiveDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, separationDate, separationType, effectiveDate',
        });
      }

      const separation = await employeeSeparationService.createSeparation({
        employeeId,
        separationDate: new Date(separationDate),
        separationType: separationType as any,
        reason,
        reasonDescription,
        noticeDate: noticeDate ? new Date(noticeDate) : undefined,
        noticePeriod: noticePeriod ? parseInt(noticePeriod) : undefined,
        effectiveDate: new Date(effectiveDate),
        lastSalaryMonth: lastSalaryMonth ? parseInt(lastSalaryMonth) : undefined,
        lastSalaryYear: lastSalaryYear ? parseInt(lastSalaryYear) : undefined,
      });

      res.status(201).json({
        success: true,
        data: separation,
        message: 'Separation created successfully',
      });
    } catch (error: any) {
      console.error('Error creating separation:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to create separation',
      });
    }
  },

  // Get all separations
  async getSeparations(req: Request, res: Response) {
    try {
      const { employeeId, separationType, settlementStatus, page, limit } = req.query;

      const { data, total } = await employeeSeparationService.getSeparations(
        {
          employeeId: employeeId as string,
          separationType: separationType as any,
          settlementStatus: settlementStatus as any,
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
      console.error('Error fetching separations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch separations',
      });
    }
  },

  // Get separation by ID
  async getSeparationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const separation = await employeeSeparationService.getSeparationById(id);

      if (!separation) {
        return res.status(404).json({
          success: false,
          error: 'Separation not found',
        });
      }

      res.json({
        success: true,
        data: separation,
      });
    } catch (error: any) {
      console.error('Error fetching separation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch separation',
      });
    }
  },

  // Update separation
  async updateSeparation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const separation = await employeeSeparationService.updateSeparation(id, updateData);

      res.json({
        success: true,
        data: separation,
        message: 'Separation updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating separation:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update separation',
      });
    }
  },

  // Calculate settlement
  async calculateSettlement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        basicSalaryDue,
        allowancesDue,
        earnedLeavePayout,
        gratuity,
        bonusAdjustment,
        loanRecovery,
        otherAdjustments,
      } = req.body;

      const separation = await employeeSeparationService.calculateSettlement(id, {
        basicSalaryDue: basicSalaryDue ? parseFloat(basicSalaryDue) : undefined,
        allowancesDue: allowancesDue ? parseFloat(allowancesDue) : undefined,
        earnedLeavePayout: earnedLeavePayout ? parseFloat(earnedLeavePayout) : undefined,
        gratuity: gratuity ? parseFloat(gratuity) : undefined,
        bonusAdjustment: bonusAdjustment ? parseFloat(bonusAdjustment) : undefined,
        loanRecovery: loanRecovery ? parseFloat(loanRecovery) : undefined,
        otherAdjustments: otherAdjustments ? parseFloat(otherAdjustments) : undefined,
      });

      res.json({
        success: true,
        data: separation,
        message: 'Settlement calculated successfully',
      });
    } catch (error: any) {
      console.error('Error calculating settlement:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to calculate settlement',
      });
    }
  },

  // Approve final settlement
  async approveFinalSettlement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approvedById } = req.body;

      if (!approvedById) {
        return res.status(400).json({
          success: false,
          error: 'Approved by ID is required',
        });
      }

      const separation = await employeeSeparationService.approveFinalSettlement(
        id,
        approvedById
      );

      res.json({
        success: true,
        data: separation,
        message: 'Final settlement approved successfully',
      });
    } catch (error: any) {
      console.error('Error approving final settlement:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to approve final settlement',
      });
    }
  },

  // Generate experience certificate
  async generateExperienceCertificate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { documentUrl } = req.body;

      if (!documentUrl) {
        return res.status(400).json({
          success: false,
          error: 'Document URL is required',
        });
      }

      const separation = await employeeSeparationService.generateExperienceCertificate(
        id,
        documentUrl
      );

      res.json({
        success: true,
        data: separation,
        message: 'Experience certificate generated successfully',
      });
    } catch (error: any) {
      console.error('Error generating experience certificate:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to generate experience certificate',
      });
    }
  },

  // Get all separations for employee
  async getEmployeeSeparations(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const separations = await employeeSeparationService.getEmployeeSeparations(employeeId);

      res.json({
        success: true,
        data: separations,
      });
    } catch (error: any) {
      console.error('Error fetching employee separations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employee separations',
      });
    }
  },

  // Get pending settlements
  async getPendingSettlements(req: Request, res: Response) {
    try {
      const separations = await employeeSeparationService.getPendingSettlements();

      res.json({
        success: true,
        data: separations,
      });
    } catch (error: any) {
      console.error('Error fetching pending settlements:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch pending settlements',
      });
    }
  },

  // Get separations by type
  async getSeparationsByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Separation type is required',
        });
      }

      const separations = await employeeSeparationService.getSeparationsBySeparationType(
        type as any
      );

      res.json({
        success: true,
        data: separations,
      });
    } catch (error: any) {
      console.error('Error fetching separations by type:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch separations by type',
      });
    }
  },

  // Get separations by date range
  async getSeparationsByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: startDate, endDate',
        });
      }

      const separations = await employeeSeparationService.getSeparationsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        data: separations,
      });
    } catch (error: any) {
      console.error('Error fetching separations by date range:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch separations by date range',
      });
    }
  },

  // Get separation statistics
  async getSeparationStats(req: Request, res: Response) {
    try {
      const stats = await employeeSeparationService.getSeparationStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching separation stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch separation stats',
      });
    }
  },

  // Get average settlement amount
  async getAvgSettlementAmount(req: Request, res: Response) {
    try {
      const avgAmount = await employeeSeparationService.getAvgSettlementAmount();

      res.json({
        success: true,
        data: { averageSettlementAmount: avgAmount },
      });
    } catch (error: any) {
      console.error('Error fetching average settlement amount:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch average settlement amount',
      });
    }
  },
};
