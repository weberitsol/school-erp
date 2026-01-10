import { PrismaClient, MessComplaintStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateComplaintData {
  studentId: string;
  schoolId: string;
  title: string;
  description: string;
  category?: string;
}

export interface UpdateComplaintData {
  title?: string;
  description?: string;
  category?: string;
  status?: MessComplaintStatus;
  resolutionNotes?: string;
  resolutionDate?: Date;
}

export interface ComplaintFilters {
  studentId?: string;
  schoolId?: string;
  status?: MessComplaintStatus;
  category?: string;
  skip?: number;
  take?: number;
}

export interface ComplaintStats {
  totalComplaints: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  averageResolutionTime: number;
}

class MessComplaintService {
  /**
   * Create new complaint
   */
  async createComplaint(data: CreateComplaintData) {
    try {
      const complaint = await prisma.messComplaint.create({
        data: {
          studentId: data.studentId,
          schoolId: data.schoolId,
          title: data.title,
          description: data.description,
          category: data.category,
          status: 'OPEN',
        },
        include: {
          student: true,
        },
      });

      return complaint;
    } catch (error: any) {
      throw new Error(`Failed to create complaint: ${error.message}`);
    }
  }

  /**
   * Get complaints with filters
   */
  async getComplaints(filters?: ComplaintFilters) {
    try {
      const where: any = {};

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }
      if (filters?.studentId) {
        where.studentId = filters.studentId;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.category) {
        where.category = filters.category;
      }

      const [data, total] = await Promise.all([
        prisma.messComplaint.findMany({
          where,
          include: {
            student: true,
          },
          skip: filters?.skip,
          take: filters?.take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.messComplaint.count({ where }),
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch complaints: ${error.message}`);
    }
  }

  /**
   * Get complaint by ID
   */
  async getComplaintById(id: string) {
    try {
      const complaint = await prisma.messComplaint.findUnique({
        where: { id },
        include: {
          student: true,
        },
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      return complaint;
    } catch (error: any) {
      throw new Error(`Failed to fetch complaint: ${error.message}`);
    }
  }

  /**
   * Update complaint
   */
  async updateComplaint(id: string, data: UpdateComplaintData) {
    try {
      const complaint = await prisma.messComplaint.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          status: data.status,
          resolutionNotes: data.resolutionNotes,
          resolutionDate: data.resolutionDate,
        },
        include: {
          student: true,
        },
      });

      return complaint;
    } catch (error: any) {
      throw new Error(`Failed to update complaint: ${error.message}`);
    }
  }

  /**
   * Update complaint status
   */
  async updateComplaintStatus(
    id: string,
    status: MessComplaintStatus,
    resolutionNotes?: string
  ) {
    try {
      const data: any = { status };

      if (status === 'RESOLVED' || status === 'CLOSED') {
        data.resolutionDate = new Date();
        if (resolutionNotes) {
          data.resolutionNotes = resolutionNotes;
        }
      }

      const complaint = await prisma.messComplaint.update({
        where: { id },
        data,
        include: {
          student: true,
        },
      });

      return complaint;
    } catch (error: any) {
      throw new Error(`Failed to update complaint status: ${error.message}`);
    }
  }

  /**
   * Delete complaint
   */
  async deleteComplaint(id: string) {
    try {
      const complaint = await prisma.messComplaint.delete({
        where: { id },
        include: {
          student: true,
        },
      });

      return complaint;
    } catch (error: any) {
      throw new Error(`Failed to delete complaint: ${error.message}`);
    }
  }

  /**
   * Get open complaints
   */
  async getOpenComplaints(schoolId: string, filters?: ComplaintFilters) {
    try {
      const where: any = {
        schoolId,
        status: 'OPEN',
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      const [data, total] = await Promise.all([
        prisma.messComplaint.findMany({
          where,
          include: {
            student: true,
          },
          skip: filters?.skip,
          take: filters?.take,
          orderBy: {
            createdAt: 'asc',
          },
        }),
        prisma.messComplaint.count({ where }),
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch open complaints: ${error.message}`);
    }
  }

  /**
   * Get complaints by category
   */
  async getComplaintsByCategory(schoolId: string, category: string) {
    try {
      const complaints = await prisma.messComplaint.findMany({
        where: {
          schoolId,
          category,
        },
        include: {
          student: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return complaints;
    } catch (error: any) {
      throw new Error(`Failed to fetch complaints by category: ${error.message}`);
    }
  }

  /**
   * Get student complaints
   */
  async getStudentComplaints(studentId: string, schoolId: string) {
    try {
      const complaints = await prisma.messComplaint.findMany({
        where: {
          studentId,
          schoolId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return complaints;
    } catch (error: any) {
      throw new Error(`Failed to fetch student complaints: ${error.message}`);
    }
  }

  /**
   * Get complaint categories
   */
  async getCategories(schoolId: string) {
    try {
      const complaints = await prisma.messComplaint.findMany({
        where: { schoolId },
        distinct: ['category'],
        select: {
          category: true,
        },
      });

      return complaints
        .map((c) => c.category)
        .filter((c) => c !== null) as string[];
    } catch (error: any) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Get complaint statistics
   */
  async getComplaintStats(schoolId: string): Promise<ComplaintStats> {
    try {
      const [total, open, inProgress, resolved, closed] = await Promise.all([
        prisma.messComplaint.count({
          where: { schoolId },
        }),
        prisma.messComplaint.count({
          where: { schoolId, status: 'OPEN' },
        }),
        prisma.messComplaint.count({
          where: { schoolId, status: 'IN_PROGRESS' },
        }),
        prisma.messComplaint.count({
          where: { schoolId, status: 'RESOLVED' },
        }),
        prisma.messComplaint.count({
          where: { schoolId, status: 'CLOSED' },
        }),
      ]);

      const resolutionTime = await this.calculateAverageResolutionTime(schoolId);

      return {
        totalComplaints: total,
        openCount: open,
        inProgressCount: inProgress,
        resolvedCount: resolved,
        closedCount: closed,
        averageResolutionTime: resolutionTime,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch complaint stats: ${error.message}`);
    }
  }

  /**
   * Calculate average resolution time
   */
  private async calculateAverageResolutionTime(schoolId: string): Promise<number> {
    try {
      const resolvedComplaints = await prisma.messComplaint.findMany({
        where: {
          schoolId,
          status: 'RESOLVED',
          resolutionDate: { not: null },
        },
        select: {
          createdAt: true,
          resolutionDate: true,
        },
      });

      if (resolvedComplaints.length === 0) {
        return 0;
      }

      const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        if (complaint.resolutionDate) {
          const diff =
            complaint.resolutionDate.getTime() - complaint.createdAt.getTime();
          return sum + diff;
        }
        return sum;
      }, 0);

      const avgTimeMs = totalTime / resolvedComplaints.length;
      return Math.round(avgTimeMs / (1000 * 60 * 60 * 24)); // Convert to days
    } catch (error: any) {
      return 0;
    }
  }

  /**
   * Get complaint summary by status
   */
  async getComplaintSummary(schoolId: string) {
    try {
      const complaints = await prisma.messComplaint.findMany({
        where: { schoolId },
        select: {
          status: true,
        },
      });

      const summary = {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
      };

      complaints.forEach((c) => {
        summary[c.status as MessComplaintStatus]++;
      });

      return summary;
    } catch (error: any) {
      throw new Error(`Failed to fetch complaint summary: ${error.message}`);
    }
  }
}

export const messComplaintService = new MessComplaintService();
