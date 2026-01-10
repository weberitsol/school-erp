import { Request, Response } from 'express';
import { studentAllergyService } from '../services/student-allergy.service';

export const studentAllergyController = {
  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { studentId, allergenId, isVerified, isActive } = req.query;

      const data = await studentAllergyService.getAll({
        studentId: studentId as string,
        allergenId: allergenId as string,
        isVerified: isVerified === 'true',
        isActive: isActive === 'true',
        schoolId,
      });

      res.json({ success: true, data: data.data, total: data.total });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const allergy = await studentAllergyService.getById(id);

      if (!allergy) {
        return res.status(404).json({ success: false, error: 'Allergy record not found' });
      }

      res.json({ success: true, data: allergy });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByStudent(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { studentId } = req.params;
      const allergies = await studentAllergyService.getByStudent(studentId, schoolId);

      res.json({ success: true, data: allergies });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getCriticalAlergies(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { studentId } = req.params;
      const allergies = await studentAllergyService.getCriticalAllergies(studentId, schoolId);

      res.json({ success: true, data: allergies, message: `Found ${allergies.length} critical allergies` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { studentId, allergenId, severity } = req.body;
      if (!studentId || !allergenId) {
        return res.status(400).json({ success: false, error: 'studentId and allergenId are required' });
      }

      const allergy = await studentAllergyService.create({
        ...req.body,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: allergy,
        message: 'Allergy record created. Doctor verification required for approval.'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const allergy = await studentAllergyService.update(id, req.body);

      res.json({ success: true, data: allergy, message: 'Allergy record updated' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async verify(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const allergy = await studentAllergyService.verify(id);

      res.json({
        success: true,
        data: allergy,
        message: '✓ Allergy verified by doctor and activated'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const allergy = await studentAllergyService.reject(id);

      res.json({
        success: true,
        data: allergy,
        message: 'Allergy record rejected and deactivated'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await studentAllergyService.delete(id);

      res.json({ success: true, message: 'Allergy record deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
