import { Request, Response } from 'express';
import { enrollmentService } from '../services/enrollment.service';

export const enrollmentController = {
  async getAll(req: Request, res: Response) {
    try {
      const { studentId, messId, status } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const data = await enrollmentService.getAll({
        studentId: studentId as string,
        messId: messId as string,
        schoolId,
        status: status as string,
      });

      res.json({ success: true, data: data.data, total: data.total });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const enrollment = await enrollmentService.getById(id);

      if (!enrollment) {
        return res
          .status(404)
          .json({ success: false, error: 'Enrollment not found' });
      }

      res.json({ success: true, data: enrollment });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getStudentEnrollments(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const enrollments = await enrollmentService.getStudentEnrollments(studentId, schoolId);

      res.json({
        success: true,
        data: enrollments,
        message: `${enrollments.length} enrollment(s) found`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { studentId, messId, planId, startDate, endDate, dietaryPreferences } = req.body;

      if (!studentId || !messId || !planId || !startDate) {
        return res.status(400).json({
          success: false,
          error: 'studentId, messId, planId, and startDate are required',
        });
      }

      const enrollment = await enrollmentService.create({
        studentId,
        messId,
        planId,
        enrollmentDate: new Date(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        dietaryPreferences,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: enrollment,
        message: '✓ Student enrolled successfully',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { endDate, dietaryPreferences } = req.body;

      const enrollment = await enrollmentService.update(id, {
        endDate: endDate ? new Date(endDate) : undefined,
        dietaryPreferences,
      } as any);

      res.json({
        success: true,
        data: enrollment,
        message: 'Enrollment updated',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async endEnrollment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const enrollment = await enrollmentService.endEnrollment(id);

      res.json({
        success: true,
        data: enrollment,
        message: '✓ Enrollment terminated',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getMessStatistics(req: Request, res: Response) {
    try {
      const { messId } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const stats = await enrollmentService.getMessStatistics(messId, schoolId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await enrollmentService.delete(id);

      res.json({ success: true, message: 'Enrollment deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
