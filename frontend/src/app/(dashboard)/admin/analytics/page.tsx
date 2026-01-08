'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface StudentAnalytics {
  examPerformance?: {
    averageMarks: number;
    totalExams: number;
    passRate: number;
  };
  attendanceRate?: number;
  engagementScore?: number;
  learningProgress?: {
    chaptersCompleted: number;
    totalChapters: number;
    completionRate: number;
  };
}

interface Insight {
  type: string;
  category: string;
  message: string;
  priority: string;
}

interface StudentWithAnalytics {
  id: string;
  firstName: string;
  lastName: string;
  analytics?: StudentAnalytics;
  insights?: Insight[];
  recommendations?: string[];
}

interface StudentsResponse {
  data: StudentWithAnalytics[];
}

interface AnalyticsResponse {
  data: StudentAnalytics;
}

interface InsightsResponse {
  data: Insight[];
}

interface RecommendationsResponse {
  data: string[];
}

export default function AnalyticsPage() {
  const { accessToken } = useAuthStore();
  const [students, setStudents] = useState<StudentWithAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchStudents();
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedStudent?.id) {
      fetchStudentAnalytics(selectedStudent.id);
    }
  }, [selectedStudent?.id]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<StudentsResponse>('/api/v1/students');
      const studentsList = response.data || [];
      setStudents(studentsList);
      if (studentsList.length > 0) {
        setSelectedStudent(studentsList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAnalytics = async (studentId: string) => {
    try {
      setLoading(true);
      const [analyticsRes, insightsRes, recommendationsRes] = await Promise.all([
        apiClient.get<AnalyticsResponse>(`/api/v1/advanced/student/${studentId}/analytics`),
        apiClient.get<InsightsResponse>(`/api/v1/advanced/student/${studentId}/insights`),
        apiClient.get<RecommendationsResponse>(`/api/v1/advanced/student/${studentId}/recommendations`),
      ]);

      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              analytics: analyticsRes.data,
              insights: insightsRes.data,
              recommendations: recommendationsRes.data,
            }
          : null
      );
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Student List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Students</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                      selectedStudent?.id === student.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Analytics */}
          <div className="lg:col-span-3 space-y-6">
            {selectedStudent ? (
              <>
                {/* Student Header */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h1>
                  <p className="text-gray-600 mt-1">Student Learning Analytics</p>
                </div>

                {/* Analytics Cards */}
                {selectedStudent.analytics && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Engagement Score */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <p className="text-sm text-gray-600 font-semibold uppercase">Engagement Score</p>
                      <div className={`text-3xl font-bold mt-2 ${getGradeColor(selectedStudent.analytics.engagementScore || 0)}`}>
                        {selectedStudent.analytics.engagementScore || 0}
                        <span className="text-lg">/100</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedStudent.analytics.engagementScore || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="bg-white rounded-lg shadow p-4">
                      <p className="text-sm text-gray-600 font-semibold uppercase">Attendance</p>
                      <div className={`text-3xl font-bold mt-2 ${getGradeColor(selectedStudent.analytics.attendanceRate || 0)}`}>
                        {selectedStudent.analytics.attendanceRate || 0}
                        <span className="text-lg">%</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${selectedStudent.analytics.attendanceRate || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Exam Performance */}
                    {selectedStudent.analytics.examPerformance && (
                      <div className="bg-white rounded-lg shadow p-4">
                        <p className="text-sm text-gray-600 font-semibold uppercase">Exam Average</p>
                        <div className={`text-3xl font-bold mt-2 ${getGradeColor(selectedStudent.analytics.examPerformance.averageMarks)}`}>
                          {selectedStudent.analytics.examPerformance.averageMarks}
                          <span className="text-lg">%</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {selectedStudent.analytics.examPerformance.totalExams} exams • Pass Rate: {selectedStudent.analytics.examPerformance.passRate}%
                        </p>
                      </div>
                    )}

                    {/* Learning Progress */}
                    {selectedStudent.analytics.learningProgress && (
                      <div className="bg-white rounded-lg shadow p-4">
                        <p className="text-sm text-gray-600 font-semibold uppercase">Learning Progress</p>
                        <div className={`text-3xl font-bold mt-2 ${getGradeColor(selectedStudent.analytics.learningProgress.completionRate)}`}>
                          {selectedStudent.analytics.learningProgress.completionRate}
                          <span className="text-lg">%</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {selectedStudent.analytics.learningProgress.chaptersCompleted} / {selectedStudent.analytics.learningProgress.totalChapters} chapters
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Insights */}
                {selectedStudent.insights && selectedStudent.insights.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Learning Insights</h2>
                    <div className="space-y-3">
                      {selectedStudent.insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            insight.type === 'strength'
                              ? 'border-green-200 bg-green-50'
                              : insight.type === 'improvement_area'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-blue-200 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{insight.message}</p>
                              <p className="text-xs text-gray-600 mt-1">Category: {insight.category}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ml-2 flex-shrink-0 ${getPriorityColor(insight.priority)}`}>
                              {insight.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selectedStudent.recommendations && selectedStudent.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h2>
                    <ul className="space-y-2">
                      {selectedStudent.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-600 mr-3 mt-1 font-bold">→</span>
                          <span className="text-gray-700 text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Select a student to view analytics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
