import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface GrantAccessDto {
  bookId: string;
  classId: string;
  sectionId?: string;
  academicYearId?: string;
  canDownload?: boolean;
  canAnnotate?: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
  createdById: string;
}

export interface UpdateAccessDto {
  canDownload?: boolean;
  canAnnotate?: boolean;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
}

class BookAccessService {
  // Grant access to a batch
  async grantAccess(data: GrantAccessDto) {
    return prisma.bookAccess.create({
      data: {
        bookId: data.bookId,
        classId: data.classId,
        sectionId: data.sectionId,
        academicYearId: data.academicYearId,
        canDownload: data.canDownload ?? true,
        canAnnotate: data.canAnnotate ?? true,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
        createdById: data.createdById,
      },
      include: {
        book: { select: { id: true, title: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });
  }

  // Get access rules for a book
  async getBookAccess(bookId: string) {
    return prisma.bookAccess.findMany({
      where: { bookId },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { section: { name: 'asc' } }],
    });
  }

  // Update access rule
  async updateAccess(id: string, data: UpdateAccessDto) {
    return prisma.bookAccess.update({
      where: { id },
      data: {
        ...(data.canDownload !== undefined && { canDownload: data.canDownload }),
        ...(data.canAnnotate !== undefined && { canAnnotate: data.canAnnotate }),
        ...(data.availableFrom !== undefined && { availableFrom: data.availableFrom }),
        ...(data.availableUntil !== undefined && { availableUntil: data.availableUntil }),
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  // Revoke access
  async revokeAccess(id: string) {
    return prisma.bookAccess.delete({ where: { id } });
  }

  // Check if student has access to a book
  async checkStudentAccess(bookId: string, studentId: string): Promise<{
    hasAccess: boolean;
    canDownload: boolean;
    canAnnotate: boolean;
  }> {
    // Get student's class and section
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { currentClassId: true, currentSectionId: true },
    });

    if (!student?.currentClassId) {
      return { hasAccess: false, canDownload: false, canAnnotate: false };
    }

    const now = new Date();

    // Check if book has access rule for student's batch
    const access = await prisma.bookAccess.findFirst({
      where: {
        bookId,
        classId: student.currentClassId,
        OR: [
          { sectionId: null }, // All sections
          { sectionId: student.currentSectionId }, // Specific section
        ],
        AND: [
          {
            OR: [
              { availableFrom: null },
              { availableFrom: { lte: now } },
            ],
          },
          {
            OR: [
              { availableUntil: null },
              { availableUntil: { gte: now } },
            ],
          },
        ],
      },
    });

    if (!access) {
      return { hasAccess: false, canDownload: false, canAnnotate: false };
    }

    return {
      hasAccess: true,
      canDownload: access.canDownload,
      canAnnotate: access.canAnnotate,
    };
  }

  // Grant access to multiple books for a batch
  async bulkGrantAccess(
    bookIds: string[],
    classId: string,
    sectionId: string | null,
    createdById: string,
    options?: {
      canDownload?: boolean;
      canAnnotate?: boolean;
      availableFrom?: Date;
      availableUntil?: Date;
    }
  ) {
    const data = bookIds.map((bookId) => ({
      bookId,
      classId,
      sectionId,
      canDownload: options?.canDownload ?? true,
      canAnnotate: options?.canAnnotate ?? true,
      availableFrom: options?.availableFrom,
      availableUntil: options?.availableUntil,
      createdById,
    }));

    // Use createMany with skipDuplicates to avoid errors on existing access
    return prisma.bookAccess.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Revoke all access for a book
  async revokeAllAccess(bookId: string) {
    return prisma.bookAccess.deleteMany({ where: { bookId } });
  }

  // Get all books accessible by a class/section
  async getBooksForBatch(classId: string, sectionId?: string) {
    const now = new Date();

    return prisma.bookAccess.findMany({
      where: {
        classId,
        OR: sectionId
          ? [{ sectionId: null }, { sectionId }]
          : [{ sectionId: null }],
        AND: [
          {
            OR: [
              { availableFrom: null },
              { availableFrom: { lte: now } },
            ],
          },
          {
            OR: [
              { availableUntil: null },
              { availableUntil: { gte: now } },
            ],
          },
        ],
        book: {
          isActive: true,
          status: 'PUBLISHED',
        },
      },
      include: {
        book: {
          include: {
            category: { select: { id: true, name: true, boardType: true } },
            subject: { select: { id: true, name: true } },
          },
        },
      },
    });
  }
}

export const bookAccessService = new BookAccessService();
