import { Request, Response } from 'express';
import { driverService } from '../services/driver.service';

export const driverController = {
  // Create new driver
  async createDriver(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { userId, licenseNumber, licenseExpiry, phone, branchId } = req.body;

      // Validation
      if (!userId || !licenseNumber || !licenseExpiry || !phone) {
        return res.status(400).json({
          success: false,
          error: 'User ID, license number, license expiry, and phone are required',
        });
      }

      // Validate license expiry date
      const expiry = new Date(licenseExpiry);
      if (expiry < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'License expiry date cannot be in the past',
        });
      }

      const driver = await driverService.createDriver({
        userId,
        licenseNumber,
        licenseExpiry,
        phone,
        schoolId,
        branchId,
      });

      res.status(201).json({
        success: true,
        data: driver,
        message: 'Driver created successfully',
      });
    } catch (error: any) {
      console.error('Error creating driver:', error);
      res.status(error.message.includes('already exists') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create driver',
      });
    }
  },

  // Get all drivers
  async getDrivers(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, branchId, status, isActive, page, limit } = req.query;

      const { data, total } = await driverService.getDrivers(
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
      console.error('Error fetching drivers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch drivers',
      });
    }
  },

  // Get driver by ID
  async getDriverById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const driver = await driverService.getDriverById(id, schoolId);

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      res.json({
        success: true,
        data: driver,
      });
    } catch (error: any) {
      console.error('Error fetching driver:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch driver',
      });
    }
  },

  // Update driver
  async updateDriver(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { licenseNumber, licenseExpiry, phone, status, isActive } = req.body;

      // Validation
      if (licenseExpiry) {
        const expiry = new Date(licenseExpiry);
        if (expiry < new Date()) {
          return res.status(400).json({
            success: false,
            error: 'License expiry date cannot be in the past',
          });
        }
      }

      if (status) {
        const validStatuses = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid driver status',
          });
        }
      }

      const driver = await driverService.updateDriver(id, schoolId, {
        licenseNumber,
        licenseExpiry,
        phone,
        status,
        isActive,
      });

      res.json({
        success: true,
        data: driver,
        message: 'Driver updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating driver:', error);
      res.status(error.message === 'Driver not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update driver',
      });
    }
  },

  // Delete driver (soft delete)
  async deleteDriver(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const driver = await driverService.deleteDriver(id, schoolId);

      res.json({
        success: true,
        data: driver,
        message: 'Driver deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting driver:', error);
      res.status(error.message === 'Driver not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete driver',
      });
    }
  },

  // Check licenses expiring soon
  async checkLicenseExpiry(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const drivers = await driverService.checkLicenseExpiry(schoolId);

      res.json({
        success: true,
        data: drivers,
        message: `Found ${drivers.length} drivers with licenses expiring within 30 days`,
      });
    } catch (error: any) {
      console.error('Error checking license expiry:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to check license expiry',
      });
    }
  },

  // Assign driver to route
  async assignRoute(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: driverId } = req.params;
      const { routeId } = req.body;

      if (!routeId) {
        return res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
      }

      const assignment = await driverService.assignDriverToRoute(driverId, routeId, schoolId);

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Driver assigned to route successfully',
      });
    } catch (error: any) {
      console.error('Error assigning driver to route:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to assign driver to route',
      });
    }
  },

  // Unassign driver from route
  async unassignRoute(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: driverId } = req.params;
      const { routeId } = req.body;

      if (!routeId) {
        return res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
      }

      const assignment = await driverService.unassignDriverFromRoute(driverId, routeId, schoolId);

      res.json({
        success: true,
        data: assignment,
        message: 'Driver unassigned from route successfully',
      });
    } catch (error: any) {
      console.error('Error unassigning driver from route:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to unassign driver from route',
      });
    }
  },

  // Get driver's routes
  async getRoutes(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: driverId } = req.params;

      const routes = await driverService.getDriverRoutes(driverId, schoolId);

      res.json({
        success: true,
        data: routes,
      });
    } catch (error: any) {
      console.error('Error fetching driver routes:', error);
      res.status(error.message === 'Driver not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch driver routes',
      });
    }
  },

  // Get driver's trips
  async getTrips(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: driverId } = req.params;
      const { page, limit } = req.query;

      const { data, total } = await driverService.getDriverTrips(driverId, schoolId, {
        page: page ? parseInt(page as string) : 0,
        limit: limit ? parseInt(limit as string) : 10,
      });

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
      console.error('Error fetching driver trips:', error);
      res.status(error.message === 'Driver not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch driver trips',
      });
    }
  },
};
