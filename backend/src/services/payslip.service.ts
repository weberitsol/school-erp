import { PrismaClient, Payslip, PayslipStatus, Decimal } from '@prisma/client';
import { attendanceService } from './attendance.service';

const prisma = new PrismaClient();

interface PayslipFilters {
  employeeId?: string;
  status?: PayslipStatus;
  month?: number;
  year?: number;
}

interface CreatePayslipData {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  dearness: number;
  houseRent: number;
  conveyance: number;
  medical: number;
  otherAllowances: number;
  grossSalary: number;
  workingDays: number;
  daysPresent: number;
  daysAbsent: number;
  pf: number;
  esi: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  totalDeductions: number;
  bonus?: number;
  advance?: number;
  loanDeduction?: number;
  netPayable?: number;
}

interface UpdatePayslipData {
  workingDays?: number;
  daysPresent?: number;
  daysAbsent?: number;
  bonus?: number;
  advance?: number;
  loanDeduction?: number;
  status?: PayslipStatus;
  paidDate?: Date;
  documentUrl?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class PayslipService {
  async createPayslip(data: CreatePayslipData): Promise<Payslip> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if payslip already exists for this month/year
    const existing = await prisma.payslip.findFirst({
      where: {
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
      },
    });

    if (existing) {
      throw new Error('Payslip already exists for this employee in this month');
    }

    // Validate month and year
    if (data.month < 1 || data.month > 12) {
      throw new Error('Invalid month');
    }

    // Calculate net payable if not provided
    const bonus = new Decimal(data.bonus || 0);
    const advance = new Decimal(data.advance || 0);
    const loanDeduction = new Decimal(data.loanDeduction || 0);
    const grossSalary = new Decimal(data.grossSalary);
    const totalDeductions = new Decimal(data.totalDeductions);

    const netPayable = grossSalary.minus(totalDeductions).plus(bonus).minus(advance).minus(loanDeduction);

    return prisma.payslip.create({
      data: {
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
        basicSalary: new Decimal(data.basicSalary),
        dearness: new Decimal(data.dearness),
        houseRent: new Decimal(data.houseRent),
        conveyance: new Decimal(data.conveyance),
        medical: new Decimal(data.medical),
        otherAllowances: new Decimal(data.otherAllowances),
        grossSalary: new Decimal(data.grossSalary),
        workingDays: data.workingDays,
        daysPresent: data.daysPresent,
        daysAbsent: data.daysAbsent,
        pf: new Decimal(data.pf),
        esi: new Decimal(data.esi),
        professionalTax: new Decimal(data.professionalTax),
        incomeTax: new Decimal(data.incomeTax),
        otherDeductions: new Decimal(data.otherDeductions),
        totalDeductions: new Decimal(data.totalDeductions),
        bonus: new Decimal(data.bonus || 0),
        advance: new Decimal(data.advance || 0),
        loanDeduction: new Decimal(data.loanDeduction || 0),
        netPayable,
      },
      include: { employee: true },
    });
  }

