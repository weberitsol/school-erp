import { PrismaClient, PatternType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== PATTERN INTERFACES ====================

export interface QuestionTypeConfig {
  type: string;           // SINGLE_CORRECT, MULTIPLE_CORRECT, INTEGER_TYPE, etc.
  count: number;
  marksPerQuestion: number;
  negativeMarks: number;
  partialMarking?: boolean;
  requiredAttempts?: number;  // For "5 out of 10" scenarios - if not set, all questions required
}

export interface PatternSection {
  name: string;           // "Physics", "Chemistry", "Biology", "Mathematics"
  subjectCode?: string;   // "PHY", "CHEM", "BIO", "MATH"
  questionTypes: QuestionTypeConfig[];
  totalMarks: number;
  duration: number;       // in minutes
  // Question range for Word file mapping
  questionRange?: {
    start: number;        // Q1
    end: number;          // Q20
  };
  // For "5 out of 10" at section level
  requiredAttempts?: number;
}

export interface ScoringRules {
  [questionType: string]: {
    marks: number;
    negative: number;
    partial?: boolean;
  };
}

export interface CreatePatternDto {
  name: string;
  description?: string;
  patternType?: PatternType;
  subjectId?: string;
  sections: PatternSection[];
  scoringRules: ScoringRules;
  createdById?: string;
}

export interface UpdatePatternDto {
  name?: string;
  description?: string;
  sections?: PatternSection[];
  scoringRules?: ScoringRules;
  isActive?: boolean;
}

// ==================== DEFAULT PATTERNS ====================

export const JEE_MAIN_PATTERN: Omit<CreatePatternDto, 'createdById'> = {
  name: 'JEE Main Pattern',
  description: 'Standard JEE Main examination pattern with 75 questions across Physics, Chemistry, and Mathematics',
  patternType: 'JEE_MAIN',
  sections: [
    {
      name: 'Physics',
      subjectCode: 'PHY',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 20, marksPerQuestion: 4, negativeMarks: 1 },
        { type: 'INTEGER_TYPE', count: 5, marksPerQuestion: 4, negativeMarks: 0 },
      ],
      totalMarks: 100,
      duration: 60,
    },
    {
      name: 'Chemistry',
      subjectCode: 'CHEM',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 20, marksPerQuestion: 4, negativeMarks: 1 },
        { type: 'INTEGER_TYPE', count: 5, marksPerQuestion: 4, negativeMarks: 0 },
      ],
      totalMarks: 100,
      duration: 60,
    },
    {
      name: 'Mathematics',
      subjectCode: 'MATH',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 20, marksPerQuestion: 4, negativeMarks: 1 },
        { type: 'INTEGER_TYPE', count: 5, marksPerQuestion: 4, negativeMarks: 0 },
      ],
      totalMarks: 100,
      duration: 60,
    },
  ],
  scoringRules: {
    SINGLE_CORRECT: { marks: 4, negative: 1 },
    INTEGER_TYPE: { marks: 4, negative: 0 },
  },
};

export const JEE_ADVANCED_PATTERN: Omit<CreatePatternDto, 'createdById'> = {
  name: 'JEE Advanced Pattern',
  description: 'JEE Advanced examination pattern with multiple question types including Matrix Match',
  patternType: 'JEE_ADVANCED',
  sections: [
    {
      name: 'Physics',
      subjectCode: 'PHY',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 6, marksPerQuestion: 3, negativeMarks: 1 },
        { type: 'MULTIPLE_CORRECT', count: 6, marksPerQuestion: 4, negativeMarks: 2, partialMarking: true },
        { type: 'INTEGER_TYPE', count: 6, marksPerQuestion: 3, negativeMarks: 0 },
        { type: 'MATRIX_MATCH', count: 2, marksPerQuestion: 3, negativeMarks: 1, partialMarking: true },
      ],
      totalMarks: 60,
      duration: 60,
    },
    {
      name: 'Chemistry',
      subjectCode: 'CHEM',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 6, marksPerQuestion: 3, negativeMarks: 1 },
        { type: 'MULTIPLE_CORRECT', count: 6, marksPerQuestion: 4, negativeMarks: 2, partialMarking: true },
        { type: 'INTEGER_TYPE', count: 6, marksPerQuestion: 3, negativeMarks: 0 },
        { type: 'MATRIX_MATCH', count: 2, marksPerQuestion: 3, negativeMarks: 1, partialMarking: true },
      ],
      totalMarks: 60,
      duration: 60,
    },
    {
      name: 'Mathematics',
      subjectCode: 'MATH',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 6, marksPerQuestion: 3, negativeMarks: 1 },
        { type: 'MULTIPLE_CORRECT', count: 6, marksPerQuestion: 4, negativeMarks: 2, partialMarking: true },
        { type: 'INTEGER_TYPE', count: 6, marksPerQuestion: 3, negativeMarks: 0 },
        { type: 'MATRIX_MATCH', count: 2, marksPerQuestion: 3, negativeMarks: 1, partialMarking: true },
      ],
      totalMarks: 60,
      duration: 60,
    },
  ],
  scoringRules: {
    SINGLE_CORRECT: { marks: 3, negative: 1 },
    MULTIPLE_CORRECT: { marks: 4, negative: 2, partial: true },
    INTEGER_TYPE: { marks: 3, negative: 0 },
    MATRIX_MATCH: { marks: 3, negative: 1, partial: true },
  },
};

