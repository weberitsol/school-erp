'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { videosApi, classesApi } from '@/lib/api';
import {
  Play,
  Clock,
  CheckCircle,
  Users,
  BarChart2,
  TrendingUp,
  Award,
  AlertCircle,
  ChevronDown,
  Search,
  Filter,
  Eye,
  Target,
  XCircle,
} from 'lucide-react';

interface StudentStats {
  studentId: string;
  studentName: string;
  rollNo: string | null;
  totalVideos: number;
  totalWatchTime: number;
  completedVideos: number;
  verificationSuccessRate: number;
  questionAccuracy: number;
}

interface VideoReport {
  video: {
    id: string;
    title: string;
    duration: number | null;
    subject: string | null;
  };
  stats: {
    totalSessions: number;
    uniqueStudents: number;
    totalWatchTime: number;
    averageWatchTime: number;
    completionRate: number;
    verificationRate: number;
    questionAccuracy: number;
  };
  studentBreakdown: StudentStats[];
}

interface BatchReport {
  class: string;
  section: string | null;
  studentCount: number;
  videosAssigned: number;
  averageWatchTime: number;
  averageVerificationRate: number;
  averageQuestionAccuracy: number;
  topPerformers: StudentStats[];
  needsAttention: StudentStats[];
}

interface ChildReport {
  child: {
    id: string;
    name: string;
    class: string;
    section: string;
  };
  summary: {
    totalVideosAssigned: number;
    videosWatched: number;
    totalWatchTime: number;
    verificationSuccessRate: number;
    questionAccuracy: number;
  };
  recentActivity: {
    videoTitle: string;
    watchTime: number;
    watchedAt: string;
    completed: boolean;
  }[];
  weeklyTrend: {
    week: string;
    watchTime: number;
    videosWatched: number;
  }[];
}

interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  currentClass?: { name: string };
  currentSection?: { name: string };
}

