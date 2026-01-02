import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { attendanceController } from '../controllers/attendance.controller';

const router = Router();

router.use(authenticate);

// ==================== Student Attendance ====================

// POST /attendance/students - Mark single student attendance
router.post(
  '/students',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  attendanceController.markStudentAttendance
);

// POST /attendance/students/bulk - Bulk mark student attendance
router.post(
  '/students/bulk',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  attendanceController.bulkMarkStudentAttendance
);

// GET /attendance/students - Get student attendance with filters
router.get('/students', attendanceController.getStudentAttendance);

// GET /attendance/students/section - Get attendance by date and section
router.get(
  '/students/section',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  attendanceController.getAttendanceByDateAndSection
);

// GET /attendance/students/report - Get attendance report for section
router.get(
  '/students/report',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  attendanceController.getAttendanceReport
);

// ==================== Teacher Attendance ====================

// POST /attendance/teachers - Mark teacher attendance
router.post(
  '/teachers',
  authorize('ADMIN', 'SUPER_ADMIN'),
  attendanceController.markTeacherAttendance
);

// POST /attendance/teachers/bulk - Bulk mark teacher attendance
router.post(
  '/teachers/bulk',
  authorize('ADMIN', 'SUPER_ADMIN'),
  attendanceController.bulkMarkTeacherAttendance
);

// GET /attendance/teachers - Get teacher attendance
router.get(
  '/teachers',
  authorize('ADMIN', 'SUPER_ADMIN'),
  attendanceController.getTeacherAttendance
);

// ==================== Dashboard Stats ====================

// GET /attendance/stats - Get attendance statistics for dashboard
router.get(
  '/stats',
  authorize('ADMIN', 'SUPER_ADMIN'),
  attendanceController.getAttendanceStats
);

export default router;
