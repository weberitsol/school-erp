import { PrismaClient, EmployeePromotion, PromotionStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface PromotionFilters {
  employeeId?: string;
  status?: PromotionStatus;
  fromYear?: number;
  toYear?: number;
}

interface CreatePromotionData {
  employeeId: string;
  previousDesignationId: string;
  newDesignationId: string;
  newDepartmentId?: string;
  previousSalary?: number;
  newSalary?: number;
  promotionDate: Date;
  promotionReason?: string;
  performanceRating?: number;
  approvedById?: string;
  effectiveFrom: Date;
  documentUrl?: string;
}

interface UpdatePromotionData {
  newDesignationId?: string;
  newDepartmentId?: string;
  newSalary?: number;
  promotionReason?: string;
  performanceRating?: number;
  status?: PromotionStatus;
  effectiveFrom?: Date;
  documentUrl?: string;
  approvedById?: string;
  approvalDate?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class EmployeePromotionService {
  async createPromotion(data: CreatePromotionData): Promise<EmployeePromotion> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify previous designation exists
    const previousDesignation = await prisma.designation.findUnique({
      where: { id: data.previousDesignationId },
    });

    if (!previousDesignation) {
      throw new Error('Previous designation not found');
    }

    // Verify new designation exists
    const newDesignation = await prisma.designation.findUnique({
      where: { id: data.newDesignationId },
    });

    if (!newDesignation) {
      throw new Error('New designation not found');
    }

    // Verify new department if provided
    if (data.newDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.newDepartmentId },
      });

      if (!department) {
        throw new Error('New department not found');
      }
    }

    // Verify approver if provided
    if (data.approvedById) {
      const approver = await prisma.user.findUnique({
        where: { id: data.approvedById },
      });

      if (!approver) {
        throw new Error('Approver not found');
      }
    }

    return prisma.employeePromotion.create({
      data: {
        employeeId: data.employeeId,
        previousDesignationId: data.previousDesignationId,
        previousDesignation: previousDesignation.name,
        previousDepartmentId: employee.departmentId,
        previousDepartment: (await prisma.department.findUnique({
          where: { id: employee.departmentId },
        }))?.name,
        previousSalary: data.previousSalary,
        newDesignationId: data.newDesignationId,
        newDesignation: newDesignation.name,
        newDepartmentId: data.newDepartmentId,
        newDepartment: data.newDepartmentId
          ? (await prisma.department.findUnique({
              where: { id: data.newDepartmentId },
            }))?.name
          : undefined,
        newSalary: data.newSalary,
        promotionDate: data.promotionDate,
        promotionReason: data.promotionReason,
        performanceRating: data.performanceRating,
        approvedById: data.approvedById,
        approvalDate: data.approvedById ? new Date() : undefined,
        status: 'APPROVED',
        effectiveFrom: data.effectiveFrom,
        documentUrl: data.documentUrl,
      },
      include: {
        employee: true,
        previousDesignation: true,
        newDesignation: true,
        approvedBy: true,
      },
    });
  }

  async getPromotions(
    filters: PromotionFilters,
    pagination?: PaginationParams
  ): Promise<{ data: EmployeePromotion[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      prisma.employeePromotion.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
          previousDesignation: true,
          newDesignation: true,
          approvedBy: true,
        },
        orderBy: { promotionDate: 'desc' },
      }),
      prisma.employeePromotion.count({ where }),
    ]);

    return { data, total };
  }

  async getPromotionById(id: string): Promise<EmployeePromotion | null> {
    return prisma.employeePromotion.findUnique({
      where: { id },
      include: {
        employee: true,
        previousDesignation: true,
        newDesignation: true,
        approvedBy: true,
      },
    });
  }

  async updatePromotion(
    id: string,
    data: UpdatePromotionData
  ): Promise<EmployeePromotion> {
    const promotion = await prisma.employeePromotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Verify new designation if being updated
    if (data.newDesignationId) {
      const designation = await prisma.designation.findUnique({
        where: { id: data.newDesignationId },
      });

      if (!designation) {
        throw new Error('New designation not found');
      }
    }

    // Verify new department if provided
    if (data.newDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.newDepartmentId },
      });

      if (!department) {
        throw new Error('New department not found');
      }
    }

    // Verify approver if provided
    if (data.approvedById) {
      const approver = await prisma.user.findUnique({
        where: { id: data.approvedById },
      });

      if (!approver) {
        throw new Error('Approver not found');
      }
    }

    return prisma.employeePromotion.update({
      where: { id },
      data,
      include: {
        employee: true,
        previousDesignation: true,
        newDesignation: true,
        approvedBy: true,
      },
    });
  }

  async getEmployeePromotions(employeeId: string): Promise<EmployeePromotion[]> {
    return prisma.employeePromotion.findMany({
      where: { employeeId },
      include: {
        previousDesignation: true,
        newDesignation: true,
        approvedBy: true,
      },
      orderBy: { promotionDate: 'desc' },
    });
  }

  async getLatestPromotion(employeeId: string): Promise<EmployeePromotion | null> {
    return prisma.employeePromotion.findFirst({
      where: { employeeId },
      include: {
        previousDesignation: true,
        newDesignation: true,
        approvedBy: true,
      },
      orderBy: { promotionDate: 'desc' },
    });
  }

  async getPendingPromotions(): Promise<EmployeePromotion[]> {
    return prisma.employeePromotion.findMany({
      where: { status: 'PROPOSED' },
      include: {
        employee: true,
        previousDesignation: true,
        newDesignation: true,
      },
      orderBy: { promotionDate: 'asc' },
    });
  }

  async approvePromotion(
    id: string,
    approvedById: string
  ): Promise<EmployeePromotion> {
    const promotion = await prisma.employeePromotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Verify approver exists
    const approver = await prisma.user.findUnique({
      where: { id: approvedById },
    });

    if (!approver) {
      throw new Error('Approver not found');
    }

    // Update employee's designation and department
    await prisma.employee.update({
      where: { id: promotion.employeeId },
      data: {
        designationId: promotion.newDesignationId,
        departmentId: promotion.newDepartmentId || undefined,
        basicSalary: promotion.newSalary,
      },
    });

    return prisma.employeePromotion.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedById,
        approvalDate: new Date(),
      },
      include: {
        employee: true,
        previousDesignation: true,
        newDesignation: true,
        approvedBy: true,
      },
    });
  }

  async rejectPromotion(id: string): Promise<EmployeePromotion> {
    const promotion = await prisma.employeePromotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    return prisma.employeePromotion.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        employee: true,
        previousDesignation: true,
        newDesignation: true,
      },
    });
  }

  async getPromotionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<EmployeePromotion[]> {
    return prisma.employeePromotion.findMany({
      where: {
        promotionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
        previousDesignation: true,
        newDesignation: true,
      },
      orderBy: { promotionDate: 'desc' },
    });
  }

  async getPromotionStatsByDesignation(): Promise<
    Array<{
      designation: string;
      promotionCount: number;
      averageSalaryIncrease: number;
    }>
  > {
    const promotions = await prisma.employeePromotion.findMany({
      where: { status: 'ACTIVE' },
    });

    const designationStats: {
      [key: string]: { count: number; totalIncrease: number };
    } = {};

    promotions.forEach(promotion => {
      const designation = promotion.newDesignation;

      if (!designationStats[designation]) {
        designationStats[designation] = { count: 0, totalIncrease: 0 };
      }

      designationStats[designation].count++;

      if (promotion.newSalary && promotion.previousSalary) {
        const increase = promotion.newSalary - promotion.previousSalary;
        designationStats[designation].totalIncrease += increase;
      }
    });

    return Object.entries(designationStats).map(([designation, stats]) => ({
      designation,
      promotionCount: stats.count,
      averageSalaryIncrease:
        stats.count > 0 ? stats.totalIncrease / stats.count : 0,
    }));
  }
}

export const employeePromotionService = new EmployeePromotionService();