  async getPayslips(
    filters: PayslipFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Payslip[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;

    const [data, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        skip,
        take: limit,
        include: { employee: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.payslip.count({ where }),
    ]);

    return { data, total };
  }

  async getPayslipById(id: string): Promise<Payslip | null> {
    return prisma.payslip.findUnique({
      where: { id },
      include: { employee: true },
    });
  }

  async updatePayslip(id: string, data: UpdatePayslipData): Promise<Payslip> {
    const payslip = await prisma.payslip.findUnique({
      where: { id },
    });

    if (!payslip) {
      throw new Error('Payslip not found');
    }

    // Recalculate net payable if relevant fields changed
    const updateData: any = { ...data };

    if (
      data.bonus !== undefined ||
      data.advance !== undefined ||
      data.loanDeduction !== undefined
    ) {
      const bonus = new Decimal(data.bonus || payslip.bonus);
      const advance = new Decimal(data.advance || payslip.advance);
      const loanDeduction = new Decimal(data.loanDeduction || payslip.loanDeduction);

      const netPayable = payslip.grossSalary
        .minus(payslip.totalDeductions)
        .plus(bonus)
        .minus(advance)
        .minus(loanDeduction);

      updateData.netPayable = netPayable;
    }

    return prisma.payslip.update({
      where: { id },
      data: updateData,
      include: { employee: true },
    });
  }

  async getPayslipByEmployeeAndMonth(
    employeeId: string,
    month: number,
    year: number
  ): Promise<Payslip | null> {
    return prisma.payslip.findFirst({
      where: { employeeId, month, year },
      include: { employee: true },
    });
  }

  async getEmployeePayslips(
    employeeId: string,
    limit?: number
  ): Promise<Payslip[]> {
    return prisma.payslip.findMany({
      where: { employeeId },
      take: limit || 12,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { employee: true },
    });
  }

  async generatePayslips(
    month: number,
    year: number,
    employeeIds?: string[]
  ): Promise<Payslip[]> {
    // Get all active employees or specific ones
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(employeeIds && { id: { in: employeeIds } }),
      },
      include: { salaries: true },
    });

    const payslips: Payslip[] = [];

    for (const employee of employees) {
      // Get current salary
      const salary = employee.salaries.find(s => s.status === 'ACTIVE');

      if (!salary) {
        continue; // Skip if no active salary
      }

      // Get attendance for the month
      const attendance = await this.getMonthlyAttendance(
        employee.id,
        month,
        year
      );

      // Check if payslip already exists
      const existing = await prisma.payslip.findFirst({
        where: {
          employeeId: employee.id,
          month,
          year,
        },
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Create payslip
      const payslip = await this.createPayslip({
        employeeId: employee.id,
        month,
        year,
        basicSalary: salary.basicSalary.toNumber(),
        dearness: salary.dearness.toNumber(),
        houseRent: salary.houseRent.toNumber(),
        conveyance: salary.conveyance.toNumber(),
        medical: salary.medical.toNumber(),
        otherAllowances: salary.otherAllowances.toNumber(),
        grossSalary: salary.grossSalary.toNumber(),
        workingDays: attendance.workingDays,
        daysPresent: attendance.daysPresent,
        daysAbsent: attendance.daysAbsent,
        pf: salary.pf.toNumber(),
        esi: salary.esi.toNumber(),
        professionalTax: salary.professionalTax.toNumber(),
        incomeTax: salary.incomeTax.toNumber(),
        otherDeductions: salary.otherDeductions.toNumber(),
        totalDeductions: salary.totalDeductions.toNumber(),
      });

      payslips.push(payslip);
    }

    return payslips;
  }

  private async getMonthlyAttendance(
    employeeId: string,
    month: number,
    year: number
  ): Promise<{
    workingDays: number;
    daysPresent: number;
    daysAbsent: number;
  }> {
    // This would integrate with attendance service
    // For now, returning placeholder values
    return {
      workingDays: 22,
      daysPresent: 20,
      daysAbsent: 2,
    };
  }

  async finalizePayslip(id: string): Promise<Payslip> {
    const payslip = await prisma.payslip.findUnique({
      where: { id },
    });

    if (!payslip) {
      throw new Error('Payslip not found');
    }

    if (payslip.status !== 'DRAFT') {
      throw new Error('Only draft payslips can be finalized');
    }

    return prisma.payslip.update({
      where: { id },
      data: { status: 'FINALIZED' },
      include: { employee: true },
    });
  }

  async markPayslipAsPaid(id: string, paidDate?: Date): Promise<Payslip> {
    const payslip = await prisma.payslip.findUnique({
      where: { id },
    });

    if (!payslip) {
      throw new Error('Payslip not found');
    }

    if (payslip.status === 'PAID' || payslip.status === 'CANCELLED') {
      throw new Error('Cannot mark payslip as paid');
    }

    return prisma.payslip.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: paidDate || new Date(),
      },
      include: { employee: true },
    });
  }

  async getUnpaidPayslips(month: number, year: number): Promise<Payslip[]> {
    return prisma.payslip.findMany({
      where: {
        month,
        year,
        status: {
          in: ['FINALIZED'],
        },
      },
      include: { employee: true },
      orderBy: { employee: { firstName: 'asc' } },
    });
  }

  async getPaidPayslips(month: number, year: number): Promise<Payslip[]> {
    return prisma.payslip.findMany({
      where: {
        month,
        year,
        status: 'PAID',
      },
      include: { employee: true },
      orderBy: { paidDate: 'desc' },
    });
  }

  async getPayslipStats(month: number, year: number): Promise<{
    total: number;
    draft: number;
    finalized: number;
    paid: number;
    cancelled: number;
  }> {
    const [total, draft, finalized, paid, cancelled] = await Promise.all([
      prisma.payslip.count({ where: { month, year } }),
      prisma.payslip.count({ where: { month, year, status: 'DRAFT' } }),
      prisma.payslip.count({ where: { month, year, status: 'FINALIZED' } }),
      prisma.payslip.count({ where: { month, year, status: 'PAID' } }),
      prisma.payslip.count({ where: { month, year, status: 'CANCELLED' } }),
    ]);

    return { total, draft, finalized, paid, cancelled };
  }
}

export const payslipService = new PayslipService();
