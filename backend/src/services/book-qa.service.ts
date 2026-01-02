import { PrismaClient, Prisma } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Similarity threshold for semantic match (0-1)
const SEMANTIC_THRESHOLD = 0.85;
const MAX_CONTENT_LENGTH = 15000; // Max chars to include in prompt

export interface QAResponse {
  id?: string;
  answer: string;
  answerHtml?: string;
  sourcePages: number[];
  confidence: number;
  cached: boolean;
  cacheType?: 'exact' | 'semantic';
  tokensUsed?: number;
}

export interface PopularQuestion {
  id: string;
  question: string;
  useCount: number;
  lastUsedAt: Date;
}

class BookQAService {
  // Check if AI service is available (key must be set and not a placeholder)
  isAvailable(): boolean {
    const key = process.env.ANTHROPIC_API_KEY || '';
    return key.length > 20 && key.startsWith('sk-ant-');
  }

  // Hash question for exact match lookup
  private hashQuestion(question: string): string {
    // Normalize: lowercase, trim, collapse whitespace
    const normalized = question.toLowerCase().trim().replace(/\s+/g, ' ');
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  // Main method: Ask a question about a book
  async askQuestion(
    bookId: string,
    question: string,
    userId: string
  ): Promise<QAResponse> {
    const questionHash = this.hashQuestion(question);

    // STEP 1: Exact match lookup
    const exactMatch = await prisma.bookQA.findFirst({
      where: {
        bookId,
        questionHash,
        isActive: true,
      },
    });

    if (exactMatch) {
      // Update usage stats
      await prisma.bookQA.update({
        where: { id: exactMatch.id },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return {
        id: exactMatch.id,
        answer: exactMatch.answer,
        answerHtml: exactMatch.answerHtml || exactMatch.answer,
        sourcePages: exactMatch.sourcePages,
        confidence: Number(exactMatch.confidence),
        cached: true,
        cacheType: 'exact',
      };
    }

    // STEP 2: Semantic similarity search
    const semanticMatch = await this.findSemanticMatch(bookId, question);
    if (semanticMatch) {
      // Update usage stats
      await prisma.bookQA.update({
        where: { id: semanticMatch.id },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return {
        id: semanticMatch.id,
        answer: semanticMatch.answer,
        answerHtml: semanticMatch.answerHtml || semanticMatch.answer,
        sourcePages: semanticMatch.sourcePages,
        confidence: Number(semanticMatch.confidence),
        cached: true,
        cacheType: 'semantic',
      };
    }

    // STEP 3: Generate new answer using AI
    return this.generateAnswer(bookId, question, userId, questionHash);
  }

  // Find semantically similar questions (simple implementation)
  private async findSemanticMatch(bookId: string, question: string) {
    // Get recent Q&As for this book with high usage (likely good answers)
    const existingQAs = await prisma.bookQA.findMany({
      where: {
        bookId,
        isActive: true,
        useCount: { gte: 2 }, // Only consider questions asked multiple times
      },
      orderBy: { useCount: 'desc' },
      take: 20,
    });

    if (existingQAs.length === 0) {
      return null;
    }

    // Simple keyword matching for semantic similarity
    // In production, use embeddings with pgvector
    const questionWords = new Set(
      question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    let bestMatch = null;
    let bestScore = 0;

    for (const qa of existingQAs) {
      const qaWords = new Set(
        qa.question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      );

      // Calculate Jaccard similarity
      const intersection = new Set([...questionWords].filter(x => qaWords.has(x)));
      const union = new Set([...questionWords, ...qaWords]);
      const similarity = intersection.size / union.size;

      if (similarity > bestScore && similarity >= SEMANTIC_THRESHOLD) {
        bestScore = similarity;
        bestMatch = qa;
      }
    }

    return bestMatch;
  }

  // Generate a new answer using Claude
  private async generateAnswer(
    bookId: string,
    question: string,
    userId: string,
    questionHash: string
  ): Promise<QAResponse> {
    // Get book content
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        title: true,
        author: true,
        textContent: true,
        subject: { select: { name: true } },
      },
    });

    if (!book) {
      throw new Error('Book not found');
    }

    // Check if AI is available
    if (!this.isAvailable()) {
      // Return a fallback response
      return {
        answer: 'AI service is not available. Please try again later or contact support.',
        sourcePages: [],
        confidence: 0,
        cached: false,
      };
    }

    // Check if book has text content
    if (!book.textContent) {
      return {
        answer: 'This book has not been indexed for AI Q&A yet. Please ask your teacher to index the book.',
        sourcePages: [],
        confidence: 0,
        cached: false,
      };
    }

    // Truncate content if too long
    const content = book.textContent.substring(0, MAX_CONTENT_LENGTH);

    const prompt = `You are a helpful educational assistant. Answer the following question based ONLY on the provided book content.

Book Title: ${book.title}
${book.author ? `Author: ${book.author}` : ''}
${book.subject?.name ? `Subject: ${book.subject.name}` : ''}

Book Content:
${content}

Student's Question: ${question}

Instructions:
1. Answer based ONLY on the information in the book content provided
2. If the answer is not found in the content, clearly say so
3. Be educational and helpful in your explanation
4. Include page references if you can identify them (format: "Page X" or "Pages X-Y")
5. Keep your answer concise but complete

Format your response as JSON with the following structure:
{
  "answer": "Your detailed answer here",
  "sourcePages": [1, 2, 3],
  "confidence": 0.95
}

The confidence should be:
- 0.9-1.0 if the answer is directly found in the text
- 0.7-0.89 if you had to infer or combine information
- 0.5-0.69 if the answer is partially based on the text
- Below 0.5 if the text doesn't really answer the question`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const contentBlock = response.content[0];
      if (contentBlock.type !== 'text') {
        throw new Error('Unexpected response type from AI');
      }

      // Parse JSON response
      let parsed: { answer: string; sourcePages: number[]; confidence: number };
      try {
        const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = {
            answer: contentBlock.text,
            sourcePages: [],
            confidence: 0.7,
          };
        }
      } catch {
        parsed = {
          answer: contentBlock.text,
          sourcePages: [],
          confidence: 0.7,
        };
      }

      // Calculate tokens
      const promptTokens = response.usage?.input_tokens || 0;
      const completionTokens = response.usage?.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;

      // Store in cache
      const savedQA = await prisma.bookQA.create({
        data: {
          bookId,
          question,
          questionHash,
          answer: parsed.answer,
          sourcePages: parsed.sourcePages || [],
          sourceChunks: [],
          confidence: parsed.confidence || 0.7,
          promptTokens,
          completionTokens,
          totalTokens,
          model: 'claude-3-haiku-20240307',
          askedById: userId,
        },
      });

      return {
        id: savedQA.id,
        answer: parsed.answer,
        answerHtml: parsed.answer,
        sourcePages: parsed.sourcePages || [],
        confidence: parsed.confidence || 0.7,
        cached: false,
        tokensUsed: totalTokens,
      };
    } catch (error: any) {
      console.error('AI Q&A error:', error);
      throw new Error(`Failed to generate answer: ${error.message}`);
    }
  }

  // Get Q&A history for a book
  async getBookQAHistory(bookId: string, limit = 20) {
    return prisma.bookQA.findMany({
      where: { bookId, isActive: true },
      select: {
        id: true,
        question: true,
        answer: true,
        sourcePages: true,
        confidence: true,
        useCount: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Get popular questions for a book
  async getPopularQuestions(bookId: string, limit = 10): Promise<PopularQuestion[]> {
    const questions = await prisma.bookQA.findMany({
      where: {
        bookId,
        isActive: true,
        useCount: { gte: 2 },
      },
      select: {
        id: true,
        question: true,
        useCount: true,
        lastUsedAt: true,
      },
      orderBy: { useCount: 'desc' },
      take: limit,
    });

    return questions;
  }

  // Get user's Q&A history
  async getUserQAHistory(userId: string, limit = 50) {
    return prisma.bookQA.findMany({
      where: { askedById: userId, isActive: true },
      include: {
        book: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Delete a Q&A (soft delete)
  async deleteQA(id: string) {
    return prisma.bookQA.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Get Q&A statistics
  async getStats(bookId?: string) {
    const where = bookId ? { bookId, isActive: true } : { isActive: true };

    const [totalQuestions, totalTokens, avgConfidence] = await Promise.all([
      prisma.bookQA.count({ where }),
      prisma.bookQA.aggregate({
        where,
        _sum: { totalTokens: true },
      }),
      prisma.bookQA.aggregate({
        where,
        _avg: { confidence: true },
      }),
    ]);

    return {
      totalQuestions,
      totalTokens: totalTokens._sum.totalTokens || 0,
      avgConfidence: avgConfidence._avg.confidence
        ? Number(avgConfidence._avg.confidence)
        : 0,
    };
  }
}

export const bookQAService = new BookQAService();
