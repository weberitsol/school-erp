'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  User,
  Trophy,
  Target,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  ChevronRight,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { reportsApi, StudentReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function StudentReportPage({ params }: { params: { id: string } }) {
  const studentId = params.id;
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [report, setReport] = useState<StudentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch student report
  const fetchReport = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const response = await reportsApi.getStudentReport(studentId, accessToken);
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch student report',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [accessToken, studentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading student report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Report Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Could not load the student report.</p>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Tests Taken',
      value: report.overallStats.totalTests,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-400',
    },
    {
      label: 'Average Score',
      value: `${report.overallStats.averagePercentage.toFixed(1)}%`,
      icon: Target,
      gradient: 'from-amber-500 to-orange-400',
    },
    {
      label: 'Best Score',
      value: `${report.overallStats.bestPercentage.toFixed(1)}%`,
      icon: Trophy,
      gradient: 'from-green-500 to-emerald-400',
    },
    {
      label: 'Above 80%',
      value: report.overallStats.testsAbove80,
      icon: Award,
      gradient: 'from-purple-500 to-pink-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-emerald-100 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-medium text-emerald-200">Student Report</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{report.student.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-emerald-100">
                {report.student.rollNo && (
                  <span>Roll No: {report.student.rollNo}</span>
                )}
                {report.student.class && (
                  <span>Class: {report.student.class.name}</span>
                )}
                {report.student.section && (
                  <span>Section: {report.student.section.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                  card.gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Trend Chart */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Progress Trend
        </h3>
        {report.progressTrend.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No test data available yet</p>
          </div>
        ) : (
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Chart area */}
            <div className="ml-10 h-full flex items-end gap-2 pb-8 overflow-x-auto">
              {report.progressTrend.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="relative w-full flex justify-center">
                    <div
                      className={cn(
                        "w-8 rounded-t-lg transition-all duration-500",
                        point.percentage >= 70 && "bg-gradient-to-t from-green-500 to-green-400",
                        point.percentage >= 50 && point.percentage < 70 && "bg-gradient-to-t from-amber-500 to-amber-400",
                        point.percentage < 50 && "bg-gradient-to-t from-red-500 to-red-400"
                      )}
                      style={{ height: `${(point.percentage / 100) * 180}px` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 hover:opacity-100 whitespace-nowrap pointer-events-none">
                      {point.percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[60px]" title={point.testTitle}>
                      T{point.index + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subject-wise Performance */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-500" />
          Subject-wise Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.subjectWise.map((subject) => (
            <div
              key={subject.subjectId}
              className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">{subject.subjectName}</h4>
                <span className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                  {subject.testCount} Tests
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Average</span>
                  <span className={cn(
                    "font-semibold",
                    subject.avgPercentage >= 70 && "text-green-600",
                    subject.avgPercentage >= 50 && subject.avgPercentage < 70 && "text-amber-600",
                    subject.avgPercentage < 50 && "text-red-600"
                  )}>
                    {subject.avgPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      subject.avgPercentage >= 70 && "bg-green-500",
                      subject.avgPercentage >= 50 && subject.avgPercentage < 70 && "bg-amber-500",
                      subject.avgPercentage < 50 && "bg-red-500"
                    )}
                    style={{ width: `${subject.avgPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chapters Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Chapters */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Strong Chapters
          </h3>
          <div className="space-y-3">
            {report.chapterPerformance.filter(c => c.percentage >= 70).length === 0 ? (
              <p className="text-center py-6 text-gray-500 dark:text-gray-400">Keep practicing to build strong chapters!</p>
            ) : (
              report.chapterPerformance
                .filter(c => c.percentage >= 70)
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 5)
                .map((chapter) => (
                  <div key={chapter.chapterId} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {chapter.chapterName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {chapter.correct}/{chapter.total} correct
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-600">{chapter.percentage.toFixed(0)}%</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Weak Chapters */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Chapters to Improve
          </h3>
          <div className="space-y-3">
            {report.weakChapters.length === 0 ? (
              <div className="text-center py-6">
                <Award className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Great work! No weak chapters found.</p>
              </div>
            ) : (
              report.weakChapters.slice(0, 5).map((chapter) => (
                <div key={chapter.chapterId} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {chapter.chapterName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {chapter.correct}/{chapter.total} correct
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-red-600">{chapter.percentage.toFixed(0)}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test History */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-500" />
          Test History
        </h3>
        {report.testHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No test history available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.testHistory.map((test) => (
              <div
                key={test.testId}
                className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {test.testTitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                        {test.subject.name}
                      </span>
                      <span>{test.correctAnswers}/{test.questionsAnswered} correct</span>
                      {test.submittedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(test.submittedAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-bold",
                        test.percentage >= 70 && "text-green-600",
                        test.percentage >= 50 && test.percentage < 70 && "text-amber-600",
                        test.percentage < 50 && "text-red-600"
                      )}>
                        {test.percentage.toFixed(0)}%
                      </span>
                      {test.percentage >= 70 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : test.percentage >= 50 ? (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {test.score}/{test.totalMarks} marks
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
