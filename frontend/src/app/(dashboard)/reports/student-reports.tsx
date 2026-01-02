'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
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
  Brain,
  Zap,
  Star,
  ArrowRight,
  Loader2,
  RefreshCw,
  GraduationCap,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { reportsApi, testsApi, StudentReport } from '@/lib/api';
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

// Mock data for student analytics
const performanceTrend = [
  { test: 'Test 1', score: 65 },
  { test: 'Test 2', score: 72 },
  { test: 'Test 3', score: 68 },
  { test: 'Test 4', score: 78 },
  { test: 'Test 5', score: 75 },
  { test: 'Test 6', score: 82 },
];

const subjectWisePerformance = [
  { subject: 'Physics', score: 78 },
  { subject: 'Chemistry', score: 72 },
  { subject: 'Maths', score: 85 },
  { subject: 'Biology', score: 70 },
  { subject: 'English', score: 88 },
];

const topicStrengths = [
  { topic: 'Kinematics', value: 85, color: '#10b981' },
  { topic: 'Thermodynamics', value: 72, color: '#3b82f6' },
  { topic: 'Organic Chemistry', value: 68, color: '#8b5cf6' },
  { topic: 'Calculus', value: 90, color: '#06b6d4' },
  { topic: 'Optics', value: 75, color: '#f59e0b' },
];

const timeSpentData = [
  { day: 'Mon', minutes: 45 },
  { day: 'Tue', minutes: 60 },
  { day: 'Wed', minutes: 30 },
  { day: 'Thu', minutes: 75 },
  { day: 'Fri', minutes: 50 },
  { day: 'Sat', minutes: 90 },
  { day: 'Sun', minutes: 40 },
];

const questionTypePerformance = [
  { type: 'Single', correct: 80 },
  { type: 'Multiple', correct: 65 },
  { type: 'Integer', correct: 70 },
  { type: 'Matrix', correct: 55 },
];

