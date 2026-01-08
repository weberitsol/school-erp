import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface CreateExamData {
  name: string;
  examType: string;
  academicYearId: string;
  termId?: string;
  classId: string;
  sectionId?: string;
  subjectId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  maxMarks: number;
  passingMarks: number;
  weightage?: number;
  createdById: string;
}

interface UpdateExamData {
  name?: string;
  examType?: string;
  date?: Date;
  startTime?: string;
  endTime?: string;
  maxMarks?: number;
  passingMarks?: number;
  weightage?: number;
}

export class ExamService {
  // Create new exam
  async createExam(data: CreateExamData) {
    try {
      // Validate required data
      if (!data.name || !data.academicYearId || !data.classId || !data.subjectId || !data.createdById) {
        throw new Error('Missing required fields: name, academicYearId, classId, subjectId, createdById');
      }

      // Verify academic year exists
      const academicYear = await prisma.academicYear.findUnique({
        where: { id: data.academicYearId },
      });
      if (!academicYear) throw new Error('Academic year not found');

      // Verify class exists
      const classRecord = await prisma.class.findUnique({
        where: { id: data.classId },
      });
      if (!classRecord) throw new Error('Class not found');

      // Verify subject exists
      const subject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
      });
      if (!subject) throw new Error('Subject not found');

      // Verify teacher exists
      const teacher = await prisma.teacher.findUnique({
        where: { id: data.createdById },
      });
      if (!teacher) throw new Error('Teacher not found');

      // Create exam
      const exam = await prisma.exam.create({
        data: {
          name: data.name,
          examType: data.examType,
          academicYearId: data.academicYearId,
          termId: data.termId,
          classId: data.classId,
          sectionId: data.sectionId,
          subjectId: data.subjectId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          maxMarks: new Decimal(data.maxMarks),
          passingMarks: new Decimal(data.passingMarks),
          weightage: data.weightage ? new Decimal(data.weightage) : new Decimal(100),
          createdById: data.createdById,
        },
        include: {
          academicYear: true,
          class: true,
          subject: true,
          createdBy: true,
        },
      });

