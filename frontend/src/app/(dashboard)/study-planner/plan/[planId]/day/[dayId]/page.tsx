'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { studyPlannerApi } from '@/lib/api';
import {
  ArrowLeft,
  Video,
  BookOpen,
  FileQuestion,
  FileText,
  CheckCircle2,
  Circle,
  Play,
  Loader2,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Square,
  CheckSquare
} from 'lucide-react';

// Question Types
type QuestionType =
  | 'MCQ'
  | 'SINGLE_CORRECT'
  | 'MULTIPLE_CORRECT'
  | 'INTEGER_TYPE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'ASSERTION_REASONING'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'MATCHING'
  | 'MATRIX_MATCH'
  | 'COMPREHENSION';

interface QuestionOption {
  id: string;
  text: string;
}

interface VideoItem {
  id: string;
  title: string;
  youtubeVideoId: string;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
  isWatched: boolean;
}

interface QuestionItem {
  id: string;
  questionText: string;
  questionHtml?: string;
  questionType: QuestionType;
  options?: QuestionOption[];
  correctAnswer: string;
  correctOptions?: string[];
  explanation?: string;
}

interface DayDetails {
  id: string;
  dayNumber: number;
  status: string;
  estimatedMinutes: number;
  actualTimeSpentMinutes: number;
  videosWatched: number;
  videosTotal: number;
  readingCompleted: boolean;
  practiceCompleted: boolean;
  currentPassRequirement: number;
  summaryNotes: string | null;
  bookContentPageStart: number | null;
  bookContentPageEnd: number | null;
  videos: VideoItem[];
  practiceQuestions: QuestionItem[];
  studyPlan: {
    id: string;
    subject: { name: string };
    chapter: { name: string; chapterNumber: number };
  };
}

