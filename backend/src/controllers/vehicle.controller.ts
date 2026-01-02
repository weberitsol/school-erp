import { Request, Response } from 'express';
import { vehicleService } from '../services/vehicle.service';

export const vehicleController = {
  // Create new vehicle
  async createVehicle(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        registrationNumber,
        type,
        capacity,
        gpsDeviceId,
        branchId,
        purchaseDate,
      } = req.body;

      // Validation
      if (!registrationNumber || !type || !capacity) {
        return res.status(400).json({
          success: false,
          error: 'Registration number, type, and capacity are required',
        });
      }

      const validTypes = ['BUS', 'VAN', 'CAR', 'AUTO', 'TEMPO'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid vehicle type',
        });
      }

      if (capacity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Capacity must be greater than 0',
        });
      }

      const vehicle = await vehicleService.createVehicle({
        registrationNumber,
        type,
        capacity,
        gpsDeviceId,
        schoolId,
        branchId,
        purchaseDate,
      });

      res.status(201).json({
        success: true,
        data: vehicle,
        message: 'Vehicle created successfully',
      });
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create vehicle',
      });
    }
  },

  // Get all vehicles
  async getVehicles(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, branchId, status, type, isActive, page, limit } = req.query;

      const { data, total } = await vehicleService.getVehicles(
        {
          schoolId,
          search: search as string,
          branchId: branchId as string,
          status: status as any,
          type: type as any,
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
      console.error('Error fetching vehicles:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch vehicles',
      });
    }
  },

  // Get vehicle by ID
  async getVehicleById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const vehicle = await vehicleService.getVehicleById(id, schoolId);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found',
        });
      }

      res.json({
        success: true,
        data: vehicle,
      });
    } catch (error: any) {
      console.error('Error fetching vehicle:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch vehicle',
      });
    }
  },

  // Update vehicle
  async updateVehicle(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { registrationNumber, type, capacity, gpsDeviceId, status, purchaseDate, isActive } = req.body;

      // Validation
      if (type) {
        const validTypes = ['BUS', 'VAN', 'CAR', 'AUTO', 'TEMPO'];
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid vehicle type',
          });
        }
      }

      if (capacity !== undefined && capacity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Capacity must be greater than 0',
        });
      }

      if (status) {
        const validStatuses = ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid vehicle status',
          });
        }
      }

      const vehicle = await vehicleService.updateVehicle(id, schoolId, {
        registrationNumber,
        type,
        capacity,
        gpsDeviceId,
        status,
        purchaseDate,
        isActive,
      });

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      res.status(error.message === 'Vehicle not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to update vehicle',
      });
    }
  },

  // Delete vehicle (soft delete)
  async deleteVehicle(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      const vehicle = await vehicleService.deleteVehicle(id, schoolId);

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      res.status(error.message === 'Vehicle not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to delete vehicle',
      });
    }
  },

  // Get maintenance history
  async getMaintenanceHistory(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { page, limit } = req.query;

      const { data, total } = await vehicleService.getVehicleMaintenanceHistory(
        id,
        schoolId,
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
      console.error('Error fetching maintenance history:', error);
      res.status(error.message === 'Vehicle not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch maintenance history',
      });
    }
  },

  // Assign driver to vehicle
  async assignDriver(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: vehicleId } = req.params;
      const { driverId } = req.body;

      if (!driverId) {
        return res.status(400).json({
          success: false,
          error: 'Driver ID is required',
        });
      }

      const assignment = await vehicleService.assignDriverToVehicle(vehicleId, driverId, schoolId);

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Driver assigned successfully',
      });
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to assign driver',
      });
    }
  },

  // Unassign driver from vehicle
  async unassignDriver(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: vehicleId } = req.params;
      const { driverId } = req.body;

      if (!driverId) {
        return res.status(400).json({
          success: false,
          error: 'Driver ID is required',
        });
      }

      const assignment = await vehicleService.unassignDriverFromVehicle(vehicleId, driverId, schoolId);

      res.json({
        success: true,
        data: assignment,
        message: 'Driver unassigned successfully',
      });
    } catch (error: any) {
      console.error('Error unassigning driver:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to unassign driver',
      });
    }
  },

  // Get vehicle drivers
  async getVehicleDrivers(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id: vehicleId } = req.params;

      const drivers = await vehicleService.getVehicleDrivers(vehicleId, schoolId);

      res.json({
        success: true,
        data: drivers,
      });
    } catch (error: any) {
      console.error('Error fetching vehicle drivers:', error);
      res.status(error.message === 'Vehicle not found or access denied' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch vehicle drivers',
      });
    }
  },
};