export const NEET_PATTERN: Omit<CreatePatternDto, 'createdById'> = {
  name: 'NEET Pattern',
  description: 'NEET UG examination pattern with 180 questions across Physics, Chemistry, and Biology',
  patternType: 'NEET',
  sections: [
    {
      name: 'Physics',
      subjectCode: 'PHY',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
        { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
      ],
      totalMarks: 180,
      duration: 60,
    },
    {
      name: 'Chemistry',
      subjectCode: 'CHEM',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
        { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
      ],
      totalMarks: 180,
      duration: 60,
    },
    {
      name: 'Biology (Botany)',
      subjectCode: 'BOT',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
        { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
      ],
      totalMarks: 180,
      duration: 60,
    },
    {
      name: 'Biology (Zoology)',
      subjectCode: 'ZOO',
      questionTypes: [
        { type: 'SINGLE_CORRECT', count: 35, marksPerQuestion: 4, negativeMarks: 1 },
        { type: 'ASSERTION_REASONING', count: 10, marksPerQuestion: 4, negativeMarks: 1 },
      ],
      totalMarks: 180,
      duration: 60,
    },
  ],
  scoringRules: {
    SINGLE_CORRECT: { marks: 4, negative: 1 },
    ASSERTION_REASONING: { marks: 4, negative: 1 },
  },
};

// ==================== PATTERN SERVICE ====================

// Frontend section format (simpler, user-friendly)
interface FrontendSection {
  name: string;
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarks: number;
  questionTypes: string[]; // Just type names: ['SINGLE_CORRECT', 'MULTIPLE_CORRECT']
  questionRange?: { start: number; end: number };
  duration?: number;
  partialMarking?: boolean;
  isOptional?: boolean;
  optionalCount?: number;
}

class PatternService {
  // Normalize section data to handle both frontend and backend formats
  private normalizeSections(sections: any[]): any[] {
    return sections.map((section: any) => {
      // Check if this is the frontend format (questionTypes is array of strings)
      if (Array.isArray(section.questionTypes) && typeof section.questionTypes[0] === 'string') {
        // Frontend format - convert to normalized storage format
        return {
          name: section.name,
          subjectId: section.subjectId,
          subjectCode: section.subjectCode,
          subjectName: section.subjectName,
          questionCount: section.questionCount || 25,
          marksPerQuestion: section.marksPerQuestion || 4,
          negativeMarks: section.negativeMarks || 0,
          questionTypes: section.questionTypes, // Keep as string array
          questionRange: section.questionRange,
          duration: section.duration || 60,
          partialMarking: section.partialMarking || false,
          isOptional: section.isOptional || false,
          optionalCount: section.optionalCount || 0,
          // Computed total marks for this section
          totalMarks: (section.questionCount || 25) * (section.marksPerQuestion || 4),
        };
      }
      // Already in backend format or normalized - return as is
      return section;
    });
  }

  // Calculate totals from sections (supports both formats)
  private calculateTotals(sections: any[]): {
    totalMarks: number;
    totalQuestions: number;
    totalDuration: number;
  } {
    let totalMarks = 0;
    let totalQuestions = 0;
    let totalDuration = 0;

    for (const section of sections) {
      // Handle new frontend format (questionCount + marksPerQuestion)
      if (typeof section.questionCount === 'number') {
        totalQuestions += section.questionCount;
        totalMarks += section.questionCount * (section.marksPerQuestion || 4);
        totalDuration += section.duration || 60;
      }
      // Handle old backend format (questionTypes with count property)
      else if (Array.isArray(section.questionTypes) && section.questionTypes[0]?.count) {
        totalDuration += section.duration || 60;
        for (const qt of section.questionTypes) {
          totalQuestions += qt.count;
          totalMarks += qt.count * qt.marksPerQuestion;
        }
      }
    }

    return { totalMarks, totalQuestions, totalDuration };
  }

