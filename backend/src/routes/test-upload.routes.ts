import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  uploadAndParse,
  parseText,
  updateParsedQuestion,
  deleteParsedQuestion,
  createTestFromParsed,
  getAvailablePatterns,
  getSchoolQuestionBank,
  verifyQuestionsWithAI,
} from '../controllers/test-upload.controller';

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'test-papers');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || ['.docx', '.doc'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Word documents (.docx, .doc) are allowed'));
    }
  },
});

// ==================== ROUTES ====================

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/tests/upload/parse
 * @desc    Upload and parse a Word document
 * @access  Admin, Teacher
 */
router.post(
  '/parse',
  authorize('ADMIN', 'TEACHER'),
  upload.single('file'),
  uploadAndParse
);

/**
 * @route   POST /api/tests/upload/parse-text
 * @desc    Parse raw text (for testing)
 * @access  Admin, Teacher
 */
router.post(
  '/parse-text',
  authorize('ADMIN', 'TEACHER'),
  parseText
);

/**
 * @route   PUT /api/tests/upload/questions/:questionId
 * @desc    Update a parsed question before creating test
 * @access  Admin, Teacher
 */
router.put(
  '/questions/:questionId',
  authorize('ADMIN', 'TEACHER'),
  updateParsedQuestion
);

/**
 * @route   DELETE /api/tests/upload/questions/:questionId
 * @desc    Delete a parsed question from preview
 * @access  Admin, Teacher
 */
router.delete(
  '/questions/:questionId',
  authorize('ADMIN', 'TEACHER'),
  deleteParsedQuestion
);

/**
 * @route   POST /api/tests/upload/create
 * @desc    Create test from parsed questions
 * @access  Admin, Teacher
 */
router.post(
  '/create',
  authorize('ADMIN', 'TEACHER'),
  createTestFromParsed
);

/**
 * @route   GET /api/tests/upload/patterns
 * @desc    Get available patterns for test creation
 * @access  Admin, Teacher
 */
router.get(
  '/patterns',
  authorize('ADMIN', 'TEACHER'),
  getAvailablePatterns
);

/**
 * @route   GET /api/tests/question-bank
 * @desc    Get school's question bank
 * @access  Admin, Teacher
 */
router.get(
  '/question-bank',
  authorize('ADMIN', 'TEACHER'),
  getSchoolQuestionBank
);

/**
 * @route   POST /api/tests/upload/verify-with-ai
 * @desc    Verify parsed questions with AI
 * @access  Admin, Teacher
 */
router.post(
  '/verify-with-ai',
  authorize('ADMIN', 'TEACHER'),
  verifyQuestionsWithAI
);

export default router;
