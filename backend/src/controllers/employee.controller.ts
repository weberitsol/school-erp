import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';

export const employeeController = {
  // Create new employee
  async createEmployee(req: Request, res: Response) {
    try {
      const {
        userId,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        zipCode,
        employeeNo,
        employmentType,
        designationId,
        departmentId,
        reportingToId,
        joiningDate,
        basicSalary,
        salaryGrade,
        salaryEffectiveFrom,
        panNumber,
        aadharNumber,
        bankAccountNumber,
        bankIfscCode,
      } = req.body;

      // Validation
      if (!userId || !firstName || !lastName || !email || !employeeNo || !designationId || !departmentId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, firstName, lastName, email, employeeNo, designationId, departmentId',
        });
      }

      const employee = await employeeService.createEmployee({
        userId,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        city,
        state,
        zipCode,
        employeeNo,
        employmentType,
        designationId,
        departmentId,
        reportingToId,
        joiningDate: new Date(joiningDate),
        basicSalary,
        salaryGrade,
        salaryEffectiveFrom: salaryEffectiveFrom ? new Date(salaryEffectiveFrom) : undefined,
        panNumber,
        aadharNumber,
        bankAccountNumber,
        bankIfscCode,
      });

      res.status(201).json({
        success: true,
        data: employee,
        message: 'Employee created successfully',
      });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create employee',
      });
    }
  },

  // Get all employees
  async getEmployees(req: Request, res: Response) {
    try {
      const { departmentId, designationId, status, employmentType, search, isActive, page, limit } = req.query;

      const { data, total } = await employeeService.getEmployees(
        {
          departmentId: departmentId as string,
          designationId: designationId as string,
          status: status as any,
          employmentType: employmentType as any,
          search: search as string,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
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
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employees',
      });
    }
  },

  // Get employee by ID
  async getEmployeeById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const employee = await employeeService.getEmployeeById(id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
      }

      res.json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employee',
      });
    }
  },

  // Update employee
  async updateEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Convert date fields if present
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      const employee = await employeeService.updateEmployee(id, updateData);

      res.json({
        success: true,
        data: employee,
        message: 'Employee updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating employee:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update employee',
      });
    }
  },

  // Delete employee
  async deleteEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await employeeService.deleteEmployee(id);

      res.json({
        success: true,
        message: 'Employee deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete employee',
      });
    }
  },

  // Get employee by employee number
  async getEmployeeByEmployeeNo(req: Request, res: Response) {
    try {
      const { employeeNo } = req.params;

      const employee = await employeeService.getEmployeeByEmployeeNo(employeeNo);

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
      }

      res.json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employee',
      });
    }
  },

  // Get employees by department
  async getEmployeesByDepartment(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;

      const employees = await employeeService.getEmployeesByDepartment(departmentId);

      res.json({
        success: true,
        data: employees,
      });
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employees',
      });
    }
  },

  // Get subordinates for a manager
  async getSubordinates(req: Request, res: Response) {
    try {
      const { managerId } = req.params;

      const subordinates = await employeeService.getSubordinates(managerId);

      res.json({
        success: true,
        data: subordinates,
      });
    } catch (error: any) {
      console.error('Error fetching subordinates:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch subordinates',
      });
    }
  },

  // Update employee status
  async updateEmployeeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
        });
      }

      const employee = await employeeService.updateEmployeeStatus(id, status);

      res.json({
        success: true,
        data: employee,
        message: 'Employee status updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating employee status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update employee status',
      });
    }
  },

  // Get active employee count
  async getActiveEmployeeCount(req: Request, res: Response) {
    try {
      const { departmentId } = req.query;

      const count = await employeeService.getActiveEmployeeCount({
        departmentId: departmentId as string,
      });

      res.json({
        success: true,
        data: { activeEmployeeCount: count },
      });
    } catch (error: any) {
      console.error('Error fetching active employee count:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch active employee count',
      });
    }
  },
};
