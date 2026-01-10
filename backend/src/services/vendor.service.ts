import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CreateVendorData {
  name: string;
  code: string;
  vendorType: string;
  schoolId: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  performanceRating?: number;
  qualityScore?: number;
  deliveryScore?: number;
}

export interface UpdateVendorData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  performanceRating?: number;
  qualityScore?: number;
  deliveryScore?: number;
  isActive?: boolean;
}

export interface VendorFilters {
  schoolId?: string;
  vendorType?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  averagePerformanceRating: number;
}

class VendorService {
  /**
   * Create new vendor
   */
  async createVendor(data: CreateVendorData) {
    try {
      // Check if vendor code already exists for this school
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          code: data.code,
          schoolId: data.schoolId,
        },
      });

      if (existingVendor) {
        throw new Error('Vendor code already exists for this school');
      }

      const vendor = await prisma.vendor.create({
        data: {
          name: data.name,
          code: data.code,
          vendorType: data.vendorType,
          schoolId: data.schoolId,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          address: data.address,
          performanceRating: data.performanceRating
            ? new Decimal(data.performanceRating)
            : null,
          qualityScore: data.qualityScore,
          deliveryScore: data.deliveryScore,
          isActive: true,
        },
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to create vendor: ${error.message}`);
    }
  }

  /**
   * Get vendors with filters
   */
  async getVendors(filters?: VendorFilters) {
    try {
      const where: any = {};

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }
      if (filters?.vendorType) {
        where.vendorType = filters.vendorType;
      }
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const [data, total] = await Promise.all([
        prisma.vendor.findMany({
          where,
          skip: filters?.skip,
          take: filters?.take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.vendor.count({ where }),
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(id: string) {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id },
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to fetch vendor: ${error.message}`);
    }
  }

  /**
   * Update vendor
   */
  async updateVendor(id: string, data: UpdateVendorData) {
    try {
      const updateData: any = {
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        isActive: data.isActive,
      };

      if (data.performanceRating !== undefined) {
        updateData.performanceRating = data.performanceRating
          ? new Decimal(data.performanceRating)
          : null;
      }
      if (data.qualityScore !== undefined) {
        updateData.qualityScore = data.qualityScore;
      }
      if (data.deliveryScore !== undefined) {
        updateData.deliveryScore = data.deliveryScore;
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: updateData,
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to update vendor: ${error.message}`);
    }
  }

  /**
   * Delete vendor
   */
  async deleteVendor(id: string) {
    try {
      const vendor = await prisma.vendor.delete({
        where: { id },
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to delete vendor: ${error.message}`);
    }
  }

  /**
   * Get vendors by type
   */
  async getVendorsByType(schoolId: string, vendorType: string) {
    try {
      const vendors = await prisma.vendor.findMany({
        where: {
          schoolId,
          vendorType,
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return vendors;
    } catch (error: any) {
      throw new Error(`Failed to fetch vendors by type: ${error.message}`);
    }
  }

  /**
   * Get active vendors
   */
  async getActiveVendors(schoolId: string, filters?: VendorFilters) {
    try {
      const where: any = {
        schoolId,
        isActive: true,
      };

      if (filters?.vendorType) {
        where.vendorType = filters.vendorType;
      }

      const [data, total] = await Promise.all([
        prisma.vendor.findMany({
          where,
          skip: filters?.skip,
          take: filters?.take,
          orderBy: {
            performanceRating: 'desc',
          },
        }),
        prisma.vendor.count({ where }),
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch active vendors: ${error.message}`);
    }
  }

  /**
   * Deactivate vendor
   */
  async deactivateVendor(id: string) {
    try {
      const vendor = await prisma.vendor.update({
        where: { id },
        data: { isActive: false },
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to deactivate vendor: ${error.message}`);
    }
  }

  /**
   * Reactivate vendor
   */
  async reactivateVendor(id: string) {
    try {
      const vendor = await prisma.vendor.update({
        where: { id },
        data: { isActive: true },
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to reactivate vendor: ${error.message}`);
    }
  }

  /**
   * Update vendor performance rating
   */
  async updatePerformanceRating(id: string, rating: number) {
    try {
      if (rating < 0 || rating > 5) {
        throw new Error('Rating must be between 0 and 5');
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          performanceRating: new Decimal(rating),
        },
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to update performance rating: ${error.message}`);
    }
  }

  /**
   * Update quality score
   */
  async updateQualityScore(id: string, score: number) {
    try {
      if (score < 0 || score > 100) {
        throw new Error('Quality score must be between 0 and 100');
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          qualityScore: score,
        },
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to update quality score: ${error.message}`);
    }
  }

  /**
   * Update delivery score
   */
  async updateDeliveryScore(id: string, score: number) {
    try {
      if (score < 0 || score > 100) {
        throw new Error('Delivery score must be between 0 and 100');
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          deliveryScore: score,
        },
      });

      return vendor;
    } catch (error: any) {
      throw new Error(`Failed to update delivery score: ${error.message}`);
    }
  }

  /**
   * Get vendor types
   */
  async getVendorTypes(schoolId: string) {
    try {
      const vendors = await prisma.vendor.findMany({
        where: { schoolId },
        distinct: ['vendorType'],
        select: {
          vendorType: true,
        },
      });

      return vendors.map((v) => v.vendorType);
    } catch (error: any) {
      throw new Error(`Failed to fetch vendor types: ${error.message}`);
    }
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(schoolId: string): Promise<VendorStats> {
    try {
      const [total, active] = await Promise.all([
        prisma.vendor.count({ where: { schoolId } }),
        prisma.vendor.count({ where: { schoolId, isActive: true } }),
      ]);

      const vendors = await prisma.vendor.findMany({
        where: { schoolId },
        select: {
          performanceRating: true,
        },
      });

      let avgRating = 0;
      if (vendors.length > 0) {
        const sum = vendors.reduce((acc, v) => {
          if (v.performanceRating) {
            return acc + parseFloat(v.performanceRating.toString());
          }
          return acc;
        }, 0);
        avgRating = Math.round((sum / vendors.length) * 100) / 100;
      }

      return {
        totalVendors: total,
        activeVendors: active,
        inactiveVendors: total - active,
        averagePerformanceRating: avgRating,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch vendor stats: ${error.message}`);
    }
  }

  /**
   * Get top rated vendors
   */
  async getTopRatedVendors(schoolId: string, limit: number = 10) {
    try {
      const vendors = await prisma.vendor.findMany({
        where: {
          schoolId,
          isActive: true,
        },
        orderBy: {
          performanceRating: 'desc',
        },
        take: limit,
      });

      return vendors;
    } catch (error: any) {
      throw new Error(`Failed to fetch top rated vendors: ${error.message}`);
    }
  }

  /**
   * Format performance rating
   */
  formatRating(rating: Decimal | null): string {
    if (!rating) return 'N/A';
    return parseFloat(rating.toString()).toFixed(1);
  }
}

export const vendorService = new VendorService();
