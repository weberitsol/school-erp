import { Request, Response } from 'express';
import { studyPlannerService } from '../services/study-planner.service';

// ==================== SUBJECT & CHAPTER ====================

export const getSubjectsWithChapters = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const subjects = await studyPlannerService.getSubjectsWithChapters(user.schoolId);
    res.json({ success: true, data: subjects });
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== DIAGNOSTIC TEST ====================

export const startDiagnostic = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { subjectId, chapterId } = req.body;

    if (!subjectId || !chapterId) {
      return res.status(400).json({ success: false, error: 'Subject and chapter are required' });
    }

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Only students can start diagnostic tests' });
    }

    const diagnostic = await studyPlannerService.createDiagnosticTest(user.studentId, subjectId, chapterId);
    res.json({ success: true, data: diagnostic });
  } catch (error: any) {
    console.error('Error starting diagnostic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitDiagnostic = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { subjectId, chapterId, responses } = req.body;

    if (!subjectId || !chapterId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ success: false, error: 'Invalid request data' });
    }

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Only students can submit diagnostic tests' });
    }

    const result = await studyPlannerService.submitDiagnosticAndGetRecommendation(
      user.studentId,
      subjectId,
      chapterId,
      responses
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error submitting diagnostic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STUDY PLAN ====================

export const createStudyPlan = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { subjectId, chapterId, diagnosticScore, aiRecommendation, totalDays } = req.body;

    if (!subjectId || !chapterId || !aiRecommendation || !totalDays) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Only students can create study plans' });
    }

    const plan = await studyPlannerService.createStudyPlan(
      user.studentId,
      subjectId,
      chapterId,
      diagnosticScore || 0,
      aiRecommendation,
      totalDays
    );

    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Error creating study plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudyPlans = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Only students can view their study plans' });
    }

    const plans = await studyPlannerService.getStudyPlans(user.studentId);
    res.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('Error fetching study plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudyPlanDetails = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { planId } = req.params;

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const plan = await studyPlannerService.getStudyPlanDetails(planId, user.studentId);
    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('Error fetching study plan details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== DAY OPERATIONS ====================

export const getDayDetails = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { dayId } = req.params;

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const day = await studyPlannerService.getStudyDay(dayId, user.studentId);
    res.json({ success: true, data: day });
  } catch (error: any) {
    console.error('Error fetching day details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDayProgress = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { dayId } = req.params;
    const updates = req.body;

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const day = await studyPlannerService.updateDayProgress(dayId, user.studentId, updates);
    res.json({ success: true, data: day });
  } catch (error: any) {
    console.error('Error updating day progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== DAY TEST ====================

export const startDayTest = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { dayId } = req.params;

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const test = await studyPlannerService.startDayTest(dayId, user.studentId);
    res.json({ success: true, data: test });
  } catch (error: any) {
    console.error('Error starting day test:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const submitDayTest = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { dayId } = req.params;
    const { attemptId, responses } = req.body;

    if (!attemptId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ success: false, error: 'Invalid request data' });
    }

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const result = await studyPlannerService.submitDayTest(attemptId, user.studentId, responses);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error submitting day test:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// ==================== PROGRESS TRACKING ====================

export const getStudyPlanProgress = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { planId } = req.params;

    if (!user.studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const progress = await studyPlannerService.getStudyPlanProgress(planId, user.studentId);
    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { studentId } = req.params;

    // Authorization: Admin, Teacher can view any student. Parent can view only their children.
    // This is a simplified check - in production, verify parent-child relationship
    if (user.role === 'STUDENT' && user.studentId !== studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const progress = await studyPlannerService.getStudentStudyProgress(studentId, user.id, user.role);
    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== REPORTS ====================

export const getStudentReport = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { studentId } = req.params;

    // Authorization check
    if (user.role === 'STUDENT' && user.studentId !== studentId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const report = await studyPlannerService.getStudentReport(studentId);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error fetching student report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClassReport = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { classId } = req.params;

    // Only Admin and Teacher can view class reports
    if (!['ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const report = await studyPlannerService.getClassReport(classId);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error fetching class report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminReport = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // Only Admin can view admin reports
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const report = await studyPlannerService.getAdminReport(user.schoolId);
    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error fetching admin report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
