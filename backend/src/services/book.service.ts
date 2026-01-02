import { PrismaClient, BookStatus, BookSourceType, Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// ==================== DTOs ====================

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
  boardType?: string;
  classLevel?: string;
  subjectCode?: string;
  displayOrder?: number;
  iconName?: string;
  color?: string;
  schoolId: string;
}

export interface CreateBookDto {
  title: string;
  description?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  coverImage?: string;
  sourceType: BookSourceType;
  // Local file
  fileName?: string;
  originalName?: string;
  fileSize?: number;
  storagePath?: string;
  mimeType?: string;
  pageCount?: number;
  // External URL
  externalUrl?: string;
  externalProvider?: string;
  // Classification
  categoryId: string;
  chapterNumber?: number;
  classLevel?: string;
  subjectId?: string;
  // Metadata
  tags?: string[];
  language?: string;
  // School & uploader
  schoolId: string;
  uploadedById: string;
}

export interface UpdateBookDto {
  title?: string;
  description?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  coverImage?: string;
  categoryId?: string;
  chapterNumber?: number;
  classLevel?: string;
  subjectId?: string;
  tags?: string[];
  language?: string;
  status?: BookStatus;
}

export interface BookFilters {
  categoryId?: string;
  subjectId?: string;
  classLevel?: string;
  status?: BookStatus;
  search?: string;
  tags?: string[];
  schoolId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== Category Service ====================

class BookCategoryService {
  async create(data: CreateCategoryDto) {
    return prisma.bookCategory.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        boardType: data.boardType,
        classLevel: data.classLevel,
        subjectCode: data.subjectCode,
        displayOrder: data.displayOrder || 0,
        iconName: data.iconName,
        color: data.color,
        schoolId: data.schoolId,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { books: true, children: true } },
      },
    });
  }

  async getAll(schoolId: string) {
    return prisma.bookCategory.findMany({
      where: { schoolId, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                children: { where: { isActive: true } },
                _count: { select: { books: true } },
              },
            },
            _count: { select: { books: true } },
          },
        },
        _count: { select: { books: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getById(id: string) {
    return prisma.bookCategory.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        books: {
          where: { isActive: true, status: 'PUBLISHED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { books: true, children: true } },
      },
    });
  }

  async update(id: string, data: Partial<CreateCategoryDto>) {
    return prisma.bookCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        boardType: data.boardType,
        classLevel: data.classLevel,
        subjectCode: data.subjectCode,
        displayOrder: data.displayOrder,
        iconName: data.iconName,
        color: data.color,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { books: true, children: true } },
      },
    });
  }

  async delete(id: string) {
    // Soft delete
    return prisma.bookCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Get tree structure for specific board/class
  async getTree(schoolId: string, boardType?: string, classLevel?: string) {
    const where: Prisma.BookCategoryWhereInput = {
      schoolId,
      isActive: true,
      parentId: null, // Root categories only
      ...(boardType && { boardType }),
      ...(classLevel && { classLevel }),
    };

    return prisma.bookCategory.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                children: { where: { isActive: true } },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }
}

// ==================== Book Service ====================

