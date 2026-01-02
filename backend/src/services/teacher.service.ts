import { PrismaClient, Teacher, Gender, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CreateTeacherDto } from './teacher-import.service';

const prisma = new PrismaClient();

interface TeacherFilters {
  schoolId: string;
  branchId?: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class TeacherService {
  async createTeacher(data: CreateTeacherDto, schoolId: string): Promise<Teacher> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.teacher.create({
      data: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        qualification: data.qualification,
        specialization: data.specialization,
        experience: data.experience,
        ...(data.departmentId && { department: { connect: { id: data.departmentId } } }),
        ...(data.branchId && { branch: { connect: { id: data.branchId } } }),
        salary: data.salary,
        bankAccount: data.bankAccount,
        bankName: data.bankName,
        ifscCode: data.ifscCode,
        user: {
          create: {
            email: data.email,
            password: hashedPassword,
            role: 'TEACHER',
            schoolId,
          },
        },
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        department: true,
        branch: true,
      },
    });
  }

  async getTeachers(
    filters: TeacherFilters,
    pagination: PaginationParams = {}
  ): Promise<{ teachers: Teacher[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where: Prisma.TeacherWhereInput = {
      user: { schoolId: filters.schoolId },
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.departmentId && { departmentId: filters.departmentId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { employeeId: { contains: filters.search, mode: 'insensitive' } },
          { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { id: true, email: true, role: true, isActive: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.teacher.count({ where }),
    ]);

    return {
      teachers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTeacherById(id: string): Promise<Teacher | null> {
    return prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, role: true, isActive: true, schoolId: true },
        },
        department: true,
        branch: true,
        classTeacher: true,
        subjectTeachers: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  async getTeacherByEmployeeId(employeeId: string): Promise<Teacher | null> {
    return prisma.teacher.findUnique({
      where: { employeeId },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async updateTeacher(id: string, data: Partial<CreateTeacherDto>): Promise<Teacher> {
    const updateData: any = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.alternatePhone !== undefined) updateData.alternatePhone = data.alternatePhone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.ifscCode !== undefined) updateData.ifscCode = data.ifscCode;

    return prisma.teacher.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        department: true,
        branch: true,
      },
    });
  }

  async deleteTeacher(id: string): Promise<Teacher> {
    // Soft delete
    return prisma.teacher.update({
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
  }

  async hardDeleteTeacher(id: string): Promise<void> {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (teacher) {
      await prisma.$transaction([
        prisma.teacher.delete({ where: { id } }),
        prisma.user.delete({ where: { id: teacher.userId } }),
      ]);
    }
  }

  async bulkCreateTeachers(
    teachers: CreateTeacherDto[],
    schoolId: string
  ): Promise<{ success: string[]; failed: { employeeId: string; error: string }[] }> {
    const success: string[] = [];
    const failed: { employeeId: string; error: string }[] = [];

    for (const teacherData of teachers) {
      try {
        await this.createTeacher(teacherData, schoolId);
        success.push(teacherData.employeeId);
      } catch (error: any) {
        let errorMessage = 'Unknown error';
        if (error.code === 'P2002') {
          if (error.meta?.target?.includes('email')) {
            errorMessage = 'Email already exists';
          } else if (error.meta?.target?.includes('employeeId')) {
            errorMessage = 'Employee ID already exists';
          } else {
            errorMessage = 'Duplicate entry';
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        failed.push({ employeeId: teacherData.employeeId, error: errorMessage });
      }
    }

    return { success, failed };
  }

  async getTeacherClasses(teacherId: string): Promise<any[]> {
    return prisma.section.findMany({
      where: { classTeacherId: teacherId },
      include: {
        class: true,
      },
    });
  }

  async getTeacherSubjects(teacherId: string): Promise<any[]> {
    return prisma.subjectTeacher.findMany({
      where: { teacherId },
      include: {
        subject: true,
      },
    });
  }
}

export const teacherService = new TeacherService();
