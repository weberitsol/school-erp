import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateFeedbackActionData {
  feedbackId: string;
  schoolId: string;
  actionDescription: string;
  actionDate: Date;
  status?: string;
}

export interface UpdateFeedbackActionData {
  actionDescription?: string;
  actionDate?: Date;
  completionDate?: Date;
  status?: string;
}

export interface FeedbackActionFilters {
  feedbackId?: string;
  schoolId?: string;
  status?: string;
  skip?: number;
  take?: number;
}

class FeedbackActionService {
  /**
   * Create new feedback action
   */
  async createAction(data: CreateFeedbackActionData) {
    try {
      const action = await prisma.feedbackAction.create({
        data: {
          feedbackId: data.feedbackId,
          schoolId: data.schoolId,
          actionDescription: data.actionDescription,
          actionDate: data.actionDate,
          status: data.status || 'OPEN',
        },
        include: {
          feedback: true,
        },
      });

      return action;
    } catch (error: any) {
      throw new Error(`Failed to create feedback action: ${error.message}`);
    }
  }

  /**
   * Get actions with filters
   */
  async getActions(filters?: FeedbackActionFilters) {
    try {
      const where: any = {};

      if (filters?.feedbackId) {
        where.feedbackId = filters.feedbackId;
      }
      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }
      if (filters?.status) {
        where.status = filters.status;
      }

      const [data, total] = await Promise.all([
        prisma.feedbackAction.findMany({
          where,
          include: {
            feedback: true,
          },
          skip: filters?.skip,
          take: filters?.take,
          orderBy: {
            actionDate: 'desc',
          },
        }),
        prisma.feedbackAction.count({ where }),
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch actions: ${error.message}`);
    }
  }

  /**
   * Get action by ID
   */
  async getActionById(id: string) {
    try {
      const action = await prisma.feedbackAction.findUnique({
        where: { id },
        include: {
          feedback: true,
        },
      });

      if (!action) {
        throw new Error('Action not found');
      }

      return action;
    } catch (error: any) {
      throw new Error(`Failed to fetch action: ${error.message}`);
    }
  }

  /**
   * Update feedback action
   */
  async updateAction(id: string, data: UpdateFeedbackActionData) {
    try {
      const action = await prisma.feedbackAction.update({
        where: { id },
        data: {
          actionDescription: data.actionDescription,
          actionDate: data.actionDate,
          completionDate: data.completionDate,
          status: data.status,
        },
        include: {
          feedback: true,
        },
      });

      return action;
    } catch (error: any) {
      throw new Error(`Failed to update action: ${error.message}`);
    }
  }

  /**
   * Mark action as complete
   */
  async completeAction(id: string, completionDate?: Date) {
    try {
      const action = await prisma.feedbackAction.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completionDate: completionDate || new Date(),
        },
        include: {
          feedback: true,
        },
      });

      return action;
    } catch (error: any) {
      throw new Error(`Failed to complete action: ${error.message}`);
    }
  }

  /**
   * Delete feedback action
   */
  async deleteAction(id: string) {
    try {
      const action = await prisma.feedbackAction.delete({
        where: { id },
        include: {
          feedback: true,
        },
      });

      return action;
    } catch (error: any) {
      throw new Error(`Failed to delete action: ${error.message}`);
    }
  }

  /**
   * Get actions for a feedback
   */
  async getFeedbackActions(feedbackId: string) {
    try {
      const actions = await prisma.feedbackAction.findMany({
        where: { feedbackId },
        include: {
          feedback: true,
        },
        orderBy: {
          actionDate: 'desc',
        },
      });

      return actions;
    } catch (error: any) {
      throw new Error(`Failed to fetch feedback actions: ${error.message}`);
    }
  }

  /**
   * Get open actions
   */
  async getOpenActions(schoolId: string) {
    try {
      const actions = await prisma.feedbackAction.findMany({
        where: {
          schoolId,
          status: 'OPEN',
        },
        include: {
          feedback: true,
        },
        orderBy: {
          actionDate: 'asc',
        },
      });

      return actions;
    } catch (error: any) {
      throw new Error(`Failed to fetch open actions: ${error.message}`);
    }
  }

  /**
   * Get overdue actions
   */
  async getOverdueActions(schoolId: string) {
    try {
      const now = new Date();
      const actions = await prisma.feedbackAction.findMany({
        where: {
          schoolId,
          status: 'OPEN',
          actionDate: {
            lt: now,
          },
        },
        include: {
          feedback: true,
        },
        orderBy: {
          actionDate: 'asc',
        },
      });

      return actions;
    } catch (error: any) {
      throw new Error(`Failed to fetch overdue actions: ${error.message}`);
    }
  }

  /**
   * Get action statistics
   */
  async getActionStats(schoolId: string) {
    try {
      const [total, open, completed] = await Promise.all([
        prisma.feedbackAction.count({
          where: { schoolId },
        }),
        prisma.feedbackAction.count({
          where: { schoolId, status: 'OPEN' },
        }),
        prisma.feedbackAction.count({
          where: { schoolId, status: 'COMPLETED' },
        }),
      ]);

      const overdue = await this.getOverdueActions(schoolId);

      return {
        totalActions: total,
        openActions: open,
        completedActions: completed,
        overdueCount: overdue.length,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch action stats: ${error.message}`);
    }
  }
}

export const feedbackActionService = new FeedbackActionService();
