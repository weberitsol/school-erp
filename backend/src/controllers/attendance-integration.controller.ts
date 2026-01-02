import { Request, Response } from 'express';
import { attendanceIntegrationService } from '../services/attendance-integration.service';

export const attendanceIntegrationController = {
  /**
   * POST /api/v1/transportation/trips/:tripId/attendance/sync
   * Sync trip attendance to school attendance system
   */
  async syncTripAttendance(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      const result = await attendanceIntegrationService.syncTripAttendanceToSystem(
        tripId,
        schoolId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error syncing trip attendance:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to sync attendance',
      });
    }
  },

  /**
   * GET /api/v1/transportation/students/:studentId/attendance/:date
   * Get student attendance on specific date
   */
  async getStudentAttendanceOnDate(req: Request, res: Response) {
    try {
      const { studentId, date } = req.params;

      // Parse date
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD.',
        });
      }

      const result = await attendanceIntegrationService.getStudentAttendanceOnDate(
        studentId,
        attendanceDate
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting student attendance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get attendance',
      });
    }
  },

  /**
   * GET /api/v1/transportation/sections/:sectionId/attendance/:date
   * Get section attendance summary for date
   */
  async getSectionAttendanceSummary(req: Request, res: Response) {
    try {
      const { sectionId, date } = req.params;

      // Parse date
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD.',
        });
      }

      const result = await attendanceIntegrationService.getSectionAttendanceSummary(
        sectionId,
        attendanceDate
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting section attendance summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get section summary',
      });
    }
  },

  /**
   * POST /api/v1/transportation/students/:studentId/notify-absence
   * Send absence notification to parent
   */
  async notifyParentOfAbsence(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { tripId, reason } = req.body;

      // Validation
      if (!tripId) {
        return res.status(400).json({
          success: false,
          error: 'tripId is required',
        });
      }

      const result = await attendanceIntegrationService.notifyParentOfAbsence(
        studentId,
        tripId,
        reason
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error notifying parent:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to send notification',
      });
    }
  },

  /**
   * POST /api/v1/transportation/sections/:sectionId/notify-absences/:date
   * Notify section teachers of absences
   */
  async notifySectionTeachersOfAbsences(req: Request, res: Response) {
    try {
      const { sectionId, date } = req.params;

      // Parse date
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD.',
        });
      }

      const result = await attendanceIntegrationService.notifySectionTeachersOfAbsences(
        sectionId,
        attendanceDate
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error notifying section teachers:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to notify teachers',
      });
    }
  },

  /**
   * GET /api/v1/transportation/students/:studentId/attendance-history
   * Get student attendance history
   */
  async getStudentAttendanceHistory(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { limit } = req.query;

      const limitValue = limit ? parseInt(limit as string) : 30;

      if (limitValue < 1 || limitValue > 365) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 365',
        });
      }

      const result = await attendanceIntegrationService.getStudentAttendanceHistory(
        studentId,
        limitValue
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting attendance history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get attendance history',
      });
    }
  },

  /**
   * POST /api/v1/transportation/attendance/batch-sync
   * Batch sync multiple trips to attendance
   */
  async batchSyncTripsToAttendance(req: Request, res: Response) {
    try {
      const { tripIds } = req.body;

      // Validation
      if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'tripIds array is required and must not be empty',
        });
      }

      if (tripIds.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 100 trips per batch',
        });
      }

      const result = await attendanceIntegrationService.syncMultipleTripsToAttendance(
        tripIds
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error batch syncing trips:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to batch sync',
      });
    }
  },

  /**
   * GET /api/v1/transportation/attendance/stats-by-section
   * Get attendance statistics by section for a date range
   */
  async getAttendanceStatsBySection(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      // Validation
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD).',
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          error: 'startDate must be before endDate',
        });
      }

      const result = await attendanceIntegrationService.getAttendanceStatsBySection(
        start,
        end
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting attendance statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get attendance statistics',
      });
    }
  },

  /**
   * GET /api/v1/transportation/attendance/absence-summary
   * Get student-wise absence summary for a date range
   */
  async getStudentAbsenceSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit } = req.query;

      // Validation
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD).',
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          error: 'startDate must be before endDate',
        });
      }

      const limitValue = limit ? parseInt(limit as string) : 20;

      if (limitValue < 1 || limitValue > 200) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 200',
        });
      }

      const result = await attendanceIntegrationService.getStudentAbsenceSummary(
        start,
        end,
        limitValue
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting absence summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get absence summary',
      });
    }
  },
};
