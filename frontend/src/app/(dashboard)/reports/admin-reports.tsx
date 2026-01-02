'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  GraduationCap,
  School,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Calendar,
  BookOpen,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Loader2,
  ChevronRight,
  PieChart,
  Activity,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardApi, classesApi, testsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  SimpleAreaChart,
  MultiBarChart,
  SimpleLineChart,
  DonutChart,
  SimpleRadarChart,
  ProgressRing,
  SparklineStat,
  CHART_COLORS,
} from '@/components/charts';

// Mock data for charts (replace with actual API calls)
const enrollmentTrend = [
  { month: 'Jan', students: 850, teachers: 45 },
  { month: 'Feb', students: 880, teachers: 46 },
  { month: 'Mar', students: 920, teachers: 48 },
  { month: 'Apr', students: 950, teachers: 50 },
  { month: 'May', students: 980, teachers: 51 },
  { month: 'Jun', students: 1020, teachers: 52 },
];

const attendanceData = [
  { day: 'Mon', present: 92, absent: 8 },
  { day: 'Tue', present: 88, absent: 12 },
  { day: 'Wed', present: 95, absent: 5 },
  { day: 'Thu', present: 90, absent: 10 },
  { day: 'Fri', present: 85, absent: 15 },
];

const classPerformance = [
  { name: 'Class 10', avgScore: 78, passRate: 92 },
  { name: 'Class 9', avgScore: 72, passRate: 88 },
  { name: 'Class 8', avgScore: 75, passRate: 90 },
  { name: 'Class 7', avgScore: 80, passRate: 95 },
  { name: 'Class 6', avgScore: 82, passRate: 96 },
];

const subjectPerformance = [
  { subject: 'Mathematics', score: 75 },
  { subject: 'Physics', score: 72 },
  { subject: 'Chemistry', score: 78 },
  { subject: 'Biology', score: 80 },
  { subject: 'English', score: 85 },
];

const feeCollection = [
  { month: 'Jan', collected: 450000, pending: 50000 },
  { month: 'Feb', collected: 420000, pending: 80000 },
  { month: 'Mar', collected: 480000, pending: 20000 },
  { month: 'Apr', collected: 460000, pending: 40000 },
  { month: 'May', collected: 490000, pending: 10000 },
  { month: 'Jun', collected: 470000, pending: 30000 },
];

const genderDistribution = [
  { name: 'Male', value: 540, color: '#3b82f6' },
  { name: 'Female', value: 480, color: '#ec4899' },
];

const testCompletionRate = [
  { name: 'Completed', value: 85, color: '#10b981' },
  { name: 'In Progress', value: 10, color: '#f59e0b' },
  { name: 'Not Started', value: 5, color: '#ef4444' },
];

