'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { studyPlannerApi } from '@/lib/api';
import {
  Brain,
  Clock,
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface WeakArea {
  topic: string;
  score: number;
  questionCount: number;
}

interface DiagnosticResult {
  diagnosticScore: number;
  totalCount: number;
  correctCount: number;
  percentage?: number;
  weakAreas: WeakArea[];
  aiRecommendation: {
    totalHours: number;
    analysis: string;
    studyStrategy?: string;
    focusAreas?: string[];
    dailyPlan?: any[];
    summaryNotes?: string[];
    weakAreas?: WeakArea[];
  };
}

export default function RecommendationPage() {
  const router = useRouter();
  const { accessToken: token } = useAuthStore();

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState<string>('');
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState<string>('');
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const [selectedDays, setSelectedDays] = useState<number>(4);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedSubjectId = sessionStorage.getItem('studyPlanner_subjectId');
    const storedSubjectName = sessionStorage.getItem('studyPlanner_subjectName');
    const storedChapterId = sessionStorage.getItem('studyPlanner_chapterId');
    const storedChapterName = sessionStorage.getItem('studyPlanner_chapterName');
    const storedResult = sessionStorage.getItem('studyPlanner_diagnosticResult');

    console.log('Recommendation page loading...', { storedSubjectId, storedChapterId, hasResult: !!storedResult });

    if (!storedSubjectId || !storedChapterId || !storedResult) {
      console.log('Missing session data, redirecting');
      router.push('/study-planner');
      return;
    }

    setSubjectId(storedSubjectId);
    setSubjectName(storedSubjectName || '');
    setChapterId(storedChapterId);
    setChapterName(storedChapterName || '');

    try {
      const parsedResult = JSON.parse(storedResult);
      console.log('Parsed diagnostic result:', parsedResult);

      // Ensure the result has the expected structure
      if (!parsedResult.aiRecommendation) {
        parsedResult.aiRecommendation = {
          totalHours: 4,
          analysis: 'Based on your diagnostic score, we recommend focused study on the weak areas.',
        };
      }

      setResult(parsedResult);
    } catch (err) {
      console.error('Failed to parse diagnostic result:', err);
      setError('Failed to load diagnostic results');
    }
  }, [router]);

  const hoursPerDay = result ? (result.aiRecommendation.totalHours / selectedDays).toFixed(1) : 0;

  const handleCreatePlan = async () => {
    if (!token || !subjectId || !chapterId || !result) return;

    setCreating(true);
    try {
      const response = await studyPlannerApi.createPlan(
        {
          subjectId,
          chapterId,
          diagnosticScore: result.diagnosticScore,
          aiRecommendation: result.aiRecommendation as any,
          totalDays: selectedDays,
        },
        token
      );

      if (response.success && response.data) {
        // Clear session storage
        sessionStorage.removeItem('studyPlanner_subjectId');
        sessionStorage.removeItem('studyPlanner_subjectName');
        sessionStorage.removeItem('studyPlanner_chapterId');
        sessionStorage.removeItem('studyPlanner_chapterName');
        sessionStorage.removeItem('studyPlanner_diagnosticResult');

        router.push(`/study-planner/plan/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to create study plan');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create study plan');
    } finally {
      setCreating(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    if (percentage >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          AI Study Recommendation
        </h1>
        <p className="text-gray-600 mt-2">
          {subjectName} → {chapterName}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Diagnostic Score */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Results</h2>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className={`w-32 h-32 rounded-full ${getScoreBg(result.diagnosticScore)} flex items-center justify-center`}>
            <div className="text-center">
              <span className={`text-4xl font-bold ${getScoreColor(result.diagnosticScore)}`}>
                {Math.round(result.diagnosticScore)}%
              </span>
              <p className="text-sm text-gray-500">Score</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Correct Answers</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.correctCount}/{result.totalCount}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Knowledge Level</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.diagnosticScore >= 80 ? 'Advanced' :
                   result.diagnosticScore >= 60 ? 'Intermediate' :
                   result.diagnosticScore >= 40 ? 'Beginner' : 'Needs Work'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weak Areas */}
        {result.weakAreas && result.weakAreas.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Areas Needing Improvement
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.weakAreas.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                >
                  {area.topic} ({Math.round(area.score)}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
        </div>

        <p className="text-gray-700 mb-4">{result.aiRecommendation.analysis}</p>

        {result.aiRecommendation.studyStrategy && (
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h3 className="font-medium text-gray-900 mb-2">Recommended Study Strategy:</h3>
            <p className="text-gray-600">{result.aiRecommendation.studyStrategy}</p>
          </div>
        )}

        {result.aiRecommendation.focusAreas && result.aiRecommendation.focusAreas.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              Focus Areas
            </h3>
            <ul className="space-y-1">
              {result.aiRecommendation.focusAreas.map((area, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Study Plan Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Create Your Study Plan
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recommended Hours */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Recommended Hours</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {result.aiRecommendation.totalHours} hours
            </p>
          </div>

          {/* Days Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complete in how many days?
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6, 7].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    selectedDays === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {days}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculated Hours per Day */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Daily Study Target:</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{hoursPerDay} hours/day</span>
          </div>
        </div>

        {/* What's Included */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Each day includes:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Video Lessons</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Book Content</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Practice Questions</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Summary Notes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Plan Button */}
      <button
        onClick={handleCreatePlan}
        disabled={creating}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {creating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating Your Plan...
          </>
        ) : (
          <>
            <BookOpen className="h-5 w-5" />
            Create {selectedDays}-Day Study Plan
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        Complete each day's content and pass the test to unlock the next day
      </p>
    </div>
  );
}
