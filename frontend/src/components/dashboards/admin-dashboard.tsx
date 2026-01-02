'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  UserPlus,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Activity,
  BarChart3,
  PieChart,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  feeCollection: number;
  studentChange?: string;
  teacherChange?: string;
  classChange?: string;
  feeChange?: string;
}

interface RecentActivity {
  id: number | string;
  type: string;
  message: string;
  time: string;
  icon?: any;
  gradient?: string;
}

interface UpcomingEvent {
  id: number | string;
  title: string;
  date: string;
  time: string;
  type: string;
  color: string;
}

interface PendingTask {
  id: number | string;
  task: string;
  priority: string;
  progress: number;
}

// Default fallback data
const defaultStats = [
  {
    title: 'Total Students',
    value: 0,
    change: '0%',
    changeType: 'neutral',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-400',
    shadowColor: 'shadow-blue-500/25',
  },
  {
    title: 'Total Teachers',
    value: 0,
    change: '0%',
    changeType: 'neutral',
    icon: GraduationCap,
    gradient: 'from-emerald-500 to-teal-400',
    shadowColor: 'shadow-emerald-500/25',
  },
  {
    title: 'Active Classes',
    value: 0,
    change: '0%',
    changeType: 'neutral',
    icon: BookOpen,
    gradient: 'from-purple-500 to-pink-400',
    shadowColor: 'shadow-purple-500/25',
  },
  {
    title: 'Fee Collection',
    value: '0',
    prefix: '₹',
    change: '0%',
    changeType: 'neutral',
    icon: DollarSign,
    gradient: 'from-amber-500 to-orange-400',
    shadowColor: 'shadow-amber-500/25',
  },
];

const defaultActivities: RecentActivity[] = [
  {
    id: 1,
    type: 'info',
    message: 'No recent activities',
    time: 'Just now',
    gradient: 'from-gray-500 to-gray-400',
  },
];

const defaultEvents: UpcomingEvent[] = [
  {
    id: 1,
    title: 'No upcoming events',
    date: '-',
    time: '-',
    type: 'info',
    color: 'gray',
  },
];

const defaultTasks: PendingTask[] = [
  { id: 1, task: 'No pending tasks', priority: 'low', progress: 0 },
];

const activityIcons: Record<string, any> = {
  admission: UserPlus,
  payment: DollarSign,
  alert: AlertCircle,
  exam: FileText,
  task: CheckCircle,
  info: Bell,
};

const activityGradients: Record<string, string> = {
  admission: 'from-emerald-500 to-teal-400',
  payment: 'from-blue-500 to-cyan-400',
  alert: 'from-red-500 to-pink-400',
  exam: 'from-purple-500 to-violet-400',
  task: 'from-green-500 to-emerald-400',
  info: 'from-gray-500 to-gray-400',
};

// Animated counter component
function AnimatedNumber({ value, prefix = '' }: { value: number | string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [numericValue]);

  if (typeof value === 'string' && value.includes('L')) {
    return <>{prefix}{displayValue.toFixed(1)}L</>;
  }
  return <>{prefix}{displayValue.toLocaleString()}</>;
}