export default function DayContentPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken: token } = useAuthStore();

  const planId = params.planId as string;
  const dayId = params.dayId as string;

  const [day, setDay] = useState<DayDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<'videos' | 'reading' | 'practice' | 'summary'>('videos');
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);

  useEffect(() => {
    fetchDayDetails();
  }, [token, dayId]);

  const fetchDayDetails = async () => {
    if (!token || !dayId) return;

    try {
      setLoading(true);
      const response = await studyPlannerApi.getDayDetails(dayId, token);

      if (response.success && response.data) {
        setDay(response.data as unknown as DayDetails);
        // Initialize practice answers based on question type
        const initialAnswers: Record<string, string | string[]> = {};
        response.data.practiceQuestions?.forEach((q: QuestionItem) => {
          initialAnswers[q.id] = q.questionType === 'MULTIPLE_CORRECT' ? [] : '';
        });
        setPracticeAnswers(initialAnswers);
      } else {
        setError(response.error || 'Failed to fetch day details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch day details');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoWatched = async (videoId: string) => {
    if (!token || !day || updating) return;

    setUpdating(true);
    try {
      const response = await studyPlannerApi.updateDayProgress(
        dayId,
        { videoWatched: videoId },
        token
      );

      if (response.success) {
        await fetchDayDetails();
      }
    } catch (err: any) {
      console.error('Failed to mark video as watched:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleReadingComplete = async () => {
    if (!token || !day || updating || day.readingCompleted) return;

    setUpdating(true);
    try {
      const response = await studyPlannerApi.updateDayProgress(
        dayId,
        { readingCompleted: true },
        token
      );

      if (response.success) {
        await fetchDayDetails();
      }
    } catch (err: any) {
      console.error('Failed to mark reading as complete:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Handle single answer selection
  const handlePracticeAnswer = (questionId: string, answer: string) => {
    setPracticeAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Handle multiple answer selection
  const handlePracticeMultipleAnswer = (questionId: string, answer: string) => {
    setPracticeAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(answer)) {
        return { ...prev, [questionId]: current.filter(a => a !== answer) };
      } else {
        return { ...prev, [questionId]: [...current, answer] };
      }
    });
  };

  // Check if answer is correct based on question type
  const isAnswerCorrect = (question: QuestionItem): boolean => {
    const answer = practiceAnswers[question.id];

    if (question.questionType === 'MULTIPLE_CORRECT') {
      const selectedAnswers = (answer as string[]) || [];
      const correctAnswers = question.correctOptions || question.correctAnswer.split(',');
      return selectedAnswers.length === correctAnswers.length &&
        selectedAnswers.every(a => correctAnswers.includes(a));
    }

    if (question.questionType === 'INTEGER_TYPE') {
      return String(answer).trim() === String(question.correctAnswer).trim();
    }

    return answer === question.correctAnswer;
  };

  const handleCheckPractice = async () => {
    setShowResults(true);

    // Check if all answers are correct
    const allCorrect = day?.practiceQuestions?.every(isAnswerCorrect);

    if (allCorrect && !day?.practiceCompleted) {
      setUpdating(true);
      try {
        await studyPlannerApi.updateDayProgress(
          dayId,
          { practiceCompleted: true },
          token!
        );
        await fetchDayDetails();
      } catch (err) {
        console.error('Failed to mark practice as complete:', err);
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleTakeTest = () => {
    router.push(`/study-planner/test/${dayId}`);
  };

  const canTakeTest = day &&
    day.videosWatched >= day.videosTotal &&
    day.readingCompleted &&
    day.practiceCompleted;

  const getYouTubeEmbedUrl = (videoId: string) => {
    if (!videoId) return null;
    // Remove any suffix like "_demo" that was added for uniqueness
    const cleanId = videoId.replace(/_demo$/, '');
    return `https://www.youtube.com/embed/${cleanId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !day) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error || 'Day not found'}</p>
          <button
            onClick={() => router.push(`/study-planner/plan/${planId}`)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Back Button */}
      <button
        onClick={() => router.push(`/study-planner/plan/${planId}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plan
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Day {day.dayNumber}</h1>
            <p className="text-gray-600">
              {day.studyPlan?.subject?.name || 'Subject'} → {day.studyPlan?.chapter?.name || 'Chapter'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span>{Math.round(day.estimatedMinutes / 60)}h estimated</span>
            </div>
            <div className="flex items-center gap-2 text-purple-600">
              <Target className="h-5 w-5" />
              <span>{day.currentPassRequirement}% to pass test</span>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg ${day.videosWatched >= day.videosTotal ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2">
              {day.videosWatched >= day.videosTotal ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <span className="font-medium">Videos: {day.videosWatched}/{day.videosTotal}</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${day.readingCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2">
              {day.readingCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <span className="font-medium">Reading</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${day.practiceCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2">
              {day.practiceCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
              <span className="font-medium">Practice</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'videos', label: 'Videos', icon: Video },
          { key: 'reading', label: 'Reading', icon: BookOpen },
          { key: 'practice', label: 'Practice', icon: FileQuestion },
          { key: 'summary', label: 'Summary', icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeSection === key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Videos Section */}
        {activeSection === 'videos' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Video Lessons</h2>
            {day.videos && day.videos.length > 0 ? (
              <div className="space-y-4">
                {day.videos.map((video) => (
                  <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-100">
                      {getYouTubeEmbedUrl(video.youtubeVideoId) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(video.youtubeVideoId)!}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Video unavailable
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{video.title}</h3>
                        <p className="text-sm text-gray-500">{Math.round((video.duration || 0) / 60)} minutes</p>
                      </div>
                      <button
                        onClick={() => handleVideoWatched(video.id)}
                        disabled={video.isWatched || updating}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          video.isWatched
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50`}
                      >
                        {video.isWatched ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Watched
                          </span>
                        ) : (
                          'Mark as Watched'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No videos assigned for this day</p>
            )}
          </div>
        )}

        {/* Reading Section */}
        {activeSection === 'reading' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Reading Material</h2>
            {day.bookContentPageStart && day.bookContentPageEnd ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-700">
                    <span className="font-medium">Assignment:</span> Read pages{' '}
                    <span className="font-bold">{day.bookContentPageStart}</span> to{' '}
                    <span className="font-bold">{day.bookContentPageEnd}</span> from your textbook.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-600 mb-4">
                    After completing the reading, mark it as complete to continue with your study plan.
                  </p>
                  <button
                    onClick={handleReadingComplete}
                    disabled={day.readingCompleted || updating}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      day.readingCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {day.readingCompleted ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Reading Completed
                      </span>
                    ) : (
                      'Mark Reading as Complete'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No reading material assigned for this day</p>
            )}
          </div>
        )}

        {/* Practice Section */}
        {activeSection === 'practice' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Practice Questions</h2>
            {day.practiceQuestions && day.practiceQuestions.length > 0 ? (
              <div className="space-y-6">
                {day.practiceQuestions.map((question, index) => {
                  const questionCorrect = showResults && isAnswerCorrect(question);
                  const questionWrong = showResults && !isAnswerCorrect(question);

                  return (
                    <div key={question.id} className={`border rounded-lg p-4 ${
                      questionCorrect ? 'border-green-300 bg-green-50' :
                      questionWrong ? 'border-red-300 bg-red-50' :
                      'border-gray-200'
                    }`}>
                      <div className="flex items-start gap-2 mb-3">
                        <span className="font-semibold text-gray-700">{index + 1}.</span>
                        <div className="flex-1">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mb-2">
                            {question.questionType.replace(/_/g, ' ')}
                          </span>
                          {question.questionHtml ? (
                            <div className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: question.questionHtml }} />
                          ) : (
                            <p className="font-medium text-gray-900">{question.questionText}</p>
                          )}
                        </div>
                      </div>

                      {/* MCQ / Single Correct */}
                      {(question.questionType === 'MCQ' || question.questionType === 'SINGLE_CORRECT') && question.options && (
                        <div className="space-y-2 ml-6">
                          {question.options.map((option) => {
                            const isSelected = practiceAnswers[question.id] === option.id;
                            const isCorrect = showResults && option.id === question.correctAnswer;
                            const isWrong = showResults && isSelected && option.id !== question.correctAnswer;

                            return (
                              <button
                                key={option.id}
                                onClick={() => !showResults && handlePracticeAnswer(question.id, option.id)}
                                disabled={showResults}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  isCorrect ? 'border-green-500 bg-green-100 text-green-700' :
                                  isWrong ? 'border-red-500 bg-red-100 text-red-700' :
                                  isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' :
                                  'border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <span className="font-medium">{option.id.toUpperCase()}.</span> {option.text}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Multiple Correct */}
                      {question.questionType === 'MULTIPLE_CORRECT' && question.options && (
                        <div className="space-y-2 ml-6">
                          <p className="text-sm text-purple-600 font-medium">(Select all correct answers)</p>
                          {question.options.map((option) => {
                            const selectedAnswers = (practiceAnswers[question.id] as string[]) || [];
                            const isSelected = selectedAnswers.includes(option.id);
                            const correctAnswers = question.correctOptions || question.correctAnswer.split(',');
                            const isCorrect = showResults && correctAnswers.includes(option.id);
                            const isWrong = showResults && isSelected && !correctAnswers.includes(option.id);

                            return (
                              <button
                                key={option.id}
                                onClick={() => !showResults && handlePracticeMultipleAnswer(question.id, option.id)}
                                disabled={showResults}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  isCorrect ? 'border-green-500 bg-green-100 text-green-700' :
                                  isWrong ? 'border-red-500 bg-red-100 text-red-700' :
                                  isSelected ? 'border-purple-500 bg-purple-50 text-purple-700' :
                                  'border-gray-200 hover:border-purple-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-400" />}
                                  <span className="font-medium">{option.id.toUpperCase()}.</span> {option.text}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* True/False */}
                      {question.questionType === 'TRUE_FALSE' && (
                        <div className="grid grid-cols-2 gap-3 ml-6">
                          {['true', 'false'].map((value) => {
                            const isSelected = practiceAnswers[question.id] === value;
                            const isCorrect = showResults && value === question.correctAnswer;
                            const isWrong = showResults && isSelected && value !== question.correctAnswer;

                            return (
                              <button
                                key={value}
                                onClick={() => !showResults && handlePracticeAnswer(question.id, value)}
                                disabled={showResults}
                                className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                                  isCorrect ? 'border-green-500 bg-green-100 text-green-700' :
                                  isWrong ? 'border-red-500 bg-red-100 text-red-700' :
                                  isSelected ? (value === 'true' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') :
                                  'border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                {value.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Integer Type */}
                      {question.questionType === 'INTEGER_TYPE' && (
                        <div className="ml-6 space-y-2">
                          <input
                            type="number"
                            value={(practiceAnswers[question.id] as string) || ''}
                            onChange={(e) => !showResults && handlePracticeAnswer(question.id, e.target.value)}
                            disabled={showResults}
                            placeholder="Enter numerical answer..."
                            className={`w-full p-3 text-lg font-mono border-2 rounded-lg ${
                              showResults && isAnswerCorrect(question) ? 'border-green-500 bg-green-50' :
                              showResults ? 'border-red-500 bg-red-50' :
                              'border-gray-300 focus:border-blue-500'
                            }`}
                          />
                          {showResults && (
                            <p className="text-sm text-gray-600">
                              Correct answer: <span className="font-semibold">{question.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Fill in Blank / Short Answer */}
                      {(question.questionType === 'FILL_BLANK' || question.questionType === 'SHORT_ANSWER') && (
                        <div className="ml-6 space-y-2">
                          <input
                            type="text"
                            value={(practiceAnswers[question.id] as string) || ''}
                            onChange={(e) => !showResults && handlePracticeAnswer(question.id, e.target.value)}
                            disabled={showResults}
                            placeholder="Type your answer..."
                            className={`w-full p-3 border-2 rounded-lg ${
                              showResults && isAnswerCorrect(question) ? 'border-green-500 bg-green-50' :
                              showResults ? 'border-red-500 bg-red-50' :
                              'border-gray-300 focus:border-blue-500'
                            }`}
                          />
                          {showResults && (
                            <p className="text-sm text-gray-600">
                              Correct answer: <span className="font-semibold">{question.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {showResults && question.explanation && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 ml-6">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!showResults ? (
                  <button
                    onClick={handleCheckPractice}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Check Answers
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowResults(false);
                        const resetAnswers: Record<string, string | string[]> = {};
                        day.practiceQuestions?.forEach((q) => {
                          resetAnswers[q.id] = q.questionType === 'MULTIPLE_CORRECT' ? [] : '';
                        });
                        setPracticeAnswers(resetAnswers);
                      }}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Try Again
                    </button>
                    {day.practiceCompleted && (
                      <div className="flex-1 py-3 bg-green-100 text-green-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Practice Complete!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No practice questions assigned for this day</p>
            )}
          </div>
        )}

        {/* Summary Section */}
        {activeSection === 'summary' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Summary Notes</h2>
            {day.summaryNotes ? (
              <div className="prose max-w-none">
                <div
                  className={`relative ${!expandedNotes ? 'max-h-96 overflow-hidden' : ''}`}
                >
                  <div className="whitespace-pre-wrap text-gray-700">{day.summaryNotes}</div>
                  {!expandedNotes && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
                  )}
                </div>
                <button
                  onClick={() => setExpandedNotes(!expandedNotes)}
                  className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  {expandedNotes ? (
                    <>
                      <ChevronUp className="h-5 w-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-5 w-5" />
                      Show More
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No summary notes available for this day</p>
            )}
          </div>
        )}
      </div>

      {/* Take Test Button */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Ready for the Day Test?</h3>
            <p className="text-sm text-gray-600">
              {canTakeTest
                ? `Complete the test with at least ${day.currentPassRequirement}% to unlock the next day.`
                : 'Complete all videos, reading, and practice before taking the test.'}
            </p>
          </div>
          <button
            onClick={handleTakeTest}
            disabled={!canTakeTest}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              canTakeTest
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="h-5 w-5" />
            Take Test
          </button>
        </div>
      </div>
    </div>
  );
}
