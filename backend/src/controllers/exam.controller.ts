import { Request, Response } from 'express';
import { examService } from '../services/exam.service';

class ExamController {
  // GET /exams - List all exams
  async getAllExams(req: Request, res: Response) {
    try {
      const filters = {
        classId: req.query.classId,
        subjectId: req.query.subjectId,
        academicYearId: req.query.academicYearId,
        examType: req.query.examType,
        isPublished: req.query.isPublished === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { data, total } = await examService.getAll(filters);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: 'Exams fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch exams',
      });
    }
  }

  // GET /exams/:id - Get exam by ID
  async getExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exam = await examService.getById(id);

      res.json({
        success: true,
        data: exam,
        message: 'Exam fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Exam not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch exam',
      });
    }
  }

  // POST /exams - Create new exam
  async createExam(req: Request, res: Response) {
    try {
      const { name, examType, academicYearId, termId, classId, sectionId, subjectId, date, startTime, endTime, maxMarks, passingMarks, weightage } = req.body;

      // Validate required fields
      if (!name || !examType || !academicYearId || !classId || !subjectId || !date || !maxMarks || !passingMarks) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, examType, academicYearId, classId, subjectId, date, maxMarks, passingMarks',
        });
      }

      const createdById = (req as any).user?.id;
      if (!createdById) {
        return res.status(401).json({
          success: false,
          error: 'User ID not found in request',
        });
      }

      const exam = await examService.createExam({
        name,
        examType,
        academicYearId,
        termId,
        classId,
        sectionId,
        subjectId,
        date: new Date(date),
        startTime,
        endTime,
        maxMarks: parseFloat(maxMarks),
        passingMarks: parseFloat(passingMarks),
        weightage: weightage ? parseFloat(weightage) : 100,
        createdById,
      });

      res.status(201).json({
        success: true,
        data: exam,
        message: 'Exam created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create exam',
      });
    }
  }

  // PUT /exams/:id - Update exam
  async updateExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, examType, date, startTime, endTime, maxMarks, passingMarks, weightage } = req.body;

      const exam = await examService.updateExam(id, {
        name,
        examType,
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        maxMarks: maxMarks ? parseFloat(maxMarks) : undefined,
        passingMarks: passingMarks ? parseFloat(passingMarks) : undefined,
        weightage: weightage ? parseFloat(weightage) : undefined,
      });

      res.json({
        success: true,
        data: exam,
        message: 'Exam updated successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Exam not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to update exam',
      });
    }
  }

  // DELETE /exams/:id - Delete exam
  async deleteExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await examService.deleteExam(id);

      res.json({
        success: true,
        data: result,
        message: 'Exam deleted successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Exam not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to delete exam',
      });
    }
  }

  // POST /exams/:id/results - Enter exam results
  async enterResults(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { results } = req.body;

      if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Results must be a non-empty array',
        });
      }

      const enteredById = (req as any).user?.id;
      if (!enteredById) {
        return res.status(401).json({
          success: false,
          error: 'User ID not found in request',
        });
      }

      const createdResults = await examService.enterResults(id, results, enteredById);

      res.status(201).json({
        success: true,
        data: createdResults,
        message: `Entered ${createdResults.length} exam results`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to enter results',
      });
    }
  }

  // GET /exams/:id/results - Get exam results
  async getResults(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { results, statistics } = await examService.getExamResults(id);

      res.json({
        success: true,
        data: results,
        statistics,
        message: 'Exam results fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Exam not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch exam results',
      });
    }
  }

  // POST /exams/:id/publish - Publish exam results
  async publishResults(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const published = await examService.publishResults(id);

      res.json({
        success: true,
        data: published,
        message: 'Exam results published successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to publish results',
      });
    }
  }

  // GET /exams/stats - Get exam statistics
  async getStats(req: Request, res: Response) {
    try {
      const filters = {
        academicYearId: req.query.academicYearId,
        classId: req.query.classId,
      };

      const stats = await examService.getExamStats(filters);

      res.json({
        success: true,
        data: stats,
        message: 'Exam statistics fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch exam statistics',
      });
    }
  }

  // GET /exams/student/:studentId/results - Get student exam results
  async getStudentResults(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const filters = {
        academicYearId: req.query.academicYearId,
        classId: req.query.classId,
      };

      const results = await examService.getStudentExamResults(studentId, filters);

      res.json({
        success: true,
        data: results,
        message: 'Student exam results fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Student not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch student results',
      });
    }
  }
}

export const examController = new ExamController();
