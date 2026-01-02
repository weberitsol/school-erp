import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

// GET /classes - List all classes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await prisma.class.findMany({
      where: {
        schoolId: req.user?.schoolId,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        displayOrder: true,
        _count: {
          select: { sections: true, students: true },
        },
      },
    });

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
});

// GET /classes/:id - Get class by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        sections: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            capacity: true,
            classTeacher: {
              select: { firstName: true, lastName: true },
            },
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: { students: true, subjects: true },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
      });
    }

    res.json({
      success: true,
      data: classData,
    });
  } catch (error) {
    next(error);
  }
});

// POST /classes - Create new class
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, displayOrder } = req.body;

    const classData = await prisma.class.create({
      data: {
        name,
        code,
        displayOrder: displayOrder || 0,
        schoolId: req.user!.schoolId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classData,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /classes/:id - Update class
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code, displayOrder, isActive } = req.body;

    const classData = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: classData,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /classes/:id - Delete class (soft delete)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    await prisma.class.update({
      where: { id },
      data: { isActive: false },
    });

    // Also deactivate all sections
    await prisma.section.updateMany({
      where: { classId: id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /classes/:id/sections - Get class sections
router.get('/:id/sections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const sections = await prisma.section.findMany({
      where: {
        classId: id,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        capacity: true,
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    res.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    next(error);
  }
});

// GET /classes/:id/students - Get class students
router.get('/:id/students', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { sectionId } = req.query;

    const students = await prisma.student.findMany({
      where: {
        currentClassId: id,
        ...(sectionId && { currentSectionId: sectionId as string }),
        isActive: true,
      },
      orderBy: [{ rollNo: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        admissionNo: true,
        rollNo: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        currentSection: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
});

// POST /classes/:id/sections - Create section for a class
router.post('/:id/sections', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, capacity, classTeacherId } = req.body;

    const section = await prisma.section.create({
      data: {
        name,
        capacity: capacity || 40,
        classId: id,
        classTeacherId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: section,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /sections/:sectionId - Update section
router.put('/sections/:sectionId', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const { name, capacity, classTeacherId } = req.body;

    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        ...(name && { name }),
        ...(capacity !== undefined && { capacity }),
        ...(classTeacherId !== undefined && { classTeacherId: classTeacherId || null }),
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Section updated successfully',
      data: section,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /sections/:sectionId - Delete section
router.delete('/sections/:sectionId', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;

    // Soft delete by setting isActive to false
    await prisma.section.update({
      where: { id: sectionId },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /classes/:id/timetable - Get class timetable
router.get('/:id/timetable', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { sectionId } = req.query;

    const timetables = await prisma.timetable.findMany({
      where: {
        classId: id,
        ...(sectionId && { sectionId: sectionId as string }),
        isActive: true,
      },
      include: {
        slots: {
          orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
          include: {
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: timetables,
    });
  } catch (error) {
    next(error);
  }
});

// GET /classes/:id/subjects - Get class subjects
router.get('/:id/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: classSubjects.map((cs) => ({
        ...cs.subject,
        isElective: cs.isElective,
        weeklyPeriods: cs.weeklyPeriods,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
