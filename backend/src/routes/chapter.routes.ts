import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { chapterController, passageController } from '../controllers/chapter.controller';

const router = Router();

router.use(authenticate);

// ==================== CHAPTER ROUTES ====================

// GET /chapters - Get all chapters (optional filter by subjectId query param)
router.get('/', chapterController.getAllChapters);

// GET /chapters/subject/:subjectId - Get chapters by subject
router.get('/subject/:subjectId', chapterController.getChaptersBySubject);

// GET /chapters/subject/:subjectId/stats - Get chapter stats
router.get('/subject/:subjectId/stats', chapterController.getChapterStats);

// POST /chapters - Create chapter
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  chapterController.createChapter
);

// POST /chapters/bulk - Bulk create chapters
router.post(
  '/bulk',
  authorize('ADMIN', 'SUPER_ADMIN'),
  chapterController.bulkCreateChapters
);

// GET /chapters/:id - Get chapter by ID
router.get('/:id', chapterController.getChapterById);

// PUT /chapters/:id - Update chapter
router.put(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  chapterController.updateChapter
);

// DELETE /chapters/:id - Delete chapter
router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  chapterController.deleteChapter
);

// ==================== PASSAGE ROUTES ====================

// GET /chapters/passages - Get passages
router.get('/passages/list', passageController.getPassages);

// POST /chapters/passages - Create passage
router.post(
  '/passages',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  passageController.createPassage
);

// GET /chapters/passages/:id - Get passage by ID
router.get('/passages/:id', passageController.getPassageById);

// PUT /chapters/passages/:id - Update passage
router.put(
  '/passages/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  passageController.updatePassage
);

// DELETE /chapters/passages/:id - Delete passage
router.delete(
  '/passages/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  passageController.deletePassage
);

export default router;
