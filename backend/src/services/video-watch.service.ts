import prisma from '../config/database';
import { videoService } from './video.service';

// ==================== Random Words for Verification ====================

const VERIFICATION_WORDS = [
  'apple', 'banana', 'orange', 'grape', 'mango',
  'pencil', 'eraser', 'notebook', 'folder', 'marker',
  'window', 'mirror', 'carpet', 'pillow', 'blanket',
  'guitar', 'piano', 'violin', 'drums', 'flute',
  'coffee', 'water', 'juice', 'milk', 'honey',
  'sunset', 'rainbow', 'thunder', 'breeze', 'cloud',
  'garden', 'flower', 'tree', 'grass', 'leaf',
  'mountain', 'river', 'ocean', 'valley', 'forest',
  'student', 'teacher', 'school', 'class', 'lesson',
  'science', 'history', 'english', 'math', 'art',
  'rocket', 'planet', 'galaxy', 'star', 'moon',
  'dolphin', 'elephant', 'tiger', 'eagle', 'rabbit',
  'diamond', 'crystal', 'golden', 'silver', 'bronze',
  'puzzle', 'riddle', 'mystery', 'secret', 'wonder',
  'journey', 'adventure', 'explore', 'discover', 'learn',
  'courage', 'wisdom', 'kindness', 'patience', 'strength',
  'melody', 'rhythm', 'harmony', 'tempo', 'chorus',
  'castle', 'bridge', 'tower', 'palace', 'temple',
  'sunrise', 'twilight', 'midnight', 'dawn', 'dusk',
  'compass', 'anchor', 'lighthouse', 'harbor', 'voyage',
];

// ==================== Types ====================

interface WatchStats {
  totalVideos: number;
  totalWatchTime: number; // in seconds
  completedVideos: number;
  averageWatchTime: number;
  verificationsCompleted: number;
  verificationSuccessRate: number;
  questionsAnswered: number;
  questionsCorrect: number;
  questionAccuracy: number;
}

interface VideoStats {
  totalSessions: number;
  uniqueStudents: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  verificationRate: number;
  questionAccuracy: number;
}

// ==================== Video Watch Service ====================

export class VideoWatchService {
  // Verification interval in seconds (5 minutes)
  private readonly VERIFICATION_INTERVAL = 300;

  // Question trigger time in seconds (30 minutes)
  private readonly QUESTION_TRIGGER_TIME = 1800;

  // Generate a random word for verification
  generateRandomWord(): string {
    const index = Math.floor(Math.random() * VERIFICATION_WORDS.length);
    return VERIFICATION_WORDS[index];
  }

  // ==================== Session Management ====================

  // Start a new watch session
  async startWatchSession(videoId: string, studentId: string) {
    // Verify student has access
    const hasAccess = await videoService.checkStudentAccess(videoId, studentId);
    if (!hasAccess) {
      throw new Error('Access denied to this video');
    }

    // Check for existing active session
    const existingSession = await this.getActiveSession(videoId, studentId);
    if (existingSession) {
      return existingSession;
    }

    // Create new session
    const session = await prisma.videoWatchSession.create({
      data: {
        videoId,
        studentId,
        totalWatchTimeSeconds: 0,
        lastPositionSeconds: 0,
      },
      include: {
        video: {
          select: {
            id: true,
            youtubeVideoId: true,
            title: true,
            duration: true,
          },
        },
      },
    });

    return session;
  }

