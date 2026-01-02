import { PrismaClient, FeeStructure, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface FeeStructureFilters {
  schoolId: string;
  classId?: string;
  academicYearId?: string;
  isActive?: boolean;
  search?: string;
}

interface CreateFeeStructureData {
  name: string;
  description?: string;
  schoolId: string;
  academicYearId: string;
  classId?: string;
  amount: Prisma.Decimal | number;
  frequency: string; // Monthly, Quarterly, Annually, One-time
  dueDay?: number;
  lateFee?: Prisma.Decimal | number;
  lateFeeAfterDays?: number;
}

interface UpdateFeeStructureData {
  name?: string;
  description?: string;
  amount?: Prisma.Decimal | number;
  frequency?: string;
  dueDay?: number;
  lateFee?: Prisma.Decimal | number;
  lateFeeAfterDays?: number;
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class FeeService {
  async createFeeStructure(data: CreateFeeStructureData): Promise<FeeStructure> {
    return prisma.feeStructure.create({
      data: {
        name: data.name,
        description: data.description,
        schoolId: data.schoolId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        amount: new Prisma.Decimal(data.amount),
        frequency: data.frequency,
        dueDay: data.dueDay,
        lateFee: data.lateFee ? new Prisma.Decimal(data.lateFee) : undefined,
        lateFeeAfterDays: data.lateFeeAfterDays || 10,
      },
    });
  }

  async getFeeStructures(
    filters: FeeStructureFilters,
    pagination?: PaginationParams
  ): Promise<{ data: FeeStructure[]; total: number }> {
    const where: Prisma.FeeStructureWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.feeStructure.findMany({
        where,
        include: { class: true, academicYear: true },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.feeStructure.count({ where }),
    ]);

    return { data, total };
  }

  async getFeeStructureById(id: string, schoolId: string): Promise<FeeStructure | null> {
    return prisma.feeStructure.findFirst({
      where: { id, schoolId },
      include: { class: true, academicYear: true, payments: true },
    });
  }

  async updateFeeStructure(id: string, schoolId: string, data: UpdateFeeStructureData): Promise<FeeStructure> {
    const updateData: any = {
      ...data,
    };

    if (data.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(data.amount);
    }
    if (data.lateFee !== undefined) {
      updateData.lateFee = new Prisma.Decimal(data.lateFee);
    }

    return prisma.feeStructure.update({
      where: { id },
      data: updateData,
      include: { class: true, academicYear: true },
    });
  }

  async deleteFeeStructure(id: string, schoolId: string): Promise<FeeStructure> {
    return prisma.feeStructure.delete({
      where: { id },
    });
  }

  async getFeeStructuresByClass(
    classId: string,
    academicYearId: string,
    schoolId: string
  ): Promise<FeeStructure[]> {
    return prisma.feeStructure.findMany({
      where: {
        classId,
        academicYearId,
        schoolId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async bulkCreateFeeStructures(
    schoolId: string,
    structures: CreateFeeStructureData[]
  ): Promise<FeeStructure[]> {
    const createdStructures = await Promise.all(
      structures.map((structure) =>
        this.createFeeStructure({
          ...structure,
          schoolId,
        })
      )
    );
    return createdStructures;
  }

  async duplicateFeeStructure(
    id: string,
    targetClassIds: string[],
    schoolId: string
  ): Promise<FeeStructure[]> {
    const original = await prisma.feeStructure.findFirst({
      where: { id, schoolId },
    });

    if (!original) {
      throw new Error('Fee structure not found');
    }

    const duplicates = await Promise.all(
      targetClassIds.map((classId) =>
        this.createFeeStructure({
          name: original.name,
          description: original.description || undefined,
          schoolId,
          academicYearId: original.academicYearId,
          classId,
          amount: original.amount,
          frequency: original.frequency,
          dueDay: original.dueDay || undefined,
          lateFee: original.lateFee,
          lateFeeAfterDays: original.lateFeeAfterDays,
        })
      )
    );

    return duplicates;
  }

  async calculateLateFee(
    amount: Prisma.Decimal,
    lateFee: Prisma.Decimal,
    daysLate: number,
    gracePeriodDays: number
  ): Promise<Prisma.Decimal> {
    if (daysLate <= gracePeriodDays) {
      return new Prisma.Decimal(0);
    }

    // Fixed late fee (not per day)
    return lateFee;
  }
}

export const feeService = new FeeService();
