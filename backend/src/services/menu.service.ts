import { PrismaClient, Prisma, DayOfWeek } from '@prisma/client';

const prisma = new PrismaClient();

export interface Menu {
  id: string;
  messId: string;
  schoolId: string;
  date: Date;
  dayOfWeek: DayOfWeek;
  season?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuDto {
  messId: string;
  date: Date;
  dayOfWeek?: DayOfWeek;
  season?: string;
  schoolId: string;
}

class MenuService {
  async getAll(filters?: {
    messId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    schoolId?: string;
  }): Promise<{ data: Menu[]; total: number }> {
    const where: Prisma.MenuWhereInput = {};

    if (filters?.messId) where.messId = filters.messId;
    if (filters?.status) where.status = filters.status as any;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters?.startDate) where.date!.gte = filters.startDate;
      if (filters?.endDate) where.date!.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        include: {
          meals: {
            include: {
              feedbacks: true,
            },
          },
          approvals: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.menu.count({ where }),
    ]);

    return { data: data as any, total };
  }

  async getById(id: string): Promise<Menu | null> {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        meals: {
          include: {
            attendances: true,
            feedbacks: true,
          },
        },
        approvals: true,
        mess: true,
      },
    });
    return menu as any;
  }

  async getByDate(messId: string, date: Date): Promise<Menu | null> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const endDate = new Date(dateOnly);
    endDate.setDate(endDate.getDate() + 1);

    const menu = await prisma.menu.findFirst({
      where: {
        messId,
        date: {
          gte: dateOnly,
          lt: endDate,
        },
      },
      include: {
        meals: {
          include: {
            attendances: true,
          },
        },
      },
    });
    return menu as any;
  }

  async getMenusByDateRange(
    messId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Menu[]> {
    const menus = await prisma.menu.findMany({
      where: {
        messId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        meals: true,
      },
      orderBy: { date: 'asc' },
    });
    return menus as any;
  }

  async create(data: CreateMenuDto): Promise<Menu> {
    // Check if menu already exists for this date
    const existing = await this.getByDate(data.messId, data.date);
    if (existing) {
      throw new Error('Menu already exists for this date');
    }

    // Calculate dayOfWeek if not provided
    const dayOfWeekValue = data.dayOfWeek || this.calculateDayOfWeek(data.date);

    const menu = await prisma.menu.create({
      data: {
        messId: data.messId,
        schoolId: data.schoolId,
        date: data.date,
        dayOfWeek: dayOfWeekValue,
        season: data.season,
        status: 'DRAFT',
      },
      include: {
        meals: true,
      },
    });

    return menu as any;
  }

  /**
   * Calculate DayOfWeek enum value from a date
   */
  private calculateDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as DayOfWeek[];
    return days[new Date(date).getDay()];
  }

  async update(id: string, data: Partial<CreateMenuDto>): Promise<Menu> {
    const menu = await prisma.menu.update({
      where: { id },
      data: {
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        season: data.season,
      },
      include: {
        meals: true,
      },
    });

    return menu as any;
  }

  async updateStatus(
    id: string,
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED',
    notes?: string
  ): Promise<Menu> {
    const menu = await prisma.menu.update({
      where: { id },
      data: {
        status: status as any,
        approvalNotes: notes,
      },
      include: {
        meals: true,
      },
    });

    return menu as any;
  }

  async publish(id: string): Promise<Menu> {
    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) throw new Error('Menu not found');

    if (menu.status !== 'DRAFT') {
      throw new Error('Only draft menus can be published');
    }

    return this.updateStatus(id, 'PENDING');
  }

  async delete(id: string): Promise<void> {
    await prisma.menu.delete({
      where: { id },
    });
  }

  /**
   * Get menu statistics
   */
  async getStatistics(menuId: string): Promise<{
    totalMeals: number;
    mealsWithAttendance: number;
    avgFeedbackRating: number;
    mealTypes: string[];
    allergenWarnings: string[];
  }> {
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        meals: {
          include: {
            attendances: true,
            feedbacks: true,
          },
        },
      },
    });

    if (!menu) throw new Error('Menu not found');

    let totalAttendance = 0;
    let totalRating = 0;
    let ratingCount = 0;
    const mealTypes = new Set<string>();

    for (const meal of menu.meals) {
      mealTypes.add(meal.mealType);
      totalAttendance += meal.attendances.length;
      meal.feedbacks.forEach(f => {
        const ratingMap: Record<string, number> = {
          POOR: 1,
          AVERAGE: 2,
          GOOD: 3,
          EXCELLENT: 4,
        };
        if (f.rating) {
          totalRating += ratingMap[f.rating] || 0;
          ratingCount++;
        }
      });
    }

    return {
      totalMeals: menu.meals.length,
      mealsWithAttendance: totalAttendance,
      avgFeedbackRating: ratingCount > 0 ? Math.round(totalRating / ratingCount * 10) / 10 : 0,
      mealTypes: Array.from(mealTypes),
      allergenWarnings: [], // Can be enhanced with allergen checking
    };
  }

  /**
   * Clone menu from another date
   */
  async cloneFromDate(
    messId: string,
    sourceDate: Date,
    targetDate: Date,
    schoolId: string
  ): Promise<Menu> {
    const sourceMenu = await this.getByDate(messId, sourceDate);
    if (!sourceMenu) {
      throw new Error('Source menu not found');
    }

    // Create new menu
    const targetDayOfWeek = this.calculateDayOfWeek(targetDate);

    const newMenu = await this.create({
      messId,
      date: targetDate,
      dayOfWeek: targetDayOfWeek,
      schoolId,
    });

    // Clone meals from source
    const sourceMenuWithMeals = await this.getByDate(messId, sourceDate);
    if (!sourceMenuWithMeals) {
      throw new Error('Source menu not found');
    }

    const mealsData = await prisma.meal.findMany({
      where: { menuId: sourceMenuWithMeals.id },
    });

    for (const meal of mealsData) {
      await prisma.meal.create({
        data: {
          menuId: newMenu.id,
          schoolId,
          name: meal.name,
          mealType: meal.mealType,
          serveTimeStart: meal.serveTimeStart,
          serveTimeEnd: meal.serveTimeEnd,
          isServing: true,
        },
      });
    }

    return this.getById(newMenu.id) as Promise<Menu>;
  }
}

export const menuService = new MenuService();
