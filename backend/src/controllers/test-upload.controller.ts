import { Request, Response } from 'express';
import { testUploadService } from '../services/test-upload.service';
import { wordParserService, ParsedQuestion } from '../services/word-parser.service';
import Anthropic from '@anthropic-ai/sdk';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ==================== UPLOAD & PARSE ====================

/**
 * POST /api/tests/upload/parse
 * Upload a Word file and parse it for preview
 */
export const uploadAndParse = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { patternId } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Validate file type
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.docx', '.doc'].includes(ext)) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only .docx and .doc files are supported',
      });
    }

    const result = await testUploadService.uploadAndParse(
      { path: file.path, originalname: file.originalname },
      patternId
    );

    res.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Upload and parse error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to parse document',
    });
  }
};

/**
 * POST /api/tests/upload/parse-text
 * Parse raw text (for testing or copy-paste scenarios)
 */
export const parseText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'No text provided',
      });
    }

    // Create a temporary file with the text
    const tempPath = path.join(process.cwd(), 'uploads', 'temp', `${Date.now()}.txt`);
    const tempDir = path.dirname(tempPath);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempPath, text);

    // For raw text, we'll parse it directly
    const lines = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line);
    const parseResult = await wordParserService.parseWordDocument(tempPath);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    res.json({
      success: true,
      data: parseResult,
    });

  } catch (error: any) {
    console.error('Parse text error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to parse text',
    });
  }
};

// ==================== PREVIEW & EDIT ====================

/**
 * PUT /api/tests/upload/questions/:questionId
 * Update a parsed question before creating test
 */
export const updateParsedQuestion = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const { questions, updates } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required',
      });
    }

    const updatedQuestions = await testUploadService.updateParsedQuestion(
      questions,
      questionId,
      updates
    );

    res.json({
      success: true,
      data: updatedQuestions,
    });

  } catch (error: any) {
    console.error('Update parsed question error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update question',
    });
  }
};

/**
 * DELETE /api/tests/upload/questions/:questionId
 * Remove a parsed question from preview
 */
export const deleteParsedQuestion = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required',
      });
    }

    const updatedQuestions = await testUploadService.deleteParsedQuestion(
      questions,
      questionId
    );

    res.json({
      success: true,
      data: updatedQuestions,
    });

  } catch (error: any) {
    console.error('Delete parsed question error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete question',
    });
  }
};

// ==================== CREATE TEST ====================

/**
 * POST /api/tests/upload/create
 * Create test from parsed questions
 */
export const createTestFromParsed = async (req: Request, res: Response) => {
  try {
    const {
      questions,
      passages,
      patternId,
      subjectId,
      subjectIds, // Array of subject IDs for multi-subject tests
      classId,
      sectionId,
      testName,
      description,
      instructions,
      durationMinutes,
      startDateTime,
      endDateTime,
      shuffleQuestions,
      shuffleOptions,
      showResultsImmediately,
      maxAttempts,
      marksConfig,
      saveToQuestionBank,
      questionBankChapterId,
    } = req.body;

    const user = (req as any).user;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required',
      });
    }

    if (!subjectId || !classId || !testName || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subjectId, classId, testName, durationMinutes',
      });
    }

    const result = await testUploadService.createTestFromParsed({
      questions,
      passages,
      patternId,
      subjectId,
      subjectIds, // Pass all subject IDs for multi-subject tests
      classId,
      sectionId,
      testName,
      description,
      instructions,
      durationMinutes,
      startDateTime: startDateTime ? new Date(startDateTime) : undefined,
      endDateTime: endDateTime ? new Date(endDateTime) : undefined,
      shuffleQuestions,
      shuffleOptions,
      showResultsImmediately,
      maxAttempts,
      marksConfig,
      saveToQuestionBank,
      questionBankChapterId,
      createdById: user.id,
      schoolId: user.schoolId,
    });

    res.json({
      success: true,
      message: 'Test created successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('Create test from parsed error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create test',
    });
  }
};

// ==================== PATTERNS ====================

