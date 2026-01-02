import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { reportsController } from '../controllers/reports.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== DASHBOARD ====================

// GET /reports/dashboard - Get dashboard summary
router.get('/dashboard', reportsController.getDashboardSummary);

// ==================== TEST REPORTS (Teacher/Admin) ====================

// GET /reports/test/:testId - Get comprehensive test report
router.get(
  '/test/:testId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  reportsController.getTestReport
);

// GET /reports/test/:testId/export - Get test data for export
router.get(
  '/test/:testId/export',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  reportsController.getTestExportData
);

// GET /reports/test/:testId/export/csv - Export test report as CSV
router.get(
  '/test/:testId/export/csv',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  reportsController.exportTestReportCsv
);

// ==================== CLASS REPORTS (Teacher/Admin) ====================

// GET /reports/class/:classId - Get class-wise performance report
router.get(
  '/class/:classId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  reportsController.getClassReport
);

// ==================== STUDENT REPORTS ====================

// GET /reports/student/:studentId - Get individual student report
// Teachers and admins can view any student, students can view their own
router.get('/student/:studentId', reportsController.getStudentReport);

export default router;
