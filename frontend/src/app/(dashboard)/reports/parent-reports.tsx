'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  Users,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Calendar,
  BookOpen,
  Clock,
  Award,
  Activity,
  User,
  Bell,
  DollarSign,
  Loader2,
  RefreshCw,
  ChevronRight,
  Heart,
  GraduationCap,
  Lightbulb,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardApi, reportsApi, StudentReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  SimpleAreaChart,
  MultiBarChart,
  SimpleLineChart,
  DonutChart,
  SimpleRadarChart,
  ProgressRing,
  CHART_COLORS,
} from '@/components/charts';

interface Child {
  id: string;
  name: string;
  class: string;
  section?: string;
  rollNo?: string;
  attendance: number;
  avgScore: number;
  recentGrades: { subject: string; score: number }[];
}

// Mock data for parent view
const mockChildren: Child[] = [
  {
    id: '1',
    name: 'Rahul Kumar',
    class: 'Class 10',
    section: 'A',
    rollNo: '15',
    attendance: 92,
    avgScore: 78,
    recentGrades: [
      { subject: 'Mathematics', score: 85 },
      { subject: 'Physics', score: 78 },
      { subject: 'Chemistry', score: 72 },
      { subject: 'English', score: 88 },
      { subject: 'Biology', score: 75 },
    ],
  },
];

const attendanceTrend = [
  { month: 'Jan', attendance: 95 },
  { month: 'Feb', attendance: 88 },
  { month: 'Mar', attendance: 92 },
  { month: 'Apr', attendance: 90 },
  { month: 'May', attendance: 94 },
  { month: 'Jun', attendance: 92 },
];

const performanceTrend = [
  { month: 'Jan', score: 72 },
  { month: 'Feb', score: 75 },
  { month: 'Mar', score: 70 },
  { month: 'Apr', score: 78 },
  { month: 'May', score: 82 },
  { month: 'Jun', score: 78 },
];

const subjectComparison = [
  { subject: 'Math', child: 85, classAvg: 72 },
  { subject: 'Physics', child: 78, classAvg: 70 },
  { subject: 'Chemistry', child: 72, classAvg: 68 },
  { subject: 'Biology', child: 75, classAvg: 74 },
  { subject: 'English', child: 88, classAvg: 75 },
];

const upcomingEvents = [
  { title: 'Unit Test - Mathematics', date: 'Dec 20, 2025', type: 'exam' },
  { title: 'Parent-Teacher Meeting', date: 'Dec 22, 2025', type: 'meeting' },
  { title: 'Science Fair', date: 'Dec 28, 2025', type: 'event' },
];

const feeStatus = [
  { name: 'Paid', value: 75, color: '#10b981' },
  { name: 'Pending', value: 25, color: '#f59e0b' },
];