      return exam;
    } catch (error: any) {
      throw new Error(`Failed to create exam: ${error.message}`);
    }
  }

  // Get all exams with filters
  async getAll(filters?: any) {
    try {
      const where: any = {};

      if (filters?.classId) where.classId = filters.classId;
      if (filters?.subjectId) where.subjectId = filters.subjectId;
      if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
      if (filters?.examType) where.examType = filters.examType;
      if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished;

      const exams = await prisma.exam.findMany({
        where,
        include: {
          academicYear: true,
          class: true,
          subject: true,
          createdBy: true,
          results: true,
        },
        orderBy: { date: 'desc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 20) : 0,
        take: filters?.limit || 20,
      });

      const total = await prisma.exam.count({ where });

      return { data: exams, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch exams: ${error.message}`);
    }
  }

  // Get single exam by ID
  async getById(id: string) {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id },
        include: {
          academicYear: true,
          class: true,
          subject: true,
          createdBy: true,
          results: {
            include: {
              student: true,
              enteredBy: true,
            },
          },
        },
      });

      if (!exam) throw new Error('Exam not found');
      return exam;
    } catch (error: any) {
      throw new Error(`Failed to fetch exam: ${error.message}`);
    }
  }

  // Update exam
  async updateExam(id: string, data: UpdateExamData) {
    try {
      // Verify exam exists
      const exam = await prisma.exam.findUnique({ where: { id } });
      if (!exam) throw new Error('Exam not found');

      // Cannot update if results are published
      if (exam.isPublished && data.maxMarks !== undefined) {
        throw new Error('Cannot update exam marks after results are published');
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.examType !== undefined) updateData.examType = data.examType;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.startTime !== undefined) updateData.startTime = data.startTime;
      if (data.endTime !== undefined) updateData.endTime = data.endTime;
      if (data.maxMarks !== undefined) updateData.maxMarks = new Decimal(data.maxMarks);
      if (data.passingMarks !== undefined) updateData.passingMarks = new Decimal(data.passingMarks);
      if (data.weightage !== undefined) updateData.weightage = new Decimal(data.weightage);

      const updated = await prisma.exam.update({
        where: { id },
        data: updateData,
        include: {
          academicYear: true,
          class: true,
          subject: true,
          createdBy: true,
        },
      });

      return updated;
    } catch (error: any) {
      throw new Error(`Failed to update exam: ${error.message}`);
    }
  }

  // Delete exam
  async deleteExam(id: string) {
    try {
      const exam = await prisma.exam.findUnique({ where: { id } });
      if (!exam) throw new Error('Exam not found');

      // Check if results are published
      if (exam.isPublished) {
        throw new Error('Cannot delete exam after results are published');
      }

      await prisma.exam.delete({ where: { id } });
      return { success: true, message: 'Exam deleted successfully' };
    } catch (error: any) {
      throw new Error(`Failed to delete exam: ${error.message}`);
    }
  }

  // Enter exam results
  async enterResults(examId: string, results: Array<{ studentId: string; marksObtained: number; grade?: string; remarks?: string; isAbsent?: boolean }>, enteredById: string) {
    try {
      // Verify exam exists
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) throw new Error('Exam not found');

      // Verify teacher exists
      const teacher = await prisma.teacher.findUnique({ where: { id: enteredById } });
      if (!teacher) throw new Error('Teacher not found');

      // Verify results are not already published
      if (exam.isPublished) {
        throw new Error('Cannot enter results for published exam');
      }

      const createdResults = [];

      for (const result of results) {
        // Verify student exists
        const student = await prisma.student.findUnique({ where: { id: result.studentId } });
        if (!student) continue; // Skip if student not found

        // Check for existing result
        const existingResult = await prisma.examResult.findUnique({
          where: {
            examId_studentId: {
              examId,
              studentId: result.studentId,
            },
          },
        });

        if (existingResult) {
          // Update existing result
          const updated = await prisma.examResult.update({
            where: { id: existingResult.id },
            data: {
              marksObtained: result.isAbsent ? null : new Decimal(result.marksObtained),
              grade: result.grade,
              remarks: result.remarks,
              isAbsent: result.isAbsent || false,
              enteredById,
              enteredAt: new Date(),
            },
            include: {
              student: true,
              exam: true,
            },
          });
          createdResults.push(updated);
        } else {
          // Create new result
          const newResult = await prisma.examResult.create({
            data: {
              examId,
              studentId: result.studentId,
              marksObtained: result.isAbsent ? null : new Decimal(result.marksObtained),
              grade: result.grade,
              remarks: result.remarks,
              isAbsent: result.isAbsent || false,
              enteredById,
            },
            include: {
              student: true,
              exam: true,
            },
          });
          createdResults.push(newResult);
        }
      }

      return createdResults;
    } catch (error: any) {
      throw new Error(`Failed to enter results: ${error.message}`);
    }
  }

  // Get exam results
  async getExamResults(examId: string) {
    try {
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) throw new Error('Exam not found');

      const results = await prisma.examResult.findMany({
        where: { examId },
        include: {
          student: true,
          enteredBy: true,
        },
        orderBy: { student: { firstName: 'asc' } },
      });

      // Calculate statistics
      const passedCount = results.filter((r) => r.marksObtained && Number(r.marksObtained) >= Number(exam.passingMarks)).length;
      const failedCount = results.filter((r) => r.marksObtained && Number(r.marksObtained) < Number(exam.passingMarks)).length;
      const absentCount = results.filter((r) => r.isAbsent).length;
      const avgMarks = results.filter((r) => r.marksObtained).length > 0 ? results.reduce((sum, r) => sum + (r.marksObtained ? Number(r.marksObtained) : 0), 0) / results.filter((r) => r.marksObtained).length : 0;
      const maxObtained = results.length > 0 ? Math.max(...results.filter((r) => r.marksObtained).map((r) => Number(r.marksObtained))) : 0;
      const minObtained = results.filter((r) => r.marksObtained).length > 0 ? Math.min(...results.filter((r) => r.marksObtained).map((r) => Number(r.marksObtained))) : 0;

      return {
        results,
        statistics: {
          totalStudents: results.length,
          passedCount,
          failedCount,
          absentCount,
          averageMarks: Math.round(avgMarks * 100) / 100,
          maxMarks: Number(exam.maxMarks),
          maxObtained,
          minObtained,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch exam results: ${error.message}`);
    }
  }

  // Publish exam results
  async publishResults(examId: string) {
    try {
      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) throw new Error('Exam not found');

      if (exam.isPublished) throw new Error('Results already published');

      const published = await prisma.exam.update({
        where: { id: examId },
        data: { isPublished: true },
        include: {
          results: true,
          class: true,
          subject: true,
        },
      });

      return published;
    } catch (error: any) {
      throw new Error(`Failed to publish results: ${error.message}`);
    }
  }

  // Get exam statistics
  async getExamStats(filters?: any) {
    try {
      const where: any = {};
      if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
      if (filters?.classId) where.classId = filters.classId;

      const totalExams = await prisma.exam.count({ where });
      const publishedExams = await prisma.exam.count({ where: { ...where, isPublished: true } });
      const pendingExams = await prisma.exam.count({ where: { ...where, isPublished: false } });

      return {
        totalExams,
        publishedExams,
        pendingExams,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch exam statistics: ${error.message}`);
    }
  }

  // Get student exam results (for student view)
  async getStudentExamResults(studentId: string, filters?: any) {
    try {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) throw new Error('Student not found');

      const where: any = { student: { id: studentId } };
      if (filters?.classId) where.exam = { classId: filters.classId };
      if (filters?.academicYearId) where.exam = { academicYearId: filters.academicYearId };

      const results = await prisma.examResult.findMany({
        where: {
          studentId,
          exam: filters?.academicYearId ? { academicYearId: filters.academicYearId } : undefined,
        },
        include: {
          exam: {
            include: {
              subject: true,
              class: true,
            },
          },
        },
        orderBy: { exam: { date: 'desc' } },
      });

      return results;
    } catch (error: any) {
      throw new Error(`Failed to fetch student exam results: ${error.message}`);
    }
  }
}

export const examService = new ExamService();
