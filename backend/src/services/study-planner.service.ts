import {
  PrismaClient,
  StudyPlanStatus,
  StudyDayStatus,
  DayAttemptStatus,
  DifficultyLevel,
} from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Constants
const COOLDOWN_HOURS = 1;
const FIRST_ATTEMPT_PASS_PERCENT = 80;
const REATTEMPT_PASS_PERCENT = 100;
const QUESTIONS_PER_DAY_TEST = 10;
const DIAGNOSTIC_QUESTION_COUNT = 15;
const DIAGNOSTIC_TIME_MINUTES = 20;

// ==================== INTERFACES ====================

export interface WeakArea {
  topic: string;
  score: number;
  questionCount: number;
  priorityLevel?: 'high' | 'medium' | 'low';
}

export interface DailyPlan {
  dayNumber: number;
  topics: string[];
  videoKeywords: string[];
  estimatedMinutes: number;
}

export interface AIStudyRecommendation {
  totalHours: number;
  weakAreas: WeakArea[];
  dailyPlan: DailyPlan[];
  summaryNotes: string[];
  analysis: string;
}

export interface DiagnosticResponse {
  questionId: string;
  selectedAnswer: string;
}

export interface ScoringResult {
  percentage: number;
  correctCount: number;
  totalCount: number;
  byTopic: Map<string, { correct: number; total: number }>;
}

// ==================== STUDY PLANNER SERVICE ====================

class StudyPlannerService {
  // ==================== SUBJECT & CHAPTER ====================

  async getSubjectsWithChapters(schoolId: string) {
    // Get subjects from the student's school that have chapters with questions
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId,
        isActive: true,
        chapters: {
          some: {
            isActive: true,
            questions: { some: {} },
          },
        },
      },
      include: {
        chapters: {
          where: {
            isActive: true,
            questions: { some: {} }, // Only include chapters that have questions
          },
          orderBy: { chapterNumber: 'asc' },
          select: {
            id: true,
            name: true,
            chapterNumber: true,
            classLevel: true,
            description: true,
            _count: {
              select: { questions: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter out subjects with no chapters
    return subjects.filter((s) => s.chapters.length > 0);
  }

  // ==================== DIAGNOSTIC TEST ====================

  async createDiagnosticTest(studentId: string, subjectId: string, chapterId: string) {
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { currentClassId: true },
    });

    if (!student || !student.currentClassId) {
      throw new Error('Student not found or not enrolled in a class');
    }

    // Get chapter info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { subject: true },
    });

    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // Get questions for diagnostic - mix of difficulties
    const questions = await prisma.question.findMany({
      where: {
        subjectId,
        chapterId,
        isActive: true,
        // Try to get verified questions first, fallback to any
      },
      take: DIAGNOSTIC_QUESTION_COUNT * 2, // Get more, then select
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        questionText: true,
        questionHtml: true,
        questionType: true,
        options: true,
        difficulty: true,
        marks: true,
        topic: true,
      },
    });

    // Shuffle and select questions
    const shuffled = this.shuffleArray([...questions]);
    const selectedQuestions = shuffled.slice(0, DIAGNOSTIC_QUESTION_COUNT);

