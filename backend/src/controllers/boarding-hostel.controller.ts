import { Request, Response } from 'express';
import { boardingHostelService } from '../services/boarding-hostel.service';

class BoardingHostelController {
  // Facilities
  async createFacility(req: Request, res: Response) {
    try {
      const { name, description, type } = req.body;
      const schoolId = (req as any).user?.schoolId;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, type',
        });
      }

      if (!schoolId) {
        return res.status(401).json({
          success: false,
          error: 'School ID not found in request',
        });
      }

      const facility = await boardingHostelService.createBoardingFacility({
        name,
        description,
        type,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: facility,
        message: 'Boarding facility created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create facility',
      });
    }
  }

  async getAllFacilities(req: Request, res: Response) {
    try {
      const filters = {
        schoolId: (req as any).user?.schoolId,
        type: req.query.type,
        available: req.query.available === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { data, total } = await boardingHostelService.getAllFacilities(filters);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: 'Facilities fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch facilities',
      });
    }
  }

  async getFacilityById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const facility = await boardingHostelService.getFacilityById(id);

      res.json({
        success: true,
        data: facility,
        message: 'Facility fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Boarding facility not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch facility',
      });
    }
  }

  // Rooms
  async createRoom(req: Request, res: Response) {
    try {
      const { roomNumber, floorNumber, capacity, type, boardingFacilityId, amenities } = req.body;
      const schoolId = (req as any).user?.schoolId;

      if (!roomNumber || floorNumber === undefined || !capacity || !type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: roomNumber, floorNumber, capacity, type',
        });
      }

      if (!schoolId) {
        return res.status(401).json({
          success: false,
          error: 'School ID not found in request',
        });
      }

      const room = await boardingHostelService.createRoom({
        roomNumber,
        floorNumber,
        capacity,
        type,
        schoolId,
        boardingFacilityId,
        amenities,
      });

      res.status(201).json({
        success: true,
        data: room,
        message: 'Room created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create room',
      });
    }
  }

  async getAllRooms(req: Request, res: Response) {
    try {
      const filters = {
        schoolId: (req as any).user?.schoolId,
        type: req.query.type,
        available: req.query.available === 'true',
        floorNumber: req.query.floorNumber,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { data, total } = await boardingHostelService.getAllRooms(filters);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: 'Rooms fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch rooms',
      });
    }
  }

  async getRoomById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const room = await boardingHostelService.getRoomById(id);

      res.json({
        success: true,
        data: room,
        message: 'Room fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Room not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch room',
      });
    }
  }

  async updateRoom(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { roomNumber, floorNumber, capacity, type, amenities, available } = req.body;

      const room = await boardingHostelService.updateRoom(id, {
        roomNumber,
        floorNumber,
        capacity,
        type,
        amenities,
        available,
      });

      res.json({
        success: true,
        data: room,
        message: 'Room updated successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Room not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to update room',
      });
    }
  }

  // Student Boarding
  async registerStudentBoarding(req: Request, res: Response) {
    try {
      const {
        studentId,
        roomId,
        boardingStartDate,
        boardingEndDate,
        boardingFeeAmount,
        emergencyContactName,
        emergencyContactPhone,
        medicalRequirements,
      } = req.body;

      const schoolId = (req as any).user?.schoolId;

      if (!studentId || !roomId || !boardingStartDate || !boardingFeeAmount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: studentId, roomId, boardingStartDate, boardingFeeAmount',
        });
      }

      if (!schoolId) {
        return res.status(401).json({
          success: false,
          error: 'School ID not found in request',
        });
      }

      const boarding = await boardingHostelService.registerStudentBoarding(
        {
          studentId,
          roomId,
          boardingStartDate: new Date(boardingStartDate),
          boardingEndDate: boardingEndDate ? new Date(boardingEndDate) : undefined,
          boardingFeeAmount,
          emergencyContactName,
          emergencyContactPhone,
          medicalRequirements,
        },
        schoolId
      );

      res.status(201).json({
        success: true,
        data: boarding,
        message: 'Student registered for boarding successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to register boarding',
      });
    }
  }

  async getActiveBoardings(req: Request, res: Response) {
    try {
      const filters = {
        schoolId: (req as any).user?.schoolId,
        roomId: req.query.roomId,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { data, total } = await boardingHostelService.getActiveBoardings(filters);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: 'Active boardings fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch boardings',
      });
    }
  }

  async getStudentBoarding(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const boarding = await boardingHostelService.getStudentBoarding(studentId);

      res.json({
        success: true,
        data: boarding,
        message: 'Student boarding fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Student boarding not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch student boarding',
      });
    }
  }

  async getStudentBoardingHistory(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const history = await boardingHostelService.getStudentBoardingHistory(studentId);

      res.json({
        success: true,
        data: history,
        message: 'Student boarding history fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch boarding history',
      });
    }
  }

  async endStudentBoarding(req: Request, res: Response) {
    try {
      const { boardingId } = req.params;
      const { endDate } = req.body;

      if (!endDate) {
        return res.status(400).json({
          success: false,
          error: 'endDate is required',
        });
      }

      const boarding = await boardingHostelService.endStudentBoarding(boardingId, new Date(endDate));

      res.json({
        success: true,
        data: boarding,
        message: 'Student boarding ended successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Boarding record not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to end boarding',
      });
    }
  }

  // Statistics
  async getBoardingStats(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user?.schoolId;
      const stats = await boardingHostelService.getBoardingStats(schoolId);

      res.json({
        success: true,
        data: stats,
        message: 'Boarding statistics fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch statistics',
      });
    }
  }
}

export const boardingHostelController = new BoardingHostelController();