class BookService {
  async create(data: CreateBookDto) {
    return prisma.book.create({
      data: {
        title: data.title,
        description: data.description,
        author: data.author,
        publisher: data.publisher,
        publicationYear: data.publicationYear,
        isbn: data.isbn,
        coverImage: data.coverImage,
        sourceType: data.sourceType,
        fileName: data.fileName,
        originalName: data.originalName,
        fileSize: data.fileSize,
        storagePath: data.storagePath,
        mimeType: data.mimeType,
        pageCount: data.pageCount,
        externalUrl: data.externalUrl,
        externalProvider: data.externalProvider,
        categoryId: data.categoryId,
        chapterNumber: data.chapterNumber,
        classLevel: data.classLevel,
        subjectId: data.subjectId,
        tags: data.tags || [],
        language: data.language || 'en',
        schoolId: data.schoolId,
        uploadedById: data.uploadedById,
        status: 'DRAFT',
      },
      include: {
        category: { select: { id: true, name: true, boardType: true } },
        subject: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, email: true } },
      },
    });
  }

  async getAll(filters: BookFilters = {}, pagination: PaginationOptions = {}) {
    const { categoryId, subjectId, classLevel, status, search, tags, schoolId } = filters;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = {
      isActive: true,
      ...(schoolId && { schoolId }),
      ...(categoryId && { categoryId }),
      ...(subjectId && { subjectId }),
      ...(classLevel && { classLevel }),
      ...(status && { status }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, boardType: true } },
          subject: { select: { id: true, name: true, code: true } },
          uploadedBy: { select: { id: true, email: true } },
          _count: { select: { bookAccess: true, bookQA: true, bookAnnotations: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    return prisma.book.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            boardType: true,
            classLevel: true,
            parent: { select: { id: true, name: true } },
          },
        },
        subject: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, email: true } },
        chapters: { orderBy: { chapterNumber: 'asc' } },
        bookAccess: {
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        },
        _count: { select: { bookQA: true, bookAnnotations: true } },
      },
    });
  }

  async update(id: string, data: UpdateBookDto) {
    return prisma.book.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.author !== undefined && { author: data.author }),
        ...(data.publisher !== undefined && { publisher: data.publisher }),
        ...(data.publicationYear !== undefined && { publicationYear: data.publicationYear }),
        ...(data.isbn !== undefined && { isbn: data.isbn }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.chapterNumber !== undefined && { chapterNumber: data.chapterNumber }),
        ...(data.classLevel !== undefined && { classLevel: data.classLevel }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.tags && { tags: data.tags }),
        ...(data.language && { language: data.language }),
        ...(data.status && { status: data.status }),
      },
      include: {
        category: { select: { id: true, name: true, boardType: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async delete(id: string) {
    // Get book to delete file if local
    const book = await prisma.book.findUnique({
      where: { id },
      select: { storagePath: true, sourceType: true },
    });

    // Delete file if local
    if (book?.sourceType === 'LOCAL_FILE' && book.storagePath) {
      try {
        fs.unlinkSync(book.storagePath);
      } catch (e) {
        console.error('Failed to delete book file:', e);
      }
    }

    // Soft delete
    return prisma.book.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async publish(id: string) {
    return prisma.book.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async archive(id: string) {
    return prisma.book.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async incrementViewCount(id: string) {
    return prisma.book.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementDownloadCount(id: string) {
    return prisma.book.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  // Get books available to a specific student based on access rules
  async getAvailableBooks(studentId: string, schoolId: string) {
    // Get student's class and section
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { currentClassId: true, currentSectionId: true },
    });

    if (!student?.currentClassId) {
      return [];
    }

    const now = new Date();

    // Find books with access for student's class/section
    const accessibleBooks = await prisma.bookAccess.findMany({
      where: {
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
        book: {
          isActive: true,
          status: 'PUBLISHED',
          schoolId,
        },
      },
      include: {
        book: {
          include: {
            category: { select: { id: true, name: true, boardType: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return accessibleBooks.map((access) => ({
      ...access.book,
      canDownload: access.canDownload,
      canAnnotate: access.canAnnotate,
    }));
  }

  // Update book chapters (Table of Contents)
  async updateChapters(bookId: string, chapters: { title: string; chapterNumber: number; startPage: number; endPage?: number; description?: string }[]) {
    // Delete existing chapters and create new ones
    await prisma.bookChapter.deleteMany({ where: { bookId } });

    return prisma.bookChapter.createMany({
      data: chapters.map((ch) => ({
        bookId,
        title: ch.title,
        chapterNumber: ch.chapterNumber,
        startPage: ch.startPage,
        endPage: ch.endPage,
        description: ch.description,
      })),
    });
  }

  // Update text content for AI indexing
  async updateTextContent(id: string, textContent: string) {
    return prisma.book.update({
      where: { id },
      data: {
        textContent,
        isIndexed: true,
        indexedAt: new Date(),
      },
    });
  }
}

export const bookCategoryService = new BookCategoryService();
export const bookService = new BookService();
