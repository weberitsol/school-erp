import { PrismaClient, AssessmentReason, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface AssessmentReasonFilters {
  schoolId: string;
  isActive?: boolean;
  search?: string;
}

interface CreateAssessmentReasonData {
  name: string;
  code: string;
  description?: string;
  schoolId: string;
}

interface UpdateAssessmentReasonData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

class AssessmentReasonService {
  async createAssessmentReason(data: CreateAssessmentReasonData): Promise<AssessmentReason> {
    return prisma.assessmentReason.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        schoolId: data.schoolId,
      },
    });
  }

  async getAssessmentReasons(filters: AssessmentReasonFilters): Promise<AssessmentReason[]> {
    const where: Prisma.AssessmentReasonWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return prisma.assessmentReason.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getAssessmentReasonById(id: string, schoolId: string): Promise<AssessmentReason | null> {
    return prisma.assessmentReason.findFirst({
      where: { id, schoolId },
    });
  }

  async getAssessmentReasonByCode(code: string, schoolId: string): Promise<AssessmentReason | null> {
    return prisma.assessmentReason.findFirst({
      where: { code: code.toUpperCase(), schoolId },
    });
  }

  async updateAssessmentReason(
    id: string,
    schoolId: string,
    data: UpdateAssessmentReasonData
  ): Promise<AssessmentReason> {
    return prisma.assessmentReason.update({
      where: { id },
      data: {
        ...data,
        ...(data.code && { code: data.code.toUpperCase() }),
      },
    });
  }

  async deleteAssessmentReason(id: string, schoolId: string): Promise<AssessmentReason> {
    // Soft delete
    return prisma.assessmentReason.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteAssessmentReason(id: string, schoolId: string): Promise<AssessmentReason> {
    return prisma.assessmentReason.delete({
      where: { id },
    });
  }
}

export const assessmentReasonService = new AssessmentReasonService();
