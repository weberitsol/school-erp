import { PrismaClient, LeaveBalance } from '@prisma/client';

const prisma = new PrismaClient();

interface LeaveBalanceFilters {
  employeeId?: string;
  academicYear?: string;
}

interface CreateLeaveBalanceData {
  employeeId: string;
  academicYear: string;
  academicYearId?: string;
  casualLeave: number;
  earnedLeave: number;
  medicalLeave: number;
  unpaidLeave?: number;
  studyLeave?: number;
  maternityLeave?: number;
  paternityLeave?: number;
  bereavementLeave?: number;
  carryOverDays?: number;
  carryOverExpiry?: Date;
}

interface UpdateLeaveBalanceData {
  casualLeave?: number;
  earnedLeave?: number;
  medicalLeave?: number;
  unpaidLeave?: number;
  studyLeave?: number;
  maternityLeave?: number;
  paternityLeave?: number;
  bereavementLeave?: number;
  casualLeaveUsed?: number;
  earnedLeaveUsed?: number;
  medicalLeaveUsed?: number;
  unpaidLeaveUsed?: number;
  carryOverDays?: number;
  carryOverExpiry?: Date;
  carryOverUsed?: number;
  lastCalculatedDate?: Date;
  nextCalculationDate?: Date;
}

interface LeaveDeductionData {
  leaveType: string; // CASUAL, EARNED, MEDICAL, UNPAID, MATERNITY, PATERNITY, BEREAVEMENT, STUDY
  days: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class LeaveBalanceService {
  async createLeaveBalance(
    data: CreateLeaveBalanceData
  ): Promise<LeaveBalance> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if leave balance already exists for this year
    const existing = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: data.employeeId,
        academicYear: data.academicYear,
      },
    });

    if (existing) {
      throw new Error(
        'Leave balance already exists for this employee in this academic year'
      );
    }

    return prisma.leaveBalance.create({
      data: {
        employeeId: data.employeeId,
        academicYear: data.academicYear,
        academicYearId: data.academicYearId,
        casualLeave: data.casualLeave,
        earnedLeave: data.earnedLeave,
        medicalLeave: data.medicalLeave,
        unpaidLeave: data.unpaidLeave || 0,
        studyLeave: data.studyLeave || 0,
        maternityLeave: data.maternityLeave || 0,
        paternityLeave: data.paternityLeave || 0,
        bereavementLeave: data.bereavementLeave || 0,
        carryOverDays: data.carryOverDays || 0,
        carryOverExpiry: data.carryOverExpiry,
        lastCalculatedDate: new Date(),
        nextCalculationDate: this.calculateNextCalculationDate(),
      },
      include: { employee: true },
    });
  }

  async getLeaveBalances(
    filters: LeaveBalanceFilters,
    pagination?: PaginationParams
  ): Promise<{ data: LeaveBalance[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.academicYear) where.academicYear = filters.academicYear;

    const [data, total] = await Promise.all([
      prisma.leaveBalance.findMany({
        where,
        skip,
        take: limit,
        include: { employee: true },
        orderBy: { academicYear: 'desc' },
      }),
      prisma.leaveBalance.count({ where }),
    ]);

    return { data, total };
  }

  async getLeaveBalanceById(id: string): Promise<LeaveBalance | null> {
    return prisma.leaveBalance.findUnique({
      where: { id },
      include: { employee: true },
    });
  }

  async updateLeaveBalance(
    id: string,
    data: UpdateLeaveBalanceData
  ): Promise<LeaveBalance> {
    const balance = await prisma.leaveBalance.findUnique({
      where: { id },
    });

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    return prisma.leaveBalance.update({
      where: { id },
      data,
      include: { employee: true },
    });
  }

  async getEmployeeLeaveBalance(
    employeeId: string,
    academicYear: string
  ): Promise<LeaveBalance | null> {
    return prisma.leaveBalance.findFirst({
      where: { employeeId, academicYear },
      include: { employee: true },
    });
  }

  async getCurrentLeaveBalance(employeeId: string): Promise<LeaveBalance | null> {
    // Get current academic year and fetch balance
    const academicYear = this.getCurrentAcademicYear();

    return this.getEmployeeLeaveBalance(employeeId, academicYear);
  }

  async deductLeave(
    id: string,
    deduction: LeaveDeductionData
  ): Promise<LeaveBalance> {
    const balance = await prisma.leaveBalance.findUnique({
      where: { id },
    });

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    const updateData: any = {};

    switch (deduction.leaveType) {
      case 'CASUAL':
        if ((balance.casualLeave as any).toNumber?.() < deduction.days || balance.casualLeave < deduction.days) {
          throw new Error('Insufficient casual leave balance');
        }
        updateData.casualLeaveUsed = (balance.casualLeaveUsed as any).toNumber?.() ? (balance.casualLeaveUsed as any).toNumber() + deduction.days : (balance.casualLeaveUsed as number) + deduction.days;
        break;

      case 'EARNED':
        if ((balance.earnedLeave as any).toNumber?.() < deduction.days || balance.earnedLeave < deduction.days) {
          throw new Error('Insufficient earned leave balance');
        }
        updateData.earnedLeaveUsed = (balance.earnedLeaveUsed as any).toNumber?.() ? (balance.earnedLeaveUsed as any).toNumber() + deduction.days : (balance.earnedLeaveUsed as number) + deduction.days;
        break;

      case 'MEDICAL':
        if ((balance.medicalLeave as any).toNumber?.() < deduction.days || balance.medicalLeave < deduction.days) {
          throw new Error('Insufficient medical leave balance');
        }
        updateData.medicalLeaveUsed = (balance.medicalLeaveUsed as any).toNumber?.() ? (balance.medicalLeaveUsed as any).toNumber() + deduction.days : (balance.medicalLeaveUsed as number) + deduction.days;
        break;

      case 'UNPAID':
        const unpaidUsed = (balance.unpaidLeaveUsed as any).toNumber?.() || (balance.unpaidLeaveUsed as number) || 0;
        updateData.unpaidLeaveUsed = unpaidUsed + deduction.days;
        break;

      default:
        throw new Error('Invalid leave type');
    }

    return this.updateLeaveBalance(id, updateData);
  }

  async restoreLeave(
    id: string,
    restoration: LeaveDeductionData
  ): Promise<LeaveBalance> {
    const balance = await prisma.leaveBalance.findUnique({
      where: { id },
    });

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    const updateData: any = {};

    switch (restoration.leaveType) {
      case 'CASUAL':
        updateData.casualLeaveUsed = Math.max(
          0,
          ((balance.casualLeaveUsed as any).toNumber?.() || balance.casualLeaveUsed as number) - restoration.days
        );
        break;

      case 'EARNED':
        updateData.earnedLeaveUsed = Math.max(
          0,
          ((balance.earnedLeaveUsed as any).toNumber?.() || balance.earnedLeaveUsed as number) - restoration.days
        );
        break;

      case 'MEDICAL':
        updateData.medicalLeaveUsed = Math.max(
          0,
          ((balance.medicalLeaveUsed as any).toNumber?.() || balance.medicalLeaveUsed as number) - restoration.days
        );
        break;

      case 'UNPAID':
        updateData.unpaidLeaveUsed = Math.max(
          0,
          (((balance.unpaidLeaveUsed as any).toNumber?.() || (balance.unpaidLeaveUsed as number) || 0) - restoration.days)
        );
        break;

      default:
        throw new Error('Invalid leave type');
    }

    return this.updateLeaveBalance(id, updateData);
  }

  async getAvailableLeave(
    id: string,
    leaveType: string
  ): Promise<number> {
    const balance = await prisma.leaveBalance.findUnique({
      where: { id },
    });

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    switch (leaveType) {
      case 'CASUAL':
        return ((balance.casualLeave as any).toNumber?.() || balance.casualLeave as number) - ((balance.casualLeaveUsed as any).toNumber?.() || balance.casualLeaveUsed as number);
      case 'EARNED':
        return ((balance.earnedLeave as any).toNumber?.() || balance.earnedLeave as number) - ((balance.earnedLeaveUsed as any).toNumber?.() || balance.earnedLeaveUsed as number);
      case 'MEDICAL':
        return ((balance.medicalLeave as any).toNumber?.() || balance.medicalLeave as number) - ((balance.medicalLeaveUsed as any).toNumber?.() || balance.medicalLeaveUsed as number);
      case 'UNPAID':
        return ((balance.unpaidLeave as any).toNumber?.() || balance.unpaidLeave as number) - (((balance.unpaidLeaveUsed as any).toNumber?.() || (balance.unpaidLeaveUsed as number)) || 0);
      case 'STUDY':
        return balance.studyLeave.toNumber();
      case 'MATERNITY':
        return balance.maternityLeave.toNumber();
      case 'PATERNITY':
        return balance.paternityLeave.toNumber();
      case 'BEREAVEMENT':
        return balance.bereavementLeave.toNumber();
      default:
        throw new Error('Invalid leave type');
    }
  }

  async processCarryOver(id: string): Promise<LeaveBalance> {
    const balance = await prisma.leaveBalance.findUnique({
      where: { id },
    });

    if (!balance) {
      throw new Error('Leave balance not found');
    }

    // Check if carry over has expired
    if (balance.carryOverExpiry && balance.carryOverExpiry < new Date()) {
      throw new Error('Carry over period has expired');
    }

    // Add carry over to next year's balance (this would be done during year-end process)
    return balance;
  }

  async getLeaveBalanceSummary(employeeId: string): Promise<{
    current: LeaveBalance | null;
    previous: LeaveBalance | null;
  }> {
    const currentYear = this.getCurrentAcademicYear();
    const previousYear = this.getPreviousAcademicYear(currentYear);

    const [current, previous] = await Promise.all([
      this.getEmployeeLeaveBalance(employeeId, currentYear),
      this.getEmployeeLeaveBalance(employeeId, previousYear),
    ]);

    return { current, previous };
  }

  private getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Assuming academic year starts from June
    if (month >= 5) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  private getPreviousAcademicYear(currentYear: string): string {
    const [startYear] = currentYear.split('-').map(Number);
    return `${startYear - 1}-${startYear}`;
  }

  private calculateNextCalculationDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // Quarterly calculation
    return date;
  }

  async deleteLeaveBalance(id: string): Promise<void> {
    const leaveBalance = await prisma.leaveBalance.findUnique({
      where: { id },
    });

    if (!leaveBalance) {
      throw new Error('Leave balance not found');
    }

    await prisma.leaveBalance.delete({
      where: { id },
    });
  }
}

export const leaveBalanceService = new LeaveBalanceService();