export function AdminReports() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 1020,
    totalTeachers: 52,
    totalClasses: 24,
    feeCollection: 2850000,
    studentChange: '+5.2%',
    teacherChange: '+2.0%',
    attendanceRate: 91,
    passRate: 92,
  });

  useEffect(() => {
    // Fetch admin dashboard stats
    const fetchStats = async () => {
      if (!accessToken) return;
      try {
        const response = await dashboardApi.getAdminDashboard(accessToken);
        if (response.success && response.data?.stats) {
          setStats({
            totalStudents: response.data.stats.totalStudents || 1020,
            totalTeachers: response.data.stats.totalTeachers || 52,
            totalClasses: response.data.stats.totalClasses || 24,
            feeCollection: response.data.stats.feeCollection || 2850000,
            studentChange: response.data.stats.studentChange || '+5.2%',
            teacherChange: response.data.stats.teacherChange || '+2.0%',
            attendanceRate: 91,
            passRate: 92,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [accessToken]);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents.toLocaleString(),
      change: stats.studentChange,
      icon: GraduationCap,
      gradient: 'from-blue-500 to-cyan-400',
      sparkline: [850, 880, 920, 950, 980, 1020],
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      change: stats.teacherChange,
      icon: Users,
      gradient: 'from-purple-500 to-pink-400',
      sparkline: [45, 46, 48, 50, 51, 52],
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      change: '+2.1%',
      icon: UserCheck,
      gradient: 'from-green-500 to-emerald-400',
      sparkline: [88, 90, 89, 92, 91, 91],
    },
    {
      title: 'Pass Rate',
      value: `${stats.passRate}%`,
      change: '+3.5%',
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-400',
      sparkline: [85, 87, 88, 90, 91, 92],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <School className="h-6 w-6" />
              <span className="text-sm font-medium text-purple-200">Admin Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">School Analytics</h1>
            <p className="text-purple-100 mt-2 max-w-md">
              Comprehensive overview of school performance, enrollment, and financial metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="px-5 py-2.5 text-sm font-medium text-purple-600 bg-white rounded-xl hover:bg-purple-50 transition-all duration-200 shadow-lg flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change?.startsWith('+');
          return (
            <div
              key={stat.title}
              className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                  stat.gradient,
                  'shadow-lg transform group-hover:scale-110 transition-transform duration-300'
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {stat.change && (
                  <div className={cn(
                    'px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1',
                    isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  )}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{stat.title}</p>
              <SimpleAreaChart
                data={stat.sparkline.map((v, i) => ({ value: v, index: i }))}
                dataKey="value"
                xAxisKey="index"
                height={50}
                color={CHART_COLORS[index]}
                showGrid={false}
                showTooltip={false}
              />
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Enrollment Trend
          </h3>
          <SimpleLineChart
            data={enrollmentTrend}
            lines={[
              { dataKey: 'students', color: '#3b82f6', name: 'Students' },
              { dataKey: 'teachers', color: '#8b5cf6', name: 'Teachers' },
            ]}
            xAxisKey="month"
            height={280}
          />
        </div>

        {/* Fee Collection */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Fee Collection (Monthly)
          </h3>
          <MultiBarChart
            data={feeCollection}
            bars={[
              { dataKey: 'collected', color: '#10b981', name: 'Collected' },
              { dataKey: 'pending', color: '#f59e0b', name: 'Pending' },
            ]}
            xAxisKey="month"
            height={280}
            stacked
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Performance */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Class-wise Performance
          </h3>
          <MultiBarChart
            data={classPerformance}
            bars={[
              { dataKey: 'avgScore', color: '#8b5cf6', name: 'Avg Score' },
              { dataKey: 'passRate', color: '#10b981', name: 'Pass Rate' },
            ]}
            xAxisKey="name"
            height={280}
          />
        </div>

        {/* Gender Distribution */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-pink-500" />
            Gender Distribution
          </h3>
          <DonutChart
            data={genderDistribution}
            height={280}
            showLabel={false}
          />
          <div className="flex justify-center gap-6 mt-4">
            {genderDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-500" />
            Weekly Attendance
          </h3>
          <MultiBarChart
            data={attendanceData}
            bars={[
              { dataKey: 'present', color: '#10b981', name: 'Present %' },
              { dataKey: 'absent', color: '#ef4444', name: 'Absent %' },
            ]}
            xAxisKey="day"
            height={250}
            stacked
          />
        </div>

        {/* Subject Performance Radar */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            Subject Performance
          </h3>
          <SimpleRadarChart
            data={subjectPerformance}
            dataKeys={[{ key: 'score', color: '#8b5cf6', name: 'Score' }]}
            angleKey="subject"
            height={250}
            showLegend={false}
          />
        </div>

        {/* Test Completion */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Test Completion Status
          </h3>
          <DonutChart
            data={testCompletionRate}
            height={200}
            showLabel={false}
          />
          <div className="space-y-2 mt-4">
            {testCompletionRate.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'View All Students', href: '/students', icon: GraduationCap, color: 'blue' },
          { label: 'View All Teachers', href: '/teachers', icon: Users, color: 'purple' },
          { label: 'Attendance Reports', href: '/attendance', icon: UserCheck, color: 'green' },
          { label: 'Fee Management', href: '/finance/payments', icon: DollarSign, color: 'amber' },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 p-4 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                link.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                link.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
                link.color === 'green' && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                link.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                  {link.label}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
