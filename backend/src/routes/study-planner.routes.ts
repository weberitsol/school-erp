import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as studyPlannerController from '../controllers/study-planner.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Subject & Chapter Selection ====================
// GET /api/v1/study-planner/subjects - Get subjects with chapters
router.get('/subjects', studyPlannerController.getSubjectsWithChapters);

// ==================== Diagnostic Test ====================
// POST /api/v1/study-planner/diagnostic - Start diagnostic test
router.post('/diagnostic', studyPlannerController.startDiagnostic);

// POST /api/v1/study-planner/diagnostic/submit - Submit diagnostic and get AI recommendation
router.post('/diagnostic/submit', studyPlannerController.submitDiagnostic);

// ==================== Study Plan CRUD ====================
// POST /api/v1/study-planner/create - Create study plan with chosen days
router.post('/create', studyPlannerController.createStudyPlan);

// GET /api/v1/study-planner/plans - Get student's study plans
router.get('/plans', studyPlannerController.getStudyPlans);

// GET /api/v1/study-planner/plan/:planId - Get study plan details
router.get('/plan/:planId', studyPlannerController.getStudyPlanDetails);

// GET /api/v1/study-planner/plan/:planId/progress - Get study plan progress
router.get('/plan/:planId/progress', studyPlannerController.getStudyPlanProgress);

// ==================== Day Operations ====================
// GET /api/v1/study-planner/day/:dayId - Get day tile details with content
router.get('/day/:dayId', studyPlannerController.getDayDetails);

// PATCH /api/v1/study-planner/day/:dayId/progress - Update day progress
router.patch('/day/:dayId/progress', studyPlannerController.updateDayProgress);

// POST /api/v1/study-planner/day/:dayId/test/start - Start day test
router.post('/day/:dayId/test/start', studyPlannerController.startDayTest);

// POST /api/v1/study-planner/day/:dayId/test/submit - Submit day test
router.post('/day/:dayId/test/submit', studyPlannerController.submitDayTest);

// ==================== Parent/Teacher/Admin Views ====================
// GET /api/v1/study-planner/student/:studentId/progress - View student progress (for parents/teachers)
router.get(
  '/student/:studentId/progress',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT'),
  studyPlannerController.getStudentProgress
);

// ==================== Reports ====================
// GET /api/v1/study-planner/reports/student/:studentId - Detailed student report
router.get(
  '/reports/student/:studentId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'),
  studyPlannerController.getStudentReport
);

// GET /api/v1/study-planner/reports/class/:classId - Class-wide study planner report
router.get(
  '/reports/class/:classId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  studyPlannerController.getClassReport
);

// GET /api/v1/study-planner/reports/admin - Admin dashboard report
router.get(
  '/reports/admin',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studyPlannerController.getAdminReport
);

export default router;