/**
 * GET /api/tests/upload/patterns
 * Get available patterns for test creation
 */
export const getAvailablePatterns = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.query;

    const patterns = await testUploadService.getAvailablePatterns(
      subjectId as string | undefined
    );

    res.json({
      success: true,
      data: patterns,
    });

  } catch (error: any) {
    console.error('Get patterns error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get patterns',
    });
  }
};

// ==================== SCHOOL QUESTION BANK ====================

/**
 * GET /api/tests/question-bank
 * Get school's question bank
 */
export const getSchoolQuestionBank = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subjectId, chapterId, questionType, search, page, limit } = req.query;

    const result = await testUploadService.getSchoolQuestionBank(
      user.schoolId,
      {
        subjectId: subjectId as string,
        chapterId: chapterId as string,
        questionType: questionType as string,
        search: search as string,
      },
      {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      }
    );

    res.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Get question bank error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get question bank',
    });
  }
};

// ==================== AI VERIFICATION ====================

interface AIVerificationResult {
  questionNumber: number;
  isCorrect: boolean;
  confidence: 'high' | 'medium' | 'low';
  aiSolution?: string;
  suggestedAnswer?: string;
  reasoning?: string;
}

/**
 * POST /api/tests/upload/verify-with-ai
 * Verify parsed questions with AI
 */
export const verifyQuestionsWithAI = async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required',
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not available. Please configure ANTHROPIC_API_KEY.',
      });
    }

    const verificationResults: AIVerificationResult[] = [];

    // Process questions in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      const batchPromises = batch.map(async (q: any) => {
        try {
          const optionsText = q.options
            ? q.options.map((o: any) => `${o.id}) ${o.text}`).join('\n')
            : '';

          const prompt = `You are an expert educator verifying a multiple choice question.

Question ${q.questionNumber}:
${q.questionText}

Options:
${optionsText}

Given correct answer: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}

${q.solution ? `Given solution: ${q.solution}` : ''}

Please verify:
1. Is the given correct answer actually correct?
2. Provide a step-by-step solution
3. Rate your confidence (high/medium/low)

Respond ONLY with valid JSON in this exact format (no other text):
{
  "isCorrect": true or false,
  "confidence": "high" or "medium" or "low",
  "suggestedAnswer": "the correct answer option letter(s)",
  "reasoning": "brief explanation of why",
  "aiSolution": "step-by-step solution"
}`;

          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }],
          });

          const content = response.content[0];
          if (content.type !== 'text') {
            throw new Error('Unexpected response type');
          }

          // Parse JSON from response
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              questionNumber: q.questionNumber,
              isCorrect: parsed.isCorrect,
              confidence: parsed.confidence || 'medium',
              aiSolution: parsed.aiSolution,
              suggestedAnswer: parsed.suggestedAnswer,
              reasoning: parsed.reasoning,
            } as AIVerificationResult;
          }

          return {
            questionNumber: q.questionNumber,
            isCorrect: true,
            confidence: 'low' as const,
            reasoning: 'Could not parse AI response',
          };
        } catch (err: any) {
          console.error(`Error verifying question ${q.questionNumber}:`, err.message);
          return {
            questionNumber: q.questionNumber,
            isCorrect: true, // Assume correct if verification fails
            confidence: 'low' as const,
            reasoning: 'Verification failed: ' + err.message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      verificationResults.push(...batchResults);

      // Add small delay between batches to avoid rate limits
      if (i + batchSize < questions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    res.json({
      success: true,
      data: {
        verificationResults,
        summary: {
          total: questions.length,
          verified: verificationResults.filter(r => r.isCorrect).length,
          needsReview: verificationResults.filter(r => !r.isCorrect).length,
          highConfidence: verificationResults.filter(r => r.confidence === 'high').length,
          mediumConfidence: verificationResults.filter(r => r.confidence === 'medium').length,
          lowConfidence: verificationResults.filter(r => r.confidence === 'low').length,
        },
      },
    });

  } catch (error: any) {
    console.error('AI verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify questions with AI',
    });
  }
};
