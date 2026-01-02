import prisma from '../config/database';

// ==================== Types ====================

interface StudentVideoStats {
  studentId: string;
  studentName: string;
  rollNo: string | null;
  totalVideos: number;
  totalWatchTime: number;
  completedVideos: number;
  verificationSuccessRate: number;
  questionAccuracy: number;
}

interface VideoEngagementReport {
  video: {
    id: string;
    title: string;
    duration: number | null;
    subject: string | null;
  };
  stats: {
    totalSessions: number;
    uniqueStudents: number;
    totalWatchTime: number;
    averageWatchTime: number;
    completionRate: number;
    verificationRate: number;
    questionAccuracy: number;
  };
  studentBreakdown: StudentVideoStats[];
}

interface BatchVideoReport {
  class: string;
  section: string | null;
  studentCount: number;
  videosAssigned: number;
  averageWatchTime: number;
  averageVerificationRate: number;
  averageQuestionAccuracy: number;
  topPerformers: StudentVideoStats[];
  needsAttention: StudentVideoStats[];
}

interface ChildVideoReport {
  child: {
    id: string;
    name: string;
    class: string;
    section: string;
  };
  summary: {
    totalVideosAssigned: number;
    videosWatched: number;
    totalWatchTime: number;
    verificationSuccessRate: number;
    questionAccuracy: number;
  };
  recentActivity: {
    videoTitle: string;
    watchTime: number;
    watchedAt: Date;
    completed: boolean;
  }[];
  weeklyTrend: {
    week: string;
    watchTime: number;
    videosWatched: number;
  }[];
}

// ==================== Video Reports Service ====================

export class VideoReportsService {
  // Format seconds to human-readable time
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // ==================== Video Engagement Report ====================

  async getVideoEngagementReport(videoId: string): Promise<VideoEngagementReport> {
    const video = await prisma.youTubeVideo.findUnique({
      where: { id: videoId },
      include: { subject: true },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    // Get all sessions for this video
    const sessions = await prisma.videoWatchSession.findMany({
      where: { videoId },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    // Calculate overall stats
    const uniqueStudentIds = new Set(sessions.map((s) => s.studentId));
    const totalWatchTime = sessions.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0);
    const completedSessions = sessions.filter((s) => s.isCompleted).length;

    const totalVerifications = sessions.reduce((sum, s) => sum + s.verificationsCompleted, 0);
    const totalVerificationsFailed = sessions.reduce((sum, s) => sum + s.verificationsFailed, 0);
    const verificationRate =
      totalVerifications > 0
        ? ((totalVerifications - totalVerificationsFailed) / totalVerifications) * 100
        : 0;

    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
    const questionAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Calculate per-student breakdown
    const studentMap = new Map<string, any>();
    for (const session of sessions) {
      if (!studentMap.has(session.studentId)) {
        studentMap.set(session.studentId, {
          studentId: session.studentId,
          studentName: `${session.student.firstName} ${session.student.lastName}`,
          rollNo: session.student.rollNo,
          sessions: [],
        });
      }
      studentMap.get(session.studentId).sessions.push(session);
    }

    const studentBreakdown: StudentVideoStats[] = Array.from(studentMap.values()).map((data) => {
      const studentSessions = data.sessions;
      const watchTime = studentSessions.reduce((sum: number, s: any) => sum + s.totalWatchTimeSeconds, 0);
      const verifications = studentSessions.reduce((sum: number, s: any) => sum + s.verificationsCompleted, 0);
      const failed = studentSessions.reduce((sum: number, s: any) => sum + s.verificationsFailed, 0);
      const questions = studentSessions.reduce((sum: number, s: any) => sum + s.questionsAnswered, 0);
      const correct = studentSessions.reduce((sum: number, s: any) => sum + s.questionsCorrect, 0);

      return {
        studentId: data.studentId,
        studentName: data.studentName,
        rollNo: data.rollNo,
        totalVideos: 1,
        totalWatchTime: watchTime,
        completedVideos: studentSessions.some((s: any) => s.isCompleted) ? 1 : 0,
        verificationSuccessRate:
          verifications > 0 ? ((verifications - failed) / verifications) * 100 : 0,
        questionAccuracy: questions > 0 ? (correct / questions) * 100 : 0,
      };
    });

    return {
      video: {
        id: video.id,
        title: video.title,
        duration: video.duration,
        subject: video.subject?.name || null,
      },
      stats: {
        totalSessions: sessions.length,
        uniqueStudents: uniqueStudentIds.size,
        totalWatchTime,
        averageWatchTime: sessions.length > 0 ? totalWatchTime / sessions.length : 0,
        completionRate: sessions.length > 0 ? (completedSessions / sessions.length) * 100 : 0,
        verificationRate,
        questionAccuracy,
      },
      studentBreakdown,
    };
  }

  // ==================== Batch Video Report ====================

  async getBatchVideoReport(classId: string, sectionId?: string): Promise<BatchVideoReport> {
    // Get class and section info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
    });

    let sectionInfo = null;
    if (sectionId) {
      sectionInfo = await prisma.section.findUnique({
        where: { id: sectionId },
      });
    }

    // Get students in this batch
    const students = await prisma.student.findMany({
      where: {
        currentClassId: classId,
        ...(sectionId && { currentSectionId: sectionId }),
        isActive: true,
      },
      include: {
        videoWatchSessions: {
          include: { video: true },
        },
      },
    });

    // Get videos assigned to this batch
    const videoAccess = await prisma.videoAccess.findMany({
      where: {
        classId,
        ...(sectionId ? { sectionId } : { sectionId: null }),
      },
      include: { video: true },
    });

    // Calculate student stats
    const studentStats: StudentVideoStats[] = students.map((student) => {
      const sessions = student.videoWatchSessions;
      const uniqueVideos = new Set(sessions.map((s) => s.videoId)).size;
      const totalWatchTime = sessions.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0);
      const completedVideos = new Set(
        sessions.filter((s) => s.isCompleted).map((s) => s.videoId)
      ).size;

      const verifications = sessions.reduce((sum, s) => sum + s.verificationsCompleted, 0);
      const failed = sessions.reduce((sum, s) => sum + s.verificationsFailed, 0);
      const questions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
      const correct = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        totalVideos: uniqueVideos,
        totalWatchTime,
        completedVideos,
        verificationSuccessRate:
          verifications > 0 ? ((verifications - failed) / verifications) * 100 : 0,
        questionAccuracy: questions > 0 ? (correct / questions) * 100 : 0,
      };
    });

