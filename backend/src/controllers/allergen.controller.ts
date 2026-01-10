import { Request, Response } from 'express';
import { allergenService } from '../services/allergen.service';

export const allergenController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, code, description, severity } = req.body;

      if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and code are required' });
      }

      const result = await allergenService.create({
        name,
        code,
        schoolId,
        description,
        severity,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Allergen created successfully',
      });
    } catch (error: any) {
      console.error('Error creating allergen:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { severity, isActive } = req.query;

      const result = await allergenService.getAll({
        schoolId: schoolId!,
        severity: severity as any,
        isActive: isActive === 'true',
      });

      res.json({ success: true, data: result, total: result.length });
    } catch (error: any) {
      console.error('Error fetching allergens:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await allergenService.getById(id);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Allergen not found' });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching allergen:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await allergenService.update(id, req.body);

      res.json({ success: true, data: result, message: 'Allergen updated successfully' });
    } catch (error: any) {
      console.error('Error updating allergen:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await allergenService.delete(id);

      res.json({ success: true, message: 'Allergen deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting allergen:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getCritical(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const result = await allergenService.getCriticalAllergens(schoolId!);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching critical allergens:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getStudentAllergens(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const result = await allergenService.getStudentAllergens(studentId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching student allergens:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
