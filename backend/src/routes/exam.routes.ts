import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { examController } from '../controllers/exam.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /exams - List all exams
router.get('/', examController.getAllExams);

// GET /exams/stats - Get exam statistics
router.get('/stats', examController.getStats);

// GET /exams/student/:studentId/results - Get student exam results
router.get('/student/:studentId/results', examController.getStudentResults);

// POST /exams - Create new exam
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.createExam);

// GET /exams/:id - Get exam by ID
router.get('/:id', examController.getExam);

// PUT /exams/:id - Update exam
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.updateExam);

// DELETE /exams/:id - Delete exam
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.deleteExam);

// POST /exams/:id/results - Enter exam results
router.post('/:id/results', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), examController.enterResults);

// GET /exams/:id/results - Get exam results
router.get('/:id/results', examController.getResults);

// POST /exams/:id/publish - Publish exam results
router.post('/:id/publish', authorize('ADMIN', 'SUPER_ADMIN'), examController.publishResults);

export default router;
