import { PrismaClient, EmployeeTransfer, TransferStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TransferFilters {
  employeeId?: string;
  status?: TransferStatus;
  fromDepartmentId?: string;
  toDepartmentId?: string;
}

interface CreateTransferData {
  employeeId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromLocation?: string;
  toLocation?: string;
  transferDate: Date;
  transferReason: string;
  initiatedBy?: string;
  transferOrder?: string;
}

interface UpdateTransferData {
  toDepartmentId?: string;
  toLocation?: string;
  transferReason?: string;
  status?: TransferStatus;
  transferOrder?: string;
  approvedById?: string;
  approvalDate?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class EmployeeTransferService {
  async createTransfer(data: CreateTransferData): Promise<EmployeeTransfer> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify current department is correct
    if (employee.departmentId !== data.fromDepartmentId) {
      throw new Error('Employee is not in the specified from department');
    }

    // Verify from department exists
    const fromDept = await prisma.department.findUnique({
      where: { id: data.fromDepartmentId },
    });

    if (!fromDept) {
      throw new Error('From department not found');
    }

    // Verify to department exists
    const toDept = await prisma.department.findUnique({
      where: { id: data.toDepartmentId },
    });

    if (!toDept) {
      throw new Error('To department not found');
    }

    // Cannot transfer to same department
    if (data.fromDepartmentId === data.toDepartmentId) {
      throw new Error('From and to departments cannot be the same');
    }

    return prisma.employeeTransfer.create({
      data: {
        employeeId: data.employeeId,
        fromDepartmentId: data.fromDepartmentId,
        fromDepartment: fromDept.name,
        fromLocation: data.fromLocation,
        toDepartmentId: data.toDepartmentId,
        toDepartment: toDept.name,
        toLocation: data.toLocation,
        transferDate: data.transferDate,
        transferReason: data.transferReason,
        initiatedBy: data.initiatedBy,
        status: 'PENDING',
      },
      include: {
        employee: true,
        approvedBy: true,
      },
    });
  }

  async getTransfers(
    filters: TransferFilters,
    pagination?: PaginationParams
  ): Promise<{ data: EmployeeTransfer[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.fromDepartmentId) where.fromDepartmentId = filters.fromDepartmentId;
    if (filters.toDepartmentId) where.toDepartmentId = filters.toDepartmentId;

    const [data, total] = await Promise.all([
      prisma.employeeTransfer.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
          approvedBy: true,
        },
        orderBy: { transferDate: 'desc' },
      }),
      prisma.employeeTransfer.count({ where }),
    ]);

    return { data, total };
  }

  async getTransferById(id: string): Promise<EmployeeTransfer | null> {
    return prisma.employeeTransfer.findUnique({
      where: { id },
      include: {
        employee: true,
        approvedBy: true,
      },
    });
  }

  async updateTransfer(
    id: string,
    data: UpdateTransferData
  ): Promise<EmployeeTransfer> {
    const transfer = await prisma.employeeTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    // Verify to department if being updated
    if (data.toDepartmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.toDepartmentId },
      });

      if (!dept) {
        throw new Error('To department not found');
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

    return prisma.employeeTransfer.update({
      where: { id },
      data,
      include: {
        employee: true,
        approvedBy: true,
      },
    });
  }

  async getEmployeeTransfers(employeeId: string): Promise<EmployeeTransfer[]> {
    return prisma.employeeTransfer.findMany({
      where: { employeeId },
      include: {
        approvedBy: true,
      },
      orderBy: { transferDate: 'desc' },
    });
  }

  async getLatestTransfer(employeeId: string): Promise<EmployeeTransfer | null> {
    return prisma.employeeTransfer.findFirst({
      where: { employeeId },
      include: {
        approvedBy: true,
      },
      orderBy: { transferDate: 'desc' },
    });
  }

  async getPendingTransfers(): Promise<EmployeeTransfer[]> {
    return prisma.employeeTransfer.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: true,
      },
      orderBy: { transferDate: 'asc' },
    });
  }

  async approveTransfer(
    id: string,
    approvedById: string
  ): Promise<EmployeeTransfer> {
    const transfer = await prisma.employeeTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    // Verify approver exists
    const approver = await prisma.user.findUnique({
      where: { id: approvedById },
    });

    if (!approver) {
      throw new Error('Approver not found');
    }

    // Update employee's department
    await prisma.employee.update({
      where: { id: transfer.employeeId },
      data: { departmentId: transfer.toDepartmentId },
    });

    return prisma.employeeTransfer.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        approvedById,
        approvalDate: new Date(),
      },
      include: {
        employee: true,
        approvedBy: true,
      },
    });
  }

  async rejectTransfer(id: string): Promise<EmployeeTransfer> {
    const transfer = await prisma.employeeTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    return prisma.employeeTransfer.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        employee: true,
      },
    });
  }

  async getTransfersByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeTransfer[]> {
    return prisma.employeeTransfer.findMany({
      where: {
        transferDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: true,
        approvedBy: true,
      },
      orderBy: { transferDate: 'desc' },
    });
  }

  async getDepartmentTransfers(departmentId: string): Promise<{
    incoming: EmployeeTransfer[];
    outgoing: EmployeeTransfer[];
  }> {
    const [incoming, outgoing] = await Promise.all([
      prisma.employeeTransfer.findMany({
        where: {
          toDepartmentId: departmentId,
          status: 'COMPLETED',
        },
        include: { employee: true },
        orderBy: { transferDate: 'desc' },
      }),
      prisma.employeeTransfer.findMany({
        where: {
          fromDepartmentId: departmentId,
          status: 'COMPLETED',
        },
        include: { employee: true },
        orderBy: { transferDate: 'desc' },
      }),
    ]);

    return { incoming, outgoing };
  }

  async getTransferStatsByDepartment(): Promise<
    Array<{
      departmentName: string;
      incomingCount: number;
      outgoingCount: number;
      netChange: number;
    }>
  > {
    const departments = await prisma.department.findMany();
    const stats = [];

    for (const dept of departments) {
      const { incoming, outgoing } = await this.getDepartmentTransfers(dept.id);

      stats.push({
        departmentName: dept.name,
        incomingCount: incoming.length,
        outgoingCount: outgoing.length,
        netChange: incoming.length - outgoing.length,
      });
    }

    return stats;
  }
}

export const employeeTransferService = new EmployeeTransferService();
