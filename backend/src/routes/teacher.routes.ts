import { Router } from 'express';
import multer from 'multer';
import { teacherController } from '../controllers/teacher.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Download import template
router.get('/template', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.downloadTemplate);

// Preview import file (validate before actual import)
router.post(
  '/import/preview',
  authorize('ADMIN', 'SUPER_ADMIN'),
  upload.single('file'),
  teacherController.previewImport
);

// Import teachers from file
router.post(
  '/import',
  authorize('ADMIN', 'SUPER_ADMIN'),
  upload.single('file'),
  teacherController.importTeachers
);

// Bulk create teachers from JSON
router.post('/bulk', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.bulkCreate);

// List all teachers
router.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), teacherController.getAll);

// Get teacher by ID
router.get('/:id', teacherController.getById);

// Get teacher's assigned classes
router.get('/:id/classes', teacherController.getClasses);

// Get teacher's assigned subjects
router.get('/:id/subjects', teacherController.getSubjects);

// Create new teacher
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.create);

// Update teacher
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.update);

// Delete teacher
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.delete);

export default router;
