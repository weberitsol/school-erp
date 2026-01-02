import { PrismaClient, BatchTransfer, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface TransferFilters {
  studentId?: string;
  fromClassId?: string;
  toClassId?: string;
  transferredById?: string;
  fromDate?: Date;
  toDate?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TransferStudentData {
  studentId: string;
  toClassId: string;
  toSectionId: string;
  reason?: string;
  transferredById: string;
}

class BatchTransferService {
  async transferStudent(data: TransferStudentData): Promise<BatchTransfer> {
    // Get current student assignment
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: {
        id: true,
        currentClassId: true,
        currentSectionId: true,
        currentBranchId: true,
        user: {
          select: { schoolId: true },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (!student.currentClassId || !student.currentSectionId) {
      throw new Error('Student is not assigned to a class/batch');
    }

    // Validate target class exists
    const targetClass = await prisma.class.findUnique({
      where: { id: data.toClassId },
    });

    if (!targetClass) {
      throw new Error('Target class not found');
    }

    // Validate target section exists and belongs to target class
    const targetSection = await prisma.section.findFirst({
      where: {
        id: data.toSectionId,
        classId: data.toClassId,
      },
    });

    if (!targetSection) {
      throw new Error('Target batch not found or does not belong to the specified class');
    }

    // Check section capacity
    const currentStudentCount = await prisma.student.count({
      where: {
        currentSectionId: data.toSectionId,
        isActive: true,
      },
    });

    if (currentStudentCount >= targetSection.capacity) {
      throw new Error(`Target batch is at full capacity (${targetSection.capacity} students)`);
    }

    // Perform transfer in transaction
    const [transfer] = await prisma.$transaction([
      // Create transfer record
      prisma.batchTransfer.create({
        data: {
          studentId: data.studentId,
          fromClassId: student.currentClassId,
          fromSectionId: student.currentSectionId,
          toClassId: data.toClassId,
          toSectionId: data.toSectionId,
          reason: data.reason,
          transferredById: data.transferredById,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
            },
          },
          transferredBy: {
            select: { id: true, email: true },
          },
        },
      }),
      // Update student
      prisma.student.update({
        where: { id: data.studentId },
        data: {
          currentClassId: data.toClassId,
          currentSectionId: data.toSectionId,
        },
      }),
    ]);

    return transfer;
  }

  async bulkTransferStudents(
    studentIds: string[],
    toClassId: string,
    toSectionId: string,
    reason: string | undefined,
    transferredById: string
  ): Promise<{ success: string[]; failed: { studentId: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { studentId: string; error: string }[] = [];

    for (const studentId of studentIds) {
      try {
        await this.transferStudent({
          studentId,
          toClassId,
          toSectionId,
          reason,
          transferredById,
        });
        success.push(studentId);
      } catch (error: any) {
        failed.push({ studentId, error: error.message });
      }
    }

    return { success, failed };
  }

  async getTransferHistory(
    filters: TransferFilters,
    pagination: PaginationParams = {}
  ): Promise<{ transfers: BatchTransfer[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where: Prisma.BatchTransferWhereInput = {
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.fromClassId && { fromClassId: filters.fromClassId }),
      ...(filters.toClassId && { toClassId: filters.toClassId }),
      ...(filters.transferredById && { transferredById: filters.transferredById }),
      ...(filters.fromDate && { effectiveDate: { gte: filters.fromDate } }),
      ...(filters.toDate && { effectiveDate: { lte: filters.toDate } }),
    };

    const [transfers, total] = await Promise.all([
      prisma.batchTransfer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true,
            },
          },
          transferredBy: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.batchTransfer.count({ where }),
    ]);

    return { transfers, total };
  }

  async getStudentTransferHistory(studentId: string): Promise<BatchTransfer[]> {
    return prisma.batchTransfer.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        transferredBy: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async getTransferById(id: string): Promise<BatchTransfer | null> {
    return prisma.batchTransfer.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          },
        },
        transferredBy: {
          select: { id: true, email: true },
        },
      },
    });
  }
}

export const batchTransferService = new BatchTransferService();
