import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { videoService } from '../services/video.service';
import { videoWatchService } from '../services/video-watch.service';
import { videoQuestionService } from '../services/video-question.service';
import { videoReportsService } from '../services/video-reports.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Student Routes (defined first to avoid /:id conflict) ====================

// Get available videos for student
router.get(
  '/available',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const videos = await videoService.getAvailableVideosForStudent(req.user!.studentId);
      res.json({ success: true, data: videos });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get tags with videos for student
router.get(
  '/tags',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const tags = await videoService.getTagsWithVideosForStudent(req.user!.studentId);
      res.json({ success: true, data: tags });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get videos by tag
router.get(
  '/by-tag/:tagId',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const videos = await videoService.getVideosByTag(req.user!.studentId, req.params.tagId);
      res.json({ success: true, data: videos });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get video for watching (student view - no full URL)
router.get(
  '/watch/:id',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const video = await videoService.getVideoForStudent(req.params.id, req.user!.studentId);
      res.json({ success: true, data: video });
    } catch (error: any) {
      res.status(403).json({ success: false, error: error.message });
    }
  }
);

// Student's own stats
router.get(
  '/my-stats',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const stats = await videoWatchService.getStudentWatchStats(req.user!.studentId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ==================== Report Routes (defined before /:id) ====================

// Batch video report
router.get(
  '/reports/batch/:classId',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sectionId } = req.query;
      const report = await videoReportsService.getBatchVideoReport(
        req.params.classId,
        sectionId as string | undefined
      );

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Student video report
router.get(
  '/reports/student/:studentId',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await videoReportsService.getStudentVideoReport(req.params.studentId);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Parent view - child video report
router.get(
  '/reports/parent/:childId',
  authorize('PARENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get parent ID from user
      const parent = await (await import('../config/database')).default.parent.findUnique({
        where: { userId: req.user!.id },
      });

      if (!parent) {
        return res.status(400).json({ success: false, error: 'Parent profile not found' });
      }

      const report = await videoReportsService.getParentChildVideoReport(
        parent.id,
        req.params.childId
      );

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(403).json({ success: false, error: error.message });
    }
  }
);

// ==================== Admin/Teacher Routes ====================

// Create video
router.post(
  '/',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const video = await videoService.createVideo({
        ...req.body,
        schoolId: req.user!.schoolId,
        createdById: req.user!.id,
      });

      res.status(201).json({ success: true, data: video });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get all videos (admin/teacher view)
router.get(
  '/',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, subjectId, tagId, search } = req.query;

      const videos = await videoService.getVideosForSchool(req.user!.schoolId, {
        status: status as any,
        subjectId: subjectId as string,
        tagId: tagId as string,
        search: search as string,
      });

      res.json({ success: true, data: videos });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get video by ID
router.get(
  '/:id',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const video = await videoService.getVideoById(req.params.id, req.user!.schoolId);

      if (!video) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }

      res.json({ success: true, data: video });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Update video
router.put(
  '/:id',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const video = await videoService.updateVideo(req.params.id, req.body, req.user!.schoolId);
      res.json({ success: true, data: video });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Delete video
router.delete(
  '/:id',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await videoService.deleteVideo(req.params.id, req.user!.schoolId);
      res.json({ success: true, message: 'Video deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Publish video
router.post(
  '/:id/publish',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const video = await videoService.publishVideo(req.params.id, req.user!.schoolId);
      res.json({ success: true, data: video });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// ==================== Access Control Routes ====================

// Grant batch access
router.post(
  '/:id/access',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access = await videoService.grantAccess({
        videoId: req.params.id,
        ...req.body,
        createdById: req.user!.id,
      });

      res.status(201).json({ success: true, data: access });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get access rules
router.get(
  '/:id/access',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access = await videoService.getVideoAccess(req.params.id);
      res.json({ success: true, data: access });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Revoke access
router.delete(
  '/:id/access/:accessId',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await videoService.revokeAccess(req.params.accessId);
      res.json({ success: true, message: 'Access revoked' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// ==================== Question Routes ====================

// Add question
router.post(
  '/:id/questions',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const question = await videoQuestionService.createQuestion({
        videoId: req.params.id,
        ...req.body,
      });

      res.status(201).json({ success: true, data: question });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get questions
router.get(
  '/:id/questions',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const questions = await videoQuestionService.getQuestionsForVideo(req.params.id);
      res.json({ success: true, data: questions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Update question
router.put(
  '/:id/questions/:qid',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const question = await videoQuestionService.updateQuestion(req.params.qid, req.body);
      res.json({ success: true, data: question });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Delete question
router.delete(
  '/:id/questions/:qid',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await videoQuestionService.deleteQuestion(req.params.qid);
      res.json({ success: true, message: 'Question deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Generate AI questions
router.post(
  '/:id/questions/generate',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = req.body.count || 4;
      const questions = await videoQuestionService.generateAndSaveQuestions(req.params.id, count);
      res.json({ success: true, data: questions });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// ==================== Watch Session Routes ====================

// Start watch session
router.post(
  '/:id/watch/start',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const session = await videoWatchService.startWatchSession(req.params.id, req.user!.studentId);
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update watch progress
router.post(
  '/:id/watch/progress',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const { sessionId, currentSeconds } = req.body;
      const result = await videoWatchService.updateWatchProgress(
        sessionId,
        currentSeconds,
        req.user!.studentId
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// End watch session
router.post(
  '/:id/watch/end',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const { sessionId } = req.body;
      const session = await videoWatchService.endWatchSession(sessionId, req.user!.studentId);
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get verification word
router.get(
  '/:id/watch/verify',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const { sessionId } = req.query;
      const verification = await videoWatchService.getNextVerification(
        sessionId as string,
        req.user!.studentId
      );

      res.json({ success: true, data: verification });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Submit verification
router.post(
  '/:id/watch/verify',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const { sessionId, verificationId, word } = req.body;
      const result = await videoWatchService.submitVerification(
        sessionId,
        verificationId,
        word,
        req.user!.studentId
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get questions for session
router.get(
  '/:id/watch/questions',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const { sessionId } = req.query;

      // Ensure minimum questions exist
      await videoQuestionService.ensureMinimumQuestions(req.params.id);

      const questions = await videoWatchService.getQuestionsForSession(
        sessionId as string,
        req.user!.studentId,
        2
      );

      res.json({ success: true, data: questions });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Submit question answer
router.post(
  '/:id/watch/answer',
  authorize('STUDENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user!.studentId) {
        return res.status(400).json({ success: false, error: 'Student profile not found' });
      }

      const { sessionId, questionId, answer } = req.body;
      const result = await videoWatchService.submitQuestionResponse(
        sessionId,
        questionId,
        answer,
        req.user!.studentId
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Video engagement report (for specific video)
router.get(
  '/:id/reports',
  authorize('ADMIN', 'TEACHER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await videoReportsService.getVideoEngagementReport(req.params.id);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
