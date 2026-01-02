import { Request, Response } from 'express';
import { teacherService } from '../services/teacher.service';
import { teacherImportService, CreateTeacherDto } from '../services/teacher-import.service';
import { Gender } from '@prisma/client';

export const teacherController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        employeeId,
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        gender,
        phone,
        alternatePhone,
        address,
        city,
        state,
        pincode,
        qualification,
        specialization,
        experience,
        departmentId,
        branchId,
        salary,
        bankAccount,
        bankName,
        ifscCode,
      } = req.body;

      // Validate required fields
      if (!employeeId || !firstName || !lastName || !email || !gender || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID, first name, last name, email, gender, and phone are required',
        });
      }

      // Check if employee ID already exists
      const existingTeacher = await teacherService.getTeacherByEmployeeId(employeeId);
      if (existingTeacher) {
        return res.status(400).json({ success: false, error: 'Employee ID already exists' });
      }

      const teacherData: CreateTeacherDto = {
        employeeId,
        firstName,
        lastName,
        email,
        password: password || teacherImportService.generatePassword(employeeId),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender as Gender,
        phone,
        alternatePhone,
        address,
        city,
        state,
        pincode,
        qualification,
        specialization,
        experience: experience ? parseInt(experience) : undefined,
        departmentId,
        branchId,
        salary: salary ? parseFloat(salary) : undefined,
        bankAccount,
        bankName,
        ifscCode,
      };

      const teacher = await teacherService.createTeacher(teacherData, schoolId);

      res.status(201).json({
        success: true,
        data: teacher,
        message: 'Teacher created successfully',
      });
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          return res.status(400).json({ success: false, error: 'Email already exists' });
        }
        return res.status(400).json({ success: false, error: 'Duplicate entry' });
      }
      res.status(500).json({ success: false, error: 'Failed to create teacher' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        search,
        branchId,
        departmentId,
        isActive,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await teacherService.getTeachers(
        {
          schoolId,
          search: search as string,
          branchId: branchId as string,
          departmentId: departmentId as string,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        },
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      res.json({
        success: true,
        data: result.teachers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch teachers' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const teacher = await teacherService.getTeacherById(id);

      if (!teacher) {
        return res.status(404).json({ success: false, error: 'Teacher not found' });
      }

      res.json({ success: true, data: teacher });
    } catch (error) {
      console.error('Error fetching teacher:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch teacher' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        alternatePhone,
        address,
        city,
        state,
        pincode,
        qualification,
        specialization,
        experience,
        departmentId,
        branchId,
        salary,
        bankAccount,
        bankName,
        ifscCode,
      } = req.body;

      // Check if teacher exists
      const existing = await teacherService.getTeacherById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Teacher not found' });
      }

      const teacher = await teacherService.updateTeacher(id, {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender as Gender,
        phone,
        alternatePhone,
        address,
        city,
        state,
        pincode,
        qualification,
        specialization,
        experience: experience !== undefined ? parseInt(experience) : undefined,
        departmentId,
        branchId,
        salary: salary !== undefined ? parseFloat(salary) : undefined,
        bankAccount,
        bankName,
        ifscCode,
      });

      res.json({ success: true, data: teacher, message: 'Teacher updated successfully' });
    } catch (error) {
      console.error('Error updating teacher:', error);
      res.status(500).json({ success: false, error: 'Failed to update teacher' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if teacher exists
      const existing = await teacherService.getTeacherById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Teacher not found' });
      }

      await teacherService.deleteTeacher(id);

      res.json({ success: true, message: 'Teacher deleted successfully' });
    } catch (error) {
      console.error('Error deleting teacher:', error);
      res.status(500).json({ success: false, error: 'Failed to delete teacher' });
    }
  },

  async getClasses(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const classes = await teacherService.getTeacherClasses(id);

      res.json({ success: true, data: classes });
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch teacher classes' });
    }
  },

  async getSubjects(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const subjects = await teacherService.getTeacherSubjects(id);

      res.json({ success: true, data: subjects });
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch teacher subjects' });
    }
  },

  async downloadTemplate(req: Request, res: Response) {
    try {
      const format = (req.query.format as string) || 'xlsx';

      if (!['csv', 'xlsx'].includes(format)) {
        return res.status(400).json({ success: false, error: 'Invalid format. Use csv or xlsx' });
      }

      const buffer = teacherImportService.generateTemplate(format as 'csv' | 'xlsx');

      const contentType =
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const filename = format === 'csv' ? 'teachers_template.csv' : 'teachers_template.xlsx';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ success: false, error: 'Failed to generate template' });
    }
  },

  async previewImport(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const result = await teacherImportService.parseAndValidate(
        req.file.buffer,
        req.file.mimetype,
        schoolId
      );

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error previewing import:', error);
      res.status(500).json({ success: false, error: 'Failed to preview import' });
    }
  },

  async importTeachers(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      // Parse and validate
      const preview = await teacherImportService.parseAndValidate(
        req.file.buffer,
        req.file.mimetype,
        schoolId
      );

      // Filter only valid rows
      const validTeachers = preview.data
        .filter((row) => row.isValid)
        .map((row) => row.data as CreateTeacherDto);

      if (validTeachers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid teachers to import',
          data: preview,
        });
      }

      // Import valid teachers
      const result = await teacherService.bulkCreateTeachers(validTeachers, schoolId);

      // Combine parse errors with import errors
      const parseErrors = preview.data
        .filter((row) => !row.isValid)
        .map((row) => ({
          employeeId: row.data.employeeId || `Row ${row.row}`,
          error: row.errors.join(', '),
        }));

      const allFailed = [...parseErrors, ...result.failed];

      res.json({
        success: result.success.length > 0,
        message: `${result.success.length} teachers imported, ${allFailed.length} failed`,
        data: {
          success: result.success,
          failed: allFailed,
          summary: {
            total: preview.totalRows,
            imported: result.success.length,
            failed: allFailed.length,
          },
        },
      });
    } catch (error) {
      console.error('Error importing teachers:', error);
      res.status(500).json({ success: false, error: 'Failed to import teachers' });
    }
  },

  async bulkCreate(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { teachers } = req.body;

      if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
        return res.status(400).json({ success: false, error: 'Teachers array is required' });
      }

      const result = await teacherService.bulkCreateTeachers(teachers, schoolId);

      res.json({
        success: result.success.length > 0,
        message: `${result.success.length} teachers created, ${result.failed.length} failed`,
        data: result,
      });
    } catch (error) {
      console.error('Error bulk creating teachers:', error);
      res.status(500).json({ success: false, error: 'Failed to create teachers' });
    }
  },
};
