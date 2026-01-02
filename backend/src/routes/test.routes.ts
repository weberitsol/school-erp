import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { testController } from '../controllers/test.controller';

const router = Router();

router.use(authenticate);

// ==================== Static Routes (MUST come before parameterized routes) ====================

// GET /tests - Get all tests
router.get(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.getTests
);

// POST /tests - Create test
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.createTest
);

// POST /tests/start - Start test attempt
router.post('/start', testController.startTest);

// POST /tests/save-response - Save response (auto-save)
router.post('/save-response', testController.saveResponse);

// POST /tests/submit - Submit test
router.post('/submit', testController.submitTest);

// GET /tests/available/:studentId - Get available tests for student
router.get('/available/:studentId', testController.getAvailableTests);

// GET /tests/attempts/:id - Get attempt by ID
router.get('/attempts/:id', testController.getAttempt);

// GET /tests/student/:studentId/attempts - Get student's attempts
router.get('/student/:studentId/attempts', testController.getStudentAttempts);

// ==================== Parameterized Routes (/:id must come LAST) ====================

// GET /tests/:id - Get test by ID
router.get('/:id', testController.getTestById);

// GET /tests/:id/analytics - Get test analytics
router.get(
  '/:id/analytics',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.getTestAnalytics
);

// POST /tests/:id/publish - Publish test
router.post(
  '/:id/publish',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.publishTest
);

// POST /tests/:id/close - Close test
router.post(
  '/:id/close',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.closeTest
);

// POST /tests/:id/duplicate - Duplicate test with new name
router.post(
  '/:id/duplicate',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.duplicateTest
);

// POST /tests/:id/assign - Assign test to class/section
router.post(
  '/:id/assign',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.assignTest
);

// DELETE /tests/:id - Delete test (Admin only)
router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  testController.deleteTest
);

// ==================== Preview/Edit Question Routes ====================

// DELETE /tests/:id/questions/:questionId - Remove question from test
router.delete(
  '/:id/questions/:questionId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.removeQuestion
);

// PUT /tests/:id/questions/:questionId/replace - Replace question in test
router.put(
  '/:id/questions/:questionId/replace',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.replaceQuestion
);

// GET /tests/:id/export-template - Export test template for Excel
router.get(
  '/:id/export-template',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.exportTemplate
);

// POST /tests/:id/verify-answers - Verify answers with AI
router.post(
  '/:id/verify-answers',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.verifyAnswers
);

// POST /tests/:id/generate-explanations - Generate AI explanations
router.post(
  '/:id/generate-explanations',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  testController.generateExplanations
);

export default router;
