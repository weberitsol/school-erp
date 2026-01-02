import { Request, Response, NextFunction } from 'express';
import { attendanceService, AttendanceFilters } from '../services/attendance.service';
import { AttendanceStatus } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    schoolId: string;
  };
}

export const attendanceController = {
  // Mark single student attendance
  async markStudentAttendance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { studentId, sectionId, date, status, remarks } = req.body;

      if (!studentId || !sectionId || !date || !status) {
        return res.status(400).json({
          success: false,
          error: 'studentId, sectionId, date, and status are required',
        });
      }

      const attendance = await attendanceService.markStudentAttendance({
        studentId,
        sectionId,
        date: new Date(date),
        status: status as AttendanceStatus,
        remarks,
        markedById: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Attendance marked successfully',
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk mark student attendance
  async bulkMarkStudentAttendance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sectionId, date, attendances } = req.body;

      if (!sectionId || !date || !attendances || !Array.isArray(attendances)) {
        return res.status(400).json({
          success: false,
          error: 'sectionId, date, and attendances array are required',
        });
      }

      const result = await attendanceService.bulkMarkStudentAttendance({
        sectionId,
        date: new Date(date),
        attendances,
        markedById: req.user?.id,
      });

      res.json({
        success: true,
        message: `${result.success.length} attendance records marked successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student attendance
  async getStudentAttendance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sectionId, studentId, startDate, endDate, status } = req.query;

      const filters: AttendanceFilters = {
        sectionId: sectionId as string,
        studentId: studentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as AttendanceStatus,
      };

      const attendances = await attendanceService.getStudentAttendance(filters);

      res.json({
        success: true,
        data: attendances,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get attendance by date and section
  async getAttendanceByDateAndSection(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sectionId, date } = req.query;

      if (!sectionId || !date) {
        return res.status(400).json({
          success: false,
          error: 'sectionId and date are required',
        });
      }

      const result = await attendanceService.getAttendanceByDateAndSection(
        sectionId as string,
        new Date(date as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get attendance report
  async getAttendanceReport(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sectionId, startDate, endDate } = req.query;

      if (!sectionId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'sectionId, startDate, and endDate are required',
        });
      }

      const report = await attendanceService.getSectionAttendanceReport(
        sectionId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark teacher attendance
  async markTeacherAttendance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { teacherId, date, status, checkInTime, checkOutTime, remarks } =
        req.body;

      if (!teacherId || !date || !status) {
        return res.status(400).json({
          success: false,
          error: 'teacherId, date, and status are required',
        });
      }

      const attendance = await attendanceService.markTeacherAttendance({
        teacherId,
        date: new Date(date),
        status: status as AttendanceStatus,
        checkInTime,
        checkOutTime,
        remarks,
      });

      res.json({
        success: true,
        message: 'Teacher attendance marked successfully',
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get teacher attendance
  async getTeacherAttendance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { teacherId, startDate, endDate, status } = req.query;

      const filters: AttendanceFilters = {
        teacherId: teacherId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as AttendanceStatus,
      };

      const attendances = await attendanceService.getTeacherAttendance(filters);

      res.json({
        success: true,
        data: attendances,
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk mark teacher attendance
  async bulkMarkTeacherAttendance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { date, attendances } = req.body;

      if (!date || !attendances || !Array.isArray(attendances)) {
        return res.status(400).json({
          success: false,
          error: 'date and attendances array are required',
        });
      }

      const result = await attendanceService.bulkMarkTeacherAttendance(
        new Date(date),
        attendances
      );

      res.json({
        success: true,
        message: `${result.success.length} teacher attendance records marked successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get attendance stats for dashboard
  async getAttendanceStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required',
        });
      }

      const { date } = req.query;
      const statsDate = date ? new Date(date as string) : new Date();

      const stats = await attendanceService.getAttendanceStats(
        schoolId,
        statsDate
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};
