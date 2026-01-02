import { Request, Response } from 'express';
import { boardingService } from '../services/boarding.service';

export const boardingController = {
  /**
   * POST /api/v1/transportation/trips/:tripId/boarding/pickup
   * Record student boarding at pickup stop with photo
   */
  async recordBoardingAtPickup(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;
      const { studentId, pickupStopId, photoUrl, accuracy } = req.body;

      // Validation
      if (!studentId || !pickupStopId) {
        return res.status(400).json({
          success: false,
          error: 'studentId and pickupStopId are required',
        });
      }

      const result = await boardingService.recordBoardingAtPickup(
        tripId,
        studentId,
        pickupStopId,
        schoolId,
        photoUrl,
        accuracy
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error recording boarding:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to record boarding',
      });
    }
  },

  /**
   * POST /api/v1/transportation/trips/:tripId/alighting/dropoff
   * Record student alighting at drop stop
   */
  async recordAlightingAtDropoff(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;
      const { studentId, dropStopId, latitude, longitude, accuracy } = req.body;

      // Validation
      if (!studentId || !dropStopId) {
        return res.status(400).json({
          success: false,
          error: 'studentId and dropStopId are required',
        });
      }

      const result = await boardingService.recordAlightingAtDropoff(
        tripId,
        studentId,
        dropStopId,
        schoolId,
        latitude,
        longitude,
        accuracy
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error recording alighting:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to record alighting',
      });
    }
  },

  /**
   * POST /api/v1/transportation/trips/:tripId/attendance/absent
   * Mark student absent for trip
   */
  async markStudentAbsent(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;
      const { studentId, reason } = req.body;

      // Validation
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'studentId is required',
        });
      }

      const result = await boardingService.markStudentAbsent(tripId, studentId, schoolId, reason);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error marking student absent:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to mark student absent',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:tripId/boarding/summary
   * Get boarding summary for trip
   */
  async getTripBoardingSummary(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      const result = await boardingService.getTripBoardingSummary(tripId, schoolId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting boarding summary:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to get boarding summary',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:tripId/students/:studentId/boarding
   * Get student boarding history for specific trip
   */
  async getStudentBoardingHistory(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId, studentId } = req.params;

      const result = await boardingService.getStudentBoardingHistory(
        tripId,
        studentId,
        schoolId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting boarding history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get boarding history',
      });
    }
  },

  /**
   * POST /api/v1/transportation/trips/:tripId/boarding/auto
   * Auto-board students at pickup stop (geofence trigger)
   */
  async autoMarkBoardingAtPickupStop(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;
      const { pickupStopId } = req.body;

      // Validation
      if (!pickupStopId) {
        return res.status(400).json({
          success: false,
          error: 'pickupStopId is required',
        });
      }

      const result = await boardingService.autoMarkBoardingAtPickupStop(
        tripId,
        pickupStopId,
        schoolId
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error auto-boarding students:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to auto-board students',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:tripId/boarding/pending
   * Get students who haven't boarded yet
   */
  async getPendingBoardingStudents(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      const result = await boardingService.getPendingBoardingStudents(tripId, schoolId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting pending boarding students:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to get pending boarding students',
      });
    }
  },

  /**
   * GET /api/v1/transportation/trips/:tripId/alighting/pending
   * Get students who have boarded but not alighted
   */
  async getPendingAlightingStudents(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      const result = await boardingService.getPendingAlightingStudents(tripId, schoolId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting pending alighting students:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to get pending alighting students',
      });
    }
  },

  /**
   * PUT /api/v1/transportation/trips/:tripId/students/:studentId/boarding/photo
   * Update boarding photo
   */
  async updateBoardingPhoto(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId, studentId } = req.params;
      const { photoUrl } = req.body;

      // Validation
      if (!photoUrl) {
        return res.status(400).json({
          success: false,
          error: 'photoUrl is required',
        });
      }

      const result = await boardingService.updateBoardingPhoto(
        tripId,
        studentId,
        schoolId,
        photoUrl
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error updating boarding photo:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update boarding photo',
      });
    }
  },

  /**
   * POST /api/v1/transportation/trips/:tripId/attendance/finalize
   * Finalize trip attendance after completion
   */
  async finalizeTripAttendance(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { tripId } = req.params;

      const result = await boardingService.finalizeTripAttendance(tripId, schoolId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error finalizing trip attendance:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to finalize trip attendance',
      });
    }
  },
};