export function ParentReports() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>(mockChildren);
  const [selectedChild, setSelectedChild] = useState<string>(mockChildren[0]?.id || '');
  const [childReport, setChildReport] = useState<StudentReport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const response = await dashboardApi.getParentDashboard(accessToken);
        if (response.success && response.data?.children) {
          const childrenData = response.data.children.map((c: any) => ({
            id: c.id,
            name: c.name,
            class: c.class,
            attendance: c.attendance || 90,
            avgScore: 75,
            recentGrades: c.recentGrades || [],
          }));
          if (childrenData.length > 0) {
            setChildren(childrenData);
            setSelectedChild(childrenData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [accessToken]);

  useEffect(() => {
    const fetchChildReport = async () => {
      if (!accessToken || !selectedChild) return;
      try {
        const response = await reportsApi.getStudentReport(selectedChild, accessToken);
        if (response.success && response.data) {
          setChildReport(response.data);
        }
      } catch (error) {
        console.error('Error fetching child report:', error);
      }
    };
    fetchChildReport();
  }, [accessToken, selectedChild]);

  const selectedChildData = children.find((c) => c.id === selectedChild) || children[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-6 w-6" />
              <span className="text-sm font-medium text-pink-200">Parent Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Child's Progress</h1>
            <p className="text-pink-100 mt-2 max-w-md">
              Monitor your child's academic performance, attendance, and activities
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors self-start"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Child Selector (if multiple children) */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all whitespace-nowrap',
                selectedChild === child.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-lg shadow-pink-500/25'
                  : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-pink-300'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                selectedChild === child.id ? 'bg-white/20' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
              )}>
                {child.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-medium">{child.name}</p>
                <p className={cn(
                  'text-xs',
                  selectedChild === child.id ? 'text-pink-100' : 'text-gray-500'
                )}>
                  {child.class}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Child Info Card */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedChildData?.name}
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {selectedChildData?.class} {selectedChildData?.section && `- ${selectedChildData.section}`}
              </span>
              {selectedChildData?.rollNo && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Roll No: {selectedChildData.rollNo}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <ProgressRing
                percentage={selectedChildData?.attendance || 0}
                size={80}
                strokeWidth={6}
                color="#10b981"
              />
              <p className="text-xs text-gray-500 mt-1">Attendance</p>
            </div>
            <div className="text-center">
              <ProgressRing
                percentage={selectedChildData?.avgScore || 0}
                size={80}
                strokeWidth={6}
                color="#8b5cf6"
              />
              <p className="text-xs text-gray-500 mt-1">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Class Rank', value: '#5', icon: Trophy, color: 'amber', desc: 'Out of 45 students' },
          { title: 'Tests Taken', value: '12', icon: FileText, color: 'blue', desc: 'This semester' },
          { title: 'Best Subject', value: 'English', icon: Star, color: 'purple', desc: '88% average' },
          { title: 'Pending Fees', value: '₹5,000', icon: DollarSign, color: 'rose', desc: 'Due by Dec 31' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5"
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                stat.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
                stat.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                stat.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
                stat.color === 'rose' && 'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Performance Trend
          </h3>
          <SimpleLineChart
            data={childReport?.progressTrend?.length
              ? childReport.progressTrend.map(p => ({ month: `T${p.index + 1}`, score: p.percentage }))
              : performanceTrend
            }
            lines={[{ dataKey: 'score', color: '#8b5cf6', name: 'Score %' }]}
            xAxisKey="month"
            height={280}
          />
        </div>

        {/* Attendance Trend */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            Attendance Trend
          </h3>
          <SimpleAreaChart
            data={attendanceTrend}
            dataKey="attendance"
            xAxisKey="month"
            height={280}
            color="#10b981"
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Performance vs Class Average */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Subject Performance vs Class Average
          </h3>
          <MultiBarChart
            data={childReport?.subjectWise?.length
              ? childReport.subjectWise.map(s => ({
                  subject: s.subjectName.substring(0, 6),
                  child: s.avgPercentage,
                  classAvg: 70, // Mock class average
                }))
              : subjectComparison
            }
            bars={[
              { dataKey: 'child', color: '#8b5cf6', name: 'Your Child' },
              { dataKey: 'classAvg', color: '#94a3b8', name: 'Class Avg' },
            ]}
            xAxisKey="subject"
            height={280}
          />
        </div>

        {/* Fee Status */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-rose-500" />
            Fee Status
          </h3>
          <DonutChart data={feeStatus} height={200} showLabel={false} />
          <div className="space-y-2 mt-4">
            {feeStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
          <Link
            href="/finance/payments"
            className="mt-4 block w-full py-2 text-center text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl hover:bg-rose-100 transition-colors"
          >
            Pay Now
          </Link>
        </div>
      </div>

      {/* Recent Grades & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Recent Test Scores
          </h3>
          <div className="space-y-3">
            {(childReport?.testHistory?.slice(0, 5) || selectedChildData?.recentGrades?.map((g, i) => ({
              testId: i.toString(),
              testTitle: g.subject,
              percentage: g.score,
              score: g.score,
              totalMarks: 100,
            })) || []).map((test: any, index: number) => (
              <div
                key={test.testId || index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    (test.percentage || test.score) >= 80 && 'bg-green-100 text-green-600',
                    (test.percentage || test.score) >= 60 && (test.percentage || test.score) < 80 && 'bg-blue-100 text-blue-600',
                    (test.percentage || test.score) < 60 && 'bg-red-100 text-red-600',
                  )}>
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {test.testTitle || test.subject?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {test.submittedAt ? new Date(test.submittedAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  'text-lg font-bold',
                  (test.percentage || test.score) >= 80 && 'text-green-600',
                  (test.percentage || test.score) >= 60 && (test.percentage || test.score) < 80 && 'text-blue-600',
                  (test.percentage || test.score) < 60 && 'text-red-600',
                )}>
                  {test.percentage || test.score}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Upcoming Events
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl"
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  event.type === 'exam' && 'bg-red-100 text-red-600',
                  event.type === 'meeting' && 'bg-blue-100 text-blue-600',
                  event.type === 'event' && 'bg-purple-100 text-purple-600',
                )}>
                  {event.type === 'exam' ? (
                    <FileText className="h-5 w-5" />
                  ) : event.type === 'meeting' ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.date}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl border border-pink-200 dark:border-pink-800/50 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-pink-500" />
          Tips for Parents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Review Together', desc: 'Spend 30 mins daily reviewing lessons with your child' },
            { title: 'Practice Tests', desc: 'Encourage taking practice tests before exams' },
            { title: 'Stay Connected', desc: 'Attend parent-teacher meetings regularly' },
          ].map((tip, index) => (
            <div key={index} className="p-4 bg-white/80 dark:bg-gray-800/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-sm font-bold mb-3">
                {index + 1}
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{tip.title}</p>
              <p className="text-xs text-gray-500 mt-1">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