  // Create pattern
  async createPattern(data: any) {
    // Normalize sections to standard format
    const normalizedSections = this.normalizeSections(data.sections || []);
    const totals = this.calculateTotals(normalizedSections);

    // Normalize scoring rules
    const scoringRules = data.scoringRules || {
      partialMarking: false,
      negativeMarkingEnabled: true,
    };

    const pattern = await prisma.testPattern.create({
      data: {
        name: data.name,
        description: data.description,
        patternType: data.patternType || 'CUSTOM',
        isDefault: false, // User-created patterns are never default
        subjectId: data.subjectId,
        sections: normalizedSections as unknown as Prisma.InputJsonValue,
        scoringRules: scoringRules as unknown as Prisma.InputJsonValue,
        totalMarks: data.totalMarks || totals.totalMarks,
        totalQuestions: data.totalQuestions || totals.totalQuestions,
        totalDuration: data.totalDuration || totals.totalDuration,
        createdById: data.createdById,
      },
    });

    return pattern;
  }

  // Get all patterns
  async getPatterns(filters: {
    patternType?: PatternType;
    isDefault?: boolean;
    subjectId?: string;
    search?: string;
    isActive?: boolean;
  } = {}) {
    const { patternType, isDefault, subjectId, search, isActive = true } = filters;

    const where: Prisma.TestPatternWhereInput = {
      isActive,
      ...(patternType && { patternType }),
      ...(isDefault !== undefined && { isDefault }),
      ...(subjectId && { subjectId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const patterns = await prisma.testPattern.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { tests: true } },
      },
    });

    return patterns;
  }

  // Get pattern by ID
  async getPatternById(id: string) {
    return prisma.testPattern.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { tests: true } },
      },
    });
  }

  // Get default patterns
  async getDefaultPatterns() {
    return prisma.testPattern.findMany({
      where: { isDefault: true, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // Update pattern
  async updatePattern(id: string, data: UpdatePatternDto) {
    const updateData: any = { ...data };

    if (data.sections) {
      // Normalize sections to handle both frontend and backend formats
      const normalizedSections = this.normalizeSections(data.sections);
      updateData.sections = normalizedSections as unknown as Prisma.InputJsonValue;

      const totals = this.calculateTotals(normalizedSections);
      updateData.totalMarks = totals.totalMarks;
      updateData.totalQuestions = totals.totalQuestions;
      updateData.totalDuration = totals.totalDuration;
    }

    return prisma.testPattern.update({
      where: { id },
      data: updateData,
    });
  }

  // Delete pattern (soft)
  async deletePattern(id: string) {
    // Check if pattern is used by any tests
    const usageCount = await prisma.onlineTest.count({
      where: { patternId: id },
    });

    if (usageCount > 0) {
      throw new Error(`Cannot delete pattern: it is used by ${usageCount} tests`);
    }

    return prisma.testPattern.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Seed default patterns
  async seedDefaultPatterns() {
    const existingPatterns = await prisma.testPattern.findMany({
      where: { isDefault: true },
    });

    const results = {
      created: [] as string[],
      skipped: [] as string[],
    };

    const defaultPatterns = [JEE_MAIN_PATTERN, JEE_ADVANCED_PATTERN, NEET_PATTERN];

    for (const patternData of defaultPatterns) {
      const exists = existingPatterns.some((p) => p.patternType === patternData.patternType);

      if (exists) {
        results.skipped.push(patternData.name);
        continue;
      }

      const totals = this.calculateTotals(patternData.sections);

      await prisma.testPattern.create({
        data: {
          name: patternData.name,
          description: patternData.description,
          patternType: patternData.patternType || 'CUSTOM',
          isDefault: true,
          sections: patternData.sections as unknown as Prisma.InputJsonValue,
          scoringRules: patternData.scoringRules as unknown as Prisma.InputJsonValue,
          totalMarks: totals.totalMarks,
          totalQuestions: totals.totalQuestions,
          totalDuration: totals.totalDuration,
        },
      });

      results.created.push(patternData.name);
    }

    return results;
  }

  // Clone pattern (for creating custom from default)
  async clonePattern(id: string, newName: string, createdById: string) {
    const original = await this.getPatternById(id);
    if (!original) {
      throw new Error('Pattern not found');
    }

    const totals = this.calculateTotals(original.sections as unknown as PatternSection[]);

    return prisma.testPattern.create({
      data: {
        name: newName,
        description: `Cloned from: ${original.name}`,
        patternType: 'CUSTOM',
        isDefault: false,
        subjectId: original.subjectId,
        sections: original.sections as Prisma.InputJsonValue,
        scoringRules: original.scoringRules as Prisma.InputJsonValue,
        totalMarks: totals.totalMarks,
        totalQuestions: totals.totalQuestions,
        totalDuration: totals.totalDuration,
        createdById,
      },
    });
  }
}

export const patternService = new PatternService();
