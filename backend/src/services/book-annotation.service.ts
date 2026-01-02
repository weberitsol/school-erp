import { PrismaClient, AnnotationType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAnnotationDto {
  bookId: string;
  userId: string;
  pageNumber: number;
  annotationType: AnnotationType;
  // Highlight
  selectedText?: string;
  textRanges?: any;
  highlightColor?: string;
  // Note
  noteContent?: string;
  notePosition?: any;
  // Drawing
  drawingPaths?: any;
  strokeColor?: string;
  strokeWidth?: number;
  // Shape
  shapeType?: string;
  shapeData?: any;
  fillColor?: string;
  // Stamp
  stampType?: string;
  // Canvas
  canvasState?: any;
  // Visibility
  isPrivate?: boolean;
  isShared?: boolean;
}

export interface UpdateAnnotationDto {
  selectedText?: string;
  textRanges?: any;
  highlightColor?: string;
  noteContent?: string;
  notePosition?: any;
  drawingPaths?: any;
  strokeColor?: string;
  strokeWidth?: number;
  shapeType?: string;
  shapeData?: any;
  fillColor?: string;
  stampType?: string;
  canvasState?: any;
  isPrivate?: boolean;
  isShared?: boolean;
}

class BookAnnotationService {
  // Create a new annotation
  async create(data: CreateAnnotationDto) {
    return prisma.bookAnnotation.create({
      data: {
        bookId: data.bookId,
        userId: data.userId,
        pageNumber: data.pageNumber,
        annotationType: data.annotationType,
        selectedText: data.selectedText,
        textRanges: data.textRanges,
        highlightColor: data.highlightColor,
        noteContent: data.noteContent,
        notePosition: data.notePosition,
        drawingPaths: data.drawingPaths,
        strokeColor: data.strokeColor,
        strokeWidth: data.strokeWidth,
        shapeType: data.shapeType,
        shapeData: data.shapeData,
        fillColor: data.fillColor,
        stampType: data.stampType,
        canvasState: data.canvasState,
        isPrivate: data.isPrivate ?? true,
        isShared: data.isShared ?? false,
      },
    });
  }

  // Get all annotations for a user on a book
  async getBookAnnotations(bookId: string, userId: string) {
    return prisma.bookAnnotation.findMany({
      where: {
        bookId,
        userId,
      },
      orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Get annotations for a specific page
  async getPageAnnotations(bookId: string, userId: string, pageNumber: number) {
    return prisma.bookAnnotation.findMany({
      where: {
        bookId,
        pageNumber,
        OR: [
          { userId }, // User's own annotations
          { isShared: true }, // Shared annotations
        ],
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Get shared annotations for a book (teacher shared)
  async getSharedAnnotations(bookId: string) {
    return prisma.bookAnnotation.findMany({
      where: {
        bookId,
        isShared: true,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
      orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Update an annotation
  async update(id: string, userId: string, data: UpdateAnnotationDto) {
    // Verify ownership
    const annotation = await prisma.bookAnnotation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!annotation || annotation.userId !== userId) {
      throw new Error('Annotation not found or access denied');
    }

    return prisma.bookAnnotation.update({
      where: { id },
      data: {
        ...(data.selectedText !== undefined && { selectedText: data.selectedText }),
        ...(data.textRanges !== undefined && { textRanges: data.textRanges }),
        ...(data.highlightColor !== undefined && { highlightColor: data.highlightColor }),
        ...(data.noteContent !== undefined && { noteContent: data.noteContent }),
        ...(data.notePosition !== undefined && { notePosition: data.notePosition }),
        ...(data.drawingPaths !== undefined && { drawingPaths: data.drawingPaths }),
        ...(data.strokeColor !== undefined && { strokeColor: data.strokeColor }),
        ...(data.strokeWidth !== undefined && { strokeWidth: data.strokeWidth }),
        ...(data.shapeType !== undefined && { shapeType: data.shapeType }),
        ...(data.shapeData !== undefined && { shapeData: data.shapeData }),
        ...(data.fillColor !== undefined && { fillColor: data.fillColor }),
        ...(data.stampType !== undefined && { stampType: data.stampType }),
        ...(data.canvasState !== undefined && { canvasState: data.canvasState }),
        ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
        ...(data.isShared !== undefined && { isShared: data.isShared }),
      },
    });
  }

  // Delete an annotation
  async delete(id: string, userId: string) {
    // Verify ownership
    const annotation = await prisma.bookAnnotation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!annotation || annotation.userId !== userId) {
      throw new Error('Annotation not found or access denied');
    }

    return prisma.bookAnnotation.delete({ where: { id } });
  }

  // Save full canvas state for a page
  async saveCanvasState(
    bookId: string,
    userId: string,
    pageNumber: number,
    canvasState: any
  ) {
    // Check if canvas annotation exists for this page
    const existing = await prisma.bookAnnotation.findFirst({
      where: {
        bookId,
        userId,
        pageNumber,
        annotationType: 'FREEHAND', // Canvas annotations stored as FREEHAND type
        canvasState: { not: Prisma.JsonNull },
      },
    });

    if (existing) {
      // Update existing
      return prisma.bookAnnotation.update({
        where: { id: existing.id },
        data: { canvasState },
      });
    } else {
      // Create new
      return prisma.bookAnnotation.create({
        data: {
          bookId,
          userId,
          pageNumber,
          annotationType: 'FREEHAND',
          canvasState,
          isPrivate: true,
        },
      });
    }
  }

  // Get canvas state for a page
  async getCanvasState(bookId: string, userId: string, pageNumber: number) {
    const annotation = await prisma.bookAnnotation.findFirst({
      where: {
        bookId,
        userId,
        pageNumber,
        canvasState: { not: Prisma.JsonNull },
      },
    });

    return annotation?.canvasState || null;
  }

  // Get all highlights for a book
  async getHighlights(bookId: string, userId: string) {
    return prisma.bookAnnotation.findMany({
      where: {
        bookId,
        userId,
        annotationType: 'HIGHLIGHT',
      },
      select: {
        id: true,
        pageNumber: true,
        selectedText: true,
        highlightColor: true,
        textRanges: true,
        createdAt: true,
      },
      orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Get all notes for a book
  async getNotes(bookId: string, userId: string) {
    return prisma.bookAnnotation.findMany({
      where: {
        bookId,
        userId,
        annotationType: 'NOTE',
      },
      select: {
        id: true,
        pageNumber: true,
        noteContent: true,
        notePosition: true,
        createdAt: true,
      },
      orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Get all bookmarks for a book
  async getBookmarks(bookId: string, userId: string) {
    return prisma.bookAnnotation.findMany({
      where: {
        bookId,
        userId,
        annotationType: 'BOOKMARK',
      },
      select: {
        id: true,
        pageNumber: true,
        noteContent: true,
        createdAt: true,
      },
      orderBy: { pageNumber: 'asc' },
    });
  }

  // Add a bookmark
  async addBookmark(bookId: string, userId: string, pageNumber: number, label?: string) {
    // Check if bookmark already exists
    const existing = await prisma.bookAnnotation.findFirst({
      where: {
        bookId,
        userId,
        pageNumber,
        annotationType: 'BOOKMARK',
      },
    });

    if (existing) {
      // Update label
      return prisma.bookAnnotation.update({
        where: { id: existing.id },
        data: { noteContent: label },
      });
    }

    return prisma.bookAnnotation.create({
      data: {
        bookId,
        userId,
        pageNumber,
        annotationType: 'BOOKMARK',
        noteContent: label,
        isPrivate: true,
      },
    });
  }

  // Remove a bookmark
  async removeBookmark(bookId: string, userId: string, pageNumber: number) {
    const bookmark = await prisma.bookAnnotation.findFirst({
      where: {
        bookId,
        userId,
        pageNumber,
        annotationType: 'BOOKMARK',
      },
    });

    if (bookmark) {
      return prisma.bookAnnotation.delete({ where: { id: bookmark.id } });
    }

    return null;
  }

  // Delete all annotations for a book by a user
  async deleteAllForBook(bookId: string, userId: string) {
    return prisma.bookAnnotation.deleteMany({
      where: { bookId, userId },
    });
  }

  // Get annotation count for a book
  async getAnnotationCount(bookId: string, userId: string) {
    const counts = await prisma.bookAnnotation.groupBy({
      by: ['annotationType'],
      where: { bookId, userId },
      _count: true,
    });

    const result: Record<string, number> = {};
    counts.forEach((c) => {
      result[c.annotationType] = c._count;
    });

    return result;
  }

  // Copy annotations from one user to another (for sharing)
  async copyAnnotations(
    bookId: string,
    fromUserId: string,
    toUserId: string,
    pageNumbers?: number[]
  ) {
    const where: Prisma.BookAnnotationWhereInput = {
      bookId,
      userId: fromUserId,
      ...(pageNumbers && pageNumbers.length > 0 && { pageNumber: { in: pageNumbers } }),
    };

    const annotations = await prisma.bookAnnotation.findMany({ where });

    const newAnnotations = annotations.map((ann) => ({
      bookId: ann.bookId,
      userId: toUserId,
      pageNumber: ann.pageNumber,
      annotationType: ann.annotationType,
      selectedText: ann.selectedText,
      textRanges: ann.textRanges === null ? Prisma.JsonNull : ann.textRanges,
      highlightColor: ann.highlightColor,
      noteContent: ann.noteContent,
      notePosition: ann.notePosition === null ? Prisma.JsonNull : ann.notePosition,
      drawingPaths: ann.drawingPaths === null ? Prisma.JsonNull : ann.drawingPaths,
      strokeColor: ann.strokeColor,
      strokeWidth: ann.strokeWidth,
      shapeType: ann.shapeType,
      shapeData: ann.shapeData === null ? Prisma.JsonNull : ann.shapeData,
      fillColor: ann.fillColor,
      stampType: ann.stampType,
      canvasState: ann.canvasState === null ? Prisma.JsonNull : ann.canvasState,
      isPrivate: true,
      isShared: false,
    }));

    return prisma.bookAnnotation.createMany({ data: newAnnotations as Prisma.BookAnnotationCreateManyInput[] });
  }
}

export const bookAnnotationService = new BookAnnotationService();
