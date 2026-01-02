import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { resultController } from '../controllers/result.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== ANALYSIS ROUTES ====================

// GET /results/:attemptId/analysis - Get detailed student analysis
router.get('/:attemptId/analysis', resultController.getDetailedAnalysis);

// GET /results/:attemptId/comparison - Get comparison with topper/class average
router.get('/:attemptId/comparison', resultController.getComparisonStats);

// GET /results/:attemptId/insights - Get performance insights and recommendations
router.get('/:attemptId/insights', resultController.getPerformanceInsights);

// GET /results/student/:studentId/weak-areas - Get weak areas for a student
router.get('/student/:studentId/weak-areas', resultController.getSubjectWeakAreas);

// ==================== AI DOUBT CLEARING ROUTES ====================

// POST /results/question/:questionId/explain - AI explanation for a question
router.post('/question/:questionId/explain', resultController.explainQuestion);

// GET /results/question/:questionId/shortcuts - Get shortcuts and tricks
router.get('/question/:questionId/shortcuts', resultController.getShortcutsTricks);

// GET /results/question/:questionId/similar - Get similar questions for practice
router.get('/question/:questionId/similar', resultController.getSimilarQuestions);

// POST /results/question/:questionId/analyze-wrong - Analyze why answer was wrong
router.post('/question/:questionId/analyze-wrong', resultController.analyzeWrongAnswer);

// GET /results/question/:questionId/insights - Get question-level statistics
router.get('/question/:questionId/insights', resultController.getQuestionInsights);

// ==================== YOUTUBE VIDEO ROUTES ====================

// GET /results/question/:questionId/videos - Get recommended videos for a question
router.get('/question/:questionId/videos', resultController.getQuestionVideos);

// GET /results/videos/search - Search YouTube videos
router.get('/videos/search', resultController.searchVideos);

// GET /results/videos/topics - Get videos by topic
router.get('/videos/topics', resultController.getVideosByTopic);

// GET /results/channels - Get curated educational channels
router.get('/channels', resultController.getCuratedChannels);

export default router;
