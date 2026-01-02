'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { tasksApi, Task, TaskStatus, TaskPriority } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'add' | 'edit';

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  category: string;
  assignedToId: string;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'MEDIUM',
  category: '',
  assignedToId: '',
};

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const statusOptions: { value: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'PENDING', label: 'Pending', icon: Circle, color: 'text-gray-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
];

const categoryOptions = [
  { value: 'fee_collection', label: 'Fee Collection' },
  { value: 'parent_meeting', label: 'Parent Meeting' },
  { value: 'report', label: 'Report' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

export default function TasksPage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Mark component as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await tasksApi.getAll(accessToken, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      if (res.success && res.data) {
        setTasks(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, searchTerm, statusFilter, priorityFilter, toast]);

  useEffect(() => {
    if (mode === 'list' && mounted) {
      fetchTasks();
    }
  }, [mode, fetchTasks, mounted]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate || undefined,
        assignedToId: formData.assignedToId || undefined,
        category: formData.category || undefined,
      };

      if (mode === 'add') {
        const res = await tasksApi.create(payload, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Task created successfully' });
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create task', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedTask) {
        const res = await tasksApi.update(selectedTask.id, payload, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Task updated successfully' });
          setSelectedTask(null);
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update task', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast({ title: 'Error', description: 'Failed to save task', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (task: Task, newStatus: TaskStatus) => {
    if (!accessToken) return;

    try {
      const res = await tasksApi.updateStatus(task.id, newStatus, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: `Task marked as ${newStatus.toLowerCase().replace('_', ' ')}` });
        fetchTasks();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Handle delete
  const handleDelete = async (task: Task) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    setIsLoading(true);
    try {
      const res = await tasksApi.delete(task.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Task deleted successfully' });
        fetchTasks();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete task', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit click
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority,
      category: task.category || '',
      assignedToId: task.assignedToId || '',
    });
    setFormErrors({});
    setMode('edit');
  };

  // Get priority badge
  const getPriorityBadge = (priority: TaskPriority) => {
    const opt = priorityOptions.find((p) => p.value === priority);
    return opt ? (
      <span className={cn('inline-flex px-2 py-1 text-xs font-medium rounded-full', opt.color)}>
        {opt.label}
      </span>
    ) : null;
  };

  // Get status icon
  const getStatusDisplay = (status: TaskStatus) => {
    const opt = statusOptions.find((s) => s.value === status);
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <div className={cn('flex items-center gap-1', opt.color)}>
        <Icon className="h-4 w-4" />
        <span className="text-sm">{opt.label}</span>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="h-7 w-7 text-blue-600" />
              Tasks
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage administrative tasks</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="h-7 w-7 text-blue-600" />
            Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage administrative tasks</p>
        </div>
        {mode === 'list' && (
          <button
            onClick={() => {
              setFormData(initialFormData);
              setFormErrors({});
              setMode('add');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        )}
      </div>

      {/* List View */}
      {mode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(tasks || []).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'p-4 border rounded-lg transition-all hover:shadow-md',
                      task.status === 'COMPLETED'
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                        : task.status === 'CANCELLED'
                        ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 opacity-60'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() =>
                              handleStatusUpdate(
                                task,
                                task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                              )
                            }
                            className={cn(
                              'mt-1 p-1 rounded transition-colors',
                              task.status === 'COMPLETED'
                                ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            {task.status === 'COMPLETED' ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h3
                              className={cn(
                                'font-medium',
                                task.status === 'COMPLETED'
                                  ? 'line-through text-gray-500 dark:text-gray-400'
                                  : 'text-gray-900 dark:text-white'
                              )}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {getPriorityBadge(task.priority)}
                              {getStatusDisplay(task.status)}
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {task.category && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                  {task.category.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(mode === 'add' || mode === 'edit') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Add New Task' : 'Edit Task'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedTask(null);
                setFormData(initialFormData);
                setFormErrors({});
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                    formErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="Enter task title"
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the task..."
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedTask(null);
                  setFormData(initialFormData);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Create Task' : 'Update Task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
