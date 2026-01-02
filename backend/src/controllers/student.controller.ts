import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { studentService, StudentFilters, PaginationOptions } from '../services/student.service';
import { studentImportService } from '../services/student-import.service';
import { Gender } from '@prisma/client';

// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    schoolId: string;
  };
}

export const studentController = {
  // Create student
  async createStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required',
        });
      }

      const studentData = {
        ...req.body,
        schoolId,
        dateOfBirth: new Date(req.body.dateOfBirth),
      };

      const student = await studentService.createStudent(studentData);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: 'A student with this email or admission number already exists',
        });
      }
      next(error);
    }
  },

  // Get all students
  async getStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        classId,
        sectionId,
        gender,
        isActive,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const filters: StudentFilters = {
        schoolId: req.user?.schoolId,
        classId: classId as string,
        sectionId: sectionId as string,
        gender: gender as Gender,
        isActive: isActive === 'false' ? false : true,
        search: search as string,
      };

      const pagination: PaginationOptions = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        sortBy: (sortBy as string) || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await studentService.getStudents(filters, pagination);

      res.json({
        success: true,
        data: result.students,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student by ID
  async getStudentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const student = await studentService.getStudentById(id);

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      // Check if user has access to this student
      // Students can only view their own profile
      if (
        req.user?.role === 'STUDENT' &&
        student.userId !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update student
  async updateStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if student exists
      const existing = await studentService.getStudentById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      const updateData = { ...req.body };
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      const student = await studentService.updateStudent(id, updateData);

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete student (soft delete)
  async deleteStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Check if student exists
      const existing = await studentService.getStudentById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      await studentService.deleteStudent(id);

      res.json({
        success: true,
        message: 'Student deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student attendance
  async getStudentAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      // Check if student exists
      const existing = await studentService.getStudentById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      // Access control
      if (
        req.user?.role === 'STUDENT' &&
        existing.userId !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const result = await studentService.getStudentAttendance(
        id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student fees
  async getStudentFees(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { academicYearId } = req.query;

      // Check if student exists
      const existing = await studentService.getStudentById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      // Access control
      if (
        req.user?.role === 'STUDENT' &&
        existing.userId !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const result = await studentService.getStudentFees(
        id,
        academicYearId as string
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student results
  async getStudentResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { academicYearId } = req.query;

      // Check if student exists
      const existing = await studentService.getStudentById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
        });
      }

      // Access control
      if (
        req.user?.role === 'STUDENT' &&
        existing.userId !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const result = await studentService.getStudentResults(
        id,
        academicYearId as string
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk create students
  async bulkCreateStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required',
        });
      }

      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Students array is required',
        });
      }

      // Add schoolId to all students
      const studentsWithSchool = students.map((s: any) => ({
        ...s,
        schoolId,
        dateOfBirth: new Date(s.dateOfBirth),
      }));

      const result = await studentService.bulkCreateStudents(studentsWithSchool);

      res.status(201).json({
        success: true,
        message: `${result.success.length} students created successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Promote students
  async promoteStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { studentIds, newClassId, newSectionId } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Student IDs array is required',
        });
      }

      if (!newClassId) {
        return res.status(400).json({
          success: false,
          error: 'New class ID is required',
        });
      }

      const result = await studentService.promoteStudents(
        studentIds,
        newClassId,
        newSectionId
      );

      res.json({
        success: true,
        message: `${result.count} students promoted successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Download import template
  async downloadTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as string) || 'csv';

      if (!['csv', 'xlsx'].includes(format)) {
        return res.status(400).json({
          success: false,
          error: 'Format must be csv or xlsx',
        });
      }

      const buffer = studentImportService.generateTemplate(format as 'csv' | 'xlsx');

      const filename = `students_template.${format}`;
      const contentType =
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  // Preview import file
  async previewImport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File is required',
        });
      }

      const buffer = fs.readFileSync(req.file.path);
      const result = await studentImportService.parseAndValidate(
        buffer,
        req.file.mimetype,
        schoolId
      );

      // Clean up temp file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Clean up temp file on error
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      next(error);
    }
  },

  // Import students from file
  async importStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'File is required',
        });
      }

      const buffer = fs.readFileSync(req.file.path);
      const parseResult = await studentImportService.parseAndValidate(
        buffer,
        req.file.mimetype,
        schoolId
      );

      // Clean up temp file
      fs.unlinkSync(req.file.path);

      // Only import valid rows
      const validStudents = parseResult.data
        .filter((row) => row.isValid)
        .map((row) => ({
          ...row.data,
          schoolId,
          dateOfBirth: row.data.dateOfBirth || new Date(),
          gender: row.data.gender || 'OTHER',
          password: row.data.password || studentImportService.generatePassword(row.data.admissionNo || ''),
        }));

      if (validStudents.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid students to import',
          data: {
            totalRows: parseResult.totalRows,
            validRows: 0,
            invalidRows: parseResult.invalidRows,
            errors: parseResult.data
              .filter((row) => !row.isValid)
              .map((row) => ({
                row: row.row,
                admissionNo: row.data.admissionNo || '',
                errors: row.errors,
              })),
          },
        });
      }

      // Bulk create students
      const result = await studentService.bulkCreateStudents(validStudents as any);

      // Combine parse errors with create errors
      const allErrors = [
        ...parseResult.data
          .filter((row) => !row.isValid)
          .map((row) => ({
            row: row.row,
            admissionNo: row.data.admissionNo || '',
            errors: row.errors,
          })),
        ...result.failed.map((f) => ({
          row: 0,
          admissionNo: f.admissionNo,
          errors: [f.error],
        })),
      ];

      const successCount = result.success.length;
      const failedCount = allErrors.length;

      res.status(successCount > 0 ? 201 : 400).json({
        success: successCount > 0,
        message:
          successCount > 0
            ? `${successCount} students imported successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`
            : 'No students were imported',
        data: {
          success: result.success,
          failed: allErrors,
          summary: {
            total: parseResult.totalRows,
            imported: successCount,
            failed: failedCount,
          },
        },
      });
    } catch (error) {
      // Clean up temp file on error
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      next(error);
    }
  },
};
