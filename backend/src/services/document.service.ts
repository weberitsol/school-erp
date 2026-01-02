import { PrismaClient, DocumentStatus, QuestionType, DifficultyLevel, QuestionSource, Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export interface UploadDocumentDto {
  originalName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  subjectId?: string;
  classId?: string;
  chapter?: string;
  language?: string;
  uploadedById: string;
}

export interface ExtractedQuestion {
  questionText: string;
  questionHtml?: string;
  questionType: QuestionType;
  difficulty?: DifficultyLevel;
  marks?: number;
  options?: any; // JSON for MCQ options
  correctAnswer?: string;
  answerExplanation?: string;
  chapter?: string;
  topic?: string;
  tags?: string[];
  sourcePage?: number;
  confidence?: number;
}

export interface DocumentFilters {
  subjectId?: string;
  classId?: string;
  status?: DocumentStatus;
  uploadedById?: string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class DocumentService {
  // Upload document record
  async createDocument(data: UploadDocumentDto) {
    const document = await prisma.uploadedDocument.create({
      data: {
        originalName: data.originalName,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        storagePath: data.storagePath,
        subjectId: data.subjectId,
        classId: data.classId,
        chapter: data.chapter,
        language: data.language || 'en',
        uploadedById: data.uploadedById,
        status: 'UPLOADED',
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        class: {
          select: { id: true, name: true, code: true },
        },
        uploadedBy: {
          select: { id: true, email: true },
        },
      },
    });

    return document;
  }

  // Get all documents
  async getDocuments(filters: DocumentFilters = {}, pagination: PaginationOptions = {}) {
    const { subjectId, classId, status, uploadedById, search } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const skip = (page - 1) * limit;

    const where: Prisma.UploadedDocumentWhereInput = {
      ...(subjectId && { subjectId }),
      ...(classId && { classId }),
      ...(status && { status }),
      ...(uploadedById && { uploadedById }),
      ...(search && {
        OR: [
          { originalName: { contains: search, mode: 'insensitive' } },
          { chapter: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [documents, total] = await Promise.all([
      prisma.uploadedDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, code: true } },
          uploadedBy: { select: { id: true, email: true } },
          _count: { select: { questions: true } },
        },
      }),
      prisma.uploadedDocument.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get document by ID
  async getDocumentById(id: string) {
    return prisma.uploadedDocument.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, email: true } },
        questions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            questionText: true,
            questionType: true,
            difficulty: true,
            marks: true,
            isVerified: true,
          },
        },
      },
    });
  }

  // Update document status
  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    error?: string
  ) {
    const updateData: any = { status };

    if (status === 'PROCESSING') {
      updateData.processingStartedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.processingCompletedAt = new Date();
    } else if (status === 'FAILED') {
      updateData.processingError = error;
    }

    return prisma.uploadedDocument.update({
      where: { id },
      data: updateData,
    });
  }

  // Start processing document (simulated - would call AI service in production)
  async processDocument(documentId: string) {
    // Update status to processing
    await this.updateDocumentStatus(documentId, 'PROCESSING');

    try {
      // In production, this would:
      // 1. Read the file from storage
      // 2. Send to OCR/AI service for text extraction
      // 3. Use LLM to identify and extract questions
      // 4. Store extracted questions

      // For demo, simulate processing delay
      // In real implementation, this would be an async job

      return {
        success: true,
        message: 'Document queued for processing',
        documentId,
      };
    } catch (error: any) {
      await this.updateDocumentStatus(documentId, 'FAILED', error.message);
      throw error;
    }
  }

  // Add extracted questions from document
  async addExtractedQuestions(
    documentId: string,
    questions: ExtractedQuestion[],
    createdById: string
  ) {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id: documentId },
      select: { subjectId: true, classId: true, chapter: true },
    });

    if (!document || !document.subjectId || !document.classId) {
      throw new Error('Document not found or missing subject/class');
    }

    const createdQuestions = [];

    for (const q of questions) {
      const question = await prisma.question.create({
        data: {
          questionText: q.questionText,
          questionHtml: q.questionHtml,
          questionType: q.questionType,
          difficulty: q.difficulty || 'MEDIUM',
          marks: q.marks || 1,
          options: q.options,
          correctAnswer: q.correctAnswer,
          answerExplanation: q.answerExplanation,
          subjectId: document.subjectId,
          classId: document.classId,
          chapter: q.chapter || document.chapter,
          topic: q.topic,
          tags: q.tags || [],
          source: 'EXTRACTED',
          sourceDocumentId: documentId,
          sourcePage: q.sourcePage,
          confidence: q.confidence,
          createdById,
        },
      });
      createdQuestions.push(question);
    }

    // Update document stats
    await prisma.uploadedDocument.update({
      where: { id: documentId },
      data: {
        questionsExtracted: { increment: createdQuestions.length },
        status: 'COMPLETED',
        processingCompletedAt: new Date(),
      },
    });

    return createdQuestions;
  }

  // Delete document
  async deleteDocument(id: string) {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id },
      select: { storagePath: true },
    });

    if (document?.storagePath) {
      // Delete file from storage
      try {
        fs.unlinkSync(document.storagePath);
      } catch (e) {
        console.error('Failed to delete file:', e);
      }
    }

    // Delete document record (cascade deletes questions)
    await prisma.uploadedDocument.delete({ where: { id } });

    return { success: true };
  }

  // Get processing stats
  async getProcessingStats(userId?: string) {
    const where = userId ? { uploadedById: userId } : {};

    const [total, processing, completed, failed] = await Promise.all([
      prisma.uploadedDocument.count({ where }),
      prisma.uploadedDocument.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.uploadedDocument.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.uploadedDocument.count({ where: { ...where, status: 'FAILED' } }),
    ]);

    const totalQuestions = await prisma.question.count({
      where: { source: 'EXTRACTED' },
    });

    return {
      documents: { total, processing, completed, failed },
      totalQuestionsExtracted: totalQuestions,
    };
  }
}

export const documentService = new DocumentService();
