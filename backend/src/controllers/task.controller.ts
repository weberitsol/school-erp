import { Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const taskController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { title, description, assignedToId, dueDate, priority, category } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      const task = await taskService.createTask({
        title,
        description,
        assignedToId,
        createdById: userId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority: priority as TaskPriority,
        category,
        schoolId,
      });

      res.status(201).json({ success: true, data: task, message: 'Task created successfully' });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ success: false, error: 'Failed to create task' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        search,
        status,
        priority,
        assignedToId,
        category,
        isActive,
        dueBefore,
        dueAfter,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await taskService.getTasks(
        {
          schoolId,
          search: search as string,
          status: status as TaskStatus,
          priority: priority as TaskPriority,
          assignedToId: assignedToId as string,
          category: category as string,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
          dueBefore: dueBefore ? new Date(dueBefore as string) : undefined,
          dueAfter: dueAfter ? new Date(dueAfter as string) : undefined,
        },
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      res.json({
        success: true,
        data: result.tasks,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
  },

  async getMyTasks(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { page, limit, sortBy, sortOrder } = req.query;

      const result = await taskService.getMyTasks(userId, schoolId, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({ success: true, data: result.tasks, total: result.total });
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const task = await taskService.getTaskById(id, schoolId);

      if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      res.json({ success: true, data: task });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch task' });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const stats = await taskService.getTaskStats(schoolId);

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching task stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch task stats' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { title, description, assignedToId, dueDate, status, priority, category, isActive } = req.body;

      // Check if task exists
      const existing = await taskService.getTaskById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      const task = await taskService.updateTask(id, schoolId, {
        title,
        description,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : dueDate === null ? null : undefined,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        category,
        isActive,
      });

      res.json({ success: true, data: task, message: 'Task updated successfully' });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ success: false, error: 'Failed to update task' });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Valid status is required' });
      }

      // Check if task exists
      const existing = await taskService.getTaskById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      const task = await taskService.updateTaskStatus(id, schoolId, status as TaskStatus);

      res.json({ success: true, data: task, message: 'Task status updated successfully' });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ success: false, error: 'Failed to update task status' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      // Check if task exists
      const existing = await taskService.getTaskById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      await taskService.deleteTask(id, schoolId);

      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ success: false, error: 'Failed to delete task' });
    }
  },
};
