import { PrismaClient, Employee, EmployeeStatus, EmploymentType } from '@prisma/client';

const prisma = new PrismaClient();

interface EmployeeFilters {
  schoolId?: string;
  departmentId?: string;
  designationId?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  search?: string;
  isActive?: boolean;
}

interface CreateEmployeeData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  employeeNo: string;
  employmentType: EmploymentType;
  designationId: string;
  departmentId: string;
  reportingToId?: string;
  joiningDate: Date;
  basicSalary?: number;
  salaryGrade?: string;
  salaryEffectiveFrom?: Date;
  panNumber?: string;
  aadharNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  designationId?: string;
  departmentId?: string;
  reportingToId?: string;
  basicSalary?: number;
  salaryGrade?: string;
  status?: EmployeeStatus;
  isActive?: boolean;
  panNumber?: string;
  aadharNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class EmployeeService {
  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    // Validate unique constraints
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeNo: data.employeeNo },
    });

    if (existingEmployee) {
      throw new Error('Employee with this employee number already exists');
    }

    // Check if email is unique
    const emailExists = await prisma.employee.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error('Employee with this email already exists');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify designation exists
    const designation = await prisma.designation.findUnique({
      where: { id: data.designationId },
    });

    if (!designation) {
      throw new Error('Designation not found');
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Create employee
    return prisma.employee.create({
      data: {
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        employeeNo: data.employeeNo,
        employmentType: data.employmentType,
        designationId: data.designationId,
        departmentId: data.departmentId,
        reportingToId: data.reportingToId,
        joiningDate: data.joiningDate,
        basicSalary: data.basicSalary,
        salaryGrade: data.salaryGrade,
        salaryEffectiveFrom: data.salaryEffectiveFrom,
        panNumber: data.panNumber,
        aadharNumber: data.aadharNumber,
        bankAccountNumber: data.bankAccountNumber,
        bankIfscCode: data.bankIfscCode,
      },
      include: {
        user: true,
        designation: true,
        department: true,
        reportingTo: true,
      },
    });
  }

  async getEmployees(
    filters: EmployeeFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Employee[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.designationId) where.designationId = filters.designationId;
    if (filters.status) where.status = filters.status;
    if (filters.employmentType) where.employmentType = filters.employmentType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeNo: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          designation: true,
          department: true,
          reportingTo: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return { data, total };
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        designation: true,
        department: true,
        reportingTo: true,
        subordinates: true,
        salaries: true,
        payslips: true,
        leaveBalance: true,
        gratuity: true,
      },
    });
  }

  async updateEmployee(
    id: string,
    data: UpdateEmployeeData
  ): Promise<Employee> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== employee.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    return prisma.employee.update({
      where: { id },
      data,
      include: {
        user: true,
        designation: true,
        department: true,
        reportingTo: true,
      },
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    await prisma.employee.delete({
      where: { id },
    });
  }

  async getEmployeeByEmployeeNo(employeeNo: string): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: { employeeNo },
      include: {
        user: true,
        designation: true,
        department: true,
        reportingTo: true,
      },
    });
  }

  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      include: {
        designation: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getEmployeesByDesignation(designationId: string): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: {
        designationId,
        isActive: true,
      },
      include: {
        department: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getSubordinates(managerId: string): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: { reportingToId: managerId },
      include: {
        designation: true,
        department: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async updateEmployeeStatus(
    id: string,
    status: EmployeeStatus
  ): Promise<Employee> {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return prisma.employee.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        designation: true,
        department: true,
      },
    });
  }

  async getActiveEmployeeCount(filters?: Partial<EmployeeFilters>): Promise<number> {
    return prisma.employee.count({
      where: {
        isActive: true,
        status: 'ACTIVE',
        departmentId: filters?.departmentId,
      },
    });
  }

  async getEmployeesByStatus(status: EmployeeStatus): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: { status },
      include: {
        designation: true,
        department: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }
}

export const employeeService = new EmployeeService();