    // Sort for top performers and needs attention
    const sortedByPerformance = [...studentStats].sort((a, b) => {
      const scoreA = a.totalWatchTime * 0.4 + a.verificationSuccessRate * 0.3 + a.questionAccuracy * 0.3;
      const scoreB = b.totalWatchTime * 0.4 + b.verificationSuccessRate * 0.3 + b.questionAccuracy * 0.3;
      return scoreB - scoreA;
    });

    const topPerformers = sortedByPerformance.slice(0, 5);
    const needsAttention = sortedByPerformance.slice(-5).reverse();

    // Calculate averages
    const avgWatchTime =
      studentStats.length > 0
        ? studentStats.reduce((sum, s) => sum + s.totalWatchTime, 0) / studentStats.length
        : 0;
    const avgVerificationRate =
      studentStats.length > 0
        ? studentStats.reduce((sum, s) => sum + s.verificationSuccessRate, 0) / studentStats.length
        : 0;
    const avgQuestionAccuracy =
      studentStats.length > 0
        ? studentStats.reduce((sum, s) => sum + s.questionAccuracy, 0) / studentStats.length
        : 0;

    return {
      class: classInfo?.name || 'Unknown',
      section: sectionInfo?.name || null,
      studentCount: students.length,
      videosAssigned: videoAccess.length,
      averageWatchTime: avgWatchTime,
      averageVerificationRate: avgVerificationRate,
      averageQuestionAccuracy: avgQuestionAccuracy,
      topPerformers,
      needsAttention,
    };
  }

  // ==================== Student Video Report ====================

  async getStudentVideoReport(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        currentClass: true,
        currentSection: true,
        user: { select: { schoolId: true } },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get all sessions
    const sessions = await prisma.videoWatchSession.findMany({
      where: { studentId },
      include: {
        video: {
          include: { subject: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Calculate summary
    const uniqueVideos = new Set(sessions.map((s) => s.videoId)).size;
    const totalWatchTime = sessions.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0);
    const completedVideos = new Set(
      sessions.filter((s) => s.isCompleted).map((s) => s.videoId)
    ).size;

    const verifications = sessions.reduce((sum, s) => sum + s.verificationsCompleted, 0);
    const failed = sessions.reduce((sum, s) => sum + s.verificationsFailed, 0);
    const questions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const correct = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);

    // Per-video breakdown
    const videoBreakdown = new Map<string, any>();
    for (const session of sessions) {
      if (!videoBreakdown.has(session.videoId)) {
        videoBreakdown.set(session.videoId, {
          videoId: session.videoId,
          videoTitle: session.video.title,
          subject: session.video.subject?.name || 'General',
          totalWatchTime: 0,
          sessions: 0,
          completed: false,
          lastWatched: session.startedAt,
        });
      }

      const entry = videoBreakdown.get(session.videoId);
      entry.totalWatchTime += session.totalWatchTimeSeconds;
      entry.sessions++;
      entry.completed = entry.completed || session.isCompleted;
      if (session.startedAt > entry.lastWatched) {
        entry.lastWatched = session.startedAt;
      }
    }

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        class: student.currentClass?.name,
        section: student.currentSection?.name,
      },
      summary: {
        totalVideosWatched: uniqueVideos,
        totalWatchTime,
        completedVideos,
        verificationSuccessRate:
          verifications > 0 ? ((verifications - failed) / verifications) * 100 : 0,
        questionAccuracy: questions > 0 ? (correct / questions) * 100 : 0,
      },
      videos: Array.from(videoBreakdown.values()),
      recentActivity: sessions.slice(0, 10).map((s) => ({
        videoTitle: s.video.title,
        watchTime: s.totalWatchTimeSeconds,
        watchedAt: s.startedAt,
        completed: s.isCompleted,
      })),
    };
  }

  // ==================== Parent View (Child Video Report) ====================

  async getParentChildVideoReport(parentId: string, childId: string): Promise<ChildVideoReport> {
    // Verify parent-child relationship
    const relationship = await prisma.studentParent.findFirst({
      where: {
        parentId,
        studentId: childId,
      },
    });

    if (!relationship) {
      throw new Error('Access denied: Not a valid parent-child relationship');
    }

    // Get child details
    const child = await prisma.student.findUnique({
      where: { id: childId },
      include: {
        currentClass: true,
        currentSection: true,
        user: { select: { schoolId: true } },
      },
    });

    if (!child) {
      throw new Error('Child not found');
    }

    // Get assigned videos count
    const assignedVideos = await prisma.videoAccess.count({
      where: {
        classId: child.currentClassId!,
        OR: [
          { sectionId: null },
          { sectionId: child.currentSectionId },
        ],
      },
    });

    // Get all sessions
    const sessions = await prisma.videoWatchSession.findMany({
      where: { studentId: childId },
      include: {
        video: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    // Calculate summary
    const uniqueVideos = new Set(sessions.map((s) => s.videoId)).size;
    const totalWatchTime = sessions.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0);

    const verifications = sessions.reduce((sum, s) => sum + s.verificationsCompleted, 0);
    const failed = sessions.reduce((sum, s) => sum + s.verificationsFailed, 0);
    const questions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const correct = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);

    // Weekly trend (last 4 weeks)
    const weeklyTrend = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekSessions = sessions.filter(
        (s) => s.startedAt >= weekStart && s.startedAt < weekEnd
      );

      weeklyTrend.push({
        week: `Week ${4 - i}`,
        watchTime: weekSessions.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0),
        videosWatched: new Set(weekSessions.map((s) => s.videoId)).size,
      });
    }

    return {
      child: {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        class: child.currentClass?.name || 'Unknown',
        section: child.currentSection?.name || 'Unknown',
      },
      summary: {
        totalVideosAssigned: assignedVideos,
        videosWatched: uniqueVideos,
        totalWatchTime,
        verificationSuccessRate:
          verifications > 0 ? ((verifications - failed) / verifications) * 100 : 0,
        questionAccuracy: questions > 0 ? (correct / questions) * 100 : 0,
      },
      recentActivity: sessions.slice(0, 5).map((s) => ({
        videoTitle: s.video.title,
        watchTime: s.totalWatchTimeSeconds,
        watchedAt: s.startedAt,
        completed: s.isCompleted,
      })),
      weeklyTrend,
    };
  }
}

export const videoReportsService = new VideoReportsService();
