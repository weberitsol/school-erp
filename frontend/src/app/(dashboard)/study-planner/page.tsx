'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { studyPlannerApi } from '@/lib/api';
import { Book, ChevronRight, GraduationCap, Loader2, BookOpen, Target, Calendar, Play, CheckCircle2 } from 'lucide-react';

interface Chapter {
  id: string;
  name: string;
  chapterNumber: number;
  description?: string;
  _count?: {
    questions: number;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  chapters: Chapter[];
}

interface StudyPlan {
  id: string;
  status: string;
  totalDays: number;
  diagnosticScore: number | null;
  startDate: string;
  targetEndDate: string;
  subject: { name: string };
  chapter: { name: string; chapterNumber: number };
  studyDays: { status: string }[];
}

export default function StudyPlannerPage() {
  const router = useRouter();
  const { accessToken: token } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [existingPlans, setExistingPlans] = useState<StudyPlan[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const [subjectsRes, plansRes] = await Promise.all([
          studyPlannerApi.getSubjectsWithChapters(token),
          studyPlannerApi.getPlans(token),
        ]);

        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(subjectsRes.data);
        } else {
          setError(subjectsRes.error || 'Failed to fetch subjects');
        }

        if (plansRes.success) {
          setExistingPlans((plansRes.data || []) as StudyPlan[]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const getProgressPercent = (plan: StudyPlan) => {
    const completed = plan.studyDays?.filter(d => d.status === 'COMPLETED').length || 0;
    return Math.round((completed / plan.totalDays) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
  };

  const handleStartDiagnostic = async () => {
    if (!selectedSubject || !selectedChapter || !token) return;

    setStarting(true);
    try {
      sessionStorage.setItem('studyPlanner_subjectId', selectedSubject.id);
      sessionStorage.setItem('studyPlanner_subjectName', selectedSubject.name);
      sessionStorage.setItem('studyPlanner_chapterId', selectedChapter.id);
      sessionStorage.setItem('studyPlanner_chapterName', selectedChapter.name);
      router.push('/study-planner/diagnostic');
    } catch (err: any) {
      setError(err.message || 'Failed to start diagnostic');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          Study Planner
        </h1>
        <p className="text-gray-600 mt-2">
          Track your study progress or create a new personalized study plan.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Existing Study Plans */}
      {existingPlans.length > 0 && !showNewPlan && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Study Plans</h2>
            <button
              onClick={() => setShowNewPlan(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Target className="h-4 w-4" />
              Create New Plan
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingPlans.map((plan) => {
              const progress = getProgressPercent(plan);
              return (
                <div
                  key={plan.id}
                  onClick={() => router.push(`/study-planner/plan/${plan.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.subject.name}</h3>
                      <p className="text-sm text-gray-500">
                        Ch. {plan.chapter.chapterNumber}: {plan.chapter.name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {plan.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{plan.totalDays} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{plan.studyDays?.filter(d => d.status === 'COMPLETED').length || 0}/{plan.totalDays} done</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/study-planner/plan/${plan.id}`);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    Continue Learning
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Plan Creation Form */}
      {(existingPlans.length === 0 || showNewPlan) && (
        <>
          {showNewPlan && existingPlans.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowNewPlan(false)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                ← Back to My Plans
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Subject Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Book className="h-5 w-5 text-blue-600" />
                Select Subject
              </h2>

              {subjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No subjects available</p>
              ) : (
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSubjectSelect(subject)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedSubject?.id === subject.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-gray-500">{subject.chapters.length} chapters</p>
                        </div>
                        <ChevronRight className={`h-5 w-5 ${
                          selectedSubject?.id === subject.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Select Chapter
              </h2>

              {!selectedSubject ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a subject to view chapters</p>
                </div>
              ) : selectedSubject.chapters.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No chapters available</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedSubject.chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterSelect(chapter)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedChapter?.id === chapter.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Chapter {chapter.chapterNumber}: {chapter.name}
                          </p>
                          {chapter._count && (
                            <p className="text-xs text-gray-400 mt-1">
                              {chapter._count.questions} questions
                            </p>
                          )}
                        </div>
                        <ChevronRight className={`h-5 w-5 flex-shrink-0 ${
                          selectedChapter?.id === chapter.id ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Start Button */}
          {selectedSubject && selectedChapter && (
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Ready to start?</h3>
                  <p className="text-blue-100 mt-1">
                    {selectedSubject.name} → Chapter {selectedChapter.chapterNumber}: {selectedChapter.name}
                  </p>
                </div>
                <button
                  onClick={handleStartDiagnostic}
                  disabled={starting}
                  className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {starting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Target className="h-5 w-5" />
                      Start Diagnostic Test
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Diagnostic Test</h3>
              <p className="text-sm text-gray-600 mt-2">
                Take a quick test to assess your current knowledge level.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">AI Recommendation</h3>
              <p className="text-sm text-gray-600 mt-2">
                Get personalized study hour recommendations.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Progressive Learning</h3>
              <p className="text-sm text-gray-600 mt-2">
                Complete daily content to master the chapter.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
