'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Trophy,
  Target,
  BookOpen,
  GraduationCap,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  ChevronRight,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { reportsApi, subjectsApi, ClassReport, Subject } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ClassReportPage({ params }: { params: { id: string } }) {
  const classId = params.id;
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [report, setReport] = useState<ClassReport | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Fetch subjects
  const fetchSubjects = async () => {
    if (!accessToken) return;
    try {
      const response = await subjectsApi.getAll(accessToken);
      if (response.success && response.data) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Fetch class report
  const fetchReport = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedSubject !== 'all') params.subjectId = selectedSubject;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await reportsApi.getClassReport(classId, accessToken, params);
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch class report',
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
    fetchSubjects();
  }, [accessToken]);

  useEffect(() => {
    fetchReport();
  }, [accessToken, classId, selectedSubject, dateFrom, dateTo]);

  // Filter students by search
  const filteredStudents = report?.allStudents.filter((student) => {
    if (searchQuery) {
      return (
        student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading class report...</p>
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">Could not load the class report.</p>
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

  const summaryCards = [
    {
      label: 'Total Tests',
      value: report.summary.totalTests,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-400',
    },
    {
      label: 'Total Attempts',
      value: report.summary.totalAttempts,
      icon: Target,
      gradient: 'from-amber-500 to-orange-400',
    },
    {
      label: 'Subjects',
      value: report.summary.subjectsCount,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-400',
    },
    {
      label: 'Students',
      value: report.summary.studentsCount,
      icon: Users,
      gradient: 'from-green-500 to-emerald-400',
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

          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-6 w-6" />
              <span className="text-sm font-medium text-emerald-200">Class Report</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{report.class.name}</h1>
            <p className="text-emerald-100 mt-2">
              Performance analytics and student tracking
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
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

      {/* Subject-wise Performance */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-500" />
          Subject-wise Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.subjectPerformance.map((subject) => (
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
                  <span className="text-gray-500 dark:text-gray-400">Average Score</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{subject.avgScore.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      subject.avgScore >= 70 && "bg-green-500",
                      subject.avgScore >= 50 && subject.avgScore < 70 && "bg-amber-500",
                      subject.avgScore < 50 && "bg-red-500"
                    )}
                    style={{ width: `${subject.avgScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subject.totalAttempts} total attempts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers & Need Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {report.topPerformers.length === 0 ? (
              <p className="text-center py-6 text-gray-500 dark:text-gray-400">No data available</p>
            ) : (
              report.topPerformers.map((student, index) => (
                <Link
                  key={student.studentId}
                  href={`/reports/student/${student.studentId}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    index === 0 && "bg-gradient-to-br from-amber-400 to-amber-500 text-white",
                    index === 1 && "bg-gradient-to-br from-gray-300 to-gray-400 text-white",
                    index === 2 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                    index > 2 && "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {student.testsTaken} tests • Roll: {student.rollNo || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-emerald-600">{student.avgPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Need Support */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Need Support
          </h3>
          <div className="space-y-3">
            {report.studentsNeedingSupport.length === 0 ? (
              <div className="text-center py-6">
                <Award className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">All students are performing well!</p>
              </div>
            ) : (
              report.studentsNeedingSupport.map((student) => (
                <Link
                  key={student.studentId}
                  href={`/reports/student/${student.studentId}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {student.testsTaken} tests • Roll: {student.rollNo || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-red-600">{student.avgPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All Students Table */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            All Students ({filteredStudents.length})
          </h3>

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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Roll No</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Student Name</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tests Taken</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Percentage</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.studentId}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
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
                  <td className="py-3 px-4 text-center text-sm text-gray-900 dark:text-white">
                    {student.testsTaken}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            student.avgPercentage >= 70 && "bg-green-500",
                            student.avgPercentage >= 50 && student.avgPercentage < 70 && "bg-amber-500",
                            student.avgPercentage < 50 && "bg-red-500"
                          )}
                          style={{ width: `${student.avgPercentage}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-sm font-medium w-12",
                        student.avgPercentage >= 70 && "text-green-600",
                        student.avgPercentage >= 50 && student.avgPercentage < 70 && "text-amber-600",
                        student.avgPercentage < 50 && "text-red-600"
                      )}>
                        {student.avgPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/reports/student/${student.studentId}`}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors inline-flex items-center gap-1"
                    >
                      View Report
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
