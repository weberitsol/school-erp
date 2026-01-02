import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { studentController } from '../controllers/student.controller';

const router = Router();

// Multer configuration for student import
const importStorage = multer.diskStorage({
  destination: './uploads/temp',
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const importFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const allowedExts = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'));
  }
};

const uploadImport = multer({
  storage: importStorage,
  fileFilter: importFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Apply authentication to all routes
router.use(authenticate);

// GET /students - List all students (Admin, Teacher)
router.get(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  studentController.getStudents
);

// GET /students/template - Download import template (Admin only)
router.get(
  '/template',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.downloadTemplate
);

// POST /students/import/preview - Preview import file (Admin only)
router.post(
  '/import/preview',
  authorize('ADMIN', 'SUPER_ADMIN'),
  uploadImport.single('file'),
  studentController.previewImport
);

// POST /students/import - Import students from file (Admin only)
router.post(
  '/import',
  authorize('ADMIN', 'SUPER_ADMIN'),
  uploadImport.single('file'),
  studentController.importStudents
);

// GET /students/:id - Get student by ID
router.get('/:id', studentController.getStudentById);

// POST /students - Create new student (Admin only)
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.createStudent
);

// POST /students/bulk - Bulk create students (Admin only)
router.post(
  '/bulk',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.bulkCreateStudents
);

// POST /students/promote - Promote students to next class (Admin only)
router.post(
  '/promote',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.promoteStudents
);

// PUT /students/:id - Update student (Admin only)
router.put(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.updateStudent
);

// PATCH /students/:id - Partial update student (Admin only)
router.patch(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.updateStudent
);

// DELETE /students/:id - Delete student (Admin only)
router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.deleteStudent
);

// GET /students/:id/attendance - Get student attendance
router.get('/:id/attendance', studentController.getStudentAttendance);

// GET /students/:id/fees - Get student fee details
router.get('/:id/fees', studentController.getStudentFees);

// GET /students/:id/results - Get student exam results
router.get('/:id/results', studentController.getStudentResults);

export default router;
