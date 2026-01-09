import { PrismaClient, EmployeeSeparation, SeparationType, SettlementStatus, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

export interface SeparationFilters {
  employeeId?: string;
  separationType?: SeparationType;
  settlementStatus?: SettlementStatus;
}

export interface CreateSeparationData {
  employeeId: string;
  separationDate: Date;
  separationType: SeparationType;
  reason: string;
  reasonDescription?: string;
  noticeDate?: Date;
  noticePeriod?: number;
  effectiveDate: Date;
  lastSalaryMonth?: number;
  lastSalaryYear?: number;
}

export interface UpdateSeparationData {
  separationType?: SeparationType;
  reason?: string;
  reasonDescription?: string;
  noticePeriod?: number;
  lastSalaryMonth?: number;
  lastSalaryYear?: number;
  settlementStatus?: SettlementStatus;
}

export interface SettlementCalculationData {
  basicSalaryDue?: number;
  allowancesDue?: number;
  earnedLeavePayout?: number;
  gratuity?: number;
  bonusAdjustment?: number;
  loanRecovery?: number;
  otherAdjustments?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class EmployeeSeparationService {
  async createSeparation(data: CreateSeparationData): Promise<EmployeeSeparation> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if employee already has an active separation
    const existing = await prisma.employeeSeparation.findFirst({
      where: {
        employeeId: data.employeeId,
        settlementStatus: {
          in: ['PENDING', 'INITIATED', 'PARTIAL'],
        },
      },
    });

    if (existing) {
      throw new Error('Employee already has an active separation process');
    }

    return prisma.employeeSeparation.create({
      data: {
        employeeId: data.employeeId,
        separationDate: data.separationDate,
        separationType: data.separationType,
        reason: data.reason,
        reasonDescription: data.reasonDescription,
        noticeDate: data.noticeDate,
        noticePeriod: data.noticePeriod,
        effectiveDate: data.effectiveDate,
        lastSalaryMonth: data.lastSalaryMonth,
        lastSalaryYear: data.lastSalaryYear,
        settlementStatus: 'PENDING',
      },
      include: { employee: true },
    });
  }

  async getSeparations(
    filters: SeparationFilters,
    pagination?: PaginationParams
  ): Promise<{ data: EmployeeSeparation[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.separationType) where.separationType = filters.separationType;
    if (filters.settlementStatus) where.settlementStatus = filters.settlementStatus;

    const [data, total] = await Promise.all([
      prisma.employeeSeparation.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
          exitChecklist: true,
        },
        orderBy: { separationDate: 'desc' },
      }),
      prisma.employeeSeparation.count({ where }),
    ]);

    return { data, total };
  }

  async getSeparationById(id: string): Promise<EmployeeSeparation | null> {
    return prisma.employeeSeparation.findUnique({
      where: { id },
      include: {
        employee: true,
        exitChecklist: true,
      },
    });
  }

  async updateSeparation(
    id: string,
    data: UpdateSeparationData
  ): Promise<EmployeeSeparation> {
    const separation = await prisma.employeeSeparation.findUnique({
      where: { id },
    });

    if (!separation) {
      throw new Error('Separation not found');
    }

    return prisma.employeeSeparation.update({
      where: { id },
      data,
      include: {
        employee: true,
        exitChecklist: true,
      },
    });
  }

  async calculateSettlement(
    id: string,
    calculation: SettlementCalculationData
  ): Promise<EmployeeSeparation> {
    const separation = await prisma.employeeSeparation.findUnique({
      where: { id },
    });

    if (!separation) {
      throw new Error('Separation not found');
    }

    const basicSalaryDue = new Decimal(calculation.basicSalaryDue || 0);
    const allowancesDue = new Decimal(calculation.allowancesDue || 0);
    const earnedLeavePayout = new Decimal(calculation.earnedLeavePayout || 0);
    const gratuity = new Decimal(calculation.gratuity || 0);
    const bonusAdjustment = new Decimal(calculation.bonusAdjustment || 0);
    const loanRecovery = new Decimal(calculation.loanRecovery || 0);
    const otherAdjustments = new Decimal(calculation.otherAdjustments || 0);

    const finalSettlementAmount = basicSalaryDue
      .plus(allowancesDue)
      .plus(earnedLeavePayout)
      .plus(gratuity)
      .plus(bonusAdjustment)
      .minus(loanRecovery)
      .plus(otherAdjustments);

    return prisma.employeeSeparation.update({
      where: { id },
      data: {
        basicSalaryDue,
        allowancesDue,
        earnedLeavePayout,
        gratuity,
        bonusAdjustment,
        loanRecovery,
        otherAdjustments,
        finalSettlementAmount,
        settlementStatus: 'INITIATED',
      },
      include: {
        employee: true,
        exitChecklist: true,
      },
    });
  }

  async approveFinalSettlement(
    id: string,
    approvedById: string
  ): Promise<EmployeeSeparation> {
    const separation = await prisma.employeeSeparation.findUnique({
      where: { id },
    });

    if (!separation) {
      throw new Error('Separation not found');
    }

    // Check if exit checklist is complete
    const exitChecklist = await prisma.exitChecklist.findUnique({
      where: { separationId: id },
    });

    if (!exitChecklist || exitChecklist.completionStatus !== 'COMPLETE') {
      throw new Error('Exit checklist must be completed before approving settlement');
    }

    // Verify approver exists
    const approver = await prisma.user.findUnique({
      where: { id: approvedById },
    });

    if (!approver) {
      throw new Error('Approver not found');
    }

    // Update employee status to SEPARATED
    await prisma.employee.update({
      where: { id: separation.employeeId },
      data: {
        status: 'SEPARATED',
        isActive: false,
        exitDate: separation.separationDate,
      },
    });

    return prisma.employeeSeparation.update({
      where: { id },
      data: {
        settlementStatus: 'COMPLETE',
        settlementDate: new Date(),
        fullFinalSettlement: true,
        ffsApprovedBy: approvedById,
        ffsApprovalDate: new Date(),
      },
      include: {
        employee: true,
        exitChecklist: true,
      },
    });
  }

  async generateExperienceCertificate(
    id: string,
    documentUrl: string
  ): Promise<EmployeeSeparation> {
    const separation = await prisma.employeeSeparation.findUnique({
      where: { id },
    });

    if (!separation) {
      throw new Error('Separation not found');
    }

    return prisma.employeeSeparation.update({
      where: { id },
      data: {
        certDocumentUrl: documentUrl,
        certIssuanceDate: new Date(),
      },
      include: {
        employee: true,
        exitChecklist: true,
      },
    });
  }

  async getEmployeeSeparations(employeeId: string): Promise<EmployeeSeparation[]> {
    return prisma.employeeSeparation.findMany({
      where: { employeeId },
      include: {
        exitChecklist: true,
      },
      orderBy: { separationDate: 'desc' },
    });
  }

  async getPendingSettlements(): Promise<EmployeeSeparation[]> {
    return prisma.employeeSeparation.findMany({
      where: {
        settlementStatus: {
          in: ['PENDING', 'INITIATED', 'PARTIAL'],
        },
      },
      include: {
        employee: true,
        exitChecklist: true,
      },
      orderBy: { separationDate: 'asc' },
    });
  }

  async getSeparationsBySeparationType(type: SeparationType): Promise<EmployeeSeparation[]> {
    return prisma.employeeSeparation.findMany({
      where: { separationType: type },
      include: {
        employee: true,
        exitChecklist: true,
      },
      orderBy: { separationDate: 'desc' },
    });
  }

  async getSeparationsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeSeparation[]> {
    return prisma.employeeSeparation.findMany({
      where: {
        separationDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
        exitChecklist: true,
      },
      orderBy: { separationDate: 'desc' },
    });
  }

  async getSeparationStats(): Promise<{
    totalSeparations: number;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    completedCount: number;
  }> {
    const [total, completed] = await Promise.all([
      prisma.employeeSeparation.count(),
      prisma.employeeSeparation.count({
        where: { settlementStatus: 'COMPLETE' },
      }),
    ]);

    // Get counts by separation type
    const separationTypes = [
      'RESIGNATION',
      'RETIREMENT',
      'TERMINATION',
      'REDUNDANCY',
      'DEATH',
      'OTHER',
    ];

    const byType = await Promise.all(
      separationTypes.map(async type => ({
        type,
        count: await prisma.employeeSeparation.count({
          where: { separationType: type as SeparationType },
        }),
      }))
    );

    // Get counts by settlement status
    const settlementStatuses = ['PENDING', 'INITIATED', 'PARTIAL', 'COMPLETE'];

    const byStatus = await Promise.all(
      settlementStatuses.map(async status => ({
        status,
        count: await prisma.employeeSeparation.count({
          where: { settlementStatus: status as SettlementStatus },
        }),
      }))
    );

    return {
      totalSeparations: total,
      byType: byType.filter(item => item.count > 0),
      byStatus: byStatus.filter(item => item.count > 0),
      completedCount: completed,
    };
  }

  async getAvgSettlementAmount(): Promise<Decimal> {
    const separations = await prisma.employeeSeparation.findMany({
      where: {
        settlementStatus: 'COMPLETE',
        finalSettlementAmount: { not: null },
      },
    });

    if (separations.length === 0) {
      return new Decimal(0);
    }

    let total = new Decimal(0);

    separations.forEach(sep => {
      if (sep.finalSettlementAmount) {
        total = total.plus(sep.finalSettlementAmount);
      }
    });

    return total.dividedBy(separations.length);
  }
}

export const employeeSeparationService = new EmployeeSeparationService();
