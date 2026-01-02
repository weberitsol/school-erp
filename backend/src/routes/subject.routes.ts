import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

// GET /subjects - List all subjects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: req.user?.schoolId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
    });

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
});

// GET /subjects/:id - Get subject by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true, classSubjects: true },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found',
      });
    }

    res.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
});

// POST /subjects - Create new subject
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Subject name is required',
      });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code || null,
        description: description || null,
        schoolId: req.user!.schoolId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /subjects/:id - Update subject
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code: code || null }),
        ...(description !== undefined && { description: description || null }),
      },
    });

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /subjects/:id - Delete subject (soft delete)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    await prisma.subject.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