    return {
      questions: selectedQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionHtml: q.questionHtml,
        questionType: q.questionType,
        options: q.options,
        difficulty: q.difficulty,
        marks: q.marks,
        topic: q.topic,
      })),
      totalQuestions: selectedQuestions.length,
      timeLimit: DIAGNOSTIC_TIME_MINUTES,
      subjectName: chapter.subject.name,
      chapterName: chapter.name,
    };
  }

  async submitDiagnosticAndGetRecommendation(
    studentId: string,
    subjectId: string,
    chapterId: string,
    responses: DiagnosticResponse[]
  ) {
    // Get chapter and subject info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { subject: true },
    });

    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // Score the diagnostic responses
    const scoringResult = await this.scoreDiagnosticResponses(responses);

    // Analyze weak areas
    const weakAreas = this.analyzeWeakAreas(scoringResult);

    // Get AI recommendation
    const aiRecommendation = await this.getAIStudyRecommendation(
      chapter.subject.name,
      chapter.name,
      scoringResult.percentage,
      weakAreas
    );

    return {
      diagnosticScore: scoringResult.percentage,
      correctCount: scoringResult.correctCount,
      totalCount: scoringResult.totalCount,
      weakAreas,
      aiRecommendation,
    };
  }

  // ==================== AI INTEGRATION ====================

  private async getAIStudyRecommendation(
    subjectName: string,
    chapterName: string,
    diagnosticScore: number,
    weakAreas: WeakArea[]
  ): Promise<AIStudyRecommendation> {
    const weakAreasText =
      weakAreas.length > 0
        ? weakAreas.map((w) => `- ${w.topic}: ${w.score.toFixed(1)}% (${w.questionCount} questions)`).join('\n')
        : '- No specific weak areas identified';

    const prompt = `You are an expert educational planner for competitive exam preparation (NEET/JEE).

A student has taken a diagnostic test for:
- Subject: ${subjectName}
- Chapter: ${chapterName}
- Score: ${diagnosticScore.toFixed(1)}%

Weak Areas identified:
${weakAreasText}

Based on this analysis, create a personalized study plan. Consider:
1. Lower scores need more study time
2. Each weak area needs dedicated focus
3. Include video learning, reading, and practice

Return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
  "totalHours": <number - recommended total study hours>,
  "weakAreas": [{"topic": "...", "score": <number>, "priorityLevel": "high|medium|low"}],
  "dailyPlan": [
    {
      "dayNumber": 1,
      "topics": ["topic1", "topic2"],
      "videoKeywords": ["search keyword 1", "search keyword 2"],
      "estimatedMinutes": <number>
    }
  ],
  "summaryNotes": ["key point 1", "key point 2"],
  "analysis": "Brief explanation of the recommendation"
}

For a score of ${diagnosticScore.toFixed(1)}%:
- 0-40%: Recommend 8-12 hours
- 40-60%: Recommend 5-8 hours
- 60-80%: Recommend 3-5 hours
- 80-100%: Recommend 1-3 hours

Create a 4-day plan by default with equal distribution of topics.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content[0];
      if (textContent.type !== 'text') {
        throw new Error('Unexpected AI response type');
      }

      // Extract JSON from response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('AI response:', textContent.text);
        throw new Error('Failed to parse AI recommendation');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI recommendation error:', error);
      // Fallback to default recommendation
      return this.getDefaultRecommendation(diagnosticScore, weakAreas);
    }
  }

  private getDefaultRecommendation(diagnosticScore: number, weakAreas: WeakArea[]): AIStudyRecommendation {
    let totalHours: number;
    if (diagnosticScore < 40) totalHours = 10;
    else if (diagnosticScore < 60) totalHours = 6;
    else if (diagnosticScore < 80) totalHours = 4;
    else totalHours = 2;

    const minutesPerDay = Math.round((totalHours * 60) / 4);

    return {
      totalHours,
      weakAreas: weakAreas.map((w) => ({
        ...w,
        priorityLevel: w.score < 40 ? 'high' : w.score < 70 ? 'medium' : 'low',
      })),
      dailyPlan: [1, 2, 3, 4].map((dayNumber) => ({
        dayNumber,
        topics: weakAreas.slice(0, 2).map((w) => w.topic),
        videoKeywords: [`${weakAreas[0]?.topic || 'concept'} explanation`, 'problem solving'],
        estimatedMinutes: minutesPerDay,
      })),
      summaryNotes: [
        'Focus on understanding core concepts',
        'Practice problems from weak areas',
        'Review formulas and key definitions',
        'Attempt mock questions regularly',
      ],
      analysis: `Based on your ${diagnosticScore.toFixed(1)}% score, you need approximately ${totalHours} hours of focused study to master this chapter.`,
    };
  }

  // ==================== STUDY PLAN CREATION ====================

  async createStudyPlan(
    studentId: string,
    subjectId: string,
    chapterId: string,
    diagnosticScore: number,
    aiRecommendation: AIStudyRecommendation,
    totalDays: number
  ) {
    const hoursPerDay = aiRecommendation.totalHours / totalDays;
    const targetEndDate = new Date();
    targetEndDate.setDate(targetEndDate.getDate() + totalDays);

    // Get content for each day
    const dayContent = await this.prepareContentForDays(subjectId, chapterId, aiRecommendation, totalDays);

    // Create study plan with days
    const studyPlan = await prisma.studyPlan.create({
      data: {
        studentId,
        subjectId,
        chapterId,
        diagnosticScore,
        weakAreas: aiRecommendation.weakAreas as any,
        aiRecommendedHours: aiRecommendation.totalHours,
        aiAnalysis: aiRecommendation as any,
        totalDays,
        hoursPerDay,
        targetEndDate,
        status: 'ACTIVE',
        studyDays: {
          create: dayContent.map((content, index) => ({
            dayNumber: index + 1,
            status: index === 0 ? 'UNLOCKED' : 'LOCKED',
            youtubeVideoIds: content.videoIds,
            bookContentPageStart: content.pageStart,
            bookContentPageEnd: content.pageEnd,
            practiceQuestionIds: content.questionIds,
            summaryNotes: aiRecommendation.summaryNotes[index] || aiRecommendation.summaryNotes[0] || '',
            estimatedMinutes: Math.round(hoursPerDay * 60),
            videosTotal: content.videoIds.length,
            unlockedAt: index === 0 ? new Date() : null,
          })),
        },
      },
      include: {
        studyDays: true,
        subject: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true, chapterNumber: true } },
      },
    });

    return studyPlan;
  }

  private async prepareContentForDays(
    subjectId: string,
    chapterId: string,
    aiRecommendation: AIStudyRecommendation,
    totalDays: number
  ) {
    const content: { videoIds: string[]; questionIds: string[]; pageStart?: number; pageEnd?: number }[] = [];

    // Get all available questions for this chapter
    const allQuestions = await prisma.question.findMany({
      where: {
        subjectId,
        chapterId,
        isActive: true,
      },
      select: { id: true, topic: true, difficulty: true },
    });

    // Get available videos for this subject
    const allVideos = await prisma.youTubeVideo.findMany({
      where: {
        subjectId,
        status: 'PUBLISHED',
        isActive: true,
      },
      select: { id: true, title: true, description: true },
    });

    // Distribute content across days
    const questionsPerDay = Math.ceil(allQuestions.length / totalDays);
    const videosPerDay = Math.max(1, Math.floor(allVideos.length / totalDays));

    for (let i = 0; i < totalDays; i++) {
      const dayPlan = aiRecommendation.dailyPlan[i] || aiRecommendation.dailyPlan[0];

      // Get questions for this day
      const startQ = i * questionsPerDay;
      const dayQuestions = allQuestions.slice(startQ, startQ + questionsPerDay);

      // Get videos for this day (search by keywords if possible)
      let dayVideos: { id: string }[] = [];
      if (dayPlan?.videoKeywords && dayPlan.videoKeywords.length > 0) {
        // Try to find videos matching keywords
        for (const keyword of dayPlan.videoKeywords) {
          const matchingVideos = allVideos.filter(
            (v) =>
              v.title.toLowerCase().includes(keyword.toLowerCase()) ||
              v.description?.toLowerCase().includes(keyword.toLowerCase())
          );
          dayVideos.push(...matchingVideos);
        }
      }

      // If no keyword matches, use sequential distribution
      if (dayVideos.length === 0) {
        const startV = i * videosPerDay;
        dayVideos = allVideos.slice(startV, startV + videosPerDay);
      }

      // Deduplicate videos
      const uniqueVideoIds = [...new Set(dayVideos.map((v) => v.id))].slice(0, 3);

      content.push({
        videoIds: uniqueVideoIds,
        questionIds: dayQuestions.map((q) => q.id).slice(0, 15), // Max 15 questions per day
        pageStart: undefined,
        pageEnd: undefined,
      });
    }

    return content;
  }

  // ==================== STUDY PLAN CRUD ====================

  async getStudyPlans(studentId: string) {
    const plans = await prisma.studyPlan.findMany({
      where: { studentId },
      include: {
        subject: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true, chapterNumber: true } },
        studyDays: {
          select: {
            id: true,
            dayNumber: true,
            status: true,
            completedAt: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      ...plan,
      completedDays: plan.studyDays.filter((d) => d.status === 'COMPLETED').length,
      progress: Math.round((plan.studyDays.filter((d) => d.status === 'COMPLETED').length / plan.totalDays) * 100),
    }));
  }

  async getStudyPlanDetails(planId: string, studentId: string) {
    const plan = await prisma.studyPlan.findUnique({
      where: { id: planId },
      include: {
        subject: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true, chapterNumber: true, description: true } },
        studyDays: {
          include: {
            dayAttempts: {
              orderBy: { attemptNumber: 'desc' },
              take: 1,
            },
            videoProgress: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!plan || plan.studentId !== studentId) {
      throw new Error('Study plan not found or access denied');
    }

    const totalMinutesSpent = plan.studyDays.reduce((sum, day) => sum + day.actualTimeSpentMinutes, 0);
    const completedDays = plan.studyDays.filter((d) => d.status === 'COMPLETED').length;

    return {
      ...plan,
      progress: {
        completedDays,
        totalDays: plan.totalDays,
        percentComplete: Math.round((completedDays / plan.totalDays) * 100),
        totalMinutesSpent,
        estimatedTotalMinutes: plan.totalDays * Number(plan.hoursPerDay) * 60,
      },
    };
  }

  // ==================== DAY OPERATIONS ====================

  async getStudyDay(studyDayId: string, studentId: string) {
    const day = await prisma.studyPlanDay.findUnique({
      where: { id: studyDayId },
      include: {
        studyPlan: {
          select: {
            id: true,
            studentId: true,
            subjectId: true,
            chapterId: true,
            subject: { select: { name: true } },
            chapter: { select: { name: true, chapterNumber: true } },
          },
        },
        videoProgress: true,
        dayAttempts: {
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!day || day.studyPlan.studentId !== studentId) {
      throw new Error('Study day not found or access denied');
    }

    // Check if day is locked
    if (day.status === 'LOCKED') {
      return {
        ...day,
        videos: [],
        practiceQuestions: [],
        isLocked: true,
        message: 'Complete the previous day to unlock this one',
      };
    }

    // Fetch full content
    const videos = await prisma.youTubeVideo.findMany({
      where: { id: { in: day.youtubeVideoIds } },
      select: {
        id: true,
        title: true,
        youtubeVideoId: true,
        thumbnailUrl: true,
        duration: true,
        description: true,
      },
    });

    const questions = await prisma.question.findMany({
      where: { id: { in: day.practiceQuestionIds } },
      select: {
        id: true,
        questionText: true,
        questionHtml: true,
        questionType: true,
        options: true,
        difficulty: true,
        topic: true,
      },
    });

    // Check if student can take the test
    const canStartTest = day.videosWatched >= day.videosTotal && day.readingCompleted;

    // Check cooldown status
    const lastAttempt = day.dayAttempts[0];
    let cooldownRemaining = 0;
    if (lastAttempt?.status === 'FAILED' && day.nextAttemptAt) {
      const now = new Date();
      if (day.nextAttemptAt > now) {
        cooldownRemaining = Math.ceil((day.nextAttemptAt.getTime() - now.getTime()) / 1000 / 60); // minutes
      }
    }

    return {
      ...day,
      videos: videos.map((v) => ({
        ...v,
        isWatched: day.videoProgress.some((vp) => vp.youtubeVideoId === v.id && vp.isCompleted),
      })),
      practiceQuestions: questions,
      canStartTest,
      cooldownRemaining,
      lastAttemptScore: lastAttempt?.percentage ? Number(lastAttempt.percentage) : null,
    };
  }

  async updateDayProgress(
    studyDayId: string,
    studentId: string,
    updates: {
      videoWatched?: string;
      readingCompleted?: boolean;
      practiceCompleted?: boolean;
      timeSpentMinutes?: number;
    }
  ) {
    const day = await prisma.studyPlanDay.findUnique({
      where: { id: studyDayId },
      include: { studyPlan: true },
    });

    if (!day || day.studyPlan.studentId !== studentId) {
      throw new Error('Access denied');
    }

    if (day.status === 'LOCKED') {
      throw new Error('Cannot update a locked day');
    }

    const updateData: any = {};

    if (updates.videoWatched) {
      // Update video progress
      await prisma.dayVideoProgress.upsert({
        where: {
          studyDayId_youtubeVideoId: {
            studyDayId,
            youtubeVideoId: updates.videoWatched,
          },
        },
        create: {
          studyDayId,
          youtubeVideoId: updates.videoWatched,
          isCompleted: true,
          completedAt: new Date(),
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Recount watched videos
      const watchedCount = await prisma.dayVideoProgress.count({
        where: { studyDayId, isCompleted: true },
      });
      updateData.videosWatched = watchedCount;
    }

    if (updates.readingCompleted !== undefined) {
      updateData.readingCompleted = updates.readingCompleted;
    }

    if (updates.practiceCompleted !== undefined) {
      updateData.practiceCompleted = updates.practiceCompleted;
    }

    if (updates.timeSpentMinutes) {
      updateData.actualTimeSpentMinutes = { increment: updates.timeSpentMinutes };
    }

    // Update day status to IN_PROGRESS if not already
    if (day.status === 'UNLOCKED') {
      updateData.status = 'IN_PROGRESS';
    }

    const updatedDay = await prisma.studyPlanDay.update({
      where: { id: studyDayId },
      data: updateData,
    });

    return updatedDay;
  }

  // ==================== DAY TEST ====================

  async startDayTest(studyDayId: string, studentId: string) {
    const day = await prisma.studyPlanDay.findUnique({
      where: { id: studyDayId },
      include: {
        studyPlan: true,
        dayAttempts: { orderBy: { attemptNumber: 'desc' }, take: 1 },
      },
    });

    if (!day || day.studyPlan.studentId !== studentId) {
      throw new Error('Access denied');
    }

    if (day.status === 'LOCKED') {
      throw new Error('Day is locked');
    }

    // Check if content is completed (for first attempt)
    const lastAttempt = day.dayAttempts[0];
    if (!lastAttempt && (day.videosWatched < day.videosTotal || !day.readingCompleted)) {
      throw new Error('Complete all content before taking the test');
    }

    // Check cooldown for reattempts
    if (lastAttempt?.status === 'FAILED' && day.nextAttemptAt) {
      if (day.nextAttemptAt > new Date()) {
        const remaining = Math.ceil((day.nextAttemptAt.getTime() - Date.now()) / 1000 / 60);
        throw new Error(`Cooldown active. Can retry in ${remaining} minutes`);
      }
    }

    // Determine pass requirement
    const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1;
    const passingPercent = attemptNumber === 1 ? FIRST_ATTEMPT_PASS_PERCENT : REATTEMPT_PASS_PERCENT;

    // Get questions for test
    const questions = await prisma.question.findMany({
      where: { id: { in: day.practiceQuestionIds } },
      take: QUESTIONS_PER_DAY_TEST,
      select: {
        id: true,
        questionText: true,
        questionHtml: true,
        questionType: true,
        options: true,
        marks: true,
      },
    });

    // Shuffle questions
    const shuffledQuestions = this.shuffleArray([...questions]);

    // Create attempt
    const attempt = await prisma.dayAttempt.create({
      data: {
        studyDayId,
        attemptNumber,
        questionCount: shuffledQuestions.length,
        passingPercent,
        responses: {
          create: shuffledQuestions.map((q) => ({
            questionId: q.id,
          })),
        },
      },
    });

    return {
      attemptId: attempt.id,
      attemptNumber,
      passingPercent,
      planId: day.studyPlan.id,
      dayNumber: day.dayNumber,
      questions: shuffledQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionHtml: q.questionHtml,
        options: q.options,
        questionType: q.questionType,
        optionA: (q.options as any)?.A || '',
        optionB: (q.options as any)?.B || '',
        optionC: (q.options as any)?.C || '',
        optionD: (q.options as any)?.D || '',
      })),
      totalQuestions: shuffledQuestions.length,
      timeLimit: 15, // 15 minutes for day test
    };
  }

  async submitDayTest(
    attemptId: string,
    studentId: string,
    responses: { questionId: string; selectedAnswer: string }[]
  ) {
    const attempt = await prisma.dayAttempt.findUnique({
      where: { id: attemptId },
      include: {
        studyDay: { include: { studyPlan: true } },
        responses: { include: { question: true } },
      },
    });

    if (!attempt || attempt.studyDay.studyPlan.studentId !== studentId) {
      throw new Error('Access denied');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new Error('Test already submitted');
    }

    // Grade responses
    let correctCount = 0;
    for (const response of responses) {
      const questionResponse = attempt.responses.find((r) => r.questionId === response.questionId);
      if (!questionResponse) continue;

      const isCorrect = questionResponse.question.correctAnswer === response.selectedAnswer;
      if (isCorrect) correctCount++;

      await prisma.dayAttemptResponse.update({
        where: { id: questionResponse.id },
        data: {
          selectedAnswer: response.selectedAnswer,
          isCorrect,
        },
      });
    }

    const percentage = (correctCount / attempt.questionCount) * 100;
    const passed = percentage >= attempt.passingPercent;

    // Calculate time taken
    const timeTakenSeconds = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

    // Update attempt
    const updatedAttempt = await prisma.dayAttempt.update({
      where: { id: attemptId },
      data: {
        totalScore: correctCount,
        percentage,
        correctAnswers: correctCount,
        submittedAt: new Date(),
        timeTakenSeconds,
        status: passed ? 'PASSED' : 'FAILED',
        cooldownEndsAt: passed ? null : new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000),
      },
    });

    // Update day status based on result
    if (passed) {
      await this.unlockNextDay(attempt.studyDay.studyPlanId, attempt.studyDay.dayNumber);

      await prisma.studyPlanDay.update({
        where: { id: attempt.studyDayId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    } else {
      // Set cooldown and increase pass requirement
      await prisma.studyPlanDay.update({
        where: { id: attempt.studyDayId },
        data: {
          status: 'FAILED',
          currentPassRequirement: REATTEMPT_PASS_PERCENT,
          nextAttemptAt: updatedAttempt.cooldownEndsAt,
        },
      });
    }

    // Check if next day was unlocked
    let nextDayUnlocked = false;
    if (passed) {
      const nextDay = await prisma.studyPlanDay.findFirst({
        where: {
          studyPlanId: attempt.studyDay.studyPlanId,
          dayNumber: attempt.studyDay.dayNumber + 1,
        },
      });
      nextDayUnlocked = !!nextDay;
    }

    return {
      passed,
      percentage: Math.round(percentage),
      correctAnswers: correctCount,
      totalQuestions: attempt.questionCount,
      passingPercent: attempt.passingPercent,
      nextDayUnlocked,
      cooldownEndsAt: updatedAttempt.cooldownEndsAt?.toISOString() || null,
      newPassRequirement: passed ? null : REATTEMPT_PASS_PERCENT,
      timeTakenSeconds,
    };
  }

  private async unlockNextDay(studyPlanId: string, currentDayNumber: number) {
    const nextDay = await prisma.studyPlanDay.findFirst({
      where: {
        studyPlanId,
        dayNumber: currentDayNumber + 1,
      },
    });

    if (nextDay) {
      await prisma.studyPlanDay.update({
        where: { id: nextDay.id },
        data: {
          status: 'UNLOCKED',
          unlockedAt: new Date(),
        },
      });

      await prisma.studyPlan.update({
        where: { id: studyPlanId },
        data: { currentDay: currentDayNumber + 1 },
      });
    } else {
      // All days completed - mark plan as completed
      await prisma.studyPlan.update({
        where: { id: studyPlanId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
  }

  // ==================== PROGRESS TRACKING ====================

  async getStudyPlanProgress(studyPlanId: string, studentId: string) {
    const plan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: {
        studyDays: {
          include: {
            dayAttempts: {
              orderBy: { attemptNumber: 'desc' },
              take: 1,
            },
            videoProgress: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
      },
    });

    if (!plan || plan.studentId !== studentId) {
      throw new Error('Access denied');
    }

    const totalMinutesSpent = plan.studyDays.reduce((sum, day) => sum + day.actualTimeSpentMinutes, 0);
    const completedDays = plan.studyDays.filter((d) => d.status === 'COMPLETED').length;

    return {
      id: plan.id,
      subject: plan.subject.name,
      chapter: plan.chapter.name,
      status: plan.status,
      startDate: plan.startDate,
      targetEndDate: plan.targetEndDate,
      currentDay: plan.currentDay,
      totalDays: plan.totalDays,
      completedDays,
      percentComplete: Math.round((completedDays / plan.totalDays) * 100),
      totalMinutesSpent,
      estimatedTotalMinutes: plan.totalDays * Number(plan.hoursPerDay) * 60,
      days: plan.studyDays.map((day) => ({
        dayNumber: day.dayNumber,
        status: day.status,
        videosWatched: day.videosWatched,
        videosTotal: day.videosTotal,
        readingCompleted: day.readingCompleted,
        practiceCompleted: day.practiceCompleted,
        testScore: day.dayAttempts[0]?.percentage ? Number(day.dayAttempts[0].percentage) : null,
        testPassed: day.dayAttempts[0]?.status === 'PASSED',
        actualTimeSpentMinutes: day.actualTimeSpentMinutes,
      })),
    };
  }

  // Get progress for parent/teacher view
  async getStudentStudyProgress(studentId: string, viewerId: string, viewerRole: string) {
    // Authorization handled at controller level

    const plans = await prisma.studyPlan.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        studyDays: {
          select: {
            dayNumber: true,
            status: true,
            actualTimeSpentMinutes: true,
            completedAt: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      subject: plan.subject.name,
      chapter: plan.chapter.name,
      status: plan.status,
      startDate: plan.startDate,
      targetEndDate: plan.targetEndDate,
      currentDay: plan.currentDay,
      totalDays: plan.totalDays,
      completedDays: plan.studyDays.filter((d) => d.status === 'COMPLETED').length,
      totalTimeSpent: plan.studyDays.reduce((sum, d) => sum + d.actualTimeSpentMinutes, 0),
      aiRecommendedHours: Number(plan.aiRecommendedHours),
      progress: Math.round(
        (plan.studyDays.filter((d) => d.status === 'COMPLETED').length / plan.totalDays) * 100
      ),
    }));
  }

  // ==================== REPORTS ====================

  async getStudentReport(studentId: string) {
    const plans = await prisma.studyPlan.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        studyDays: {
          include: {
            dayAttempts: {
              orderBy: { attemptNumber: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPlans = plans.length;
    const completedPlans = plans.filter((p) => p.status === 'COMPLETED').length;
    const activePlans = plans.filter((p) => p.status === 'ACTIVE').length;

    const totalTestAttempts = plans.reduce(
      (sum, p) => sum + p.studyDays.reduce((daySum, d) => daySum + d.dayAttempts.length, 0),
      0
    );

    const passedTests = plans.reduce(
      (sum, p) =>
        sum + p.studyDays.reduce((daySum, d) => daySum + d.dayAttempts.filter((a) => a.status === 'PASSED').length, 0),
      0
    );

    const totalTimeSpent = plans.reduce(
      (sum, p) => sum + p.studyDays.reduce((daySum, d) => daySum + d.actualTimeSpentMinutes, 0),
      0
    );

    return {
      summary: {
        totalPlans,
        completedPlans,
        activePlans,
        completionRate: totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0,
        totalTestAttempts,
        testPassRate: totalTestAttempts > 0 ? Math.round((passedTests / totalTestAttempts) * 100) : 0,
        totalTimeSpentMinutes: totalTimeSpent,
      },
      plans: plans.map((p) => ({
        id: p.id,
        subject: p.subject.name,
        chapter: p.chapter.name,
        status: p.status,
        diagnosticScore: p.diagnosticScore ? Number(p.diagnosticScore) : null,
        completedDays: p.studyDays.filter((d) => d.status === 'COMPLETED').length,
        totalDays: p.totalDays,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
    };
  }

  async getClassReport(classId: string) {
    // Get all students in this class
    const students = await prisma.student.findMany({
      where: { currentClassId: classId, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studyPlans: {
          include: {
            subject: { select: { name: true } },
            chapter: { select: { name: true } },
            studyDays: true,
          },
        },
      },
    });

    const studentsWithPlans = students.filter((s) => s.studyPlans.length > 0);
    const totalPlansCreated = students.reduce((sum, s) => sum + s.studyPlans.length, 0);
    const completedPlans = students.reduce(
      (sum, s) => sum + s.studyPlans.filter((p) => p.status === 'COMPLETED').length,
      0
    );

    return {
      summary: {
        totalStudents: students.length,
        studentsWithPlans: studentsWithPlans.length,
        adoptionRate: students.length > 0 ? Math.round((studentsWithPlans.length / students.length) * 100) : 0,
        totalPlansCreated,
        completedPlans,
        completionRate: totalPlansCreated > 0 ? Math.round((completedPlans / totalPlansCreated) * 100) : 0,
      },
      students: students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        totalPlans: s.studyPlans.length,
        activePlans: s.studyPlans.filter((p) => p.status === 'ACTIVE').length,
        completedPlans: s.studyPlans.filter((p) => p.status === 'COMPLETED').length,
      })),
    };
  }

  async getAdminReport(schoolId: string) {
    // Get school-wide statistics
    const students = await prisma.student.findMany({
      where: {
        user: { schoolId },
        isActive: true,
      },
      select: {
        id: true,
        _count: { select: { studyPlans: true } },
      },
    });

    const allPlans = await prisma.studyPlan.findMany({
      where: {
        student: { user: { schoolId } },
      },
      include: {
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        studyDays: true,
      },
    });

    const totalStudents = students.length;
    const studentsWithPlans = students.filter((s) => s._count.studyPlans > 0).length;

    // Popular subjects
    const subjectCounts: Record<string, number> = {};
    allPlans.forEach((p) => {
      subjectCounts[p.subject.name] = (subjectCounts[p.subject.name] || 0) + 1;
    });
    const popularSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      summary: {
        totalStudents,
        studentsWithPlans,
        adoptionRate: totalStudents > 0 ? Math.round((studentsWithPlans / totalStudents) * 100) : 0,
        totalPlans: allPlans.length,
        activePlans: allPlans.filter((p) => p.status === 'ACTIVE').length,
        completedPlans: allPlans.filter((p) => p.status === 'COMPLETED').length,
        averageCompletionRate:
          allPlans.length > 0
            ? Math.round(
                (allPlans.reduce(
                  (sum, p) => sum + p.studyDays.filter((d) => d.status === 'COMPLETED').length / p.totalDays,
                  0
                ) /
                  allPlans.length) *
                  100
              )
            : 0,
      },
      popularSubjects,
    };
  }

  // ==================== HELPER METHODS ====================

  private async scoreDiagnosticResponses(responses: DiagnosticResponse[]): Promise<ScoringResult> {
    const questions = await prisma.question.findMany({
      where: { id: { in: responses.map((r) => r.questionId) } },
      select: {
        id: true,
        correctAnswer: true,
        topic: true,
      },
    });

    let correctCount = 0;
    const byTopic = new Map<string, { correct: number; total: number }>();

    for (const response of responses) {
      const question = questions.find((q) => q.id === response.questionId);
      if (!question) continue;

      const topic = question.topic || 'General';
      const topicStats = byTopic.get(topic) || { correct: 0, total: 0 };
      topicStats.total++;

      if (question.correctAnswer === response.selectedAnswer) {
        correctCount++;
        topicStats.correct++;
      }

      byTopic.set(topic, topicStats);
    }

    return {
      percentage: responses.length > 0 ? (correctCount / responses.length) * 100 : 0,
      correctCount,
      totalCount: responses.length,
      byTopic,
    };
  }

  private analyzeWeakAreas(scoringResult: ScoringResult): WeakArea[] {
    const weakAreas: WeakArea[] = [];

    scoringResult.byTopic.forEach((stats, topic) => {
      const score = (stats.correct / stats.total) * 100;
      // Consider weak if below 70%
      if (score < 70) {
        weakAreas.push({
          topic,
          score,
          questionCount: stats.total,
        });
      }
    });

    return weakAreas.sort((a, b) => a.score - b.score);
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export const studyPlannerService = new StudyPlannerService();
