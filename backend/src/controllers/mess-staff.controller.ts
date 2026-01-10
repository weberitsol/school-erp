import { Request, Response } from 'express';
import { messStaffService } from '../services/mess-staff.service';

export const messStaffController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        firstName,
        lastName,
        position,
        messId,
        dateOfJoining,
        email,
        phone,
        department,
        certifications,
        trainingsCompleted,
      } = req.body;

      if (!firstName || !lastName || !position || !messId || !dateOfJoining) {
        return res.status(400).json({
          success: false,
          error: 'firstName, lastName, position, messId, and dateOfJoining are required',
        });
      }

      const result = await messStaffService.create({
        firstName,
        lastName,
        position,
        messId,
        schoolId,
        dateOfJoining: new Date(dateOfJoining),
        email,
        phone,
        department,
        certifications: certifications || [],
        trainingsCompleted: trainingsCompleted || [],
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Staff member added successfully',
      });
    } catch (error: any) {
      console.error('Error creating staff:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { messId, position, isActive } = req.query;

      const result = await messStaffService.getAll({
        schoolId: schoolId!,
        messId: messId as string,
        position: position as string,
        isActive: isActive === 'true',
      });

      res.json({ success: true, data: result, total: result.length });
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await messStaffService.getById(id);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.dateOfJoining) {
        updateData.dateOfJoining = new Date(updateData.dateOfJoining);
      }
      if (updateData.dateOfLeaving) {
        updateData.dateOfLeaving = new Date(updateData.dateOfLeaving);
      }

      const result = await messStaffService.update(id, updateData);

      res.json({ success: true, data: result, message: 'Staff member updated successfully' });
    } catch (error: any) {
      console.error('Error updating staff:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await messStaffService.delete(id);

      res.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByMess(req: Request, res: Response) {
    try {
      const { messId } = req.params;
      const result = await messStaffService.getByMess(messId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching mess staff:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addCertification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { certification } = req.body;

      if (!certification) {
        return res.status(400).json({ success: false, error: 'Certification is required' });
      }

      const result = await messStaffService.addCertification(id, certification);

      res.json({ success: true, data: result, message: 'Certification added successfully' });
    } catch (error: any) {
      console.error('Error adding certification:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async recordTraining(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { training } = req.body;

      if (!training) {
        return res.status(400).json({ success: false, error: 'Training is required' });
      }

      const result = await messStaffService.recordTraining(id, training);

      res.json({ success: true, data: result, message: 'Training recorded successfully' });
    } catch (error: any) {
      console.error('Error recording training:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async deactivate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { dateOfLeaving } = req.body;

      const result = await messStaffService.deactivateStaff(id, new Date(dateOfLeaving));

      res.json({ success: true, data: result, message: 'Staff member deactivated' });
    } catch (error: any) {
      console.error('Error deactivating staff:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const { messId } = req.params;
      const stats = await messStaffService.getStaffStats(messId);

      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error fetching staff statistics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
