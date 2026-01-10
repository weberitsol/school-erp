import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/mess`;

export interface HolidayInput {
  date: Date;
  holidayName: string;
  mealArrangement?: string;
  notes?: string;
}

export interface Holiday {
  id: string;
  date: Date;
  holidayName: string;
  mealArrangement?: string;
  notes?: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

class HolidayService {
  async create(data: HolidayInput): Promise<Holiday> {
    const response = await axios.post(`${API_BASE}/holidays`, {
      ...data,
      date: data.date.toISOString(),
    });
    return response.data.data;
  }

  async bulkCreate(holidays: HolidayInput[]): Promise<any> {
    const response = await axios.post(`${API_BASE}/holidays/bulk`, {
      holidays: holidays.map((h) => ({
        ...h,
        date: h.date.toISOString(),
      })),
    });
    return response.data.data;
  }

  async getAll(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: Holiday[]; total: number }> {
    const response = await axios.get(`${API_BASE}/holidays`, {
      params: {
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
      },
    });
    return response.data;
  }

  async getById(id: string): Promise<Holiday> {
    const response = await axios.get(`${API_BASE}/holidays/${id}`);
    return response.data.data;
  }

  async getMonthHolidays(year: number, month: number): Promise<Holiday[]> {
    const response = await axios.get(`${API_BASE}/holidays/month/${year}/${month}`);
    return response.data.data;
  }

  async isHoliday(date: Date): Promise<{
    isHoliday: boolean;
    holiday?: Holiday;
  }> {
    const response = await axios.get(`${API_BASE}/holidays/check/is-holiday`, {
      params: { date: date.toISOString() },
    });
    return response.data.data;
  }

  async getUpcomingHolidays(count: number = 10): Promise<Holiday[]> {
    const response = await axios.get(`${API_BASE}/holidays/upcoming`, {
      params: { count },
    });
    return response.data.data;
  }

  async update(
    id: string,
    data: Partial<HolidayInput>
  ): Promise<Holiday> {
    const response = await axios.put(`${API_BASE}/holidays/${id}`, {
      ...data,
      date: data.date?.toISOString(),
    });
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/holidays/${id}`);
  }

  async getHolidayStats(year: number): Promise<any> {
    const response = await axios.get(`${API_BASE}/holidays/stats/${year}`);
    return response.data.data;
  }
}

export const holidayService = new HolidayService();
