import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as bookController from '../controllers/book.controller';

const router = Router();

// Multer configuration for book uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'books'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
}).single('file');

const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
}).array('files', 50); // Max 50 files

// ==================== Category Routes ====================

// Get all categories (tree structure)
router.get('/categories', authenticate, bookController.getCategories);

// Get category by ID
router.get('/categories/:id', authenticate, bookController.getCategoryById);

// Create category (Admin/Teacher only)
router.post(
  '/categories',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.createCategory
);

// Update category (Admin/Teacher only)
router.put(
  '/categories/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.updateCategory
);

// Delete category (Admin only)
router.delete(
  '/categories/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  bookController.deleteCategory
);

// ==================== Indexing Routes ====================
// NOTE: These MUST come before /:id routes to avoid "indexing" being treated as a book ID

// Get indexing status for all books
router.get('/indexing/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), bookController.getIndexingStatus);

// Index all unindexed books
router.post('/indexing/all', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), bookController.indexAllBooks);

// ==================== Book Routes ====================

// Get available books for current user (students see only accessible books)
router.get('/available', authenticate, bookController.getAvailableBooks);

// Get all books (with filters)
router.get('/', authenticate, bookController.getBooks);

// Get book by ID
router.get('/:id', authenticate, bookController.getBookById);

// Download book file
router.get('/:id/file', authenticate, bookController.downloadBook);

// Upload single book (Admin/Teacher only)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  uploadSingle,
  bookController.uploadBook
);

// Add external URL book (Admin/Teacher only)
router.post(
  '/external',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.addExternalBook
);

// Bulk upload books (Admin/Teacher only)
router.post(
  '/bulk-upload',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  uploadMultiple,
  bookController.bulkUploadBooks
);

// Update book (Admin/Teacher only)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.updateBook
);

// Publish book (Admin/Teacher only)
router.post(
  '/:id/publish',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.publishBook
);

// Delete book (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  bookController.deleteBook
);

// ==================== Access Control Routes ====================

// Get access rules for a book
router.get('/:id/access', authenticate, bookController.getBookAccess);

// Grant access to a batch (Admin/Teacher only)
router.post(
  '/:id/access',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.grantAccess
);

// Update access rule (Admin/Teacher only)
router.put(
  '/:id/access/:accessId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.updateAccess
);

// Revoke access (Admin/Teacher only)
router.delete(
  '/:id/access/:accessId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  bookController.revokeAccess
);

// ==================== AI Q&A Routes ====================

// Ask a question about the book
router.post('/:id/ask', authenticate, bookController.askQuestion);

// Get Q&A history for a book
router.get('/:id/qa', authenticate, bookController.getQAHistory);

// Get popular questions
router.get('/:id/qa/popular', authenticate, bookController.getPopularQuestions);

// ==================== Annotation Routes ====================

// Get all annotations for a book
router.get('/:id/annotations', authenticate, bookController.getAnnotations);

// Get annotations for a specific page
router.get('/:id/annotations/page/:page', authenticate, bookController.getPageAnnotations);

// Get shared annotations
router.get('/:id/annotations/shared', authenticate, bookController.getSharedAnnotations);

// Create annotation
router.post('/:id/annotations', authenticate, bookController.createAnnotation);

// Save canvas state for a page
router.post('/:id/annotations/canvas', authenticate, bookController.saveCanvasState);

// Update annotation
router.put('/:id/annotations/:annotationId', authenticate, bookController.updateAnnotation);

// Delete annotation
router.delete('/:id/annotations/:annotationId', authenticate, bookController.deleteAnnotation);

// ==================== Single Book Indexing Routes ====================

// Index a single book
router.post('/:id/index', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), bookController.indexBook);

// Re-index a book
router.post('/:id/reindex', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), bookController.reindexBook);

export default router;