export function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(defaultActivities);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>(defaultEvents);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>(defaultTasks);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    if (!accessToken) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await dashboardApi.getAdminDashboard(accessToken);

      if (response.success && response.data) {
        const data = response.data;

        // Transform stats data
        const transformedStats = [
          {
            title: 'Total Students',
            value: data.stats?.totalStudents || 0,
            change: data.stats?.studentChange || '+0%',
            changeType: data.stats?.studentChange?.startsWith('+') ? 'increase' : data.stats?.studentChange?.startsWith('-') ? 'decrease' : 'neutral',
            icon: Users,
            gradient: 'from-blue-500 to-cyan-400',
            shadowColor: 'shadow-blue-500/25',
          },
          {
            title: 'Total Teachers',
            value: data.stats?.totalTeachers || 0,
            change: data.stats?.teacherChange || '+0%',
            changeType: data.stats?.teacherChange?.startsWith('+') ? 'increase' : data.stats?.teacherChange?.startsWith('-') ? 'decrease' : 'neutral',
            icon: GraduationCap,
            gradient: 'from-emerald-500 to-teal-400',
            shadowColor: 'shadow-emerald-500/25',
          },
          {
            title: 'Active Classes',
            value: data.stats?.totalClasses || 0,
            change: data.stats?.classChange || '0%',
            changeType: data.stats?.classChange?.startsWith('+') ? 'increase' : data.stats?.classChange?.startsWith('-') ? 'decrease' : 'neutral',
            icon: BookOpen,
            gradient: 'from-purple-500 to-pink-400',
            shadowColor: 'shadow-purple-500/25',
          },
          {
            title: 'Fee Collection',
            value: formatFeeValue(data.stats?.feeCollection || 0),
            prefix: '₹',
            change: data.stats?.feeChange || '+0%',
            changeType: data.stats?.feeChange?.startsWith('+') ? 'increase' : data.stats?.feeChange?.startsWith('-') ? 'decrease' : 'neutral',
            icon: DollarSign,
            gradient: 'from-amber-500 to-orange-400',
            shadowColor: 'shadow-amber-500/25',
          },
        ];

        setStats(transformedStats);

        // Transform activities
        if (data.recentActivities && data.recentActivities.length > 0) {
          setRecentActivities(data.recentActivities.map((a: any, i: number) => ({
            ...a,
            id: a.id || i,
            icon: activityIcons[a.type] || Bell,
            gradient: activityGradients[a.type] || 'from-gray-500 to-gray-400',
          })));
        }

        // Transform events
        if (data.upcomingEvents && data.upcomingEvents.length > 0) {
          setUpcomingEvents(data.upcomingEvents);
        }

        // Transform tasks
        if (data.pendingTasks && data.pendingTasks.length > 0) {
          setPendingTasks(data.pendingTasks);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Keep default data on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken]);

  // Format fee value to lakhs format
  const formatFeeValue = (value: number): string => {
    if (value >= 100000) {
      return (value / 100000).toFixed(1) + 'L';
    }
    return value.toString();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              <span className="text-sm font-medium text-blue-100">Welcome back!</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Admin Dashboard
            </h1>
            <p className="text-blue-100 mt-2 max-w-md">
              Here&apos;s what&apos;s happening at your school today. You have 12 pending tasks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="px-3 py-2.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/20 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </button>
            <button className="px-4 py-2.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/20">
              <BarChart3 className="h-4 w-4" />
              Download Report
            </button>
            <button className="px-4 py-2.5 text-sm font-medium text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Quick Actions
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={cn(
                'group relative bg-white dark:bg-gray-800/50 rounded-2xl p-6 overflow-hidden',
                'border border-gray-100 dark:border-gray-700/50',
                'hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
                'backdrop-blur-sm'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient background on hover */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300',
                `bg-gradient-to-br ${stat.gradient}`
              )}></div>

              <div className="relative flex items-start justify-between">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center',
                  `bg-gradient-to-br ${stat.gradient}`,
                  `shadow-lg ${stat.shadowColor}`,
                  'transform group-hover:scale-110 transition-transform duration-300'
                )}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full',
                    stat.changeType === 'increase' && 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                    stat.changeType === 'decrease' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                    stat.changeType === 'neutral' && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {stat.changeType === 'increase' && <TrendingUp className="h-3.5 w-3.5" />}
                  {stat.changeType === 'decrease' && <TrendingDown className="h-3.5 w-3.5" />}
                  {stat.change}
                </div>
              </div>

              <div className="relative mt-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  <AnimatedNumber value={stat.value} prefix={stat.prefix} />
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  {stat.title}
                </p>
              </div>

              {/* Mini chart visualization */}
              <div className="absolute bottom-0 right-0 w-24 h-12 opacity-20">
                <svg viewBox="0 0 100 40" className={cn('w-full h-full fill-current',
                  stat.changeType === 'increase' ? 'text-green-500' :
                  stat.changeType === 'decrease' ? 'text-red-500' : 'text-gray-400'
                )}>
                  <path d="M0,40 L10,35 L20,38 L30,25 L40,28 L50,15 L60,20 L70,10 L80,15 L90,5 L100,8 L100,40 Z" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon || activityIcons[activity.type] || Bell;
              const gradient = activity.gradient || activityGradients[activity.type] || 'from-gray-500 to-gray-400';
              return (
                <div
                  key={activity.id}
                  className="p-4 flex items-start gap-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                    `bg-gradient-to-br ${gradient}`,
                    'shadow-lg'
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upcoming Events
                </h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      event.color === 'blue' && 'bg-blue-500',
                      event.color === 'green' && 'bg-green-500',
                      event.color === 'purple' && 'bg-purple-500',
                      event.color === 'amber' && 'bg-amber-500',
                    )}></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                      {event.date}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {event.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pending Tasks
                </h2>
              </div>
              <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                {pendingTasks.length} tasks
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {task.task}
                    </p>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        task.priority === 'high' &&
                          'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                        task.priority === 'medium' &&
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                        task.priority === 'low' &&
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          task.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                          task.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                          'bg-gradient-to-r from-green-500 to-emerald-500'
                        )}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
