import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as wordGenController from '../controllers/word-generation.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/word-generation/question-paper
 * Generate a question paper
 * Body: { testId, title?, instructions?, columnLayout, includeAnswers? }
 */
router.post(
  '/question-paper',
  authorize('ADMIN', 'TEACHER'),
  wordGenController.generateQuestionPaper
);

/**
 * POST /api/v1/word-generation/report-card
 * Generate a student report card
 * Body: { studentId, termId, columnLayout? }
 */
router.post(
  '/report-card',
  authorize('ADMIN', 'TEACHER'),
  wordGenController.generateReportCard
);

/**
 * POST /api/v1/word-generation/certificate
 * Generate a certificate
 * Body: { studentId, certificateType, achievement?, date? }
 */
router.post(
  '/certificate',
  authorize('ADMIN', 'TEACHER'),
  wordGenController.generateCertificate
);

/**
 * POST /api/v1/word-generation/study-material
 * Generate study material
 * Body: { chapterId, includeQuestions?, columnLayout? }
 */
router.post(
  '/study-material',
  authorize('ADMIN', 'TEACHER'),
  wordGenController.generateStudyMaterial
);

/**
 * POST /api/v1/word-generation/question-bank-export
 * Export question bank
 * Body: { subjectId, classId, chapterId?, columnLayout? }
 */
router.post(
  '/question-bank-export',
  authorize('ADMIN', 'TEACHER'),
  wordGenController.exportQuestionBank
);

/**
 * GET /api/v1/word-generation/generated-documents
 * List generated documents
 * Query: { fileType?, page?, limit? }
 */
router.get(
  '/generated-documents',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  wordGenController.listGeneratedDocuments
);

/**
 * GET /api/v1/word-generation/generated-documents/:id/download
 * Download a generated document
 */
router.get(
  '/generated-documents/:id/download',
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  wordGenController.downloadGeneratedDocument
);

/**
 * DELETE /api/v1/word-generation/generated-documents/:id
 * Delete a generated document
 */
router.delete(
  '/generated-documents/:id',
  authorize('ADMIN', 'TEACHER'),
  wordGenController.deleteGeneratedDocument
);

export default router;
