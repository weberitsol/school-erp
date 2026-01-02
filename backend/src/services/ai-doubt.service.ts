import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

// Initialize Anthropic client (requires ANTHROPIC_API_KEY env variable)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ExplanationResponse {
  explanation: string;
  concept: string;
  formula?: string;
  steps: string[];
  commonMistake?: string;
  tip?: string;
}

interface ShortcutResponse {
  shortcuts: {
    title: string;
    description: string;
    example?: string;
  }[];
  timeEstimate: string;
  applicableTo: string[];
}

class AIDoubtService {
  // Check if AI service is available
  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  // Explain a question with AI
  async explainQuestion(questionId: string, studentQuery?: string): Promise<ExplanationResponse> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: { select: { name: true } },
        chapterRef: { select: { name: true } },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Build context
    const optionsText = question.options
      ? (question.options as any[]).map((o: any) => `${o.id}) ${o.text}`).join('\n')
      : '';

    const prompt = `You are an expert tutor helping a student understand a ${question.subject.name} question.

Question:
${question.questionText}

${optionsText ? `Options:\n${optionsText}` : ''}

Correct Answer: ${question.correctAnswer}

${question.answerExplanation ? `Given Explanation: ${question.answerExplanation}` : ''}

Chapter: ${question.chapterRef?.name || question.chapter || 'Not specified'}
Topic: ${question.topic || 'Not specified'}
Difficulty: ${question.difficulty}

${studentQuery ? `Student's specific doubt: ${studentQuery}` : ''}

Please provide:
1. A clear, step-by-step explanation of how to solve this question
2. The main concept being tested
3. Any relevant formula or rule (if applicable)
4. A common mistake students make with this type of question
5. A helpful tip or shortcut

Format your response as JSON with the following structure:
{
  "explanation": "detailed explanation here",
  "concept": "main concept name",
  "formula": "relevant formula if any",
  "steps": ["step 1", "step 2", "..."],
  "commonMistake": "common error students make",
  "tip": "helpful tip or trick"
}`;

    if (!this.isAvailable()) {
      // Return a fallback response if AI is not available
      return this.getFallbackExplanation(question);
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Parse JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ExplanationResponse;
      }

      // Fallback if JSON parsing fails
      return {
        explanation: content.text,
        concept: question.topic || 'General',
        steps: [content.text],
      };
    } catch (error) {
      console.error('AI explanation error:', error);
      return this.getFallbackExplanation(question);
    }
  }

  // Get shortcuts and tricks for a question
  async getShortcutsTricks(questionId: string): Promise<ShortcutResponse> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: { select: { name: true } },
        chapterRef: { select: { name: true } },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const prompt = `You are an expert competitive exam tutor. Provide shortcuts and tricks for solving this ${question.subject.name} question quickly.

Question:
${question.questionText}

Question Type: ${question.questionType}
Topic: ${question.topic || question.chapterRef?.name || 'General'}

Provide practical shortcuts that can help solve similar questions faster in competitive exams like JEE/NEET.

Format your response as JSON:
{
  "shortcuts": [
    {
      "title": "shortcut name",
      "description": "how to use it",
      "example": "quick example if applicable"
    }
  ],
  "timeEstimate": "estimated time to solve using shortcuts",
  "applicableTo": ["list of similar question types this works for"]
}`;

    if (!this.isAvailable()) {
      return this.getFallbackShortcuts(question);
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ShortcutResponse;
      }

      return {
        shortcuts: [{ title: 'General Approach', description: content.text }],
        timeEstimate: '2-3 minutes',
        applicableTo: [question.questionType],
      };
    } catch (error) {
      console.error('AI shortcuts error:', error);
      return this.getFallbackShortcuts(question);
    }
  }

  // Get similar questions for practice
  async getSimilarQuestions(questionId: string, limit = 5) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        subjectId: true,
        chapterId: true,
        topic: true,
        questionType: true,
        difficulty: true,
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Find similar questions based on chapter, topic, and difficulty
    const similarQuestions = await prisma.question.findMany({
      where: {
        id: { not: questionId },
        subjectId: question.subjectId,
        isActive: true,
        OR: [
          { chapterId: question.chapterId },
          { topic: question.topic },
          {
            AND: [
              { questionType: question.questionType },
              { difficulty: question.difficulty },
            ],
          },
        ],
      },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        difficulty: true,
        topic: true,
        chapterRef: { select: { name: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return similarQuestions.map((q) => ({
      id: q.id,
      questionText: q.questionText.substring(0, 150) + '...',
      questionType: q.questionType,
      difficulty: q.difficulty,
      topic: q.topic,
      chapter: q.chapterRef?.name,
    }));
  }

  // Analyze why an answer was wrong
  async analyzeWrongAnswer(
    questionId: string,
    selectedAnswer: string,
    correctAnswer: string
  ): Promise<{ analysis: string; conceptGap: string; suggestion: string }> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const optionsText = question.options
      ? (question.options as any[]).map((o: any) => `${o.id}) ${o.text}`).join('\n')
      : '';

    const prompt = `Analyze why a student might have selected the wrong answer for this question.

