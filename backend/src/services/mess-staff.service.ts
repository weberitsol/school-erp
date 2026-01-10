import { PrismaClient, MessStaff } from '@prisma/client';

const prisma = new PrismaClient();

class MessStaffService {
  async create(data: {
    firstName: string;
    lastName: string;
    position: string;
    messId: string;
    schoolId: string;
    dateOfJoining: Date;
    email?: string;
    phone?: string;
    department?: string;
    certifications?: string[];
    trainingsCompleted?: string[];
  }): Promise<MessStaff> {
    return prisma.messStaff.create({
      data,
      include: { mess: true },
    });
  }

  async getAll(filters: {
    messId?: string;
    schoolId: string;
    position?: string;
    isActive?: boolean;
  }): Promise<MessStaff[]> {
    const where: any = { schoolId: filters.schoolId };

    if (filters.messId) {
      where.messId = filters.messId;
    }

    if (filters.position) {
      where.position = filters.position;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.messStaff.findMany({
      where,
      include: { mess: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<MessStaff | null> {
    return prisma.messStaff.findUnique({
      where: { id },
      include: { mess: true },
    });
  }

  async update(id: string, data: Partial<MessStaff>): Promise<MessStaff> {
    return prisma.messStaff.update({
      where: { id },
      data,
      include: { mess: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.messStaff.delete({ where: { id } });
  }

  async getByMess(messId: string): Promise<MessStaff[]> {
    return prisma.messStaff.findMany({
      where: { messId, isActive: true },
      orderBy: { position: 'asc' },
    });
  }

  async getByPosition(messId: string, position: string): Promise<MessStaff[]> {
    return prisma.messStaff.findMany({
      where: { messId, position, isActive: true },
    });
  }

  async addCertification(staffId: string, certification: string): Promise<MessStaff> {
    const staff = await prisma.messStaff.findUnique({ where: { id: staffId } });
    if (!staff) throw new Error('Staff not found');

    const updatedCertifications = [
      ...((staff.certifications as string[]) || []),
      certification,
    ];

    return prisma.messStaff.update({
      where: { id: staffId },
      data: { certifications: updatedCertifications },
      include: { mess: true },
    });
  }

  async recordTraining(staffId: string, training: string): Promise<MessStaff> {
    const staff = await prisma.messStaff.findUnique({ where: { id: staffId } });
    if (!staff) throw new Error('Staff not found');

    const updatedTrainings = [...((staff.trainingsCompleted as string[]) || []), training];

    return prisma.messStaff.update({
      where: { id: staffId },
      data: { trainingsCompleted: updatedTrainings },
      include: { mess: true },
    });
  }

  async deactivateStaff(staffId: string, dateOfLeaving: Date): Promise<MessStaff> {
    return prisma.messStaff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        dateOfLeaving,
      },
      include: { mess: true },
    });
  }

  async getStaffStats(messId: string): Promise<{
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    byPosition: Record<string, number>;
  }> {
    const [totalStaff, activeStaff, inactiveStaff] = await Promise.all([
      prisma.messStaff.count({ where: { messId } }),
      prisma.messStaff.count({ where: { messId, isActive: true } }),
      prisma.messStaff.count({ where: { messId, isActive: false } }),
    ]);

    const staffByPosition = await prisma.messStaff.groupBy({
      by: ['position'],
      where: { messId, isActive: true },
      _count: true,
    });

    const byPosition: Record<string, number> = {};
    staffByPosition.forEach(item => {
      byPosition[item.position] = item._count;
    });

    return {
      totalStaff,
      activeStaff,
      inactiveStaff,
      byPosition,
    };
  }
}

export const messStaffService = new MessStaffService();
