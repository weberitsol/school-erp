import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface StudentAllergy {
  id: string;
  studentId: string;
  allergenId: string;
  description?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS';
  doctorName?: string;
  doctorContactNumber?: string;
  verificationDocumentUrl?: string;
  verificationDate?: Date;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentAllergyDto {
  studentId: string;
  allergenId: string;
  description?: string;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS';
  doctorName?: string;
  doctorContactNumber?: string;
  verificationDocumentUrl?: string;
  verificationDate?: Date;
}

class StudentAllergyService {
  async getAll(filters?: {
    studentId?: string;
    allergenId?: string;
    isVerified?: boolean;
    isActive?: boolean;
    schoolId?: string;
  }): Promise<{ data: StudentAllergy[]; total: number }> {
    const where: Prisma.StudentAllergyWhereInput = {};

    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.allergenId) where.allergenId = filters.allergenId;
    if (filters?.isVerified !== undefined) where.isVerified = filters.isVerified;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.schoolId) where.schoolId = filters.schoolId;

    const [data, total] = await Promise.all([
      prisma.studentAllergy.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          allergen: { select: { id: true, name: true, severity: true } },
        },
      }),
      prisma.studentAllergy.count({ where }),
    ]);

    return { data: data as any, total };
  }

  async getById(id: string): Promise<StudentAllergy | null> {
    const allergy = await prisma.studentAllergy.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergy as any;
  }

  async getByStudent(studentId: string, schoolId: string): Promise<StudentAllergy[]> {
    const allergies = await prisma.studentAllergy.findMany({
      where: {
        studentId,
        schoolId,
        isActive: true,
        isVerified: true, // Only return doctor-verified allergies
      },
      include: {
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergies as any;
  }

  async getCriticalAllergies(studentId: string, schoolId: string): Promise<StudentAllergy[]> {
    const allergies = await prisma.studentAllergy.findMany({
      where: {
        studentId,
        schoolId,
        isActive: true,
        isVerified: true,
        severity: {
          in: ['SEVERE', 'ANAPHYLAXIS'],
        },
      },
      include: {
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergies as any;
  }

  async create(data: CreateStudentAllergyDto & { schoolId: string }): Promise<StudentAllergy> {
    const allergy = await prisma.studentAllergy.create({
      data: {
        studentId: data.studentId,
        allergenId: data.allergenId,
        schoolId: data.schoolId,
        description: data.description,
        severity: data.severity || 'MODERATE',
        doctorName: data.doctorName,
        doctorContactNumber: data.doctorContactNumber,
        verificationDocumentUrl: data.verificationDocumentUrl,
        verificationDate: data.verificationDate,
        isVerified: false,
        isActive: true,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergy as any;
  }

  async update(
    id: string,
    data: Partial<CreateStudentAllergyDto>
  ): Promise<StudentAllergy> {
    const allergy = await prisma.studentAllergy.update({
      where: { id },
      data: {
        description: data.description,
        severity: data.severity,
        doctorName: data.doctorName,
        doctorContactNumber: data.doctorContactNumber,
        verificationDocumentUrl: data.verificationDocumentUrl,
        verificationDate: data.verificationDate,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergy as any;
  }

  async verify(id: string): Promise<StudentAllergy> {
    const allergy = await prisma.studentAllergy.update({
      where: { id },
      data: {
        isVerified: true,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergy as any;
  }

  async reject(id: string): Promise<StudentAllergy> {
    const allergy = await prisma.studentAllergy.update({
      where: { id },
      data: {
        isVerified: false,
        isActive: false,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergy as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.studentAllergy.delete({
      where: { id },
    });
  }

  async deactivate(id: string): Promise<StudentAllergy> {
    const allergy = await prisma.studentAllergy.update({
      where: { id },
      data: { isActive: false },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        allergen: { select: { id: true, name: true, severity: true } },
      },
    });
    return allergy as any;
  }
}

export const studentAllergyService = new StudentAllergyService();