  // Get active (incomplete) session for video/student
  async getActiveSession(videoId: string, studentId: string) {
    const session = await prisma.videoWatchSession.findFirst({
      where: {
        videoId,
        studentId,
        isCompleted: false,
      },
      include: {
        video: {
          select: {
            id: true,
            youtubeVideoId: true,
            title: true,
            duration: true,
          },
        },
        verifications: {
          orderBy: { createdAt: 'desc' },
        },
        questionResponses: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    return session;
  }

  // Update watch progress
  async updateWatchProgress(sessionId: string, currentSeconds: number, studentId: string) {
    // Verify session belongs to student
    const session = await prisma.videoWatchSession.findFirst({
      where: { id: sessionId, studentId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Calculate time increment
    const timeDelta = currentSeconds - session.lastPositionSeconds;
    const newTotalTime = session.totalWatchTimeSeconds + Math.max(0, Math.min(timeDelta, 10)); // Cap at 10 seconds to prevent cheating

    const updated = await prisma.videoWatchSession.update({
      where: { id: sessionId },
      data: {
        lastPositionSeconds: currentSeconds,
        totalWatchTimeSeconds: newTotalTime,
      },
    });

    return {
      session: updated,
      needsVerification: this.shouldShowVerification(newTotalTime, session.verificationsCompleted),
      needsQuestions: this.shouldShowQuestions(newTotalTime, session.questionsAnswered),
    };
  }

  // End watch session
  async endWatchSession(sessionId: string, studentId: string) {
    const session = await prisma.videoWatchSession.findFirst({
      where: { id: sessionId, studentId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const updated = await prisma.videoWatchSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        endedAt: new Date(),
      },
      include: {
        video: true,
        verifications: true,
        questionResponses: true,
      },
    });

    return updated;
  }

  // ==================== Verification (5-minute intervals) ====================

  // Check if verification is needed
  private shouldShowVerification(totalWatchTime: number, completedVerifications: number): boolean {
    const expectedVerifications = Math.floor(totalWatchTime / this.VERIFICATION_INTERVAL);
    return expectedVerifications > completedVerifications;
  }

  // Get next verification word
  async getNextVerification(sessionId: string, studentId: string) {
    const session = await prisma.videoWatchSession.findFirst({
      where: { id: sessionId, studentId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (!this.shouldShowVerification(session.totalWatchTimeSeconds, session.verificationsCompleted)) {
      return null;
    }

    const word = this.generateRandomWord();

    // Create verification record
    const verification = await prisma.videoVerification.create({
      data: {
        sessionId,
        wordShown: word,
        atVideoSeconds: session.lastPositionSeconds,
      },
    });

    return {
      verificationId: verification.id,
      word,
      atSeconds: session.lastPositionSeconds,
    };
  }

  // Submit verification response
  async submitVerification(
    sessionId: string,
    verificationId: string,
    wordEntered: string,
    studentId: string
  ) {
    const session = await prisma.videoWatchSession.findFirst({
      where: { id: sessionId, studentId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const verification = await prisma.videoVerification.findFirst({
      where: { id: verificationId, sessionId },
    });

    if (!verification) {
      throw new Error('Verification not found');
    }

    const isCorrect = verification.wordShown.toLowerCase() === wordEntered.toLowerCase().trim();

    // Update verification record
    await prisma.videoVerification.update({
      where: { id: verificationId },
      data: {
        wordEntered,
        isCorrect,
        respondedAt: new Date(),
      },
    });

    // Update session counters
    await prisma.videoWatchSession.update({
      where: { id: sessionId },
      data: {
        verificationsCompleted: { increment: 1 },
        verificationsFailed: isCorrect ? undefined : { increment: 1 },
      },
    });

    return { isCorrect };
  }

  // ==================== Comprehension Questions (30-minute mark) ====================

  // Check if questions should be shown
  private shouldShowQuestions(totalWatchTime: number, questionsAnswered: number): boolean {
    return totalWatchTime >= this.QUESTION_TRIGGER_TIME && questionsAnswered === 0;
  }

  // Check if session needs questions
  async checkNeedsQuestions(sessionId: string, studentId: string): Promise<boolean> {
    const session = await prisma.videoWatchSession.findFirst({
      where: { id: sessionId, studentId },
    });

    if (!session) {
      return false;
    }

    return this.shouldShowQuestions(session.totalWatchTimeSeconds, session.questionsAnswered);
  }

  // Get questions for session (2 questions)
  async getQuestionsForSession(sessionId: string, studentId: string, count: number = 2) {
    const session = await prisma.videoWatchSession.findFirst({
      where: { id: sessionId, studentId },
      include: {
        video: true,
        questionResponses: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get already answered question IDs
    const answeredIds = session.questionResponses.map((r) => r.questionId);

    // Get available questions
    const questions = await prisma.videoComprehensionQuestion.findMany({
      where: {
        videoId: session.videoId,
        isActive: true,
        id: { notIn: answeredIds },
      },
      orderBy: { sequenceOrder: 'asc' },
      take: count,
    });

    // If no questions, return empty array (AI generation should have been done)
    return questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      // Don't expose correct answer to client
    }));
  }

  // Submit question response
  async submitQuestionResponse(
    sessionId: string,
    questionId: string,
    selectedAnswer: string,
    studentId: string
  ) {
    const session = await prisma.videoWatchSession.findFirst({
      where: { id: sessionId, studentId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get the question with correct answer
    const question = await prisma.videoComprehensionQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = question.correctAnswer.toLowerCase() === selectedAnswer.toLowerCase();

    // Create response record
    const response = await prisma.videoQuestionResponse.create({
      data: {
        sessionId,
        questionId,
        selectedAnswer,
        isCorrect,
        atVideoSeconds: session.lastPositionSeconds,
        answeredAt: new Date(),
      },
    });

    // Update session counters
    await prisma.videoWatchSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: { increment: 1 },
        questionsCorrect: isCorrect ? { increment: 1 } : undefined,
      },
    });

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }

  // ==================== Stats ====================

  // Get watch stats for a student
  async getStudentWatchStats(studentId: string, videoId?: string): Promise<WatchStats> {
    const where: any = { studentId };
    if (videoId) {
      where.videoId = videoId;
    }

    const sessions = await prisma.videoWatchSession.findMany({
      where,
      include: {
        video: true,
      },
    });

    const totalVideos = new Set(sessions.map((s) => s.videoId)).size;
    const totalWatchTime = sessions.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0);
    const completedVideos = sessions.filter((s) => s.isCompleted).length;
    const averageWatchTime = sessions.length > 0 ? totalWatchTime / sessions.length : 0;

    const verificationsCompleted = sessions.reduce((sum, s) => sum + s.verificationsCompleted, 0);
    const verificationsFailed = sessions.reduce((sum, s) => sum + s.verificationsFailed, 0);
    const verificationSuccessRate =
      verificationsCompleted > 0
        ? ((verificationsCompleted - verificationsFailed) / verificationsCompleted) * 100
        : 0;

    const questionsAnswered = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const questionsCorrect = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
    const questionAccuracy =
      questionsAnswered > 0 ? (questionsCorrect / questionsAnswered) * 100 : 0;

    return {
      totalVideos,
      totalWatchTime,
      completedVideos,
      averageWatchTime,
      verificationsCompleted,
      verificationSuccessRate,
      questionsAnswered,
      questionsCorrect,
      questionAccuracy,
    };
  }

  // Get stats for a video
  async getVideoStats(videoId: string): Promise<VideoStats> {
    const sessions = await prisma.videoWatchSession.findMany({
      where: { videoId },
    });

    const video = await prisma.youTubeVideo.findUnique({
      where: { id: videoId },
    });

    const totalSessions = sessions.length;
    const uniqueStudents = new Set(sessions.map((s) => s.studentId)).size;
    const totalWatchTime = sessions.reduce((sum, s) => sum + s.totalWatchTimeSeconds, 0);
    const averageWatchTime = totalSessions > 0 ? totalWatchTime / totalSessions : 0;

    const completedSessions = sessions.filter((s) => s.isCompleted).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const totalVerifications = sessions.reduce((sum, s) => sum + s.verificationsCompleted, 0);
    const totalFailed = sessions.reduce((sum, s) => sum + s.verificationsFailed, 0);
    const verificationRate =
      totalVerifications > 0 ? ((totalVerifications - totalFailed) / totalVerifications) * 100 : 0;

    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
    const questionAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      totalSessions,
      uniqueStudents,
      totalWatchTime,
      averageWatchTime,
      completionRate,
      verificationRate,
      questionAccuracy,
    };
  }
}

export const videoWatchService = new VideoWatchService();
