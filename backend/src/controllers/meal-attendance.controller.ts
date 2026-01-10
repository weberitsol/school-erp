import { Request, Response } from 'express';
import { mealAttendanceService } from '../services/meal-attendance.service';

export const mealAttendanceController = {
  async getAll(req: Request, res: Response) {
    try {
      const { enrollmentId, mealId, status } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const data = await mealAttendanceService.getAll({
        enrollmentId: enrollmentId as string,
        mealId: mealId as string,
        schoolId,
        status: status as any,
      });

      res.json({ success: true, data: data.data, total: data.total });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const attendance = await mealAttendanceService.getById(id);

      if (!attendance) {
        return res
          .status(404)
          .json({ success: false, error: 'Attendance record not found' });
      }

      res.json({ success: true, data: attendance });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getSafeVariants(req: Request, res: Response) {
    try {
      const { studentId, mealId } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const variants = await mealAttendanceService.getSafeVariants(
        studentId,
        mealId,
        schoolId
      );

      const safeVariants = variants.filter((v) => v.isSafe);
      const unsafeVariants = variants.filter((v) => !v.isSafe);

      res.json({
        success: true,
        data: {
          safeVariants,
          unsafeVariants,
          totalVariants: variants.length,
          safeCount: safeVariants.length,
          unsafeCount: unsafeVariants.length,
        },
        message: `${safeVariants.length}/${variants.length} variants are safe for this student`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async markAttendance(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { studentId, enrollmentId, mealId, variantId, status, attendanceDate } = req.body;

      if (!studentId || !enrollmentId || !mealId || !status || !attendanceDate) {
        return res.status(400).json({
          success: false,
          error:
            'studentId, enrollmentId, mealId, status, and attendanceDate are required',
        });
      }

      const attendance = await mealAttendanceService.markAttendance({
        studentId,
        enrollmentId,
        mealId,
        variantId,
        status,
        attendanceDate: new Date(attendanceDate),
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: attendance,
        message: `✓ Attendance marked - ${status}${
          attendance.allergyVerified ? ' (Allergen Verified)' : ''
        }`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getMonthlyAttendance(req: Request, res: Response) {
    try {
      const { enrollmentId } = req.params;
      const { year, month } = req.query;

      if (!year || !month) {
        return res
          .status(400)
          .json({ success: false, error: 'year and month query parameters required' });
      }

      const summary = await mealAttendanceService.getMonthlyAttendance(
        enrollmentId,
        parseInt(year as string),
        parseInt(month as string)
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAttendanceStats(req: Request, res: Response) {
    try {
      const { enrollmentId } = req.params;

      const stats = await mealAttendanceService.getAttendanceStats(enrollmentId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { variantId, status, allergyVerified } = req.body;

      const updated = await mealAttendanceService.update(id, {
        variantId,
        status,
        allergyVerified,
      });

      res.json({
        success: true,
        data: updated,
        message: 'Attendance updated',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await mealAttendanceService.delete(id);

      res.json({ success: true, message: 'Attendance record deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
