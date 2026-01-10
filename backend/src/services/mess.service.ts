import { PrismaClient, Mess } from '@prisma/client';

const prisma = new PrismaClient();

interface MessFilters {
  schoolId?: string;
  search?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class MessService {
  async create(data: {
    name: string;
    code: string;
    capacity: number;
    schoolId: string;
    description?: string;
    location?: string;
    manager?: string;
    contactPhone?: string;
    contactEmail?: string;
  }): Promise<Mess> {
    // Check if mess with same code exists
    const existing = await prisma.mess.findUnique({
      where: { code_schoolId: { code: data.code, schoolId: data.schoolId } },
    });

    if (existing) {
      throw new Error(`Mess with code ${data.code} already exists for this school`);
    }

    return prisma.mess.create({
      data,
    });
  }

  async getAll(
    filters: MessFilters,
    pagination: PaginationParams
  ): Promise<{ data: Mess[]; total: number }> {
    const { page = 0, limit = 10 } = pagination;
    const skip = page * limit;

    const where: any = {};

    if (filters.schoolId) {
      where.schoolId = filters.schoolId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.mess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mess.count({ where }),
    ]);

    return { data, total };
  }

  async getById(id: string): Promise<Mess | null> {
    return prisma.mess.findUnique({
      where: { id },
    });
  }

  async getByIdWithStats(
    id: string
  ): Promise<(Mess & { enrollmentCount: number; staffCount: number }) | null> {
    const mess = await prisma.mess.findUnique({
      where: { id },
    });

    if (!mess) return null;

    const [enrollmentCount, staffCount] = await Promise.all([
      prisma.messEnrollment.count({ where: { messId: id } }),
      prisma.messStaff.count({ where: { messId: id, isActive: true } }),
    ]);

    return {
      ...mess,
      enrollmentCount,
      staffCount,
    };
  }

  async update(
    id: string,
    data: {
      name?: string;
      capacity?: number;
      description?: string;
      location?: string;
      manager?: string;
      contactPhone?: string;
      contactEmail?: string;
      isActive?: boolean;
    }
  ): Promise<Mess> {
    return prisma.mess.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.mess.delete({ where: { id } });
  }

  async getStatistics(messId: string): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    totalStaff: number;
    capacity: number;
    utilizationPercentage: number;
  }> {
    const mess = await prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new Error('Mess not found');

    const [totalEnrollments, activeEnrollments, totalStaff] = await Promise.all([
      prisma.messEnrollment.count({ where: { messId } }),
      prisma.messEnrollment.count({
        where: { messId, status: 'ACTIVE' },
      }),
      prisma.messStaff.count({ where: { messId, isActive: true } }),
    ]);

    const utilizationPercentage = (activeEnrollments / mess.capacity) * 100;

    return {
      totalEnrollments,
      activeEnrollments,
      totalStaff,
      capacity: mess.capacity,
      utilizationPercentage: Math.round(utilizationPercentage),
    };
  }
}

export const messService = new MessService();
