import prisma from '../config/database';
import Anthropic from '@anthropic-ai/sdk';

// ==================== Types ====================

interface QuestionOption {
  id: string;
  text: string;
}

interface CreateQuestionDto {
  videoId: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  sequenceOrder?: number;
}

interface UpdateQuestionDto {
  questionText?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  sequenceOrder?: number;
  isActive?: boolean;
}

interface GeneratedQuestion {
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
}

// ==================== Video Question Service ====================

export class VideoQuestionService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  // ==================== CRUD Operations ====================

  // Create a question
  async createQuestion(data: CreateQuestionDto) {
    // Get the highest sequence order for this video
    const maxOrder = await prisma.videoComprehensionQuestion.findFirst({
      where: { videoId: data.videoId },
      orderBy: { sequenceOrder: 'desc' },
      select: { sequenceOrder: true },
    });

    const question = await prisma.videoComprehensionQuestion.create({
      data: {
        videoId: data.videoId,
        questionText: data.questionText,
        options: data.options as any,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        sequenceOrder: data.sequenceOrder ?? (maxOrder?.sequenceOrder ?? 0) + 1,
        isAIGenerated: false,
      },
    });

    return question;
  }

  // Update a question
  async updateQuestion(id: string, data: UpdateQuestionDto) {
    const question = await prisma.videoComprehensionQuestion.update({
      where: { id },
      data: {
        questionText: data.questionText,
        options: data.options as any,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        sequenceOrder: data.sequenceOrder,
        isActive: data.isActive,
      },
    });

    return question;
  }

  // Delete a question (soft delete)
  async deleteQuestion(id: string) {
    await prisma.videoComprehensionQuestion.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }

  // Get all questions for a video
  async getQuestionsForVideo(videoId: string) {
    const questions = await prisma.videoComprehensionQuestion.findMany({
      where: {
        videoId,
        isActive: true,
      },
      orderBy: { sequenceOrder: 'asc' },
    });

    return questions;
  }

  // Get question by ID
  async getQuestionById(id: string) {
    const question = await prisma.videoComprehensionQuestion.findUnique({
      where: { id },
    });

    return question;
  }

  // ==================== AI Question Generation ====================

  // Generate questions using AI
  async generateQuestionsWithAI(videoId: string, count: number = 4): Promise<GeneratedQuestion[]> {
    if (!this.anthropic) {
      throw new Error('AI service not configured. Please set ANTHROPIC_API_KEY.');
    }

    // Get video details
    const video = await prisma.youTubeVideo.findUnique({
      where: { id: videoId },
      include: { subject: true },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    const prompt = `You are an educational content expert. Generate ${count} comprehension questions for a video with the following details:

Title: ${video.title}
Subject: ${video.subject?.name || 'General'}
Description: ${video.description || 'No description available'}

Generate multiple choice questions that:
1. Test understanding of the video content based on the title and description
2. Have 4 options (a, b, c, d)
3. Have one clear correct answer
4. Include brief explanations for the correct answer
5. Are appropriate for students studying this subject
6. Range from basic recall to conceptual understanding

Return ONLY a valid JSON array with this exact structure (no additional text):
[
  {
    "questionText": "Question text here?",
    "options": [
      {"id": "a", "text": "Option A text"},
      {"id": "b", "text": "Option B text"},
      {"id": "c", "text": "Option C text"},
      {"id": "d", "text": "Option D text"}
    ],
    "correctAnswer": "a",
    "explanation": "Brief explanation of why this is correct"
  }
]`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from AI');
      }

      // Parse JSON response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response as JSON');
      }

      const questions: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

      return questions;
    } catch (error: any) {
      console.error('AI question generation error:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  // Generate and save questions for a video
  async generateAndSaveQuestions(videoId: string, count: number = 4) {
    const generatedQuestions = await this.generateQuestionsWithAI(videoId, count);

    // Get the highest sequence order for this video
    const maxOrder = await prisma.videoComprehensionQuestion.findFirst({
      where: { videoId },
      orderBy: { sequenceOrder: 'desc' },
      select: { sequenceOrder: true },
    });

    let sequenceOrder = (maxOrder?.sequenceOrder ?? 0) + 1;

    const savedQuestions = [];

    for (const q of generatedQuestions) {
      const question = await prisma.videoComprehensionQuestion.create({
        data: {
          videoId,
          questionText: q.questionText,
          options: q.options as any,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          sequenceOrder: sequenceOrder++,
          isAIGenerated: true,
        },
      });

      savedQuestions.push(question);
    }

    return savedQuestions;
  }

  // Check if video needs AI-generated questions
  async needsAIQuestions(videoId: string, minQuestions: number = 2): Promise<boolean> {
    const count = await prisma.videoComprehensionQuestion.count({
      where: {
        videoId,
        isActive: true,
      },
    });

    return count < minQuestions;
  }

  // Ensure video has enough questions (auto-generate if needed)
  async ensureMinimumQuestions(videoId: string, minQuestions: number = 2) {
    const existingCount = await prisma.videoComprehensionQuestion.count({
      where: {
        videoId,
        isActive: true,
      },
    });

    if (existingCount >= minQuestions) {
      return { generated: false, existingCount };
    }

    const neededCount = minQuestions - existingCount;

    try {
      const generated = await this.generateAndSaveQuestions(videoId, neededCount + 2); // Generate a few extra
      return {
        generated: true,
        existingCount,
        newQuestions: generated.length,
      };
    } catch (error) {
      console.error('Failed to auto-generate questions:', error);
      return { generated: false, existingCount, error: 'AI generation failed' };
    }
  }
}

export const videoQuestionService = new VideoQuestionService();
