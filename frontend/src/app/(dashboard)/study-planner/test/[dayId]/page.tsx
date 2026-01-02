'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { studyPlannerApi } from '@/lib/api';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Trophy,
  RotateCcw,
  ArrowRight,
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

interface TestQuestion {
  id: string;
  questionText: string;
  questionHtml?: string;
  questionType: QuestionType;
  options?: QuestionOption[];
  difficulty?: string;
  marks?: number;
}

interface TestResponse {
  questionId: string;
  selectedAnswer: string | string[] | null;
}

interface TestResult {
  passed: boolean;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  passingPercent: number;
  nextDayUnlocked: boolean;
  cooldownEndsAt: string | null;
  newPassRequirement: number | null;
}

export default function DayTestPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken: token } = useAuthStore();

  const dayId = params.dayId as string;

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [passingPercent, setPassingPercent] = useState<number>(80);

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<TestResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const [result, setResult] = useState<TestResult | null>(null);

  // Start test
  useEffect(() => {
    const startTest = async () => {
      if (!token || !dayId) return;

      try {
        setLoading(true);
        const response = await studyPlannerApi.startDayTest(dayId, token);

        if (response.success && response.data) {
          setAttemptId(response.data.attemptId);
          // planId and dayNumber are retrieved from session storage if not in response
          const storedPlanId = sessionStorage.getItem('studyPlanner_currentPlanId');
          const storedDayNumber = sessionStorage.getItem('studyPlanner_currentDayNumber');
          if (storedPlanId) setPlanId(storedPlanId);
          if (storedDayNumber) setDayNumber(parseInt(storedDayNumber, 10));
          setPassingPercent(response.data.passingPercent);
          const fetchedQuestions = response.data.questions as TestQuestion[];
          setQuestions(fetchedQuestions);
          setResponses(
            fetchedQuestions.map((q: TestQuestion) => ({
              questionId: q.id,
              selectedAnswer: q.questionType === 'MULTIPLE_CORRECT' ? [] : null,
            }))
          );
        } else {
          setError(response.error || 'Failed to start test');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to start test');
      } finally {
        setLoading(false);
      }
    };

    startTest();
  }, [token, dayId]);

  // Timer countdown
  useEffect(() => {
    if (loading || questions.length === 0 || isTimeUp || result) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, questions.length, isTimeUp, result]);

  // Auto-submit when time is up
  useEffect(() => {
    if (isTimeUp && !submitting && !result) {
      handleSubmit();
    }
  }, [isTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle single answer selection
  const handleSingleAnswer = (answer: string) => {
    const newResponses = [...responses];
    newResponses[currentIndex] = {
      ...newResponses[currentIndex],
      selectedAnswer: answer,
    };
    setResponses(newResponses);
  };

  // Handle multiple answer selection
  const handleMultipleAnswer = (answer: string) => {
    const newResponses = [...responses];
    const current = newResponses[currentIndex].selectedAnswer as string[] || [];

    if (current.includes(answer)) {
      newResponses[currentIndex] = {
        ...newResponses[currentIndex],
        selectedAnswer: current.filter(a => a !== answer),
      };
    } else {
      newResponses[currentIndex] = {
        ...newResponses[currentIndex],
        selectedAnswer: [...current, answer],
      };
    }
    setResponses(newResponses);
  };

  // Handle text input
  const handleTextAnswer = (answer: string) => {
    const newResponses = [...responses];
    newResponses[currentIndex] = {
      ...newResponses[currentIndex],
      selectedAnswer: answer,
    };
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!token || !attemptId || submitting) return;

    setSubmitting(true);
    try {
      const formattedResponses = responses.map((r) => ({
        questionId: r.questionId,
        selectedAnswer: Array.isArray(r.selectedAnswer)
          ? r.selectedAnswer.join(',')
          : (r.selectedAnswer || ''),
      }));

      const response = await studyPlannerApi.submitDayTest(
        dayId,
        {
          attemptId,
          responses: formattedResponses,
        },
        token
      );

      if (response.success && response.data) {
        setResult(response.data as unknown as TestResult);
      } else {
        setError(response.error || 'Failed to submit test');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeUntilRetry = (cooldownEndsAt: string) => {
    const now = new Date();
    const retryTime = new Date(cooldownEndsAt);
    const diff = retryTime.getTime() - now.getTime();

    if (diff <= 0) return '0 minutes';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  const isAnswered = (response: TestResponse) => {
    if (Array.isArray(response.selectedAnswer)) {
      return response.selectedAnswer.length > 0;
    }
    return response.selectedAnswer !== null && response.selectedAnswer !== '';
  };

  const answeredCount = responses.filter(isAnswered).length;
  const currentQuestion = questions[currentIndex];
  const currentResponse = responses[currentIndex];

  // Get question type label
  const getQuestionTypeLabel = (type: QuestionType) => {
    const labels: Record<QuestionType, string> = {
      MCQ: 'Multiple Choice',
      SINGLE_CORRECT: 'Single Correct',
      MULTIPLE_CORRECT: 'Multiple Correct',
      INTEGER_TYPE: 'Integer Type',
      TRUE_FALSE: 'True/False',
      FILL_BLANK: 'Fill in the Blank',
      ASSERTION_REASONING: 'Assertion & Reasoning',
      SHORT_ANSWER: 'Short Answer',
      LONG_ANSWER: 'Long Answer',
      MATCHING: 'Matching',
      MATRIX_MATCH: 'Matrix Match',
      COMPREHENSION: 'Comprehension',
    };
    return labels[type] || type;
  };

  // Render options based on question type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const { questionType, options } = currentQuestion;

    // Single correct answer (MCQ, SINGLE_CORRECT)
    if (questionType === 'MCQ' || questionType === 'SINGLE_CORRECT') {
      return (
        <div className="space-y-3">
          {options?.map((option) => {
            const isSelected = currentResponse?.selectedAnswer === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSingleAnswer(option.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.id.toUpperCase()}
                  </span>
                  <span className="pt-1">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // Multiple correct answers
    if (questionType === 'MULTIPLE_CORRECT') {
      const selectedAnswers = (currentResponse?.selectedAnswer as string[]) || [];
      return (
        <div className="space-y-3">
          <p className="text-sm text-purple-600 font-medium mb-2">
            (Select all correct answers)
          </p>
          {options?.map((option) => {
            const isSelected = selectedAnswers.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleMultipleAnswer(option.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isSelected ? (
                    <CheckSquare className="flex-shrink-0 w-6 h-6 text-purple-600" />
                  ) : (
                    <Square className="flex-shrink-0 w-6 h-6 text-gray-400" />
                  )}
                  <span className="font-medium mr-2">{option.id.toUpperCase()}.</span>
                  <span>{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // True/False
    if (questionType === 'TRUE_FALSE') {
      return (
        <div className="grid grid-cols-2 gap-4">
          {['true', 'false'].map((value) => {
            const isSelected = currentResponse?.selectedAnswer === value;
            return (
              <button
                key={value}
                onClick={() => handleSingleAnswer(value)}
                className={`p-6 rounded-lg border-2 transition-all text-center font-semibold text-lg ${
                  isSelected
                    ? value === 'true'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {value === 'true' ? 'TRUE' : 'FALSE'}
              </button>
            );
          })}
        </div>
      );
    }

    // Integer Type
    if (questionType === 'INTEGER_TYPE') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-orange-600 font-medium">
            Enter your numerical answer (integer value only)
          </p>
          <input
            type="number"
            value={(currentResponse?.selectedAnswer as string) || ''}
            onChange={(e) => handleTextAnswer(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-4 text-xl font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
      );
    }

    // Fill in the blank
    if (questionType === 'FILL_BLANK') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-blue-600 font-medium">
            Type your answer in the box below
          </p>
          <input
            type="text"
            value={(currentResponse?.selectedAnswer as string) || ''}
            onChange={(e) => handleTextAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
      );
    }

    // Short/Long Answer
    if (questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER') {
      return (
        <div className="space-y-4">
          <textarea
            value={(currentResponse?.selectedAnswer as string) || ''}
            onChange={(e) => handleTextAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows={questionType === 'LONG_ANSWER' ? 6 : 3}
            className="w-full p-4 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
          />
        </div>
      );
    }

    // Assertion Reasoning
    if (questionType === 'ASSERTION_REASONING') {
      const arOptions = [
        { id: 'a', text: 'Both Assertion and Reason are true, and Reason is the correct explanation' },
        { id: 'b', text: 'Both Assertion and Reason are true, but Reason is NOT the correct explanation' },
        { id: 'c', text: 'Assertion is true but Reason is false' },
        { id: 'd', text: 'Assertion is false but Reason is true' },
        { id: 'e', text: 'Both Assertion and Reason are false' },
      ];

      return (
        <div className="space-y-4">
          {options && options.length >= 2 && (
            <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="font-semibold text-blue-700">Assertion (A): </span>
                <span>{options[0]?.text}</span>
              </div>
              <div>
                <span className="font-semibold text-green-700">Reason (R): </span>
                <span>{options[1]?.text}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(options && options.length > 2 ? options.slice(2) : arOptions).map((option) => {
              const isSelected = currentResponse?.selectedAnswer === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSingleAnswer(option.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.id.toUpperCase()}
                    </span>
                    <span className="text-sm">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Default fallback - show options if available
    if (options && options.length > 0) {
      return (
        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = currentResponse?.selectedAnswer === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSingleAnswer(option.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.id.toUpperCase()}
                  </span>
                  <span>{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // No options - show text input
    return (
      <textarea
        value={(currentResponse?.selectedAnswer as string) || ''}
        onChange={(e) => handleTextAnswer(e.target.value)}
        placeholder="Write your answer here..."
        rows={4}
        className="w-full p-4 text-base border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading test...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Cannot Start Test</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show result screen
  if (result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className={`rounded-xl border-2 p-8 text-center ${
          result.passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          {result.passed ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-700 mb-2">Congratulations!</h1>
              <p className="text-green-600 text-lg mb-6">You passed Day {dayNumber} test!</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-red-700 mb-2">Test Not Passed</h1>
              <p className="text-red-600 text-lg mb-6">Don't worry, you can try again!</p>
            </>
          )}

          {/* Score Display */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Your Score</p>
                <p className={`text-4xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.percentage}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Required</p>
                <p className="text-4xl font-bold text-gray-700">{result.passingPercent}%</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Correct answers: <span className="font-semibold">{result.correctAnswers}</span> / {result.totalQuestions}
              </p>
            </div>
          </div>

          {/* Actions */}
          {result.passed ? (
            <div className="space-y-3">
              {result.nextDayUnlocked && (
                <div className="p-4 bg-green-100 rounded-lg mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Day {dayNumber + 1} is now unlocked!</p>
                </div>
              )}
              <button
                onClick={() => router.push(`/study-planner/plan/${planId}`)}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
              >
                Continue to Study Plan
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {result.cooldownEndsAt && (
                <div className="p-4 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-700 font-medium">
                    Retry available in: {getTimeUntilRetry(result.cooldownEndsAt)}
                  </p>
                  {result.newPassRequirement && (
                    <p className="text-yellow-600 text-sm mt-2">
                      Next attempt requires: {result.newPassRequirement}% to pass
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/study-planner/plan/${planId}/day/${dayId}`)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Review Content
                </button>
                <button
                  onClick={() => router.push(`/study-planner/plan/${planId}`)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Back to Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Day {dayNumber} Test</h1>
            <p className="text-sm text-gray-600">
              Pass with {passingPercent}% to unlock the next day
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 120 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-semibold text-green-600">{answeredCount}</span>
              <span> / {questions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 text-white'
                  : isAnswered(responses[index])
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={getQuestionTypeLabel(q.questionType)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <span className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-semibold">
              {currentIndex + 1}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  {getQuestionTypeLabel(currentQuestion.questionType)}
                </span>
                {currentQuestion.marks && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {currentQuestion.marks} marks
                  </span>
                )}
              </div>
              {currentQuestion.questionHtml ? (
                <div
                  className="text-lg text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.questionHtml }}
                />
              ) : (
                <p className="text-lg text-gray-900 whitespace-pre-wrap">{currentQuestion.questionText}</p>
              )}
            </div>
          </div>

          <div className="ml-14">
            {renderQuestionInput()}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </button>

        <div className="flex gap-3">
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Submit Test
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Warning for unanswered questions */}
      {answeredCount < questions.length && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            <span>
              You have {questions.length - answeredCount} unanswered question(s).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
