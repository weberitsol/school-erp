import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { advancedFeaturesController } from '../controllers/advanced-features.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student Learning Analytics Routes
router.get('/student/:studentId/analytics', advancedFeaturesController.getStudentAnalytics);
router.get('/student/:studentId/insights', advancedFeaturesController.getLearningInsights);
router.get('/student/:studentId/engagement', advancedFeaturesController.getEngagementMetrics);
router.get('/student/:studentId/recommendations', advancedFeaturesController.getRecommendations);
router.get('/student/:studentId/dashboard', advancedFeaturesController.getLearningDashboard);

// Class Analytics Routes
router.get('/class/:classId/analytics', advancedFeaturesController.getClassAnalytics);

export default router;
