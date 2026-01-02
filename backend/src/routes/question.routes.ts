import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { questionController } from '../controllers/question.controller';

const router = Router();

router.use(authenticate);

// GET /questions - Get all questions
router.get(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.getQuestions
);

// GET /questions/stats - Get question statistics
router.get(
  '/stats',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.getQuestionStats
);

// POST /questions - Create question
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.createQuestion
);

// POST /questions/bulk - Bulk create questions
router.post(
  '/bulk',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.bulkCreateQuestions
);

// POST /questions/random - Get random questions for test
router.post(
  '/random',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.getRandomQuestions
);

// POST /questions/alternatives - Get alternative questions for replacement
router.post(
  '/alternatives',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.getAlternatives
);

// GET /questions/subject/:subjectId/chapters - Get chapters and topics
router.get(
  '/subject/:subjectId/chapters',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.getChaptersAndTopics
);

// GET /questions/:id - Get question by ID
router.get(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.getQuestionById
);

// PUT /questions/:id - Update question
router.put(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.updateQuestion
);

// PATCH /questions/:id - Partial update question (difficulty, subTopic, etc.)
router.patch(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.patchQuestion
);

// PATCH /questions/:id/verify - Verify question
router.patch(
  '/:id/verify',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.verifyQuestion
);

// DELETE /questions/:id - Delete question
router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  questionController.deleteQuestion
);

export default router;
