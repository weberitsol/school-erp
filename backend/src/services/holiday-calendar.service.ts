import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface HolidayData {
  date: Date;
  holidayName: string;
  mealArrangement?: string;
  notes?: string;
  schoolId: string;
}

class HolidayCalendarService {
  /**
   * Create a holiday in the calendar
   */
  async create(data: HolidayData) {
    // Check if holiday already exists for this date
    const existing = await prisma.holidayCalendar.findFirst({
      where: {
        schoolId: data.schoolId,
        date: {
          gte: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate()),
          lt: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate() + 1),
        },
      },
    });

    if (existing) {
      throw new Error(`Holiday already exists on ${data.date.toDateString()}`);
    }

    const holiday = await prisma.holidayCalendar.create({
      data: {
        date: data.date,
        holidayName: data.holidayName,
        mealArrangement: data.mealArrangement,
        notes: data.notes,
        schoolId: data.schoolId,
      },
    });

    return holiday;
  }

  /**
   * Get holiday by ID
   */
  async getById(id: string) {
    const holiday = await prisma.holidayCalendar.findUnique({
      where: { id },
    });

    return holiday;
  }

  /**
   * Get all holidays with filters
   */
  async getAll(filters?: {
    schoolId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: any[]; total: number }> {
    const where: Prisma.HolidayCalendarWhereInput = {};

    if (filters?.schoolId) where.schoolId = filters.schoolId;

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters?.startDate) where.date.gte = filters.startDate;
      if (filters?.endDate) where.date.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.holidayCalendar.findMany({
        where,
        orderBy: { date: 'asc' },
      }),
      prisma.holidayCalendar.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get holidays for a specific month
   * Used for attendance calendar UI
   */
  async getMonthHolidays(schoolId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const holidays = await prisma.holidayCalendar.findMany({
      where: {
        schoolId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return holidays;
  }

  /**
   * Check if a specific date is a holiday
   * Used for attendance marking to mark attendance as HOLIDAY
   */
  async isHoliday(schoolId: string, date: Date): Promise<boolean> {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const holiday = await prisma.holidayCalendar.findFirst({
      where: {
        schoolId,
        date: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
    });

    return !!holiday;
  }

  /**
   * Get holiday details for a specific date
   */
  async getHolidayOnDate(schoolId: string, date: Date) {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const holiday = await prisma.holidayCalendar.findFirst({
      where: {
        schoolId,
        date: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
    });

    return holiday;
  }

  /**
   * Get next N holidays from a date
   * Used for attendance planning
   */
  async getUpcomingHolidays(schoolId: string, fromDate: Date, count: number = 10) {
    const holidays = await prisma.holidayCalendar.findMany({
      where: {
        schoolId,
        date: {
          gte: fromDate,
        },
      },
      orderBy: { date: 'asc' },
      take: count,
    });

    return holidays;
  }

  /**
   * Get all holidays in a date range with meal arrangement info
   */
  async getHolidaysWithMealArrangement(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ) {
    const holidays = await prisma.holidayCalendar.findMany({
      where: {
        schoolId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by meal arrangement type
    const groupedByArrangement: Record<string, any[]> = {};
    const noArrangementHolidays: any[] = [];

    holidays.forEach((holiday) => {
      if (holiday.mealArrangement) {
        if (!groupedByArrangement[holiday.mealArrangement]) {
          groupedByArrangement[holiday.mealArrangement] = [];
        }
        groupedByArrangement[holiday.mealArrangement].push(holiday);
      } else {
        noArrangementHolidays.push(holiday);
      }
    });

    return {
      totalHolidays: holidays.length,
      byArrangement: groupedByArrangement,
      noArrangement: noArrangementHolidays,
      allHolidays: holidays,
    };
  }

  /**
   * Update holiday details
   */
  async update(
    id: string,
    data: {
      holidayName?: string;
      mealArrangement?: string;
      notes?: string;
    }
  ) {
    const updated = await prisma.holidayCalendar.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Delete a holiday from the calendar
   */
  async delete(id: string) {
    await prisma.holidayCalendar.delete({ where: { id } });
  }

  /**
   * Bulk upload holidays (for academic year setup)
   */
  async bulkCreate(holidays: HolidayData[]) {
    const created = await Promise.all(
      holidays.map((holiday) =>
        this.create(holiday).catch((error) => ({
          error: error.message,
          holiday,
        }))
      )
    );

    const successful = created.filter((c) => !('error' in c));
    const failed = created.filter((c) => 'error' in c);

    return {
      successCount: successful.length,
      failureCount: failed.length,
      successful: successful as any[],
      failed: failed as any[],
    };
  }

  /**
   * Get holiday statistics for a school
   */
  async getHolidayStats(schoolId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const holidays = await prisma.holidayCalendar.findMany({
      where: {
        schoolId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const byMonth: Record<number, number> = {};
    const byArrangement: Record<string, number> = {};

    holidays.forEach((holiday) => {
      const month = holiday.date.getMonth() + 1;
      byMonth[month] = (byMonth[month] || 0) + 1;

      const arrangement = holiday.mealArrangement || 'No Arrangement';
      byArrangement[arrangement] = (byArrangement[arrangement] || 0) + 1;
    });

    return {
      year,
      schoolId,
      totalHolidays: holidays.length,
      byMonth,
      byArrangement,
    };
  }
}

export const holidayCalendarService = new HolidayCalendarService();
