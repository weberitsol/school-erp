import { Request, Response } from 'express';
import { vendorService, CreateVendorData } from '@/services/vendor.service';

export const vendorController = {
  /**
   * Create new vendor
   */
  async createVendor(req: Request, res: Response) {
    try {
      const { name, code, vendorType, contactPerson, email, phone, address } = req.body;
      const schoolId = req.user?.schoolId;

      if (!name || !code || !vendorType) {
        return res.status(400).json({
          message: 'Name, code, and vendor type are required',
        });
      }

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const data: CreateVendorData = {
        name,
        code,
        vendorType,
        schoolId,
        contactPerson,
        email,
        phone,
        address,
      };

      const vendor = await vendorService.createVendor(data);

      res.status(201).json({
        message: 'Vendor created successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to create vendor',
      });
    }
  },

  /**
   * Get all vendors
   */
  async getVendors(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { vendorType, isActive, skip, take } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const vendors = await vendorService.getVendors({
        schoolId,
        vendorType: vendorType as string,
        isActive: isActive ? isActive === 'true' : undefined,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });

      res.status(200).json({
        message: 'Vendors retrieved successfully',
        data: vendors.data,
        total: vendors.total,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch vendors',
      });
    }
  },

  /**
   * Get vendor by ID
   */
  async getVendorById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vendor = await vendorService.getVendorById(id);

      res.status(200).json({
        message: 'Vendor retrieved successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(404).json({
        message: error.message || 'Vendor not found',
      });
    }
  },

  /**
   * Update vendor
   */
  async updateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        contactPerson,
        email,
        phone,
        address,
        performanceRating,
        qualityScore,
        deliveryScore,
        isActive,
      } = req.body;

      const vendor = await vendorService.updateVendor(id, {
        name,
        contactPerson,
        email,
        phone,
        address,
        performanceRating,
        qualityScore,
        deliveryScore,
        isActive,
      });

      res.status(200).json({
        message: 'Vendor updated successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update vendor',
      });
    }
  },

  /**
   * Delete vendor
   */
  async deleteVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await vendorService.deleteVendor(id);

      res.status(200).json({
        message: 'Vendor deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to delete vendor',
      });
    }
  },

  /**
   * Get vendors by type
   */
  async getVendorsByType(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { vendorType } = req.params;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const vendors = await vendorService.getVendorsByType(schoolId, vendorType);

      res.status(200).json({
        message: 'Vendors retrieved successfully',
        data: vendors,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch vendors',
      });
    }
  },

  /**
   * Get active vendors
   */
  async getActiveVendors(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { vendorType, skip, take } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const vendors = await vendorService.getActiveVendors(schoolId, {
        vendorType: vendorType as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });

      res.status(200).json({
        message: 'Active vendors retrieved successfully',
        data: vendors.data,
        total: vendors.total,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch active vendors',
      });
    }
  },

  /**
   * Deactivate vendor
   */
  async deactivateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vendor = await vendorService.deactivateVendor(id);

      res.status(200).json({
        message: 'Vendor deactivated successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to deactivate vendor',
      });
    }
  },

  /**
   * Reactivate vendor
   */
  async reactivateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vendor = await vendorService.reactivateVendor(id);

      res.status(200).json({
        message: 'Vendor reactivated successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to reactivate vendor',
      });
    }
  },

  /**
   * Update performance rating
   */
  async updatePerformanceRating(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (rating === undefined) {
        return res.status(400).json({
          message: 'Rating is required',
        });
      }

      const vendor = await vendorService.updatePerformanceRating(id, rating);

      res.status(200).json({
        message: 'Performance rating updated successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update performance rating',
      });
    }
  },

  /**
   * Update quality score
   */
  async updateQualityScore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { score } = req.body;

      if (score === undefined) {
        return res.status(400).json({
          message: 'Score is required',
        });
      }

      const vendor = await vendorService.updateQualityScore(id, score);

      res.status(200).json({
        message: 'Quality score updated successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update quality score',
      });
    }
  },

  /**
   * Update delivery score
   */
  async updateDeliveryScore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { score } = req.body;

      if (score === undefined) {
        return res.status(400).json({
          message: 'Score is required',
        });
      }

      const vendor = await vendorService.updateDeliveryScore(id, score);

      res.status(200).json({
        message: 'Delivery score updated successfully',
        data: vendor,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update delivery score',
      });
    }
  },

  /**
   * Get vendor types
   */
  async getVendorTypes(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const types = await vendorService.getVendorTypes(schoolId);

      res.status(200).json({
        message: 'Vendor types retrieved successfully',
        data: types,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch vendor types',
      });
    }
  },

  /**
   * Get vendor statistics
   */
  async getVendorStats(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const stats = await vendorService.getVendorStats(schoolId);

      res.status(200).json({
        message: 'Vendor stats retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch vendor stats',
      });
    }
  },

  /**
   * Get top rated vendors
   */
  async getTopRatedVendors(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { limit } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const vendors = await vendorService.getTopRatedVendors(
        schoolId,
        limit ? parseInt(limit as string) : 10
      );

      res.status(200).json({
        message: 'Top rated vendors retrieved successfully',
        data: vendors,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch top rated vendors',
      });
    }
  },
};
