import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as practiceController from '../controllers/practice.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Book Practice Listing ====================

// GET /practice - Get all books with practice available for student
router.get('/', practiceController.getBooksWithPractice);

// GET /practice/book/:bookId/stats - Get practice stats for a book
router.get('/book/:bookId/stats', practiceController.getBookPracticeStats);

// ==================== Session Management ====================

// POST /practice/session/start - Start a new practice session
router.post('/session/start', practiceController.startSession);

// GET /practice/session/:sessionId - Get session details with questions
router.get('/session/:sessionId', practiceController.getSession);

// POST /practice/session/:sessionId/complete - Complete a session (Test Mode)
router.post('/session/:sessionId/complete', practiceController.completeSession);

// ==================== Question Operations ====================

// GET /practice/book/:bookId/next - Get next unattempted question (Reading Mode)
router.get('/book/:bookId/next', practiceController.getNextQuestion);

// POST /practice/answer - Submit an answer
router.post('/answer', practiceController.answerQuestion);

// ==================== Progress ====================

// GET /practice/book/:bookId/progress - Get student's progress on a book
router.get('/book/:bookId/progress', practiceController.getProgress);

// GET /practice/history - Get all practice sessions for student
router.get('/history', practiceController.getHistory);

// ==================== Admin: Question Generation ====================

// POST /practice/book/:bookId/generate - Generate new questions (Admin/Teacher)
router.post(
  '/book/:bookId/generate',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  practiceController.generateQuestions
);

// GET /practice/book/:bookId/questions - List all questions for a book (Admin/Teacher)
router.get(
  '/book/:bookId/questions',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  practiceController.listQuestions
);

export default router;
