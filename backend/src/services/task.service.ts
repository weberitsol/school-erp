import { PrismaClient, Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface TaskFilters {
  schoolId: string;
  isActive?: boolean;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  createdById?: string;
  category?: string;
  dueBefore?: Date;
  dueAfter?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateTaskData {
  title: string;
  description?: string;
  assignedToId?: string;
  createdById: string;
  dueDate?: Date;
  priority?: TaskPriority;
  category?: string;
  schoolId: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  assignedToId?: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  isActive?: boolean;
}

class TaskService {
  async createTask(data: CreateTaskData): Promise<Task> {
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedToId: data.assignedToId,
        createdById: data.createdById,
        dueDate: data.dueDate,
        priority: data.priority || 'MEDIUM',
        category: data.category,
        schoolId: data.schoolId,
      },
      include: {
        assignedTo: {
          select: { id: true, email: true },
        },
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async getTasks(
    filters: TaskFilters,
    pagination: PaginationParams = {}
  ): Promise<{ tasks: Task[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where: Prisma.TaskWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters.createdById && { createdById: filters.createdById }),
      ...(filters.category && { category: filters.category }),
      ...(filters.dueBefore && { dueDate: { lte: filters.dueBefore } }),
      ...(filters.dueAfter && { dueDate: { gte: filters.dueAfter } }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: {
            select: { id: true, email: true },
          },
          createdBy: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTaskById(id: string, schoolId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: { id, schoolId },
      include: {
        assignedTo: {
          select: { id: true, email: true },
        },
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async getMyTasks(
    userId: string,
    schoolId: string,
    pagination: PaginationParams = {}
  ): Promise<{ tasks: Task[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = pagination;

    const where: Prisma.TaskWhereInput = {
      schoolId,
      assignedToId: userId,
      isActive: true,
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async updateTask(id: string, schoolId: string, data: UpdateTaskData): Promise<Task> {
    // If status is being set to COMPLETED, set completedAt
    if (data.status === 'COMPLETED' && !data.completedAt) {
      data.completedAt = new Date();
    }
    // If status is being changed from COMPLETED, clear completedAt
    if (data.status && data.status !== 'COMPLETED') {
      data.completedAt = null;
    }

    return prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, email: true },
        },
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async updateTaskStatus(id: string, schoolId: string, status: TaskStatus): Promise<Task> {
    const completedAt = status === 'COMPLETED' ? new Date() : null;

    return prisma.task.update({
      where: { id },
      data: { status, completedAt },
      include: {
        assignedTo: {
          select: { id: true, email: true },
        },
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async deleteTask(id: string, schoolId: string): Promise<Task> {
    // Soft delete
    return prisma.task.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteTask(id: string, schoolId: string): Promise<Task> {
    return prisma.task.delete({
      where: { id },
    });
  }

  async getTaskStats(schoolId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      prisma.task.count({ where: { schoolId, isActive: true } }),
      prisma.task.count({ where: { schoolId, isActive: true, status: 'PENDING' } }),
      prisma.task.count({ where: { schoolId, isActive: true, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { schoolId, isActive: true, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          schoolId,
          isActive: true,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return { total, pending, inProgress, completed, overdue };
  }
}

export const taskService = new TaskService();
