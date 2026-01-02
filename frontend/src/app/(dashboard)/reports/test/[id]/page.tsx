'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  TrendingDown,
  FileText,
  Percent,
  Award,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { reportsApi, TestReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function TestReportPage({ params }: { params: { id: string } }) {
  const testId = params.id;
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [report, setReport] = useState<TestReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'score'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showQuestionAnalysis, setShowQuestionAnalysis] = useState(false);

  // Fetch test report
  const fetchReport = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const response = await reportsApi.getTestReport(testId, accessToken);
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch test report',
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
  }, [accessToken, testId]);

  // Export CSV
  const handleExportCsv = async () => {
    if (!accessToken) return;

    try {
      const result = await reportsApi.exportTestReportCsv(testId, accessToken);
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test_report_${testId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export successful',
          description: 'CSV file has been downloaded.',
        });
      } else {
        toast({
          title: 'Export failed',
          description: 'Could not generate CSV file.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting.',
        variant: 'destructive',
      });
    }
  };

  // Filter and sort students
  const filteredStudents = report?.studentPerformances
    .filter((student) => {
      if (searchQuery) {
        return (
          student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'rank') comparison = a.rank - b.rank;
      else if (sortBy === 'name') comparison = a.studentName.localeCompare(b.studentName);
      else if (sortBy === 'score') comparison = b.score - a.score;

      return sortOrder === 'asc' ? comparison : -comparison;
    }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading test report...</p>
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">Could not load the test report.</p>
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

  const statCards = [
    {
      label: 'Total Attempts',
      value: report.stats.totalAttempts,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-400',
      shadowColor: 'shadow-blue-500/25',
    },
    {
      label: 'Average Score',
      value: `${report.stats.averagePercentage.toFixed(1)}%`,
      icon: Target,
      gradient: 'from-amber-500 to-orange-400',
      shadowColor: 'shadow-amber-500/25',
    },
    {
      label: 'Pass Rate',
      value: `${report.stats.passRate.toFixed(0)}%`,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-400',
      shadowColor: 'shadow-green-500/25',
    },
    {
      label: 'Highest Score',
      value: report.stats.highestScore,
      icon: Trophy,
      gradient: 'from-purple-500 to-pink-400',
      shadowColor: 'shadow-purple-500/25',
    },
    {
      label: 'Lowest Score',
      value: report.stats.lowestScore,
      icon: TrendingDown,
      gradient: 'from-red-500 to-rose-400',
      shadowColor: 'shadow-red-500/25',
    },
    {
      label: 'Median Score',
      value: report.stats.medianScore,
      icon: BarChart3,
      gradient: 'from-indigo-500 to-violet-400',
      shadowColor: 'shadow-indigo-500/25',
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

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium text-emerald-200">Test Report</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{report.test.title}</h1>
              <p className="text-emerald-100 mt-2">
                {report.test.subject.name} • {report.test.class.name}
                {report.test.section && ` • ${report.test.section.name}`}
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-5 py-2.5 text-sm font-medium text-emerald-600 bg-white rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center gap-2 w-fit"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {/* Test Info */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-emerald-100">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{report.test.totalQuestions} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>{report.test.totalMarks} Marks</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{report.test.durationMinutes} Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Pass: {report.test.passingMarks} Marks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  `bg-gradient-to-br ${stat.gradient}`,
                  `shadow-lg ${stat.shadowColor}`
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Distribution */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-500" />
          Score Distribution
        </h3>
        <div className="grid grid-cols-10 gap-2 h-48 items-end">
          {report.scoreDistribution.map((dist, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="relative w-full group">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 hover:from-emerald-400 hover:to-teal-300"
                  style={{
                    height: `${Math.max((dist.percentage / 100) * 180, 8)}px`,
                  }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {dist.count} students ({dist.percentage.toFixed(1)}%)
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{dist.count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{dist.range}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Pass: {report.stats.passCount} students</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Fail: {report.stats.failCount} students</span>
          </div>
        </div>
      </div>

      {/* Student Performance Table */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Student Performance ({filteredStudents.length})
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm w-64"
              />
            </div>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as 'rank' | 'name' | 'score');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="rank-asc">Rank: Low to High</option>
              <option value="rank-desc">Rank: High to Low</option>
              <option value="score-desc">Score: High to Low</option>
              <option value="score-asc">Score: Low to High</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Roll No</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Student Name</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Score</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Percentage</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr
                  key={student.studentId}
                  className={cn(
                    'border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors',
                    student.rank <= 3 && 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10'
                  )}
                >
                  <td className="py-3 px-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      student.rank === 1 && "bg-gradient-to-br from-amber-400 to-amber-500 text-white",
                      student.rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 text-white",
                      student.rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                      student.rank > 3 && "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    )}>
                      {student.rank}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {student.rollNo || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 dark:text-white">{student.studentName}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {student.score}/{report.test.totalMarks}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            student.percentage >= 80 && "bg-green-500",
                            student.percentage >= 60 && student.percentage < 80 && "bg-blue-500",
                            student.percentage >= 40 && student.percentage < 60 && "bg-amber-500",
                            student.percentage < 40 && "bg-red-500"
                          )}
                          style={{ width: `${student.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                        {student.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {student.status === 'PASS' ? (
                      <span className="px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center gap-1 w-fit mx-auto">
                        <CheckCircle className="h-3 w-3" />
                        Pass
                      </span>
                    ) : student.status === 'FAIL' ? (
                      <span className="px-2.5 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center gap-1 w-fit mx-auto">
                        <XCircle className="h-3 w-3" />
                        Fail
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        Not Attempted
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {student.submittedAt
                      ? new Date(student.submittedAt).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Analysis */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <button
          onClick={() => setShowQuestionAnalysis(!showQuestionAnalysis)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            Question-wise Analysis
          </h3>
          {showQuestionAnalysis ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showQuestionAnalysis && (
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {report.questionAnalysis.map((q, index) => (
                <div
                  key={q.questionId}
                  className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm flex-shrink-0">
                      Q{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                        {q.questionText}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {q.questionType}
                        </span>
                        <span>Attempts: {q.totalAttempts}</span>
                        <span>Correct: {q.correctAttempts}</span>
                        <span>Avg Time: {q.avgTimeSeconds}s</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={cn(
                        "text-2xl font-bold",
                        q.successRate >= 70 && "text-green-500",
                        q.successRate >= 40 && q.successRate < 70 && "text-amber-500",
                        q.successRate < 40 && "text-red-500"
                      )}>
                        {q.successRate.toFixed(0)}%
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