Question: ${question.questionText}

${optionsText ? `Options:\n${optionsText}` : ''}

Student's Answer: ${selectedAnswer}
Correct Answer: ${correctAnswer}

Provide:
1. A brief analysis of why the student might have chosen the wrong answer
2. The concept gap that likely caused this mistake
3. A suggestion for improvement

Format as JSON:
{
  "analysis": "why the student likely chose this answer",
  "conceptGap": "the concept they need to understand better",
  "suggestion": "what they should study or practice"
}`;

    if (!this.isAvailable()) {
      return {
        analysis: 'Unable to provide AI analysis. Please review the question and compare your answer with the correct one.',
        conceptGap: 'Review the fundamental concepts related to this topic.',
        suggestion: 'Practice more questions from this chapter.',
      };
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        analysis: content.text,
        conceptGap: 'Please review the explanation above.',
        suggestion: 'Practice similar questions to strengthen your understanding.',
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        analysis: 'Unable to provide AI analysis at this time.',
        conceptGap: 'Review the fundamental concepts related to this topic.',
        suggestion: 'Practice more questions from this chapter.',
      };
    }
  }

  // Private helper methods
  private getFallbackExplanation(question: any): ExplanationResponse {
    return {
      explanation: question.answerExplanation || 'No detailed explanation available. Please refer to your textbook or ask your teacher.',
      concept: question.topic || question.chapterRef?.name || 'General',
      steps: question.answerExplanation
        ? [question.answerExplanation]
        : ['Review the question carefully', 'Apply relevant concepts', 'Check your answer'],
    };
  }

  private getFallbackShortcuts(question: any): ShortcutResponse {
    const shortcuts: ShortcutResponse['shortcuts'] = [];

    switch (question.questionType) {
      case 'SINGLE_CORRECT':
      case 'MCQ':
        shortcuts.push({
          title: 'Elimination Method',
          description: 'Eliminate obviously wrong options first to narrow down choices.',
        });
        break;
      case 'INTEGER_TYPE':
        shortcuts.push({
          title: 'Dimensional Analysis',
          description: 'Check if your answer has the correct units/dimensions.',
        });
        break;
      case 'ASSERTION_REASONING':
        shortcuts.push({
          title: 'Evaluate Independently',
          description: 'First determine if each statement is true/false independently, then check the relationship.',
        });
        break;
      default:
        shortcuts.push({
          title: 'Read Carefully',
          description: 'Read the question twice to understand what is being asked.',
        });
    }

    return {
      shortcuts,
      timeEstimate: '1-2 minutes',
      applicableTo: [question.questionType],
    };
  }
}

export const aiDoubtService = new AIDoubtService();