export function StudentReports() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<StudentReport | null>(null);

  // Stats
  const [stats, setStats] = useState({
    testsTaken: 12,
    avgScore: 75,
    bestScore: 92,
    totalTime: 24, // hours
    rank: 5,
    percentile: 85,
  });

  useEffect(() => {
    const fetchReport = async () => {
      if (!accessToken || !user) return;
      setIsLoading(true);
      try {
        const response = await reportsApi.getStudentReport(user.id, accessToken);
        if (response.success && response.data) {
          setReport(response.data);
          setStats({
            testsTaken: response.data.overallStats.totalTests,
            avgScore: Math.round(response.data.overallStats.averagePercentage),
            bestScore: Math.round(response.data.overallStats.bestPercentage),
            totalTime: 24,
            rank: 5,
            percentile: 85,
          });
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [accessToken, user]);

  const statCards = [
    {
      title: 'Tests Taken',
      value: stats.testsTaken,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-400',
      description: 'Total tests completed',
    },
    {
      title: 'Average Score',
      value: `${stats.avgScore}%`,
      icon: Target,
      gradient: 'from-purple-500 to-pink-400',
      description: 'Across all subjects',
    },
    {
      title: 'Best Score',
      value: `${stats.bestScore}%`,
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-400',
      description: 'Your highest score',
    },
    {
      title: 'Class Rank',
      value: `#${stats.rank}`,
      icon: Award,
      gradient: 'from-green-500 to-emerald-400',
      description: `Top ${100 - stats.percentile}%`,
    },
  ];

  const achievements = [
    { title: 'First Test Completed', icon: CheckCircle, achieved: true },
    { title: 'Score Above 80%', icon: Star, achieved: true },
    { title: 'Perfect Score', icon: Trophy, achieved: false },
    { title: '10 Tests Completed', icon: Award, achieved: true },
    { title: 'Consistency Streak', icon: Zap, achieved: false },
  ];

  const recommendations = [
    { subject: 'Organic Chemistry', message: 'Practice more reaction mechanisms', priority: 'high' },
    { subject: 'Matrix Match', message: 'Work on matching type questions', priority: 'medium' },
    { subject: 'Time Management', message: 'Try to complete tests 5 min earlier', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-6 w-6" />
              <span className="text-sm font-medium text-purple-200">Student Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">My Performance</h1>
            <p className="text-purple-100 mt-2 max-w-md">
              Track your progress, identify strengths, and improve weak areas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <ProgressRing
                percentage={stats.percentile}
                size={100}
                strokeWidth={8}
                color="#10b981"
                label="Percentile"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-4',
                stat.gradient,
                'shadow-lg transform group-hover:scale-110 transition-transform duration-300'
              )}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
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
          <SimpleAreaChart
            data={report?.progressTrend?.length ? report.progressTrend.map(p => ({ test: `T${p.index + 1}`, score: p.percentage })) : performanceTrend}
            dataKey="score"
            xAxisKey="test"
            height={280}
            color="#8b5cf6"
          />
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Subject-wise Performance
          </h3>
          <SimpleRadarChart
            data={report?.subjectWise?.length ? report.subjectWise.map(s => ({ subject: s.subjectName, score: s.avgPercentage })) : subjectWisePerformance}
            dataKeys={[{ key: 'score', color: '#3b82f6', name: 'Score' }]}
            angleKey="subject"
            height={280}
            showLegend={false}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Strengths */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Topic Strengths
          </h3>
          <div className="space-y-4">
            {(report?.chapterPerformance?.slice(0, 5) || topicStrengths).map((topic: any, index: number) => (
              <div key={topic.topic || topic.chapterName}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {topic.topic || topic.chapterName}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {topic.value || topic.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${topic.value || topic.percentage}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Type Performance */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Question Types
          </h3>
          <MultiBarChart
            data={questionTypePerformance}
            bars={[{ dataKey: 'correct', color: '#8b5cf6', name: 'Accuracy %' }]}
            xAxisKey="type"
            height={220}
          />
        </div>

        {/* Study Time */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Study Time (Weekly)
          </h3>
          <MultiBarChart
            data={timeSpentData}
            bars={[{ dataKey: 'minutes', color: '#10b981', name: 'Minutes' }]}
            xAxisKey="day"
            height={220}
          />
        </div>
      </div>

      {/* Achievements & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.title}
                  className={cn(
                    'p-4 rounded-xl border text-center transition-all',
                    achievement.achieved
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                  )}
                >
                  <Icon className={cn(
                    'h-8 w-8 mx-auto mb-2',
                    achievement.achieved ? 'text-amber-500' : 'text-gray-400'
                  )} />
                  <p className={cn(
                    'text-xs font-medium',
                    achievement.achieved ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                  )}>
                    {achievement.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-500" />
            Personalized Recommendations
          </h3>
          <div className="space-y-4">
            {(report?.recommendations || recommendations.map(r => r.message)).slice(0, 3).map((rec: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white/80 dark:bg-gray-800/50 rounded-xl"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                  index === 0 && 'bg-red-500',
                  index === 1 && 'bg-amber-500',
                  index === 2 && 'bg-blue-500',
                )}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {typeof rec === 'string' ? rec : rec.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tests */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Recent Tests
          </h3>
          <Link
            href="/tests/attempts"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {(report?.testHistory?.slice(0, 5) || []).map((test: any) => (
            <div
              key={test.testId}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  test.percentage >= 80 && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                  test.percentage >= 60 && test.percentage < 80 && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                  test.percentage < 60 && 'bg-red-100 dark:bg-red-900/30 text-red-600',
                )}>
                  {test.percentage >= 80 ? (
                    <Trophy className="h-6 w-6" />
                  ) : test.percentage >= 60 ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{test.testTitle}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {test.subject?.name} • {test.submittedAt ? new Date(test.submittedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-xl font-bold',
                  test.percentage >= 80 && 'text-green-600',
                  test.percentage >= 60 && test.percentage < 80 && 'text-blue-600',
                  test.percentage < 60 && 'text-red-600',
                )}>
                  {test.percentage.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500">{test.score}/{test.totalMarks}</p>
              </div>
            </div>
          ))}
          {(!report?.testHistory || report.testHistory.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tests taken yet</p>
              <Link href="/tests" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                Browse Available Tests
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
