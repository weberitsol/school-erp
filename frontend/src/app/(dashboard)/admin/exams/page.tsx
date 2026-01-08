'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface Exam {
  id: string;
  title: string;
  subject: { name: string };
  examType: string;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

interface ExamResult {
  id: string;
  studentId: string;
  student: { firstName: string; lastName: string };
  marksObtained: number;
  grade: string;
  isPassed: boolean;
  remarks?: string;
}

export default function ExamsPage() {
  const { accessToken } = useAuthStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams');

  useEffect(() => {
    if (accessToken) {
      fetchExams();
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedExam && activeTab === 'results') {
      fetchExamResults();
    }
  }, [selectedExam, activeTab]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/exams');
      setExams(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedExam(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamResults = async () => {
    if (!selectedExam) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/exams/${selectedExam}/results`);
      setResults(response.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishExam = async (examId: string) => {
    try {
      await apiClient.post(`/api/v1/exams/${examId}/publish`, {});
      fetchExams();
      alert('Exam published successfully');
    } catch (error) {
      alert('Failed to publish exam');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Examinations Module</h1>
            <p className="text-gray-600 mt-1">Manage exams and view student results</p>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('exams')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                📚 Exams ({exams.length})
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                📊 Results
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : activeTab === 'exams' ? (
              <div className="space-y-4">
                {exams.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No exams found</p>
                  </div>
                ) : (
                  exams.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => setSelectedExam(exam.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedExam === exam.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                          <p className="text-sm text-gray-600">
                            Subject: {exam.subject.name} | Type: {exam.examType}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm">
                            <span className="text-gray-600">
                              📝 Total Marks: <strong>{exam.totalMarks}</strong>
                            </span>
                            <span className="text-gray-600">
                              ✓ Passing Marks: <strong>{exam.passingMarks}</strong>
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                exam.isPublished
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {exam.isPublished ? '✓ Published' : '⏳ Draft'}
                            </span>
                          </div>
                        </div>
                        {!exam.isPublished && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              publishExam(exam.id);
                            }}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedExam && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-900">
                      Showing results for: <strong>{exams.find(e => e.id === selectedExam)?.title}</strong>
                    </p>
                  </div>
                )}
                {results.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No results found for this exam</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Student</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Marks</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900">Grade</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {results.map((result) => (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">
                              {result.student.firstName} {result.student.lastName}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {result.marksObtained}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-3 py-1 rounded font-semibold text-sm bg-blue-100 text-blue-800">
                                {result.grade}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                                  result.isPassed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {result.isPassed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
