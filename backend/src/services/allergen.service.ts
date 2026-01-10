import { PrismaClient, Allergen, AllergenSeverity } from '@prisma/client';

const prisma = new PrismaClient();

class AllergenService {
  async create(data: {
    name: string;
    code: string;
    schoolId: string;
    description?: string;
    severity?: AllergenSeverity;
  }): Promise<Allergen> {
    // Check if allergen with same code exists
    const existing = await prisma.allergen.findFirst({
      where: { code: data.code, schoolId: data.schoolId },
    });

    if (existing) {
      throw new Error(`Allergen with code ${data.code} already exists`);
    }

    return prisma.allergen.create({
      data: {
        ...data,
        severity: data.severity || 'MODERATE',
      },
    });
  }

  async getAll(filters: {
    schoolId: string;
    severity?: AllergenSeverity;
    isActive?: boolean;
  }): Promise<Allergen[]> {
    const where: any = { schoolId: filters.schoolId };

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.allergen.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { name: 'asc' }],
    });
  }

  async getById(id: string): Promise<Allergen | null> {
    return prisma.allergen.findUnique({
      where: { id },
      include: { studentAllergies: true },
    });
  }

  async getByCode(code: string): Promise<Allergen | null> {
    return prisma.allergen.findUnique({
      where: { code },
    });
  }

  async update(id: string, data: Partial<Allergen>): Promise<Allergen> {
    return prisma.allergen.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.allergen.delete({ where: { id } });
  }

  async getBySeverity(schoolId: string, severity: AllergenSeverity): Promise<Allergen[]> {
    return prisma.allergen.findMany({
      where: { schoolId, severity, isActive: true },
    });
  }

  async getCriticalAllergens(schoolId: string): Promise<Allergen[]> {
    return prisma.allergen.findMany({
      where: {
        schoolId,
        isActive: true,
        severity: { in: ['SEVERE', 'ANAPHYLAXIS'] },
      },
    });
  }

  async getStudentAllergens(studentId: string): Promise<Allergen[]> {
    const studentAllergies = await prisma.studentAllergy.findMany({
      where: {
        studentId,
        isVerified: true,
        isActive: true,
      },
      include: { allergen: true },
    });

    return studentAllergies.map(sa => sa.allergen);
  }
}

export const allergenService = new AllergenService();
