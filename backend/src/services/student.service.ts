import { PrismaClient, Gender, Category, PwDType, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface CreateStudentDto {
  // Basic Info
  admissionNo: string;
  rollNo?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup?: string;
  profileImage?: string;

  // Contact
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Academic
  currentClassId?: string;
  currentSectionId?: string;
  previousSchool?: string;

  // Medical
  medicalConditions?: string;
  allergies?: string;

  // School
  schoolId: string;

  // ==================== NEET/JEE Eligibility Fields ====================
  // Category/Reservation
  category?: Category;
  subCategory?: string;
  isCreamyLayer?: boolean;

  // Domicile
  domicileState?: string;
  isDomicile?: boolean;
  domicileCertNo?: string;

  // Nationality
  nationality?: string;

  // PwD
  pwdType?: PwDType;
  pwdPercentage?: number;
  pwdCertNo?: string;

  // Economic Status
  annualFamilyIncome?: number;
  isEWS?: boolean;
  ewsCertNo?: string;

  // Additional Quotas
  isDefenseQuota?: boolean;
  isKashmiriMigrant?: boolean;
  isSingleGirl?: boolean;

  // Documents
  aadharNo?: string;

  // Parent Info
  fatherOccupation?: string;
  motherOccupation?: string;
}

export interface UpdateStudentDto {
  rollNo?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  bloodGroup?: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  currentClassId?: string;
  currentSectionId?: string;
  medicalConditions?: string;
  allergies?: string;
  isActive?: boolean;

  // NEET/JEE Fields
  category?: Category;
  subCategory?: string;
  isCreamyLayer?: boolean;
  domicileState?: string;
  isDomicile?: boolean;
  domicileCertNo?: string;
  nationality?: string;
  pwdType?: PwDType;
  pwdPercentage?: number;
  pwdCertNo?: string;
  annualFamilyIncome?: number;
  isEWS?: boolean;
  ewsCertNo?: string;
  isDefenseQuota?: boolean;
  isKashmiriMigrant?: boolean;
  isSingleGirl?: boolean;
  aadharNo?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
}

export interface StudentFilters {
  schoolId?: string;
  classId?: string;
  sectionId?: string;
  gender?: Gender;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class StudentService {
  // Create student
  async createStudent(data: CreateStudentDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const student = await prisma.student.create({
      data: {
        admissionNo: data.admissionNo,
        rollNo: data.rollNo,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        profileImage: data.profileImage,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        previousSchool: data.previousSchool,
        medicalConditions: data.medicalConditions,
        allergies: data.allergies,
        // NEET/JEE Fields
        category: data.category,
        subCategory: data.subCategory,
        isCreamyLayer: data.isCreamyLayer,
        domicileState: data.domicileState,
        isDomicile: data.isDomicile,
        domicileCertNo: data.domicileCertNo,
        nationality: data.nationality,
        pwdType: data.pwdType,
        pwdPercentage: data.pwdPercentage,
        pwdCertNo: data.pwdCertNo,
        annualFamilyIncome: data.annualFamilyIncome,
        isEWS: data.isEWS,
        ewsCertNo: data.ewsCertNo,
        isDefenseQuota: data.isDefenseQuota,
        isKashmiriMigrant: data.isKashmiriMigrant,
        isSingleGirl: data.isSingleGirl,
        aadharNo: data.aadharNo,
        fatherOccupation: data.fatherOccupation,
        motherOccupation: data.motherOccupation,
        ...(data.currentClassId && {
          currentClass: { connect: { id: data.currentClassId } },
        }),
        ...(data.currentSectionId && {
          currentSection: { connect: { id: data.currentSectionId } },
        }),
        user: {
          create: {
            email: data.email,
            password: hashedPassword,
            role: 'STUDENT',
            schoolId: data.schoolId,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        currentClass: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        currentSection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return student;
  }

  // Get all students with filters and pagination
  async getStudents(
    filters: StudentFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const {
      schoolId,
      classId,
      sectionId,
      gender,
      isActive = true,
      search,
    } = filters;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      isActive,
      ...(schoolId && { user: { schoolId } }),
      ...(classId && { currentClassId: classId }),
      ...(sectionId && { currentSectionId: sectionId }),
      ...(gender && { gender }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNo: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              lastLogin: true,
            },
          },
          currentClass: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          currentSection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get student by ID
  async getStudentById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true,
            school: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        currentClass: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        currentSection: {
          select: {
            id: true,
            name: true,
          },
        },
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                relation: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return student;
  }

  // Get student by admission number
  async getStudentByAdmissionNo(admissionNo: string) {
    return prisma.student.findUnique({
      where: { admissionNo },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        currentClass: true,
        currentSection: true,
      },
    });
  }

  // Update student
  async updateStudent(id: string, data: UpdateStudentDto) {
    const student = await prisma.student.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        currentClass: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        currentSection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return student;
  }

  // Soft delete student
  async deleteStudent(id: string) {
    const student = await prisma.student.update({
      where: { id },
      data: {
        isActive: false,
        user: {
          update: {
            isActive: false,
          },
        },
      },
    });

    return student;
  }

  // Hard delete student (admin only)
  async hardDeleteStudent(id: string) {
    // First get the user ID to delete the user too
    const student = await prisma.student.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Delete student (cascade will handle related records)
    await prisma.student.delete({ where: { id } });

    // Delete user
    await prisma.user.delete({ where: { id: student.userId } });

    return { success: true };
  }

  // Get student attendance
  async getStudentAttendance(
    studentId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: Prisma.StudentAttendanceWhereInput = {
      studentId,
      ...(startDate &&
        endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const attendances = await prisma.studentAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        section: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate summary
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === 'PRESENT').length;
    const absent = attendances.filter((a) => a.status === 'ABSENT').length;
    const late = attendances.filter((a) => a.status === 'LATE').length;
    const halfDay = attendances.filter((a) => a.status === 'HALF_DAY').length;

    return {
      attendances,
      summary: {
        total,
        present,
        absent,
        late,
        halfDay,
        percentage: total > 0 ? ((present + late + halfDay) / total) * 100 : 0,
      },
    };
  }

  // Get student fees
  async getStudentFees(studentId: string, academicYearId?: string) {
    const where: Prisma.FeePaymentWhereInput = {
      studentId,
      ...(academicYearId && { academicYearId }),
    };

    const fees = await prisma.feePayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        feeStructure: {
          select: {
            id: true,
            name: true,
            amount: true,
            frequency: true,
          },
        },
      },
    });

    // Calculate summary
    const totalDue = fees.reduce(
      (sum, f) => sum + f.feeStructure.amount.toNumber(),
      0
    );
    const paidAmount = fees
      .filter((f) => f.paymentStatus === 'PAID')
      .reduce((sum, f) => sum + f.totalAmount.toNumber(), 0);
    const pendingAmount = totalDue - paidAmount;

    return {
      fees,
      summary: {
        totalAmount: totalDue,
        paidAmount,
        pendingAmount,
        pendingCount: fees.filter((f) => f.paymentStatus !== 'PAID').length,
      },
    };
  }

  // Get student exam results
  async getStudentResults(studentId: string, academicYearId?: string) {
    const where: Prisma.ExamResultWhereInput = {
      studentId,
      ...(academicYearId && { exam: { academicYearId } }),
    };

    const results = await prisma.examResult.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            examType: true,
            maxMarks: true,
            passingMarks: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Calculate summary
    const totalExams = results.length;
    const passed = results.filter(
      (r) => (r.marksObtained?.toNumber() || 0) >= (r.exam.passingMarks?.toNumber() || 0)
    ).length;
    const avgPercentage =
      totalExams > 0
        ? results.reduce(
            (sum, r) =>
              sum +
              ((r.marksObtained?.toNumber() || 0) / r.exam.maxMarks.toNumber()) * 100,
            0
          ) / totalExams
        : 0;

    return {
      results,
      summary: {
        totalExams,
        passed,
        failed: totalExams - passed,
        avgPercentage: Math.round(avgPercentage * 100) / 100,
      },
    };
  }

  // Bulk create students (for CSV import)
  async bulkCreateStudents(students: CreateStudentDto[]) {
    const results = {
      success: [] as string[],
      failed: [] as { admissionNo: string; error: string }[],
    };

    for (const studentData of students) {
      try {
        const student = await this.createStudent(studentData);
        results.success.push(student.admissionNo);
      } catch (error: any) {
        results.failed.push({
          admissionNo: studentData.admissionNo,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }

  // Promote students to next class
  async promoteStudents(
    studentIds: string[],
    newClassId: string,
    newSectionId?: string
  ) {
    const updated = await prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: {
        currentClassId: newClassId,
        currentSectionId: newSectionId,
      },
    });

    return { count: updated.count };
  }
}

export const studentService = new StudentService();
