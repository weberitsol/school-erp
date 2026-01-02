'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { studyPlannerApi } from '@/lib/api';
import {
  Lock,
  Unlock,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  BookOpen,
  Video,
  FileQuestion,
  Loader2,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';

interface StudyDay {
  id: string;
  dayNumber: number;
  status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  estimatedMinutes: number;
  actualTimeSpentMinutes: number;
  videosWatched: number;
  videosTotal: number;
  readingCompleted: boolean;
  practiceCompleted: boolean;
  requiredPassPercent: number;
  currentPassRequirement: number;
  nextAttemptAt: string | null;
  dayAttempts: {
    id: string;
    attemptNumber: number;
    percentage: number | null;
    status: string;
  }[];
}

interface StudyPlanDetails {
  id: string;
  subject: { name: string };
  chapter: { name: string; chapterNumber: number };
  diagnosticScore: number;
  aiRecommendedHours: number;
  totalDays: number;
  hoursPerDay: number;
  currentDay: number;
  status: string;
  totalTimeSpentMinutes: number;
  startDate: string;
  targetEndDate: string;
  studyDays: StudyDay[];
}

export default function StudyPlanPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken: token } = useAuthStore();

  const planId = params.planId as string;

  const [plan, setPlan] = useState<StudyPlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!token || !planId) return;

      try {
        setLoading(true);
        const response = await studyPlannerApi.getPlanDetails(planId, token);

        if (response.success && response.data) {
          setPlan(response.data as unknown as StudyPlanDetails);
        } else {
          setError(response.error || 'Failed to fetch study plan');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch study plan');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [token, planId]);

  const getDayIcon = (status: string) => {
    switch (status) {
      case 'LOCKED':
        return <Lock className="h-6 w-6" />;
      case 'UNLOCKED':
        return <Unlock className="h-6 w-6" />;
      case 'IN_PROGRESS':
        return <Play className="h-6 w-6" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-6 w-6" />;
      case 'FAILED':
        return <XCircle className="h-6 w-6" />;
      default:
        return <Lock className="h-6 w-6" />;
    }
  };

  const getDayStyles = (status: string) => {
    switch (status) {
      case 'LOCKED':
        return 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed';
      case 'UNLOCKED':
        return 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100 cursor-pointer';
      case 'IN_PROGRESS':
        return 'bg-yellow-50 border-yellow-400 text-yellow-600 hover:bg-yellow-100 cursor-pointer';
      case 'COMPLETED':
        return 'bg-green-50 border-green-400 text-green-600 hover:bg-green-100 cursor-pointer';
      case 'FAILED':
        return 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100 cursor-pointer';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-400';
    }
  };

  const handleDayClick = (day: StudyDay) => {
    if (day.status === 'LOCKED') return;
    router.push(`/study-planner/plan/${planId}/day/${day.id}`);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTimeUntilRetry = (nextAttemptAt: string) => {
    const now = new Date();
    const retryTime = new Date(nextAttemptAt);
    const diff = retryTime.getTime() - now.getTime();

    if (diff <= 0) return 'Ready to retry';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  const completedDays = plan?.studyDays.filter((d) => d.status === 'COMPLETED').length || 0;
  const progressPercent = plan ? (completedDays / plan.totalDays) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Plan not found'}</p>
          <button
            onClick={() => router.push('/study-planner')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <button
        onClick={() => router.push('/study-planner')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Study Planner
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {plan.subject.name}
            </h1>
            <p className="text-gray-600">
              Chapter {plan.chapter.chapterNumber}: {plan.chapter.name}
            </p>
          </div>

          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            plan.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            plan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {plan.status}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium text-gray-900">
              {completedDays}/{plan.totalDays} days completed
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <TrendingUp className="h-4 w-4" />
              Diagnostic Score
            </div>
            <p className="text-xl font-bold text-gray-900">{plan.diagnosticScore}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="h-4 w-4" />
              Daily Target
            </div>
            <p className="text-xl font-bold text-gray-900">{plan.hoursPerDay}h</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="h-4 w-4" />
              Time Spent
            </div>
            <p className="text-xl font-bold text-gray-900">{formatTime(plan.totalTimeSpentMinutes)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Calendar className="h-4 w-4" />
              Target Date
            </div>
            <p className="text-xl font-bold text-gray-900">
              {new Date(plan.targetEndDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Day Tiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {plan.studyDays.map((day) => (
          <div
            key={day.id}
            onClick={() => handleDayClick(day)}
            className={`relative rounded-xl border-2 p-4 transition-all ${getDayStyles(day.status)}`}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold">Day {day.dayNumber}</span>
              {getDayIcon(day.status)}
            </div>

            {/* Content Progress */}
            {day.status !== 'LOCKED' && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>{day.videosWatched}/{day.videosTotal} videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{day.readingCompleted ? 'Reading done' : 'Reading pending'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4" />
                  <span>{day.practiceCompleted ? 'Practice done' : 'Practice pending'}</span>
                </div>
              </div>
            )}

            {/* Time */}
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                <span>{formatTime(day.estimatedMinutes)}</span>
              </div>
            </div>

            {/* Pass Requirement Badge */}
            {day.status !== 'LOCKED' && day.status !== 'COMPLETED' && (
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                {day.currentPassRequirement}% to pass
              </div>
            )}

            {/* Cooldown Timer */}
            {day.status === 'FAILED' && day.nextAttemptAt && new Date(day.nextAttemptAt) > new Date() && (
              <div className="mt-2 p-2 bg-red-100 rounded-lg text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Retry in: {getTimeUntilRetry(day.nextAttemptAt)}
                </div>
              </div>
            )}

            {/* Completed Badge */}
            {day.status === 'COMPLETED' && day.dayAttempts.length > 0 && (
              <div className="mt-2 p-2 bg-green-100 rounded-lg text-xs">
                Score: {day.dayAttempts[day.dayAttempts.length - 1].percentage}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tile Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300" />
            <span className="text-sm text-gray-600">Locked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
            <span className="text-sm text-gray-600">Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-400" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
            <span className="text-sm text-gray-600">Failed (Cooldown)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
