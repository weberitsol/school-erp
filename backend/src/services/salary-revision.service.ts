import { PrismaClient, SalaryRevision } from '@prisma/client';

const prisma = new PrismaClient();

interface SalaryRevisionFilters {
  employeeId?: string;
  revisionReason?: string;
}

interface CreateSalaryRevisionData {
  employeeId: string;
  previousBasicSalary: number;
  previousGrossSalary?: number;
  newBasicSalary: number;
  newGrossSalary?: number;
  revisionReason: string; // PROMOTION, INCREMENT, MARKET_ADJUSTMENT, POLICY_CHANGE, PERFORMANCE
  revisionPercentage?: number;
  fixedAmount?: number;
  effectiveFrom: Date;
  approvedById: string;
  letterUrl?: string;
}

interface UpdateSalaryRevisionData {
  newBasicSalary?: number;
  newGrossSalary?: number;
  revisionPercentage?: number;
  fixedAmount?: number;
  letterUrl?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class SalaryRevisionService {
  async createSalaryRevision(
    data: CreateSalaryRevisionData
  ): Promise<SalaryRevision> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify approver exists
    const approver = await prisma.user.findUnique({
      where: { id: data.approvedById },
    });

    if (!approver) {
      throw new Error('Approver not found');
    }

    // Validate salary increase
    if (data.newBasicSalary < data.previousBasicSalary) {
      throw new Error('New salary cannot be less than previous salary');
    }

    // Calculate revision percentage if not provided
    let revisionPercentage = data.revisionPercentage;
    let fixedAmount = data.fixedAmount;

    if (!revisionPercentage && !fixedAmount) {
      const difference = data.newBasicSalary - data.previousBasicSalary;
      revisionPercentage = (difference / data.previousBasicSalary) * 100;
    }

    return prisma.salaryRevision.create({
      data: {
        employeeId: data.employeeId,
        previousBasicSalary: new Decimal(data.previousBasicSalary),
        previousGrossSalary: data.previousGrossSalary
          ? new Decimal(data.previousGrossSalary)
          : null,
        newBasicSalary: new Decimal(data.newBasicSalary),
        newGrossSalary: data.newGrossSalary
          ? new Decimal(data.newGrossSalary)
          : null,
        revisionReason: data.revisionReason,
        revisionPercentage: revisionPercentage
          ? new Decimal(revisionPercentage)
          : null,
        fixedAmount: fixedAmount ? new Decimal(fixedAmount) : null,
        effectiveFrom: data.effectiveFrom,
        approvedDate: new Date(),
        approvedById: data.approvedById,
        letterUrl: data.letterUrl,
      },
      include: {
        employee: true,
        approvedBy: true,
      },
    });
  }

  async getSalaryRevisions(
    filters: SalaryRevisionFilters,
    pagination?: PaginationParams
  ): Promise<{ data: SalaryRevision[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.revisionReason) where.revisionReason = filters.revisionReason;

    const [data, total] = await Promise.all([
      prisma.salaryRevision.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
          approvedBy: true,
        },
        orderBy: { effectiveFrom: 'desc' },
      }),
      prisma.salaryRevision.count({ where }),
    ]);

    return { data, total };
  }

  async getSalaryRevisionById(id: string): Promise<SalaryRevision | null> {
    return prisma.salaryRevision.findUnique({
      where: { id },
      include: {
        employee: true,
        approvedBy: true,
      },
    });
  }

  async updateSalaryRevision(
    id: string,
    data: UpdateSalaryRevisionData
  ): Promise<SalaryRevision> {
    const revision = await prisma.salaryRevision.findUnique({
      where: { id },
    });

    if (!revision) {
      throw new Error('Salary revision not found');
    }

    // Validate salary if being updated
    if (
      data.newBasicSalary &&
      data.newBasicSalary < revision.previousBasicSalary
    ) {
      throw new Error('New salary cannot be less than previous salary');
    }

    const updateData: any = { ...data };

    // Recalculate revision percentage if new salary is updated
    if (data.newBasicSalary) {
      const difference = data.newBasicSalary - revision.previousBasicSalary.toNumber();
      const percentage = (difference / revision.previousBasicSalary.toNumber()) * 100;
      updateData.revisionPercentage = new Decimal(percentage);
    }

    return prisma.salaryRevision.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
        approvedBy: true,
      },
    });
  }

  async getEmployeeSalaryRevisions(employeeId: string): Promise<SalaryRevision[]> {
    return prisma.salaryRevision.findMany({
      where: { employeeId },
      include: {
        approvedBy: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getLatestSalaryRevision(employeeId: string): Promise<SalaryRevision | null> {
    return prisma.salaryRevision.findFirst({
      where: { employeeId },
      include: {
        employee: true,
        approvedBy: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getSalaryRevisionsByReason(reason: string): Promise<SalaryRevision[]> {
    return prisma.salaryRevision.findMany({
      where: { revisionReason: reason },
      include: {
        employee: true,
        approvedBy: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getSalaryRevisionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<SalaryRevision[]> {
    return prisma.salaryRevision.findMany({
      where: {
        effectiveFrom: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
        approvedBy: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async calculateTotalSalaryIncrease(employeeId: string): Promise<{
    totalIncrease: Decimal;
    percentageIncrease: number;
    revisionCount: number;
  }> {
    const revisions = await this.getEmployeeSalaryRevisions(employeeId);

    if (revisions.length === 0) {
      return {
        totalIncrease: new Decimal(0),
        percentageIncrease: 0,
        revisionCount: 0,
      };
    }

    const firstRevision = revisions[revisions.length - 1];
    const latestRevision = revisions[0];

    const totalIncrease = latestRevision.newBasicSalary.minus(
      firstRevision.previousBasicSalary
    );

    const percentageIncrease =
      (totalIncrease.toNumber() / firstRevision.previousBasicSalary.toNumber()) * 100;

    return {
      totalIncrease,
      percentageIncrease: Number(percentageIncrease.toFixed(2)),
      revisionCount: revisions.length,
    };
  }

  async getRevisionStatsByReason(): Promise<
    Array<{
      reason: string;
      count: number;
      averageIncrease: Decimal;
    }>
  > {
    const reasons = [
      'PROMOTION',
      'INCREMENT',
      'MARKET_ADJUSTMENT',
      'POLICY_CHANGE',
      'PERFORMANCE',
    ];

    const stats = [];

    for (const reason of reasons) {
      const revisions = await this.getSalaryRevisionsByReason(reason);

      if (revisions.length === 0) continue;

      let totalIncrease = new Decimal(0);

      revisions.forEach(rev => {
        totalIncrease = totalIncrease.plus(
          rev.newBasicSalary.minus(rev.previousBasicSalary)
        );
      });

      const averageIncrease = totalIncrease.dividedBy(revisions.length);

      stats.push({
        reason,
        count: revisions.length,
        averageIncrease,
      });
    }

    return stats;
  }
}

export const salaryRevisionService = new SalaryRevisionService();
