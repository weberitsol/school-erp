import { Request, Response, NextFunction } from 'express';
import { documentService, DocumentFilters } from '../services/document.service';
import { DocumentStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    schoolId: string;
  };
  file?: Express.Multer.File;
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const documentController = {
  // Upload document
  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const { subjectId, classId, chapter, language } = req.body;

      const document = await documentService.createDocument({
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        storagePath: req.file.path,
        subjectId,
        classId,
        chapter,
        language,
        uploadedById: req.user!.id,
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all documents
  async getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { subjectId, classId, status, search, page, limit } = req.query;

      const filters: DocumentFilters = {
        subjectId: subjectId as string,
        classId: classId as string,
        status: status as DocumentStatus,
        search: search as string,
        // Teachers can only see their own documents
        ...(req.user?.role === 'TEACHER' && { uploadedById: req.user.id }),
      };

      const pagination = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      };

      const result = await documentService.getDocuments(filters, pagination);

      res.json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get document by ID
  async getDocumentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  },

  // Process document (trigger AI extraction)
  async processDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const document = await documentService.getDocumentById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      if (document.status === 'PROCESSING') {
        return res.status(400).json({
          success: false,
          error: 'Document is already being processed',
        });
      }

      const result = await documentService.processDocument(id);

      res.json({
        success: true,
        message: 'Document processing started',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Add extracted questions (called by AI processing job or manual)
  async addExtractedQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { questions } = req.body;

      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          error: 'Questions array is required',
        });
      }

      const createdQuestions = await documentService.addExtractedQuestions(
        id,
        questions,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        message: `${createdQuestions.length} questions extracted successfully`,
        data: { count: createdQuestions.length },
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete document
  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const document = await documentService.getDocumentById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }

      // Only allow deletion by uploader or admin
      if (
        req.user?.role !== 'ADMIN' &&
        req.user?.role !== 'SUPER_ADMIN' &&
        document.uploadedById !== req.user?.id
      ) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this document',
        });
      }

      await documentService.deleteDocument(id);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get processing stats
  async getProcessingStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId =
        req.user?.role === 'TEACHER' ? req.user.id : undefined;

      const stats = await documentService.getProcessingStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};
