import { Request, Response } from 'express';
import { salaryService } from '../services/salary.service';

export const salaryController = {
  // Create new salary
  async createSalary(req: Request, res: Response) {
    try {
      const {
        employeeId,
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
        month,
        year,
        effectiveFrom,
      } = req.body;

      // Validation
      if (!employeeId || basicSalary === undefined || month === undefined || year === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employeeId, basicSalary, month, year',
        });
      }

      const salary = await salaryService.createSalary({
        employeeId,
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
        month: parseInt(month),
        year: parseInt(year),
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      });

      res.status(201).json({
        success: true,
        data: salary,
        message: 'Salary created successfully',
      });
    } catch (error: any) {
      console.error('Error creating salary:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create salary',
      });
    }
  },

  // Get all salaries
  async getSalaries(req: Request, res: Response) {
    try {
      const { employeeId, status, month, year, page, limit } = req.query;

      const { data, total } = await salaryService.getSalaries(
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
      console.error('Error fetching salaries:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch salaries',
      });
    }
  },

  // Get salary by ID
  async getSalaryById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const salary = await salaryService.getSalaryById(id);

      if (!salary) {
        return res.status(404).json({
          success: false,
          error: 'Salary not found',
        });
      }

      res.json({
        success: true,
        data: salary,
      });
    } catch (error: any) {
      console.error('Error fetching salary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch salary',
      });
    }
  },

  // Update salary
  async updateSalary(req: Request, res: Response) {
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
      ];

      numericFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = parseFloat(updateData[field]);
        }
      });

      const salary = await salaryService.updateSalary(id, updateData);

      res.json({
        success: true,
        data: salary,
        message: 'Salary updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating salary:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update salary',
      });
    }
  },

  // Delete salary
  async deleteSalary(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await salaryService.deleteSalary(id);

      res.json({
        success: true,
        message: 'Salary deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting salary:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete salary',
      });
    }
  },

  // Get current salary for employee
  async getCurrentSalary(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;

      const salary = await salaryService.getCurrentSalary(employeeId);

      if (!salary) {
        return res.status(404).json({
          success: false,
          error: 'No current salary found for employee',
        });
      }

      res.json({
        success: true,
        data: salary,
      });
    } catch (error: any) {
      console.error('Error fetching current salary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch current salary',
      });
    }
  },

  // Get employee salary history
  async getEmployeeSalaryHistory(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const { limit } = req.query;

      const history = await salaryService.getEmployeeSalaryHistory(
        employeeId,
        limit ? parseInt(limit as string) : 12
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error('Error fetching salary history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch salary history',
      });
    }
  },

  // Calculate total payroll for month
  async calculateTotalPayroll(req: Request, res: Response) {
    try {
      const { month, year } = req.body;

      if (month === undefined || year === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: month, year',
        });
      }

      const payroll = await salaryService.calculateTotalPayroll(
        parseInt(month),
        parseInt(year)
      );

      res.json({
        success: true,
        data: payroll,
      });
    } catch (error: any) {
      console.error('Error calculating payroll:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate payroll',
      });
    }
  },

  // Recalculate gross and net salary
  async recalculateSalary(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const salary = await salaryService.recalculateSalary(id);

      res.json({
        success: true,
        data: salary,
        message: 'Salary recalculated successfully',
      });
    } catch (error: any) {
      console.error('Error recalculating salary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to recalculate salary',
      });
    }
  },
};
