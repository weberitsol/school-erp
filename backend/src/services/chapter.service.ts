import { PrismaClient, Prisma, QuestionSource } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateChapterDto {
  name: string;
  chapterNumber: number;
  description?: string;
  subjectId: string;
  classLevel?: string;
  ncertBook?: string;
  pageRange?: string;
}

export interface UpdateChapterDto {
  name?: string;
  description?: string;
  ncertBook?: string;
  pageRange?: string;
  isActive?: boolean;
}

export interface CreatePassageDto {
  title: string;
  passageText: string;
  passageHtml?: string;
  passageImage?: string;
  subjectId: string;
  chapterId?: string;
  source?: string;
  createdById: string;
}

class ChapterService {
  // Create chapter
  async createChapter(data: CreateChapterDto) {
    return prisma.chapter.create({
      data: {
        name: data.name,
        chapterNumber: data.chapterNumber,
        description: data.description,
        subjectId: data.subjectId,
        classLevel: data.classLevel,
        ncertBook: data.ncertBook,
        pageRange: data.pageRange,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  // Bulk create chapters
  async bulkCreateChapters(chapters: CreateChapterDto[]) {
    const results = {
      success: [] as string[],
      failed: [] as { name: string; error: string }[],
    };

    for (const chapter of chapters) {
      try {
        const created = await this.createChapter(chapter);
        results.success.push(created.id);
      } catch (error: any) {
        // If duplicate, skip
        if (error.code === 'P2002') {
          results.failed.push({ name: chapter.name, error: 'Already exists' });
        } else {
          results.failed.push({ name: chapter.name, error: error.message });
        }
      }
    }

    return results;
  }

  // Get all chapters
  async getAllChapters() {
    return prisma.chapter.findMany({
      where: { isActive: true },
      orderBy: [{ subjectId: 'asc' }, { chapterNumber: 'asc' }],
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { questions: true, comprehensionPassages: true } },
      },
    });
  }

  // Get chapters by subject
  async getChaptersBySubject(subjectId: string, classLevel?: string) {
    const where: Prisma.ChapterWhereInput = {
      subjectId,
      isActive: true,
      ...(classLevel && { classLevel }),
    };

    return prisma.chapter.findMany({
      where,
      orderBy: { chapterNumber: 'asc' },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { questions: true, comprehensionPassages: true } },
      },
    });
  }

  // Get chapter by ID
  async getChapterById(id: string) {
    return prisma.chapter.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { questions: true, comprehensionPassages: true } },
      },
    });
  }

  // Update chapter
  async updateChapter(id: string, data: UpdateChapterDto) {
    return prisma.chapter.update({
      where: { id },
      data,
    });
  }

  // Delete chapter (soft)
  async deleteChapter(id: string) {
    return prisma.chapter.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Get chapter stats
  async getChapterStats(subjectId: string) {
    const chapters = await prisma.chapter.findMany({
      where: { subjectId, isActive: true },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { chapterNumber: 'asc' },
    });

    const totalQuestions = chapters.reduce((sum, ch) => sum + ch._count.questions, 0);

    return {
      totalChapters: chapters.length,
      totalQuestions,
      chapters: chapters.map((ch) => ({
        id: ch.id,
        name: ch.name,
        chapterNumber: ch.chapterNumber,
        questionCount: ch._count.questions,
      })),
    };
  }
}

class PassageService {
  // Create passage
  async createPassage(data: CreatePassageDto) {
    return prisma.comprehensionPassage.create({
      data: {
        title: data.title,
        passageText: data.passageText,
        passageHtml: data.passageHtml,
        passageImage: data.passageImage,
        subjectId: data.subjectId,
        chapterId: data.chapterId,
        source: (data.source as any) || 'MANUAL',
        createdById: data.createdById,
      },
      include: {
        chapter: { select: { id: true, name: true, chapterNumber: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  // Get passages by subject/chapter
  async getPassages(filters: { subjectId?: string; chapterId?: string } = {}) {
    const { subjectId, chapterId } = filters;

    const where: Prisma.ComprehensionPassageWhereInput = {
      isActive: true,
      ...(subjectId && { subjectId }),
      ...(chapterId && { chapterId }),
    };

    return prisma.comprehensionPassage.findMany({
      where,
      include: {
        chapter: { select: { id: true, name: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get passage by ID with questions
  async getPassageById(id: string) {
    return prisma.comprehensionPassage.findUnique({
      where: { id },
      include: {
        chapter: { select: { id: true, name: true, chapterNumber: true } },
        questions: {
          where: { isActive: true },
          orderBy: { passageQuestionNumber: 'asc' },
          select: {
            id: true,
            questionText: true,
            questionType: true,
            options: true,
            marks: true,
            passageQuestionNumber: true,
          },
        },
      },
    });
  }

  // Update passage
  async updatePassage(
    id: string,
    data: Partial<Omit<CreatePassageDto, 'createdById'>>
  ) {
    const { chapterId, source, ...updateData } = data;
    return prisma.comprehensionPassage.update({
      where: { id },
      data: {
        ...updateData,
        ...(source && { source: source as QuestionSource }),
        ...(chapterId && { chapter: { connect: { id: chapterId } } }),
      },
    });
  }

  // Delete passage (soft)
  async deletePassage(id: string) {
    return prisma.comprehensionPassage.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const chapterService = new ChapterService();
export const passageService = new PassageService();
