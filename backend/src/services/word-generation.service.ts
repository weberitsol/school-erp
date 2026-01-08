import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  convertInchesToTwip,
  PageBreak,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { Packer } from 'docx';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Options for generating a question paper
 */
export interface GenerateQuestionPaperOptions {
  testId: string;
  title?: string;
  instructions?: string;
  columnLayout: 'single' | 'double';
  includeAnswers?: boolean;
  schoolName?: string;
  headerLogo?: string;
}

/**
 * Options for generating a report card
 */
export interface GenerateReportCardOptions {
  studentId: string;
  termId: string;
  columnLayout?: 'single' | 'double';
  schoolName?: string;
}

/**
 * Options for generating a certificate
 */
export interface GenerateCertificateOptions {
  studentId: string;
  certificateType: string;
  achievement?: string;
  date?: Date;
  schoolName?: string;
}

/**
 * Options for generating study material
 */
export interface GenerateStudyMaterialOptions {
  chapterId: string;
  includeQuestions?: boolean;
  columnLayout?: 'single' | 'double';
  schoolName?: string;
}

/**
 * Word Generation Service
 * Generates Word documents for question papers, report cards, certificates, and study materials
 * Supports single and double column layouts with content preservation
 */
class WordGenerationService {
  /**
   * Generate question paper in Word format
   * Supports single and double column layouts
   * Can include answers and explanations
   */
  async generateQuestionPaper(options: GenerateQuestionPaperOptions): Promise<Buffer> {
    try {
      const {
        testId,
        title = 'Question Paper',
        instructions = '',
        columnLayout,
        includeAnswers = false,
        schoolName = 'School Name',
      } = options;

      console.log(`📝 Generating question paper: ${testId} - Layout: ${columnLayout}`);

      // Fetch test data
      const test = await prisma.onlineTest.findUnique({
        where: { id: testId },
        include: {
          testQuestions: {
            include: {
              question: {
                include: {
                  subject: true,
                  class: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          subject: true,
          class: true,
        },
      });

      if (!test) {
        throw new Error('Test not found');
      }

      console.log(`✅ Fetched test: ${test.title} with ${test.testQuestions.length} questions`);

      // Build document sections
      const sections = [
        // Header with school name and title
        new Paragraph({
          text: schoolName,
          bold: true,
          size: 24,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Test information
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Subject:', bold: true })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph(test.subject.name)],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Class:', bold: true })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph(test.class.name)],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Duration:', bold: true })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph(`${test.durationMinutes} minutes`)],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Total Marks:', bold: true })],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph(`${test.totalMarks}`)],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ text: '' }),
        new Paragraph({
          border: {
            bottom: {
              color: '000000',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { after: 200 },
        }),

        // Instructions
        ...(instructions
          ? [
              new Paragraph({
                text: 'Instructions:',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
              }),
              new Paragraph({
                text: instructions,
                spacing: { after: 200 },
              }),
            ]
          : []),

        // Questions
        ...this.generateQuestionParagraphs(test.testQuestions, includeAnswers),
      ];

      // Create document with column configuration
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: convertInchesToTwip(0.75),
                  bottom: convertInchesToTwip(0.75),
                  left: convertInchesToTwip(0.75),
                  right: convertInchesToTwip(0.75),
                },
                ...(columnLayout === 'double'
                  ? {
                      columns: {
                        num: 2,
                        space: convertInchesToTwip(0.5),
                        equalWidth: true,
                      },
                    }
                  : {}),
              },
            },
            children: sections,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      console.log(`✅ Question paper generated: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('❌ Error generating question paper:', error);
      throw error;
    }
  }

  /**
   * Generate report card for a student
   */
  async generateReportCard(options: GenerateReportCardOptions): Promise<Buffer> {
    try {
      const { studentId, termId, columnLayout = 'single', schoolName = 'School Name' } = options;

      console.log(`📊 Generating report card for student: ${studentId}, term: ${termId}`);

      // Fetch student data and grades
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          currentClass: true,
          currentSection: true,
          examResults: {
            where: { examId: termId },
            include: {
              exam: true,
              subject: true,
            },
          },
        },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      console.log(
        `✅ Fetched student: ${student.firstName} ${student.lastName} with ${student.examResults.length} grades`
      );

      // Calculate statistics
      const totalMarksObtained = student.examResults.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
      const totalMarksOutOf = student.examResults.reduce((sum, r) => sum + (r.totalMarks || 0), 0);
      const percentage = totalMarksOutOf > 0 ? ((totalMarksObtained / totalMarksOutOf) * 100).toFixed(2) : 0;

      // Build document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: convertInchesToTwip(0.75),
                  bottom: convertInchesToTwip(0.75),
                  left: convertInchesToTwip(0.75),
                  right: convertInchesToTwip(0.75),
                },
                ...(columnLayout === 'double'
                  ? {
                      columns: {
                        num: 2,
                        space: convertInchesToTwip(0.5),
                        equalWidth: true,
                      },
                    }
                  : {}),
              },
            },
            children: [
              // Header
              new Paragraph({
                text: schoolName,
                bold: true,
                size: 28,
                alignment: AlignmentType.CENTER,
                spacing: { after: 50 },
              }),

              new Paragraph({
                text: 'Student Report Card',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              }),

              // Student Information
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Name:', bold: true })],
                        width: { size: 40, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph(`${student.firstName} ${student.lastName}`),
                        ],
                        width: { size: 60, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Roll No:', bold: true })],
                        width: { size: 40, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph(student.rollNo || 'N/A')],
                        width: { size: 60, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Class:', bold: true })],
                        width: { size: 40, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph(student.currentClass?.name || 'N/A')],
                        width: { size: 60, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: '' }),

              // Grades Table
              new Paragraph({
                text: 'Academic Performance',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 150 },
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  // Header Row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: 'Subject', bold: true })],
                        width: { size: 40, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: 'Marks', bold: true })],
                        width: { size: 30, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: 'Grade', bold: true })],
                        width: { size: 30, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  // Data Rows
                  ...student.examResults.map(
                    (result) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph(result.subject.name)],
                            width: { size: 40, type: WidthType.PERCENTAGE },
                          }),
                          new TableCell({
                            children: [
                              new Paragraph(
                                `${result.marksObtained || 0}/${result.totalMarks || 0}`
                              ),
                            ],
                            width: { size: 30, type: WidthType.PERCENTAGE },
                          }),
                          new TableCell({
                            children: [new Paragraph(result.grade || 'N/A')],
                            width: { size: 30, type: WidthType.PERCENTAGE },
                          }),
                        ],
                      })
                  ),
                  // Total Row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: 'TOTAL', bold: true })],
                        width: { size: 40, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: `${totalMarksObtained}/${totalMarksOutOf}`, bold: true })],
                        width: { size: 30, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            text: `${percentage}%`,
                            bold: true,
                            color: percentage >= 60 ? '008000' : 'FF0000',
                          }),
                        ],
                        width: { size: 30, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ text: '' }),
              new Paragraph({
                text: `Date: ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 300 },
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      console.log(`✅ Report card generated: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('❌ Error generating report card:', error);
      throw error;
    }
  }

  /**
   * Generate certificate for student
   */
  async generateCertificate(options: GenerateCertificateOptions): Promise<Buffer> {
    try {
      const {
        studentId,
        certificateType,
        achievement = '',
        date = new Date(),
        schoolName = 'School Name',
      } = options;

      console.log(`🎓 Generating certificate for student: ${studentId} - Type: ${certificateType}`);

      // Fetch student
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      console.log(`✅ Fetched student: ${student.firstName} ${student.lastName}`);

      // Create certificate document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: convertInchesToTwip(1),
                  bottom: convertInchesToTwip(1),
                  left: convertInchesToTwip(1),
                  right: convertInchesToTwip(1),
                },
              },
            },
            children: [
              new Paragraph({ text: '' }),
              new Paragraph({ text: '' }),

              // Certificate Title
              new Paragraph({
                text: `CERTIFICATE OF ${certificateType.toUpperCase()}`,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                bold: true,
                size: 32,
              }),

              new Paragraph({
                text: `This is proudly presented to`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                size: 24,
              }),

              // Student Name (larger and bold)
              new Paragraph({
                text: `${student.firstName} ${student.lastName}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
                bold: true,
                size: 32,
                border: {
                  bottom: {
                    color: '000000',
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
              }),

              // Achievement text
              new Paragraph({
                text: achievement || `for successful completion of ${certificateType}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
                size: 24,
              }),

              new Paragraph({ text: '' }),

              // Date
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Date: ',
                    bold: true,
                  }),
                  new TextRun(date.toLocaleDateString()),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 },
                size: 22,
              }),

              new Paragraph({ text: '' }),

              // Signature lines
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({ text: '' }),
                          new Paragraph({
                            text: '___________________',
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 50 },
                          }),
                          new Paragraph({
                            text: 'Principal',
                            alignment: AlignmentType.CENTER,
                            bold: true,
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({ text: '' }),
                          new Paragraph({
                            text: '___________________',
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 50 },
                          }),
                          new Paragraph({
                            text: 'Director',
                            alignment: AlignmentType.CENTER,
                            bold: true,
                          }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      console.log(`✅ Certificate generated: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('❌ Error generating certificate:', error);
      throw error;
    }
  }

  /**
   * Generate study material from chapter
   */
  async generateStudyMaterial(options: GenerateStudyMaterialOptions): Promise<Buffer> {
    try {
      const {
        chapterId,
        includeQuestions = true,
        columnLayout = 'double',
        schoolName = 'School Name',
      } = options;

      console.log(
        `📚 Generating study material for chapter: ${chapterId} - Include Questions: ${includeQuestions}`
      );

      // Fetch chapter
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          subject: true,
          class: true,
          ...(includeQuestions
            ? {
                questions: {
                  take: 50,
                  orderBy: { difficulty: 'asc' },
                },
              }
            : {}),
        },
      });

      if (!chapter) {
        throw new Error('Chapter not found');
      }

      console.log(`✅ Fetched chapter: ${chapter.name}`);

      // Build sections
      const sections = [
        new Paragraph({
          text: schoolName,
          bold: true,
          size: 24,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: chapter.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({ text: 'Subject: ', bold: true }),
            new TextRun(chapter.subject.name),
            new TextRun({ text: '    |    Class: ', bold: true }),
            new TextRun(chapter.class.name),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),

        // Chapter Description
        new Paragraph({
          text: 'Chapter Overview',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 150 },
        }),

        new Paragraph({
          text: chapter.description || 'Content to be filled',
          spacing: { after: 300 },
        }),

        // Key Concepts (if available)
        ...(chapter.keyTopics && chapter.keyTopics.length > 0
          ? [
              new Paragraph({
                text: 'Key Topics',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 150 },
              }),
              ...chapter.keyTopics.map(
                (topic: string) =>
                  new Paragraph({
                    text: topic,
                    spacing: { before: 50, after: 50 },
                    indent: { left: convertInchesToTwip(0.25) },
                  })
              ),
            ]
          : []),

        // Practice Questions
        ...(includeQuestions && chapter.questions && chapter.questions.length > 0
          ? [
              new Paragraph({ text: '' }),
              new Paragraph({
                text: 'Practice Questions',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
              }),
              ...this.generateQuestionParagraphs(
                chapter.questions.map((q: any, i: number) => ({
                  question: q,
                  order: i,
                })),
                false
              ),
            ]
          : []),
      ];

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: convertInchesToTwip(0.75),
                  bottom: convertInchesToTwip(0.75),
                  left: convertInchesToTwip(0.75),
                  right: convertInchesToTwip(0.75),
                },
                ...(columnLayout === 'double'
                  ? {
                      columns: {
                        num: 2,
                        space: convertInchesToTwip(0.5),
                        equalWidth: true,
                      },
                    }
                  : {}),
              },
            },
            children: sections,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      console.log(`✅ Study material generated: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('❌ Error generating study material:', error);
      throw error;
    }
  }

  /**
   * Generate question bank export
   */
  async exportQuestionBank(
    subjectId: string,
    classId: string,
    chapterId: string,
    columnLayout: 'single' | 'double'
  ): Promise<Buffer> {
    try {
      console.log(`📖 Exporting question bank - Subject: ${subjectId}, Class: ${classId}`);

      // Fetch questions
      const questions = await prisma.question.findMany({
        where: {
          subjectId,
          classId,
          ...(chapterId ? { chapterId } : {}),
        },
        include: {
          subject: true,
          class: true,
          chapterRef: true,
        },
        orderBy: [{ chapterId: 'asc' }, { createdAt: 'asc' }],
      });

      if (questions.length === 0) {
        throw new Error('No questions found for export');
      }

      console.log(`✅ Fetched ${questions.length} questions for export`);

      const firstQuestion = questions[0];
      const title = `Question Bank - ${firstQuestion.subject.name} - ${firstQuestion.class.name}`;

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: convertInchesToTwip(0.75),
                  bottom: convertInchesToTwip(0.75),
                  left: convertInchesToTwip(0.75),
                  right: convertInchesToTwip(0.75),
                },
                ...(columnLayout === 'double'
                  ? {
                      columns: {
                        num: 2,
                        space: convertInchesToTwip(0.5),
                        equalWidth: true,
                      },
                    }
                  : {}),
              },
            },
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),

              new Paragraph({
                text: `Total Questions: ${questions.length}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              }),

              ...this.generateQuestionParagraphs(
                questions.map((q, i) => ({
                  question: q,
                  order: i,
                })),
                true
              ),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      console.log(`✅ Question bank exported: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('❌ Error exporting question bank:', error);
      throw error;
    }
  }

  /**
   * Generate question paragraphs (helper method)
   * Formats questions with options and answers
   */
  private generateQuestionParagraphs(testQuestions: any[], includeAnswers: boolean): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    testQuestions.forEach((tq, index) => {
      const question = tq.question || tq;
      const questionNumber = index + 1;

      // Question text
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${questionNumber}. `,
              bold: true,
            }),
            new TextRun(question.questionText || question.text || ''),
          ],
          spacing: { before: 200, after: 100 },
          style: 'List Number',
        })
      );

      // Options (if MCQ)
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach((opt: any, optIndex: number) => {
          const optionLabel = String.fromCharCode(97 + optIndex); // a, b, c, d
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `  ${optionLabel}) `,
                  bold: true,
                }),
                new TextRun(opt.text || opt),
              ],
              spacing: { after: 50 },
            })
          );
        });
      }

      // Answer (if requested)
      if (includeAnswers && question.correctAnswer) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '  Answer: ',
                bold: true,
                italics: true,
              }),
              new TextRun({
                text: question.correctAnswer.toUpperCase(),
                italics: true,
                color: '0000FF',
              }),
            ],
            spacing: { after: 50 },
          })
        );

        // Explanation
        if (question.answerExplanation) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '  Explanation: ',
                  bold: true,
                  italics: true,
                  size: 20,
                }),
                new TextRun({
                  text: question.answerExplanation,
                  italics: true,
                  size: 20,
                }),
              ],
              spacing: { after: 150 },
            })
          );
        }
      }

      paragraphs.push(new Paragraph({ text: '' })); // Blank line
    });

    return paragraphs;
  }
}

// Export singleton instance
export const wordGenerationService = new WordGenerationService();
