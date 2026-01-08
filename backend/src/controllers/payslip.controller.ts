import { Request, Response } from 'express';
import { payslipService } from '../services/payslip.service';

export const payslipController = {
  // Create new payslip
  async createPayslip(req: Request, res: Response) {
    try {
      const {
        employeeId,
        month,
        year,
        basicSalary,
        dearness,
        houseRent,
        conveyance,
        medical,
        otherAllowances,
        pf,
        esi,
        professionalTax,
        incomeTax,
        otherDeductions,
        workingDays,
        daysPresent,
        daysAbsent,
        bonus,
        deduction,
      } = req.body;

      // Validation
      if (!employeeId || month === undefined || year === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, month, year',
        });
      }

      const payslip = await payslipService.createPayslip({
        employeeId,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: parseFloat(basicSalary),
        dearness: dearness ? parseFloat(dearness) : undefined,
        houseRent: houseRent ? parseFloat(houseRent) : undefined,
        conveyance: conveyance ? parseFloat(conveyance) : undefined,
        medical: medical ? parseFloat(medical) : undefined,
        otherAllowances: otherAllowances ? parseFloat(otherAllowances) : undefined,
        pf: pf ? parseFloat(pf) : undefined,
        esi: esi ? parseFloat(esi) : undefined,
        professionalTax: professionalTax ? parseFloat(professionalTax) : undefined,
        incomeTax: incomeTax ? parseFloat(incomeTax) : undefined,
        otherDeductions: otherDeductions ? parseFloat(otherDeductions) : undefined,
        workingDays: workingDays ? parseInt(workingDays) : undefined,
        daysPresent: daysPresent ? parseInt(daysPresent) : undefined,
        daysAbsent: daysAbsent ? parseInt(daysAbsent) : undefined,
        bonus: bonus ? parseFloat(bonus) : undefined,
        deduction: deduction ? parseFloat(deduction) : undefined,
      });

      res.status(201).json({
        success: true,
        data: payslip,
        message: 'Payslip created successfully',
      });
    } catch (error: any) {
      console.error('Error creating payslip:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create payslip',
      });
    }
  },

  // Generate payslips for month
  async generatePayslips(req: Request, res: Response) {
    try {
      const { month, year, employeeIds } = req.body;

      if (month === undefined || year === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: month, year',
        });
      }

      const payslips = await payslipService.generatePayslips(
        parseInt(month),
        parseInt(year),
        employeeIds as string[] | undefined
      );

      res.status(201).json({
        success: true,
        data: payslips,
        message: `Generated ${payslips.length} payslips successfully`,
      });
    } catch (error: any) {
      console.error('Error generating payslips:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate payslips',
      });
    }
  },

  // Get all payslips
  async getPayslips(req: Request, res: Response) {
    try {
      const { employeeId, status, month, year, page, limit } = req.query;

      const { data, total } = await payslipService.getPayslips(
        {
          employeeId: employeeId as string,
          status: status as any,
          month: month ? parseInt(month as string) : undefined,
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
      console.error('Error fetching payslips:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch payslips',
      });
    }
  },

  // Get payslip by ID
  async getPayslipById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payslip = await payslipService.getPayslipById(id);

      if (!payslip) {
        return res.status(404).json({
          success: false,
          error: 'Payslip not found',
        });
      }

      res.json({
        success: true,
        data: payslip,
      });
    } catch (error: any) {
      console.error('Error fetching payslip:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch payslip',
      });
    }
  },

  // Update payslip
  async updatePayslip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse numeric fields if present
      const numericFields = [
        'basicSalary',
        'dearness',
        'houseRent',
        'conveyance',
        'medical',
        'otherAllowances',
        'pf',
        'esi',
        'professionalTax',
        'incomeTax',
        'otherDeductions',
        'bonus',
        'deduction',
      ];

      numericFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = parseFloat(updateData[field]);
        }
      });

      const payslip = await payslipService.updatePayslip(id, updateData);

      res.json({
        success: true,
        data: payslip,
        message: 'Payslip updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating payslip:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update payslip',
      });
    }
  },

  // Finalize payslip
  async finalizePayslip(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payslip = await payslipService.finalizePayslip(id);

      res.json({
        success: true,
        data: payslip,
        message: 'Payslip finalized successfully',
      });
    } catch (error: any) {
      console.error('Error finalizing payslip:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to finalize payslip',
      });
    }
  },

  // Mark payslip as paid
  async markPayslipAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { paidDate } = req.body;

      const payslip = await payslipService.markPayslipAsPaid(
        id,
        paidDate ? new Date(paidDate) : undefined
      );

      res.json({
        success: true,
        data: payslip,
        message: 'Payslip marked as paid successfully',
      });
    } catch (error: any) {
      console.error('Error marking payslip as paid:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to mark payslip as paid',
      });
    }
  },

  // Get payslip statistics
  async getPayslipStats(req: Request, res: Response) {
    try {
      const { month, year } = req.query;

      if (month === undefined || year === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: month, year',
        });
      }

      const stats = await payslipService.getPayslipStats(
        parseInt(month as string),
        parseInt(year as string)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching payslip stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch payslip stats',
      });
    }
  },

  // Cancel payslip
  async cancelPayslip(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payslip = await payslipService.cancelPayslip(id);

      res.json({
        success: true,
        data: payslip,
        message: 'Payslip cancelled successfully',
      });
    } catch (error: any) {
      console.error('Error cancelling payslip:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to cancel payslip',
      });
    }
  },
};
