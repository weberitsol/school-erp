import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { documentController } from '../controllers/document.controller';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'documents'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

router.use(authenticate);

// POST /documents - Upload document
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  upload.single('file'),
  documentController.uploadDocument
);

// GET /documents - Get all documents
router.get(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  documentController.getDocuments
);

// GET /documents/stats - Get processing stats
router.get(
  '/stats',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  documentController.getProcessingStats
);

// GET /documents/:id - Get document by ID
router.get(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  documentController.getDocumentById
);

// POST /documents/:id/process - Start AI processing
router.post(
  '/:id/process',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  documentController.processDocument
);

// POST /documents/:id/questions - Add extracted questions
router.post(
  '/:id/questions',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  documentController.addExtractedQuestions
);

// DELETE /documents/:id - Delete document
router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  documentController.deleteDocument
);

export default router;