export default function VideoReportsPage() {
  const { user, accessToken, isLoading: authLoading } = useAuthStore();
  const isParent = user?.role === 'PARENT';
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'batch' | 'student'>('batch');

  // Batch report state
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [batchReport, setBatchReport] = useState<BatchReport | null>(null);

  // Parent state
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [childReport, setChildReport] = useState<ChildReport | null>(null);

  // Load initial data
  useEffect(() => {
    if (!authLoading && accessToken) {
      if (isParent) {
        fetchChildren();
      } else if (isTeacherOrAdmin) {
        fetchClasses();
      }
    }
  }, [authLoading, accessToken, user?.role]);

  const fetchClasses = async () => {
    if (!accessToken) return;

    try {
      const response = await classesApi.getAll(accessToken);
      const classesData = response.data || [];
      // Map classes to include sections array
      const mappedClasses = classesData.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        sections: cls.sections || [],
      }));
      setClasses(mappedClasses);

      if (mappedClasses.length > 0) {
        setSelectedClass(mappedClasses[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    if (!accessToken) return;

    try {
      // Parents API to get their children
      const response = await fetch('/api/v1/parents/children', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      const childrenData = data.data || [];
      setChildren(childrenData);

      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0].id);
        fetchChildReport(childrenData[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching children:', err);
      setError('Failed to load children data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchReport = async () => {
    if (!accessToken || !selectedClass) return;

    setLoading(true);
    setError(null);

    try {
      const response = await videosApi.getBatchReport(
        selectedClass,
        accessToken,
        selectedSection || undefined
      );
      setBatchReport(response.data);
    } catch (err: any) {
      console.error('Error fetching batch report:', err);
      setError('Failed to load batch report');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildReport = async (childId: string) => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await videosApi.getChildReport(childId, accessToken);
      setChildReport(response.data);
    } catch (err: any) {
      console.error('Error fetching child report:', err);
      setError('Failed to load child report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && isTeacherOrAdmin) {
      fetchBatchReport();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (selectedChild && isParent) {
      fetchChildReport(selectedChild);
    }
  }, [selectedChild]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Parent View
  if (isParent) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Video Learning Report</h1>
          <p className="text-gray-600 mt-1">Track your child's video learning progress</p>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Child
            </label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        {childReport && (
          <>
            {/* Child Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {childReport.child.name}
              </h2>
              <p className="text-gray-600">
                Class {childReport.child.class} - Section {childReport.child.section}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Play className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {childReport.summary.totalVideosAssigned}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Watched</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {childReport.summary.videosWatched}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Watch Time</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatTime(childReport.summary.totalWatchTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Target className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Verification</p>
                    <p className={`text-xl font-semibold ${getScoreColor(childReport.summary.verificationSuccessRate)}`}>
                      {childReport.summary.verificationSuccessRate.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quiz Accuracy</p>
                    <p className={`text-xl font-semibold ${getScoreColor(childReport.summary.questionAccuracy)}`}>
                      {childReport.summary.questionAccuracy.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trend</h3>
              <div className="grid grid-cols-4 gap-4">
                {childReport.weeklyTrend.map((week, index) => (
                  <div key={index} className="text-center">
                    <p className="text-sm text-gray-500 mb-2">{week.week}</p>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTime(week.watchTime)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {week.videosWatched} video{week.videosWatched !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {childReport.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {childReport.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {activity.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Play className="h-5 w-5 text-indigo-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{activity.videoTitle}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(activity.watchedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatTime(activity.watchTime)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.completed ? 'Completed' : 'In Progress'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Teacher/Admin View
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Video Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor student video engagement and performance</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!selectedClass}
            >
              <option value="">All Sections</option>
              {classes
                .find((c) => c.id === selectedClass)
                ?.sections?.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {batchReport && (
        <>
          {/* Batch Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {batchReport.studentCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Watch Time</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatTime(batchReport.averageWatchTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Verification</p>
                  <p className={`text-xl font-semibold ${getScoreColor(batchReport.averageVerificationRate)}`}>
                    {batchReport.averageVerificationRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Quiz Score</p>
                  <p className={`text-xl font-semibold ${getScoreColor(batchReport.averageQuestionAccuracy)}`}>
                    {batchReport.averageQuestionAccuracy.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers and Needs Attention */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
              </div>

              {batchReport.topPerformers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-3">
                  {batchReport.topPerformers.map((student, index) => (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.studentName}</p>
                          <p className="text-sm text-gray-500">
                            Roll No: {student.rollNo || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatTime(student.totalWatchTime)}
                        </p>
                        <p className="text-sm text-green-600">
                          {student.questionAccuracy.toFixed(0)}% accuracy
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Needs Attention */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
              </div>

              {batchReport.needsAttention.length === 0 ? (
                <p className="text-gray-500 text-center py-4">All students doing well!</p>
              ) : (
                <div className="space-y-3">
                  {batchReport.needsAttention.map((student) => (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{student.studentName}</p>
                        <p className="text-sm text-gray-500">
                          Roll No: {student.rollNo || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatTime(student.totalWatchTime)}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          {student.verificationSuccessRate < 60 && (
                            <span className="text-red-600">
                              {student.verificationSuccessRate.toFixed(0)}% verify
                            </span>
                          )}
                          {student.questionAccuracy < 60 && (
                            <span className="text-yellow-600">
                              {student.questionAccuracy.toFixed(0)}% quiz
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Videos Assigned Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Batch Summary</h3>
              <span className="text-gray-500">
                {batchReport.class}
                {batchReport.section && ` - ${batchReport.section}`}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {batchReport.videosAssigned}
                </p>
                <p className="text-sm text-gray-500">Videos Assigned</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {batchReport.studentCount}
                </p>
                <p className="text-sm text-gray-500">Active Students</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className={`text-2xl font-bold ${getScoreColor(batchReport.averageVerificationRate)}`}>
                  {batchReport.averageVerificationRate.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500">Attention Rate</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className={`text-2xl font-bold ${getScoreColor(batchReport.averageQuestionAccuracy)}`}>
                  {batchReport.averageQuestionAccuracy.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500">Comprehension</p>
              </div>
            </div>
          </div>
        </>
      )}

      {!batchReport && !loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Select a Class</h3>
          <p className="text-gray-500 mt-1">Choose a class to view video analytics</p>
        </div>
      )}
    </div>
  );
}
