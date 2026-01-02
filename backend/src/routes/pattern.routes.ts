import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { patternController } from '../controllers/pattern.controller';

const router = Router();

router.use(authenticate);

// GET /patterns - Get all patterns
router.get('/', patternController.getPatterns);

// GET /patterns/defaults - Get default patterns (JEE/NEET)
router.get('/defaults', patternController.getDefaultPatterns);

// POST /patterns - Create pattern
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  patternController.createPattern
);

// POST /patterns/seed-defaults - Seed default patterns
router.post(
  '/seed-defaults',
  authorize('ADMIN', 'SUPER_ADMIN'),
  patternController.seedDefaults
);

// GET /patterns/:id - Get pattern by ID
router.get('/:id', patternController.getPatternById);

// PUT /patterns/:id - Update pattern
router.put(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  patternController.updatePattern
);

// POST /patterns/:id/clone - Clone pattern
router.post(
  '/:id/clone',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  patternController.clonePattern
);

// DELETE /patterns/:id - Delete pattern
router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  patternController.deletePattern
);

export default router;
