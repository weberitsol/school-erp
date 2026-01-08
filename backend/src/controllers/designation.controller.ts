import { Request, Response } from 'express';
import { designationService } from '../services/designation.service';

export const designationController = {
  // Create new designation
  async createDesignation(req: Request, res: Response) {
    try {
      const {
        name,
        code,
        level,
        parentDesignationId,
        minSalary,
        maxSalary,
        standardSalary,
        description,
      } = req.body;

      // Validation
      if (!name || !code || level === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, code, level',
        });
      }

      const designation = await designationService.createDesignation({
        name,
        code,
        level,
        parentDesignationId,
        minSalary: minSalary ? parseFloat(minSalary) : undefined,
        maxSalary: maxSalary ? parseFloat(maxSalary) : undefined,
        standardSalary: standardSalary ? parseFloat(standardSalary) : undefined,
        description,
      });

      res.status(201).json({
        success: true,
        data: designation,
        message: 'Designation created successfully',
      });
    } catch (error: any) {
      console.error('Error creating designation:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create designation',
      });
    }
  },

  // Get all designations
  async getDesignations(req: Request, res: Response) {
    try {
      const { search, level, page, limit } = req.query;

      const { data, total } = await designationService.getDesignations(
        {
          search: search as string,
          level: level ? parseInt(level as string) : undefined,
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
      console.error('Error fetching designations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch designations',
      });
    }
  },

  // Get designation by ID
  async getDesignationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const designation = await designationService.getDesignationById(id);

      if (!designation) {
        return res.status(404).json({
          success: false,
          error: 'Designation not found',
        });
      }

      res.json({
        success: true,
        data: designation,
      });
    } catch (error: any) {
      console.error('Error fetching designation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch designation',
      });
    }
  },

  // Update designation
  async updateDesignation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Parse numeric fields if present
      if (updateData.minSalary !== undefined) {
        updateData.minSalary = parseFloat(updateData.minSalary);
      }
      if (updateData.maxSalary !== undefined) {
        updateData.maxSalary = parseFloat(updateData.maxSalary);
      }
      if (updateData.standardSalary !== undefined) {
        updateData.standardSalary = parseFloat(updateData.standardSalary);
      }

      const designation = await designationService.updateDesignation(id, updateData);

      res.json({
        success: true,
        data: designation,
        message: 'Designation updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating designation:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update designation',
      });
    }
  },

  // Delete designation
  async deleteDesignation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await designationService.deleteDesignation(id);

      res.json({
        success: true,
        message: 'Designation deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting designation:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete designation',
      });
    }
  },

  // Get designation hierarchy
  async getDesignationHierarchy(req: Request, res: Response) {
    try {
      const hierarchy = await designationService.getDesignationHierarchy();

      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error: any) {
      console.error('Error fetching designation hierarchy:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch designation hierarchy',
      });
    }
  },

  // Validate salary range
  async validateSalaryRange(req: Request, res: Response) {
    try {
      const { designationId, salary } = req.body;

      if (!designationId || salary === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: designationId, salary',
        });
      }

      const isValid = await designationService.validateSalaryRange(
        designationId,
        parseFloat(salary)
      );

      res.json({
        success: true,
        data: { isValid },
        message: isValid ? 'Salary is within range' : 'Salary is outside range',
      });
    } catch (error: any) {
      console.error('Error validating salary range:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to validate salary range',
      });
    }
  },

  // Get designations by level
  async getDesignationsByLevel(req: Request, res: Response) {
    try {
      const { level } = req.params;

      if (level === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Level is required',
        });
      }

      const designations = await designationService.getDesignationsByLevel(
        parseInt(level as string)
      );

      res.json({
        success: true,
        data: designations,
      });
    } catch (error: any) {
      console.error('Error fetching designations by level:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch designations by level',
      });
    }
  },
};
