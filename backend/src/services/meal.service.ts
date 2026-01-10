import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface Meal {
  id: string;
  menuId: string;
  schoolId: string;
  name: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  serveTimeStart: string | null;
  serveTimeEnd: string | null;
  isServing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMealDto {
  menuId: string;
  name: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  serveTimeStart: string;
  serveTimeEnd: string;
}

class MealService {
  async getAll(filters?: {
    menuId?: string;
    mealType?: string;
    schoolId?: string;
    isServing?: boolean;
  }): Promise<{ data: Meal[]; total: number }> {
    const where: Prisma.MealWhereInput = {};

    if (filters?.menuId) where.menuId = filters.menuId;
    if (filters?.mealType) where.mealType = filters.mealType as any;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.isServing !== undefined) where.isServing = filters.isServing;

    const [data, total] = await Promise.all([
      prisma.meal.findMany({
        where,
        include: {
          menu: true,
          attendances: true,
          feedbacks: true,
        },
        orderBy: [{ menuId: 'asc' }, { mealType: 'asc' }],
      }),
      prisma.meal.count({ where }),
    ]);

    return { data: data as any, total };
  }

  async getById(id: string): Promise<Meal | null> {
    const meal = await prisma.meal.findUnique({
      where: { id },
      include: {
        menu: {
          include: {
            approvals: true,
          },
        },
        attendances: {
          include: {
            variant: true,
            enrollment: true,
          },
        },
        feedbacks: true,
      },
    });
    return meal as any;
  }

  async getByMenu(menuId: string): Promise<Meal[]> {
    const meals = await prisma.meal.findMany({
      where: { menuId },
      include: {
        attendances: true,
        feedbacks: true,
      },
      orderBy: { mealType: 'asc' },
    });
    return meals as any;
  }

  async getByMenuAndType(
    menuId: string,
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  ): Promise<Meal | null> {
    const meal = await prisma.meal.findFirst({
      where: {
        menuId,
        mealType,
      },
      include: {
        attendances: true,
        feedbacks: true,
      },
    });
    return meal as any;
  }

  async create(
    data: CreateMealDto & { schoolId: string }
  ): Promise<Meal> {
    // Validate menu exists
    const menu = await prisma.menu.findUnique({
      where: { id: data.menuId },
    });

    if (!menu) {
      throw new Error('Menu not found');
    }

    // Check if meal type already exists for this menu
    const existing = await this.getByMenuAndType(data.menuId, data.mealType);
    if (existing) {
      throw new Error(`${data.mealType} meal already exists for this menu`);
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(data.serveTimeStart) || !timeRegex.test(data.serveTimeEnd)) {
      throw new Error('Invalid time format. Use HH:MM');
    }

    // Validate start time is before end time
    const [startHour, startMin] = data.serveTimeStart.split(':').map(Number);
    const [endHour, endMin] = data.serveTimeEnd.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      throw new Error('Serve start time must be before end time');
    }

    const meal = await prisma.meal.create({
      data: {
        menuId: data.menuId,
        schoolId: data.schoolId,
        name: data.name,
        mealType: data.mealType,
        serveTimeStart: data.serveTimeStart,
        serveTimeEnd: data.serveTimeEnd,
        isServing: true,
      },
      include: {
        menu: true,
      },
    });

    return meal as any;
  }

  async update(
    id: string,
    data: Partial<CreateMealDto>
  ): Promise<Meal> {
    const meal = await prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new Error('Meal not found');

    // If changing meal type, check for duplicates
    if (data.mealType && data.mealType !== meal.mealType) {
      const existing = await this.getByMenuAndType(meal.menuId, data.mealType);
      if (existing) {
        throw new Error(`${data.mealType} meal already exists for this menu`);
      }
    }

    // Validate time format if provided
    if (data.serveTimeStart || data.serveTimeEnd) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const startTime = data.serveTimeStart || meal.serveTimeStart;
      const endTime = data.serveTimeEnd || meal.serveTimeEnd;

      if (startTime && endTime && (!timeRegex.test(startTime) || !timeRegex.test(endTime))) {
        throw new Error('Invalid time format. Use HH:MM');
      }

      // Validate start time is before end time
      if (startTime && endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
          throw new Error('Serve start time must be before end time');
        }
      }
    }

    const updated = await prisma.meal.update({
      where: { id },
      data: {
        name: data.name,
        mealType: data.mealType,
        serveTimeStart: data.serveTimeStart,
        serveTimeEnd: data.serveTimeEnd,
      },
      include: {
        menu: true,
        attendances: true,
        feedbacks: true,
      },
    });

    return updated as any;
  }

  async updateServingStatus(id: string, isServing: boolean): Promise<Meal> {
    const meal = await prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new Error('Meal not found');

    // If enabling serving, check menu approval and kitchen hygiene
    if (isServing) {
      const menu = await prisma.menu.findUnique({
        where: { id: meal.menuId },
        include: {
          approvals: true,
        },
      });

      if (!menu) throw new Error('Menu not found');

      if (menu.status !== 'APPROVED') {
        throw new Error('Cannot serve meal from unapproved menu');
      }

      // Check kitchen hygiene
      const hygieneCheck = await prisma.kitchenHygieneChecklist.findFirst({
        where: {
          messId: menu.messId,
          checkDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!hygieneCheck) {
        throw new Error('Kitchen hygiene check required before serving meals');
      }

      const score = (hygieneCheck.overallScore / 50) * 100;
      if (score < 50) {
        throw new Error('Kitchen hygiene score below minimum threshold (50%)');
      }
    }

    const updated = await prisma.meal.update({
      where: { id },
      data: { isServing },
      include: {
        menu: true,
      },
    });

    return updated as any;
  }

  async delete(id: string): Promise<void> {
    const meal = await prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new Error('Meal not found');

    // Check if meal has attendances
    const attendanceCount = await prisma.mealAttendance.count({
      where: { mealId: id },
    });

    if (attendanceCount > 0) {
      throw new Error('Cannot delete meal with existing attendance records');
    }

    await prisma.meal.delete({
      where: { id },
    });
  }

  /**
   * Get meal statistics including attendance and feedback
   */
  async getStatistics(mealId: string): Promise<{
    totalAttendees: number;
    totalFeedbacks: number;
    avgRating: number;
    variants: number;
    servingStatus: boolean;
  }> {
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        attendances: true,
        feedbacks: true,
      },
    });

    if (!meal) throw new Error('Meal not found');

    let totalRating = 0;
    let ratingCount = 0;

    meal.feedbacks.forEach(f => {
      if (f.rating) {
        const ratingMap: Record<string, number> = {
          POOR: 1,
          AVERAGE: 2,
          GOOD: 3,
          EXCELLENT: 4,
        };
        totalRating += ratingMap[f.rating] || 0;
        ratingCount++;
      }
    });

    // Count variants - note: need to query variant count separately
    const variantCount = await prisma.mealVariant.count({
      where: { mealId },
    });

    return {
      totalAttendees: meal.attendances.length,
      totalFeedbacks: meal.feedbacks.length,
      avgRating: ratingCount > 0 ? Math.round((Number(totalRating) / ratingCount) * 10) / 10 : 0,
      variants: variantCount,
      servingStatus: meal.isServing,
    };
  }

  /**
   * Get serving window information
   */
  async getServingWindow(
    mealId: string
  ): Promise<{
    mealType: string;
    startTime: string | null;
    endTime: string | null;
    isCurrentlyServing: boolean;
  }> {
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!meal) throw new Error('Meal not found');

    // Check if current time is within serving window
    const now = new Date();
    const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let isCurrentlyServing = false;
    if (meal.serveTimeStart && meal.serveTimeEnd) {
      const [startHour, startMin] = meal.serveTimeStart.split(':').map(Number);
      const [endHour, endMin] = meal.serveTimeEnd.split(':').map(Number);
      const [currentHour, currentMin] = currentTimeString.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const currentMinutes = currentHour * 60 + currentMin;

      isCurrentlyServing = meal.isServing && currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return {
      mealType: meal.mealType,
      startTime: meal.serveTimeStart,
      endTime: meal.serveTimeEnd,
      isCurrentlyServing,
    };
  }

  /**
   * Get meals by date range and meal type
   */
  async getMealsByDateRange(
    messId: string,
    startDate: Date,
    endDate: Date,
    mealType?: string
  ): Promise<Meal[]> {
    const where: Prisma.MealWhereInput = {
      menu: {
        messId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (mealType) {
      where.mealType = mealType as any;
    }

    const meals = await prisma.meal.findMany({
      where,
      include: {
        menu: true,
        attendances: true,
        feedbacks: true,
      },
      orderBy: [{ menu: { date: 'asc' } }, { mealType: 'asc' }],
    });

    return meals as any;
  }
}

export const mealService = new MealService();
