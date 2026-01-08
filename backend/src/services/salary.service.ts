import { PrismaClient, Salary, SalaryStatus, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

interface SalaryFilters {
  employeeId?: string;
  status?: SalaryStatus;
  month?: number;
  year?: number;
}

interface CreateSalaryData {
  employeeId: string;
  basicSalary: number;
  dearness?: number;
  houseRent?: number;
  conveyance?: number;
  medical?: number;
  otherAllowances?: number;
  pf?: number;
  esi?: number;
  professionalTax?: number;
  incomeTax?: number;
  otherDeductions?: number;
  month: number;
  year: number;
  effectiveFrom: Date;
  effectiveUpto?: Date;
}

interface UpdateSalaryData {
  basicSalary?: number;
  dearness?: number;
  houseRent?: number;
  conveyance?: number;
  medical?: number;
  otherAllowances?: number;
  pf?: number;
  esi?: number;
  professionalTax?: number;
  incomeTax?: number;
  otherDeductions?: number;
  status?: SalaryStatus;
  effectiveUpto?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class SalaryService {
  private calculateGrossSalary(data: CreateSalaryData): number {
    const basicSalary = data.basicSalary || 0;
    const dearness = data.dearness || 0;
    const houseRent = data.houseRent || 0;
    const conveyance = data.conveyance || 0;
    const medical = data.medical || 0;
    const otherAllowances = data.otherAllowances || 0;

    return basicSalary + dearness + houseRent + conveyance + medical + otherAllowances;
  }

  private calculateTotalDeductions(data: CreateSalaryData): number {
    const pf = data.pf || 0;
    const esi = data.esi || 0;
    const professionalTax = data.professionalTax || 0;
    const incomeTax = data.incomeTax || 0;
    const otherDeductions = data.otherDeductions || 0;

    return pf + esi + professionalTax + incomeTax + otherDeductions;
  }

  async createSalary(data: CreateSalaryData): Promise<Salary> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if salary already exists for this month/year
    const existing = await prisma.salary.findFirst({
      where: {
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
      },
    });

    if (existing) {
      throw new Error('Salary already exists for this employee in this month');
    }

    // Validate month and year
    if (data.month < 1 || data.month > 12) {
      throw new Error('Invalid month');
    }

    const grossSalary = this.calculateGrossSalary(data);
    const totalDeductions = this.calculateTotalDeductions(data);
    const netSalary = grossSalary - totalDeductions;

    return prisma.salary.create({
      data: {
        employeeId: data.employeeId,
        basicSalary: new Decimal(data.basicSalary),
        dearness: new Decimal(data.dearness || 0),
        houseRent: new Decimal(data.houseRent || 0),
        conveyance: new Decimal(data.conveyance || 0),
        medical: new Decimal(data.medical || 0),
        otherAllowances: new Decimal(data.otherAllowances || 0),
        grossSalary: new Decimal(grossSalary),
        pf: new Decimal(data.pf || 0),
        esi: new Decimal(data.esi || 0),
        professionalTax: new Decimal(data.professionalTax || 0),
        incomeTax: new Decimal(data.incomeTax || 0),
        otherDeductions: new Decimal(data.otherDeductions || 0),
        totalDeductions: new Decimal(totalDeductions),
        netSalary: new Decimal(netSalary),
        month: data.month,
        year: data.year,
        effectiveFrom: data.effectiveFrom,
        effectiveUpto: data.effectiveUpto,
      },
      include: { employee: true },
    });
  }

  async getSalaries(
    filters: SalaryFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Salary[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.month) where.month = filters.month;
    if (filters.year) where.year = filters.year;

    const [data, total] = await Promise.all([
      prisma.salary.findMany({
        where,
        skip,
        take: limit,
        include: { employee: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.salary.count({ where }),
    ]);

    return { data, total };
  }

  async getSalaryById(id: string): Promise<Salary | null> {
    return prisma.salary.findUnique({
      where: { id },
      include: { employee: true },
    });
  }

  async updateSalary(id: string, data: UpdateSalaryData): Promise<Salary> {
    const salary = await prisma.salary.findUnique({
      where: { id },
    });

    if (!salary) {
      throw new Error('Salary not found');
    }

    // Recalculate gross and net if components changed
    const updateData: any = { ...data };

    const basicSalary = new Decimal(data.basicSalary || salary.basicSalary);
    const dearness = new Decimal(data.dearness || salary.dearness);
    const houseRent = new Decimal(data.houseRent || salary.houseRent);
    const conveyance = new Decimal(data.conveyance || salary.conveyance);
    const medical = new Decimal(data.medical || salary.medical);
    const otherAllowances = new Decimal(data.otherAllowances || salary.otherAllowances);

    const pf = new Decimal(data.pf || salary.pf);
    const esi = new Decimal(data.esi || salary.esi);
    const professionalTax = new Decimal(data.professionalTax || salary.professionalTax);
    const incomeTax = new Decimal(data.incomeTax || salary.incomeTax);
    const otherDeductions = new Decimal(data.otherDeductions || salary.otherDeductions);

    const grossSalary = basicSalary.plus(dearness).plus(houseRent).plus(conveyance).plus(medical).plus(otherAllowances);
    const totalDeductions = pf.plus(esi).plus(professionalTax).plus(incomeTax).plus(otherDeductions);
    const netSalary = grossSalary.minus(totalDeductions);

    updateData.grossSalary = grossSalary;
    updateData.totalDeductions = totalDeductions;
    updateData.netSalary = netSalary;

    return prisma.salary.update({
      where: { id },
      data: updateData,
      include: { employee: true },
    });
  }

  async getSalaryByEmployeeAndMonth(
    employeeId: string,
    month: number,
    year: number
  ): Promise<Salary | null> {
    return prisma.salary.findFirst({
      where: { employeeId, month, year },
      include: { employee: true },
    });
  }

  async getEmployeeSalaryHistory(
    employeeId: string,
    limit?: number
  ): Promise<Salary[]> {
    return prisma.salary.findMany({
      where: { employeeId },
      take: limit || 12,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { employee: true },
    });
  }

  async getActiveSalaries(employeeId: string): Promise<Salary[]> {
    return prisma.salary.findMany({
      where: {
        employeeId,
        status: 'ACTIVE',
      },
      include: { employee: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async deactivatePreviousSalaries(employeeId: string): Promise<void> {
    await prisma.salary.updateMany({
      where: {
        employeeId,
        status: 'ACTIVE',
      },
      data: { status: 'INACTIVE' },
    });
  }

  async getCurrentSalary(employeeId: string): Promise<Salary | null> {
    const today = new Date();

    return prisma.salary.findFirst({
      where: {
        employeeId,
        status: 'ACTIVE',
        effectiveFrom: { lte: today },
        OR: [{ effectiveUpto: null }, { effectiveUpto: { gte: today } }],
      },
      include: { employee: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getSalariesByMonth(month: number, year: number): Promise<Salary[]> {
    return prisma.salary.findMany({
      where: { month, year },
      include: { employee: true },
      orderBy: { employee: { firstName: 'asc' } },
    });
  }

  async calculateTotalPayroll(month: number, year: number): Promise<{
    totalGross: Decimal;
    totalDeductions: Decimal;
    totalNet: Decimal;
  }> {
    const salaries = await this.getSalariesByMonth(month, year);

    let totalGross = new Decimal(0);
    let totalDeductions = new Decimal(0);
    let totalNet = new Decimal(0);

    salaries.forEach(salary => {
      totalGross = totalGross.plus(salary.grossSalary);
      totalDeductions = totalDeductions.plus(salary.totalDeductions);
      totalNet = totalNet.plus(salary.netSalary);
    });

    return { totalGross, totalDeductions, totalNet };
  }
}

export const salaryService = new SalaryService();
