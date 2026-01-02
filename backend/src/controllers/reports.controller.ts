import { Request, Response } from 'express';
import { reportsService } from '../services/reports.service';

class ReportsController {
  // GET /reports/test/:testId - Get comprehensive test report
  async getTestReport(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const report = await reportsService.getTestReport(testId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(error.message === 'Test not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch test report',
      });
    }
  }

  // GET /reports/class/:classId - Get class-wise report
  async getClassReport(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const { subjectId, dateFrom, dateTo } = req.query;

      const report = await reportsService.getClassReport(classId, {
        subjectId: subjectId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(error.message === 'Class not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch class report',
      });
    }
  }

  // GET /reports/student/:studentId - Get individual student report
  async getStudentReport(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { subjectId, dateFrom, dateTo } = req.query;

      const report = await reportsService.getStudentReport(studentId, {
        subjectId: subjectId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(error.message === 'Student not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch student report',
      });
    }
  }

  // GET /reports/test/:testId/export - Get data for export
  async getTestExportData(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const exportData = await reportsService.getTestAttemptsForExport(testId);

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error: any) {
      res.status(error.message === 'Test not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch export data',
      });
    }
  }

  // GET /reports/test/:testId/export/csv - Export as CSV
  async exportTestReportCsv(req: Request, res: Response) {
    try {
      const { testId } = req.params;
      const exportData = await reportsService.getTestAttemptsForExport(testId);

      // Generate CSV
      const headers = [
        'Rank',
        'Roll No',
        'Admission No',
        'Student Name',
        'Score',
        'Percentage',
        'Questions Answered',
        'Correct Answers',
        'Submitted At',
      ];

      const rows = exportData.data.map((row) => [
        row.rank,
        row.rollNo,
        row.admissionNo,
        row.studentName,
        row.score,
        row.percentage,
        row.questionsAnswered,
        row.correctAnswers,
        row.submittedAt ? new Date(row.submittedAt).toISOString() : '',
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exportData.testTitle.replace(/[^a-z0-9]/gi, '_')}_results.csv"`
      );
      res.send(csv);
    } catch (error: any) {
      res.status(error.message === 'Test not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to export CSV',
      });
    }
  }

  // GET /reports/dashboard - Get dashboard summary for teacher
  async getDashboardSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { classId } = req.query;

      // This would typically aggregate data from multiple sources
      // For now, return a summary structure

      res.json({
        success: true,
        data: {
          message: 'Use specific report endpoints for detailed data',
          endpoints: {
            testReport: '/api/v1/reports/test/:testId',
            classReport: '/api/v1/reports/class/:classId',
            studentReport: '/api/v1/reports/student/:studentId',
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch dashboard summary',
      });
    }
  }
}

export const reportsController = new ReportsController();
