import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface MessEnrollmentData {
  studentId: string;
  messId: string;
  planId: string;
  enrollmentDate: Date;
  startDate: Date;
  endDate?: Date;
  dietaryPreferences?: string[];
  schoolId: string;
}

export interface EnrollmentFilter {
  studentId?: string;
  messId?: string;
  schoolId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

class EnrollmentService {
  /**
   * Create a new student enrollment in a mess facility
   * CRITICAL: Validates student doesn't already have active enrollment in same mess
   */
  async create(data: MessEnrollmentData) {
    // Check if student already has an active enrollment in this mess
    const existingEnrollment = await prisma.messEnrollment.findFirst({
      where: {
        studentId: data.studentId,
        messId: data.messId,
        status: 'ACTIVE',
      },
    });

    if (existingEnrollment) {
      throw new Error(
        `Student already has an active enrollment in this mess facility. End date: ${existingEnrollment.endDate || 'Indefinite'}`
      );
    }

    // Verify meal plan exists and belongs to same school
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: data.planId,
        schoolId: data.schoolId,
      },
    });

    if (!mealPlan) {
      throw new Error('Meal plan not found or does not belong to this school');
    }

    // Verify mess belongs to same school
    const mess = await prisma.mess.findFirst({
      where: {
        id: data.messId,
        schoolId: data.schoolId,
      },
    });

    if (!mess) {
      throw new Error('Mess facility not found or does not belong to this school');
    }

    // Create enrollment
    const enrollment = await prisma.messEnrollment.create({
      data: {
        studentId: data.studentId,
        messId: data.messId,
        planId: data.planId,
        enrollmentDate: data.enrollmentDate,
        startDate: data.startDate,
        endDate: data.endDate,
        dietaryPreferences: data.dietaryPreferences || [],
        status: 'ACTIVE',
        schoolId: data.schoolId,
      },
      include: {
        student: true,
        mess: true,
        plan: true,
      },
    });

    return enrollment;
  }

  /**
   * Get enrollment by ID with all related data
   */
  async getById(id: string) {
    const enrollment = await prisma.messEnrollment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        mess: true,
        plan: true,
        attendances: {
          orderBy: { attendanceDate: 'desc' },
          take: 10,
        },
      },
    });

    return enrollment;
  }

  /**
   * Get all enrollments with filters
   */
  async getAll(filters?: EnrollmentFilter): Promise<{ data: any[]; total: number }> {
    const where: Prisma.MessEnrollmentWhereInput = {};

    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.messId) where.messId = filters.messId;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.status) where.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      where.startDate = {};
      if (filters?.startDate) where.startDate.gte = filters.startDate;
      if (filters?.endDate) where.startDate.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.messEnrollment.findMany({
        where,
        include: {
          student: {
            include: { user: true },
          },
          mess: true,
          plan: true,
        },
        orderBy: { enrollmentDate: 'desc' },
      }),
      prisma.messEnrollment.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get enrollments for a specific student
   */
  async getStudentEnrollments(studentId: string, schoolId: string) {
    const enrollments = await prisma.messEnrollment.findMany({
      where: {
        studentId,
        schoolId,
      },
      include: {
        mess: true,
        plan: true,
      },
      orderBy: { enrollmentDate: 'desc' },
    });

    return enrollments;
  }

  /**
   * Get active enrollment for student in a mess
   * Used for attendance marking to validate student can eat
   */
  async getActiveEnrollment(studentId: string, messId: string, schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrollment = await prisma.messEnrollment.findFirst({
      where: {
        studentId,
        messId,
        schoolId,
        status: 'ACTIVE',
        startDate: { lte: today },
        OR: [
          { endDate: null }, // No end date = indefinite
          { endDate: { gte: today } }, // End date is today or later
        ],
      },
      include: {
        student: true,
        plan: true,
        mess: true,
      },
    });

    return enrollment;
  }

  /**
   * Update enrollment details
   */
  async update(id: string, data: Partial<MessEnrollmentData>) {
    const enrollment = await prisma.messEnrollment.findUnique({ where: { id } });
    if (!enrollment) throw new Error('Enrollment not found');

    const updated = await prisma.messEnrollment.update({
      where: { id },
      data: {
        endDate: data.endDate,
        dietaryPreferences: data.dietaryPreferences,
        status: data.endDate ? 'INACTIVE' : 'ACTIVE',
      },
      include: {
        student: true,
        mess: true,
        plan: true,
      },
    });

    return updated;
  }

  /**
   * End enrollment (set end date to today)
   * CRITICAL: Must prevent enrollment termination if it would affect billing
   */
  async endEnrollment(id: string) {
    const enrollment = await prisma.messEnrollment.findUnique({
      where: { id },
      include: { bills: true },
    });

    if (!enrollment) throw new Error('Enrollment not found');

    if (enrollment.endDate) {
      throw new Error('Enrollment has already been terminated');
    }

    // Check for pending/unpaid bills
    const pendingBills = enrollment.bills.filter(
      (bill) => bill.status === 'PENDING' || bill.status === 'PARTIAL'
    );

    if (pendingBills.length > 0) {
      throw new Error(
        `Cannot end enrollment: ${pendingBills.length} unpaid bill(s) exist. Please resolve pending payments first.`
      );
    }

    const today = new Date();
    const updated = await prisma.messEnrollment.update({
      where: { id },
      data: {
        endDate: today,
        status: 'INACTIVE',
      },
      include: {
        student: true,
        mess: true,
        plan: true,
      },
    });

    return updated;
  }

  /**
   * Get enrollment statistics for a mess
   */
  async getMessStatistics(messId: string, schoolId: string) {
    const [totalEnrollments, activeEnrollments, inactiveEnrollments] =
      await Promise.all([
        prisma.messEnrollment.count({
          where: { messId, schoolId },
        }),
        prisma.messEnrollment.count({
          where: { messId, schoolId, status: 'ACTIVE' },
        }),
        prisma.messEnrollment.count({
          where: { messId, schoolId, status: 'INACTIVE' },
        }),
      ]);

    return {
      messId,
      totalEnrollments,
      activeEnrollments,
      inactiveEnrollments,
      utilizationRate: totalEnrollments > 0 ? (activeEnrollments / totalEnrollments) * 100 : 0,
    };
  }

  /**
   * Delete enrollment (admin cleanup only)
   */
  async delete(id: string) {
    const enrollment = await prisma.messEnrollment.findUnique({
      where: { id },
      include: { attendances: true, bills: true },
    });

    if (!enrollment) throw new Error('Enrollment not found');

    if (enrollment.attendances.length > 0) {
      throw new Error('Cannot delete enrollment with existing attendance records');
    }

    if (enrollment.bills.length > 0) {
      throw new Error('Cannot delete enrollment with existing bills');
    }

    await prisma.messEnrollment.delete({ where: { id } });
  }
}

export const enrollmentService = new EnrollmentService();
