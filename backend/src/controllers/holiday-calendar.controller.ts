import { Request, Response } from 'express';
import { holidayCalendarService } from '../services/holiday-calendar.service';

export const holidayCalendarController = {
  async getAll(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const data = await holidayCalendarService.getAll({
        schoolId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({ success: true, data: data.data, total: data.total });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const holiday = await holidayCalendarService.getById(id);

      if (!holiday) {
        return res
          .status(404)
          .json({ success: false, error: 'Holiday not found' });
      }

      res.json({ success: true, data: holiday });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getMonthHolidays(req: Request, res: Response) {
    try {
      const { year, month } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      if (!year || !month) {
        return res
          .status(400)
          .json({ success: false, error: 'year and month query parameters required' });
      }

      const holidays = await holidayCalendarService.getMonthHolidays(
        schoolId,
        parseInt(year as string),
        parseInt(month as string)
      );

      res.json({
        success: true,
        data: holidays,
        message: `${holidays.length} holiday(ies) in ${month}/${year}`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async isHoliday(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      if (!date) {
        return res.status(400).json({ success: false, error: 'date query parameter required' });
      }

      const holiday = await holidayCalendarService.getHolidayOnDate(
        schoolId,
        new Date(date as string)
      );
      const isHoliday = !!holiday;

      res.json({
        success: true,
        data: {
          isHoliday,
          holiday,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getUpcomingHolidays(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { count } = req.query;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const holidays = await holidayCalendarService.getUpcomingHolidays(
        schoolId,
        new Date(),
        count ? parseInt(count as string) : 10
      );

      res.json({
        success: true,
        data: holidays,
        message: `${holidays.length} upcoming holiday(ies)`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { date, holidayName, mealArrangement, notes } = req.body;

      if (!date || !holidayName) {
        return res
          .status(400)
          .json({ success: false, error: 'date and holidayName are required' });
      }

      const holiday = await holidayCalendarService.create({
        date: new Date(date),
        holidayName,
        mealArrangement,
        notes,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: holiday,
        message: `✓ Holiday added: ${holidayName}`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async bulkCreate(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { holidays } = req.body;

      if (!Array.isArray(holidays)) {
        return res
          .status(400)
          .json({ success: false, error: 'holidays array is required' });
      }

      const result = await holidayCalendarService.bulkCreate(
        holidays.map((h: any) => ({
          ...h,
          date: new Date(h.date),
          schoolId,
        }))
      );

      res.status(201).json({
        success: true,
        data: result,
        message: `✓ Bulk upload: ${result.successCount} successful, ${result.failureCount} failed`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { holidayName, mealArrangement, notes } = req.body;

      const updated = await holidayCalendarService.update(id, {
        holidayName,
        mealArrangement,
        notes,
      });

      res.json({
        success: true,
        data: updated,
        message: 'Holiday updated',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await holidayCalendarService.delete(id);

      res.json({ success: true, message: 'Holiday deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getHolidayStats(req: Request, res: Response) {
    try {
      const { year } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      if (!year) {
        return res.status(400).json({ success: false, error: 'year query parameter required' });
      }

      const stats = await holidayCalendarService.getHolidayStats(
        schoolId,
        parseInt(year as string)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
