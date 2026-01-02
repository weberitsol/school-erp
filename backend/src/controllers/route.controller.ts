import { Request, Response } from 'express';
import { routeService } from '../services/route.service';

export const routeController = {
  // ==================== ROUTE ENDPOINTS ====================

  // Create new route
  async createRoute(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, description, startTime, endTime, branchId } = req.body;

      // Validation
      if (!name || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'Name, start time, and end time are required',
        });
      }

      const route = await routeService.createRoute({
        name,
        description,
        startTime,
        endTime,
        schoolId,
        branchId,
      });

      res.status(201).json({
        success: true,
        data: route,
        message: 'Route created successfully',
      });
    } catch (error: any) {
      console.error('Error creating route:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create route',
      });
    }
  },

  // Get all routes
  async getRoutes(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, branchId, status, isActive, page, limit } = req.query;

      const { data, total } = await routeService.getRoutes(
        {
          schoolId,
          search: search as string,
          branchId: branchId as string,
          status: status as any,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        },
        {
          page: page ? parseInt(page as string) : 0,
          limit: limit ? parseInt(limit as string) : 10,
        }
      );

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: page ? parseInt(page as string) : 0,
          limit: limit ? parseInt(limit as string) : 10,
        },
      });
    } catch (error: any) {
      console.error('Error fetching routes:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch routes',
      });
    }
  },

  // Get route by ID
  async getRouteById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const route = await routeService.getRouteById(id, schoolId);

      if (!route) {
        return res.status(404).json({
          success: false,
          error: 'Route not found',
        });
      }

      res.json({
        success: true,
        data: route,
      });
    } catch (error: any) {
      console.error('Error fetching route:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch route',
      });
    }
  },

  // Update route
  async updateRoute(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { name, description, startTime, endTime, status, isActive } = req.body;

      if (status) {
        const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid route status',
          });
        }
      }

      const route = await routeService.updateRoute(id, schoolId, {
        name,
        description,
        startTime,
        endTime,
        status,
        isActive,
      });

      res.json({
        success: true,
        data: route,
        message: 'Route updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating route:', error);
      res.status(error.message === 'Route not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update route',
      });
    }
  },

  // Delete route
  async deleteRoute(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const route = await routeService.deleteRoute(id, schoolId);

      res.json({
        success: true,
        data: route,
        message: 'Route deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting route:', error);
      res.status(error.message === 'Route not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete route',
      });
    }
  },

  // Get route stops
  async getRouteStops(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: routeId } = req.params;

      const stops = await routeService.getRouteStops(routeId, schoolId);

      res.json({
        success: true,
        data: stops,
      });
    } catch (error: any) {
      console.error('Error fetching route stops:', error);
      res.status(error.message === 'Route not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch route stops',
      });
    }
  },

  // Add stop to route
  async addStopToRoute(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: routeId } = req.params;
      const { stopId, sequence, waitTimeMinutes } = req.body;

      if (!stopId || sequence === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Stop ID and sequence are required',
        });
      }

      if (sequence < 1) {
        return res.status(400).json({
          success: false,
          error: 'Sequence must be greater than 0',
        });
      }

      const routeStop = await routeService.addStopToRoute(
        routeId,
        stopId,
        sequence,
        waitTimeMinutes || 5,
        schoolId
      );

      res.status(201).json({
        success: true,
        data: routeStop,
        message: 'Stop added to route successfully',
      });
    } catch (error: any) {
      console.error('Error adding stop to route:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to add stop to route',
      });
    }
  },

  // Remove stop from route
  async removeStopFromRoute(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: routeId } = req.params;
      const { stopId } = req.body;

      if (!stopId) {
        return res.status(400).json({
          success: false,
          error: 'Stop ID is required',
        });
      }

      await routeService.removeStopFromRoute(routeId, stopId, schoolId);

      res.json({
        success: true,
        message: 'Stop removed from route successfully',
      });
    } catch (error: any) {
      console.error('Error removing stop from route:', error);
      res.status(error.message === 'Route not found or access denied' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to remove stop from route',
      });
    }
  },

  // Update route stop sequence
  async updateRouteStopSequence(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: routeId } = req.params;
      const { stopId, newSequence } = req.body;

      if (!stopId || newSequence === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Stop ID and new sequence are required',
        });
      }

      if (newSequence < 1) {
        return res.status(400).json({
          success: false,
          error: 'Sequence must be greater than 0',
        });
      }

      const routeStop = await routeService.updateRouteStopSequence(
        routeId,
        stopId,
        newSequence,
        schoolId
      );

      res.json({
        success: true,
        data: routeStop,
        message: 'Route stop sequence updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating route stop sequence:', error);
      res.status(error.message === 'Route not found or access denied' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to update route stop sequence',
      });
    }
  },

  // ==================== STOP ENDPOINTS ====================

  // Create new stop
  async createStop(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, latitude, longitude, stopType, address, branchId } = req.body;

      // Validation
      if (!name || latitude === undefined || longitude === undefined || !stopType) {
        return res.status(400).json({
          success: false,
          error: 'Name, latitude, longitude, and stop type are required',
        });
      }

      const validTypes = ['PICKUP', 'DROP', 'BOTH'];
      if (!validTypes.includes(stopType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid stop type',
        });
      }

      // Validate GPS coordinates
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          error: 'Latitude must be between -90 and 90',
        });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          error: 'Longitude must be between -180 and 180',
        });
      }

      const stop = await routeService.createStop({
        name,
        latitude,
        longitude,
        stopType,
        address,
        schoolId,
        branchId,
      });

      res.status(201).json({
        success: true,
        data: stop,
        message: 'Stop created successfully',
      });
    } catch (error: any) {
      console.error('Error creating stop:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create stop',
      });
    }
  },

  // Get all stops
  async getStops(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, branchId, stopType, isActive, page, limit } = req.query;

      const { data, total } = await routeService.getStops(
        {
          schoolId,
          search: search as string,
          branchId: branchId as string,
          stopType: stopType as any,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        },
        {
          page: page ? parseInt(page as string) : 0,
          limit: limit ? parseInt(limit as string) : 10,
        }
      );

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: page ? parseInt(page as string) : 0,
          limit: limit ? parseInt(limit as string) : 10,
        },
      });
    } catch (error: any) {
      console.error('Error fetching stops:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stops',
      });
    }
  },

  // Get stop by ID
  async getStopById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const stop = await routeService.getStopById(id, schoolId);

      if (!stop) {
        return res.status(404).json({
          success: false,
          error: 'Stop not found',
        });
      }

      res.json({
        success: true,
        data: stop,
      });
    } catch (error: any) {
      console.error('Error fetching stop:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stop',
      });
    }
  },

  // Update stop
  async updateStop(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { name, latitude, longitude, stopType, address, isActive } = req.body;

      // Validate stop type if provided
      if (stopType) {
        const validTypes = ['PICKUP', 'DROP', 'BOTH'];
        if (!validTypes.includes(stopType)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid stop type',
          });
        }
      }

      // Validate GPS coordinates if provided
      if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        return res.status(400).json({
          success: false,
          error: 'Latitude must be between -90 and 90',
        });
      }

      if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        return res.status(400).json({
          success: false,
          error: 'Longitude must be between -180 and 180',
        });
      }

      const stop = await routeService.updateStop(id, schoolId, {
        name,
        latitude,
        longitude,
        stopType,
        address,
        isActive,
      });

      res.json({
        success: true,
        data: stop,
        message: 'Stop updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating stop:', error);
      res.status(error.message === 'Stop not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update stop',
      });
    }
  },

  // Delete stop
  async deleteStop(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const stop = await routeService.deleteStop(id, schoolId);

      res.json({
        success: true,
        data: stop,
        message: 'Stop deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting stop:', error);
      res.status(error.message === 'Stop not found or access denied' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to delete stop',
      });
    }
  },
};
