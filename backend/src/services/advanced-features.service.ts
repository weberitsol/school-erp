import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface StudentAnalyticsData {
  studentId: string;
  examPerformance?: {
    averageMarks: number;
    totalExams: number;
    passRate: number;
  };
  attendanceRate?: number;
  engagementScore?: number;
  learningProgress?: {
    chaptersCompleted: number;
    totalChapters: number;
    completionRate: number;
  };
}

interface LearningInsight {
  type: string; // "strength", "improvement_area", "recommendation"
  category: string; // "academics", "attendance", "engagement"
  message: string;
  priority: "high" | "medium" | "low";
}

interface StudentEngagementMetrics {
  studentId: string;
  videoWatchTime: number; // minutes
  practiceQuestionsAttempted: number;
  studyMaterialAccessed: number;
  forumParticipation: number;
  overallEngagementScore: number; // 0-100
}

export class AdvancedFeaturesService {
  // Get student learning analytics
  async getStudentAnalytics(studentId: string): Promise<StudentAnalyticsData> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) throw new Error('Student not found');

      // Exam Performance
      const examResults = await prisma.examResult.findMany({
        where: { studentId },
        include: { exam: true },
      });

      const totalExams = examResults.length;
      let totalMarks = 0;
      let passedExams = 0;

      examResults.forEach((result) => {
        totalMarks += Number(result.marksObtained || 0);
        if (result.marksObtained && result.exam.passingMarks) {
          if (new Decimal(result.marksObtained).gte(result.exam.passingMarks)) {
            passedExams++;
          }
        }
      });

      const averageMarks = totalExams > 0 ? Math.round(totalMarks / totalExams) : 0;
      const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

      // Attendance Rate
      const attendanceRecords = await prisma.studentAttendance.findMany({
        where: { studentId },
      });

      const presentDays = attendanceRecords.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const attendanceRate =
        attendanceRecords.length > 0
          ? Math.round((presentDays / attendanceRecords.length) * 100)
          : 0;

      // Learning Progress (chapters)
      const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId },
        include: { class: true },
      });

      let totalChapters = 0;
      let completedChapters = 0;

      for (const enrollment of enrollments) {
        const chapters = await prisma.chapter.findMany({
          where: { classId: enrollment.classId },
        });
        totalChapters += chapters.length;
        // This would require a study progress model - for now using a mock
        completedChapters += Math.floor(chapters.length * 0.6);
      }

      const learningProgress = {
        chaptersCompleted: completedChapters,
        totalChapters,
        completionRate: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
      };

      // Overall Engagement Score
      const engagementScore = Math.round(
        (passRate * 0.3 + attendanceRate * 0.3 + learningProgress.completionRate * 0.4) / 1
      );

      return {
        studentId,
        examPerformance: {
          averageMarks,
          totalExams,
          passRate,
        },
        attendanceRate,
        engagementScore,
        learningProgress,
      };
    } catch (error: any) {
      throw new Error(`Failed to get student analytics: ${error.message}`);
    }
  }

  // Generate learning insights for student
  async generateLearningInsights(studentId: string): Promise<LearningInsight[]> {
    try {
      const analytics = await this.getStudentAnalytics(studentId);
      const insights: LearningInsight[] = [];

      // Academic Performance Insights
      if (analytics.examPerformance && analytics.examPerformance.averageMarks >= 80) {
        insights.push({
          type: 'strength',
          category: 'academics',
          message: `Excellent exam performance with average marks of ${analytics.examPerformance.averageMarks}. Keep up the great work!`,
          priority: 'high',
        });
      } else if (analytics.examPerformance && analytics.examPerformance.averageMarks < 60) {
        insights.push({
          type: 'improvement_area',
          category: 'academics',
          message: `Average exam marks (${analytics.examPerformance.averageMarks}) are below target. Consider focusing on weak subjects.`,
          priority: 'high',
        });
      }

      // Attendance Insights
      if (analytics.attendanceRate && analytics.attendanceRate >= 90) {
        insights.push({
          type: 'strength',
          category: 'attendance',
          message: `Perfect attendance record (${analytics.attendanceRate}%). Consistency is the key to success!`,
          priority: 'medium',
        });
      } else if (analytics.attendanceRate && analytics.attendanceRate < 75) {
        insights.push({
          type: 'improvement_area',
          category: 'attendance',
          message: `Attendance rate is ${analytics.attendanceRate}%, which is below the expected 85%. Regular attendance is crucial.`,
          priority: 'high',
        });
      }

      // Learning Progress Insights
      if (
        analytics.learningProgress &&
        analytics.learningProgress.completionRate >= 75
      ) {
        insights.push({
          type: 'strength',
          category: 'engagement',
          message: `Great learning progress! ${analytics.learningProgress.completionRate}% of curriculum covered. Stay focused!`,
          priority: 'medium',
        });
      } else if (
        analytics.learningProgress &&
        analytics.learningProgress.completionRate < 50
      ) {
        insights.push({
          type: 'improvement_area',
          category: 'engagement',
          message: `Learning progress at ${analytics.learningProgress.completionRate}%. Accelerate your study pace to catch up.`,
          priority: 'high',
        });
      }

      // Recommendations
      if (analytics.engagementScore && analytics.engagementScore < 60) {
        insights.push({
          type: 'recommendation',
          category: 'academics',
          message: 'Consider joining study groups or seeking extra tutoring sessions to improve performance.',
          priority: 'high',
        });
      }

      if (analytics.attendanceRate && analytics.attendanceRate < 80 && analytics.examPerformance && analytics.examPerformance.averageMarks < 70) {
        insights.push({
          type: 'recommendation',
          category: 'academics',
          message: 'Regular attendance combined with focused study can significantly improve your exam results.',
          priority: 'high',
        });
      }

      return insights;
    } catch (error: any) {
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  // Get student engagement metrics
  async getEngagementMetrics(studentId: string): Promise<StudentEngagementMetrics> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) throw new Error('Student not found');

      // Video watch time
      const videoSessions = await prisma.videoWatchSession.findMany({
        where: { studentId },
      });

      const totalWatchTime = videoSessions.reduce((sum, session) => {
        const duration = session.watchedUntil ? Number(session.watchedUntil) : 0;
        return sum + duration;
      }, 0);

      // Practice questions
      const practiceAttempts = await prisma.practiceAttempt.findMany({
        where: { studentId },
      });

      // Study material access (using test attempts as proxy)
      const testAttempts = await prisma.testAttempt.findMany({
        where: { studentId },
      });

      // Forum/Task participation (using tasks as proxy)
      const taskParticipation = await prisma.task.findMany({
        where: { createdById: studentId },
      });

      // Calculate overall engagement score (0-100)
      const videoScore = Math.min((totalWatchTime / 1000) * 10, 30); // 0-30 points
      const practiceScore = Math.min(practiceAttempts.length * 5, 30); // 0-30 points
      const studyScore = Math.min(testAttempts.length * 5, 25); // 0-25 points
      const forumScore = Math.min(taskParticipation.length * 5, 15); // 0-15 points

      const overallScore = Math.round(videoScore + practiceScore + studyScore + forumScore);

      return {
        studentId,
        videoWatchTime: Math.round(totalWatchTime),
        practiceQuestionsAttempted: practiceAttempts.length,
        studyMaterialAccessed: testAttempts.length,
        forumParticipation: taskParticipation.length,
        overallEngagementScore: overallScore,
      };
    } catch (error: any) {
      throw new Error(`Failed to get engagement metrics: ${error.message}`);
    }
  }

  // Get class-wide learning insights
  async getClassAnalytics(classId: string) {
    try {
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classExists) throw new Error('Class not found');

      // Get all students in class
      const enrollments = await prisma.classEnrollment.findMany({
        where: { classId },
        include: { student: true },
      });

      const studentAnalytics = [];
      let totalEngagement = 0;
      let totalAttendance = 0;

      for (const enrollment of enrollments) {
        const analytics = await this.getStudentAnalytics(enrollment.studentId);
        studentAnalytics.push({
          student: enrollment.student,
          analytics,
        });
        totalEngagement += analytics.engagementScore || 0;
        totalAttendance += analytics.attendanceRate || 0;
      }

      const averageEngagement = Math.round(
        totalEngagement / Math.max(studentAnalytics.length, 1)
      );
      const averageAttendance = Math.round(
        totalAttendance / Math.max(studentAnalytics.length, 1)
      );

      return {
        classId,
        totalStudents: studentAnalytics.length,
        averageEngagementScore: averageEngagement,
        averageAttendanceRate: averageAttendance,
        topPerformers: studentAnalytics
          .sort((a, b) => (b.analytics.engagementScore || 0) - (a.analytics.engagementScore || 0))
          .slice(0, 5),
        needsSupport: studentAnalytics
          .filter((s) => (s.analytics.engagementScore || 0) < 50)
          .slice(0, 5),
      };
    } catch (error: any) {
      throw new Error(`Failed to get class analytics: ${error.message}`);
    }
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(studentId: string): Promise<string[]> {
    try {
      const insights = await this.generateLearningInsights(studentId);
      const recommendations: string[] = [];

      // Extract recommendations from insights
      insights.forEach((insight) => {
        if (insight.type === 'recommendation') {
          recommendations.push(insight.message);
        }
      });

      // Add custom recommendations based on metrics
      const metrics = await this.getEngagementMetrics(studentId);
      const analytics = await this.getStudentAnalytics(studentId);

      if (metrics.videoWatchTime < 500) {
        recommendations.push(
          'Watch more video lectures to strengthen your conceptual understanding.'
        );
      }

      if (metrics.practiceQuestionsAttempted < 50) {
        recommendations.push(
          'Solve more practice questions to improve problem-solving skills.'
        );
      }

      if (analytics.attendanceRate && analytics.attendanceRate < 85) {
        recommendations.push(
          'Maintain consistent attendance - each class builds on the previous one.'
        );
      }

      return recommendations;
    } catch (error: any) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  }

  // Get learning dashboard data
  async getLearningDashboard(studentId: string) {
    try {
      const analytics = await this.getStudentAnalytics(studentId);
      const insights = await this.generateLearningInsights(studentId);
      const metrics = await this.getEngagementMetrics(studentId);
      const recommendations = await this.getPersonalizedRecommendations(studentId);

      return {
        studentId,
        analytics,
        insights,
        metrics,
        recommendations,
      };
    } catch (error: any) {
      throw new Error(`Failed to get learning dashboard: ${error.message}`);
    }
  }
}

export const advancedFeaturesService = new AdvancedFeaturesService();
