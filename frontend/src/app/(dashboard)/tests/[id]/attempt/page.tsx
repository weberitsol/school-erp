'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertTriangle,
  CheckCircle,
  Circle,
  Loader2,
  X,
  Save,
  Check,
  Square,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { testsApi, TestAttempt, TestResponse, QuestionType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RichText } from '@/components/ui/rich-text';

interface QuestionOption {
  id: string;
  text: string;
}

interface LocalResponse {
  testQuestionId: string;
  selectedOptions: string[];
  responseText: string;
  flaggedForReview: boolean;
  timeSpentSeconds: number;
}

export default function TestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params.id as string;
  const attemptId = searchParams.get('attemptId');
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localResponses, setLocalResponses] = useState<Map<string, LocalResponse>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const questionStartTime = useRef<number>(Date.now());
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch attempt data
  useEffect(() => {
    if (accessToken && attemptId) {
      fetchAttempt();
    } else if (!attemptId) {
      router.push(`/tests/${testId}`);
    }

    return () => {
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [accessToken, attemptId]);

  const fetchAttempt = async () => {
    setIsLoading(true);
    try {
      const response = await testsApi.getAttempt(attemptId!, accessToken!);

      if (response.success && response.data) {
        const attemptData = response.data;

        if (attemptData.status !== 'IN_PROGRESS') {
          router.push(`/tests/${testId}/results?attemptId=${attemptId}`);
          return;
        }

        setAttempt(attemptData);

        // Initialize local responses from existing responses
        const responses = new Map<string, LocalResponse>();
        attemptData.responses?.forEach((r: TestResponse) => {
          responses.set(r.testQuestionId, {
            testQuestionId: r.testQuestionId,
            selectedOptions: r.selectedOptions || [],
            responseText: r.responseText || '',
            flaggedForReview: r.flaggedForReview || false,
            timeSpentSeconds: r.timeSpentSeconds || 0,
          });
        });
        setLocalResponses(responses);

        // Calculate time remaining
        if (attemptData.test?.durationMinutes) {
          const startTime = new Date(attemptData.startedAt).getTime();
          const durationMs = attemptData.test.durationMinutes * 60 * 1000;
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
          setTimeRemaining(remaining);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load test attempt',
          variant: 'destructive',
        });
        router.push(`/tests/${testId}`);
      }
    } catch (error) {
      console.error('Error fetching attempt:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test attempt',
        variant: 'destructive',
      });
      router.push(`/tests/${testId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      timerInterval.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerInterval.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerInterval.current) clearInterval(timerInterval.current);
      };
    }
  }, [timeRemaining !== null]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveInterval.current = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => {
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
    };
  }, [localResponses]);

  const handleAutoSubmit = useCallback(async () => {
    toast({
      title: 'Time\'s up!',
      description: 'Your test is being submitted automatically.',
    });
    await handleSubmit();
  }, [localResponses]);

  const handleAutoSave = async () => {
    if (!accessToken || !attemptId || isSaving || localResponses.size === 0) return;

    setIsSaving(true);
    try {
      const currentResponse = getCurrentResponse();
      if (currentResponse && currentResponse.selectedOptions.length > 0) {
        await testsApi.saveResponse({
          attemptId: attemptId,
          questionId: currentResponse.testQuestionId,
          selectedAnswer: currentResponse.selectedOptions,
          textAnswer: currentResponse.responseText || undefined,
        }, accessToken);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentQuestion = () => {
    if (!attempt?.responses) return null;
    return attempt.responses[currentQuestionIndex];
  };

  const getCurrentResponse = (): LocalResponse | undefined => {
    const question = getCurrentQuestion();
    if (!question) return undefined;
    return localResponses.get(question.testQuestionId);
  };

  const updateResponse = (updates: Partial<LocalResponse>) => {
    const question = getCurrentQuestion();
    if (!question) return;

    setLocalResponses((prev) => {
      const newResponses = new Map(prev);
      const current = newResponses.get(question.testQuestionId) || {
        testQuestionId: question.testQuestionId,
        selectedOptions: [],
        responseText: '',
        flaggedForReview: false,
        timeSpentSeconds: 0,
      };
      newResponses.set(question.testQuestionId, { ...current, ...updates });
      return newResponses;
    });
  };

  const handleOptionSelect = (optionId: string) => {
    const question = getCurrentQuestion();
    if (!question?.testQuestion?.question) return;

    const questionType = question.testQuestion.question.questionType;
    const currentResponse = getCurrentResponse();

    // Single select question types
    if (questionType === 'MCQ' || questionType === 'SINGLE_CORRECT' || questionType === 'COMPREHENSION' || questionType === 'TRUE_FALSE') {
      updateResponse({ selectedOptions: [optionId] });
    } else {
      // Multi-select (for MULTIPLE_CORRECT, matching or other types)
      const currentOptions = currentResponse?.selectedOptions || [];
      const newOptions = currentOptions.includes(optionId)
        ? currentOptions.filter((o) => o !== optionId)
        : [...currentOptions, optionId];
      updateResponse({ selectedOptions: newOptions });
    }
  };

  const handleTextResponse = (text: string) => {
    updateResponse({ responseText: text });
  };

  const toggleFlag = () => {
    const currentResponse = getCurrentResponse();
    updateResponse({ flaggedForReview: !currentResponse?.flaggedForReview });
  };

  const navigateToQuestion = (index: number) => {
    // Update time spent on current question
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const currentResponse = getCurrentResponse();
    if (currentResponse) {
      updateResponse({ timeSpentSeconds: (currentResponse.timeSpentSeconds || 0) + timeSpent });
    }

    setCurrentQuestionIndex(index);
    questionStartTime.current = Date.now();
  };

  const handleSubmit = async () => {
    if (!accessToken || !attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Prepare responses
      const responses = Array.from(localResponses.values()).map((r) => ({
        testQuestionId: r.testQuestionId,
        selectedOptions: r.selectedOptions.length > 0 ? r.selectedOptions : undefined,
        responseText: r.responseText || undefined,
        timeSpentSeconds: r.timeSpentSeconds,
      }));

      const response = await testsApi.submitTest({
        attemptId,
        responses,
      }, accessToken);

      if (response.success) {
        toast({
          title: 'Test Submitted!',
          description: 'Your test has been submitted successfully.',
        });
        router.push(`/tests/${testId}/results?attemptId=${attemptId}`);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to submit test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit test',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number): 'answered' | 'flagged' | 'current' | 'unanswered' => {
    const response = attempt?.responses?.[index];
    if (!response) return 'unanswered';

    const localResponse = localResponses.get(response.testQuestionId);

    if (index === currentQuestionIndex) return 'current';
    if (localResponse?.flaggedForReview) return 'flagged';
    if (localResponse?.selectedOptions.length || localResponse?.responseText) return 'answered';
    return 'unanswered';
  };

  const getStats = () => {
    if (!attempt?.responses) return { answered: 0, flagged: 0, unanswered: 0, total: 0 };

    let answered = 0;
    let flagged = 0;

    attempt.responses.forEach((r: TestResponse) => {
      const local = localResponses.get(r.testQuestionId);
      if (local?.selectedOptions.length || local?.responseText) answered++;
      if (local?.flaggedForReview) flagged++;
    });

    return {
      answered,
      flagged,
      unanswered: attempt.responses.length - answered,
      total: attempt.responses.length,
    };
  };

  const renderQuestionContent = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion?.testQuestion?.question) return null;

    const question = currentQuestion.testQuestion.question;
    const currentResponse = getCurrentResponse();
    const isMultipleCorrect = question.questionType === 'MULTIPLE_CORRECT';
    const isMatrixMatch = question.questionType === 'MATRIX_MATCH';

    // Debug log to see what options are being received
    console.log('Question data:', {
      questionNumber: currentQuestionIndex + 1,
      questionType: question.questionType,
      options: question.options,
      optionsType: typeof question.options,
      isArray: Array.isArray(question.options),
      optionsLength: Array.isArray(question.options) ? question.options.length : 'N/A',
      matrixColumns: question.matrixColumns,
    });

    // Handle different option formats - normalize to QuestionOption[]
    let options: QuestionOption[] = [];
    if (Array.isArray(question.options)) {
      options = question.options.map((opt: any, idx: number) => {
        // If option is already an object with id and text
        if (opt && typeof opt === 'object' && 'id' in opt && 'text' in opt) {
          return { id: String(opt.id), text: String(opt.text) };
        }
        // If option is an object with just text (like {text: "..."})
        if (opt && typeof opt === 'object' && 'text' in opt) {
          return { id: String.fromCharCode(97 + idx), text: String(opt.text) }; // a, b, c, d...
        }
        // If option is a string or number, create proper object
        const optionId = String.fromCharCode(97 + idx); // a, b, c, d...
        return { id: optionId, text: String(opt) };
      });
    } else if (question.options && typeof question.options === 'object') {
      // Handle if options is an object with values (keyed object)
      const values = Object.entries(question.options);
      options = values.map(([key, val]: [string, any], idx: number) => {
        if (val && typeof val === 'object' && 'text' in val) {
          return { id: key || String.fromCharCode(97 + idx), text: String(val.text) };
        }
        return { id: key || String.fromCharCode(97 + idx), text: String(val) };
      });
    }

    console.log('Normalized options:', options);

    // For matrix match, parse column A and column B
    let matrixColumnA: { id: string; text: string }[] = [];
    let matrixColumnB: { id: string; text: string }[] = [];
    if (isMatrixMatch && question.matrixColumns) {
      matrixColumnA = question.matrixColumns.columnA || [];
      matrixColumnB = question.matrixColumns.columnB || [];
    }

    return (
      <div className="space-y-6">
        {/* Question Text */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {question.questionHtml ? (
            <div dangerouslySetInnerHTML={{ __html: question.questionHtml }} />
          ) : (
            <div className="text-gray-900 dark:text-white text-lg leading-relaxed">
              <RichText text={question.questionText} />
            </div>
          )}
        </div>

        {/* Multi-select hint for MULTIPLE_CORRECT */}
        {isMultipleCorrect && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <CheckSquare className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              This question has multiple correct answers. Select all that apply.
            </span>
          </div>
        )}

        {/* Question Image */}
        {question.questionImage && (
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={question.questionImage}
              alt="Question"
              className="max-w-full h-auto"
            />
          </div>
        )}

        {/* Options for MCQ / Single Correct / Multiple Correct / Comprehension / True-False */}
        {(question.questionType === 'MCQ' ||
          question.questionType === 'SINGLE_CORRECT' ||
          question.questionType === 'MULTIPLE_CORRECT' ||
          question.questionType === 'COMPREHENSION' ||
          question.questionType === 'INTEGER_TYPE' ||
          question.questionType === 'TRUE_FALSE') && options.length > 0 && (
          <div className="space-y-3">
            {options.map((option, idx) => {
              const isSelected = currentResponse?.selectedOptions.includes(option.id);
              const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D...

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  {/* Show checkbox for multiple correct, radio for single */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isMultipleCorrect ? (
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300 dark:border-gray-600'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'border-purple-500'
                            : 'border-gray-300 dark:border-gray-600'
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                      </div>
                    )}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors',
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      )}
                    >
                      {optionLabel}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'flex-1 text-sm pt-1',
                      isSelected
                        ? 'text-purple-900 dark:text-purple-100 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <RichText text={option.text} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Matrix Match - Table Display */}
        {isMatrixMatch && (matrixColumnA.length > 0 || options.length > 0) && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Column I (Items)
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Column II (Matches)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(matrixColumnA.length > 0 ? matrixColumnA : options.slice(0, Math.ceil(options.length / 2))).map((item, idx) => {
                    const matchItem = matrixColumnB[idx] || options[Math.ceil(options.length / 2) + idx];
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              <RichText text={item.text} />
                            </span>
                          </div>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                          {matchItem && (
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {idx + 1}.
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">
                                <RichText text={matchItem.text} />
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix answer input - Select matching pairs */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select the correct matching combination:
              </p>
              {options.length > 0 && (
                <div className="space-y-2">
                  {options.map((option, idx) => {
                    const isSelected = currentResponse?.selectedOptions.includes(option.id);
                    const optionLabel = String.fromCharCode(65 + idx);

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        className={cn(
                          'w-full flex items-start gap-4 p-3 rounded-lg border-2 transition-all duration-200 text-left',
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0',
                            isSelected
                              ? 'border-purple-500'
                              : 'border-gray-300 dark:border-gray-600'
                          )}
                        >
                          {isSelected && <div className="w-3 h-3 rounded-full bg-purple-500" />}
                        </div>
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            isSelected
                              ? 'text-purple-900 dark:text-purple-100 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          )}
                        >
                          <span className="font-bold">{optionLabel}.</span> <RichText text={option.text} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fill in the blank / Short Answer / Integer Type */}
        {(question.questionType === 'FILL_BLANK' ||
          question.questionType === 'SHORT_ANSWER' ||
          (question.questionType === 'INTEGER_TYPE' && options.length === 0)) && (
          <div>
            <input
              type={question.questionType === 'INTEGER_TYPE' ? 'number' : 'text'}
              value={currentResponse?.responseText || ''}
              onChange={(e) => handleTextResponse(e.target.value)}
              placeholder={question.questionType === 'INTEGER_TYPE' ? 'Enter your numerical answer...' : 'Type your answer here...'}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            />
          </div>
        )}

        {/* Long Answer */}
        {question.questionType === 'LONG_ANSWER' && (
          <div>
            <textarea
              value={currentResponse?.responseText || ''}
              onChange={(e) => handleTextResponse(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
            />
          </div>
        )}

        {/* Debug info when no options found */}
        {options.length === 0 && !isMatrixMatch &&
          question.questionType !== 'FILL_BLANK' &&
          question.questionType !== 'SHORT_ANSWER' &&
          question.questionType !== 'LONG_ANSWER' &&
          question.questionType !== 'INTEGER_TYPE' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              No options available for this question. Question type: {question.questionType}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const currentQuestion = getCurrentQuestion();
  const currentResponse = getCurrentResponse();
  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {attempt.test?.title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {attempt.responses?.length || 0}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-save indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Save className="h-3 w-3 animate-pulse" />
                Saving...
              </div>
            )}

            {/* Timer */}
            {timeRemaining !== null && (
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold',
                  timeRemaining <= 300
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                    : timeRemaining <= 600
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                )}
              >
                <Clock className="h-5 w-5" />
                {formatTime(timeRemaining)}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Submit Test
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question Navigation Sidebar */}
        <div
          className={cn(
            'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300',
            showSidebar ? 'w-72' : 'w-0'
          )}
        >
          {showSidebar && (
            <>
              {/* Stats */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {stats.answered}
                    </p>
                    <p className="text-[10px] text-green-600 dark:text-green-400">Answered</p>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {stats.flagged}
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">Flagged</p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                      {stats.unanswered}
                    </p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400">Unanswered</p>
                  </div>
                </div>
              </div>

              {/* Question Grid */}
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-5 gap-2">
                  {attempt.responses?.map((_, index) => {
                    const status = getQuestionStatus(index);
                    return (
                      <button
                        key={index}
                        onClick={() => navigateToQuestion(index)}
                        className={cn(
                          'aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all',
                          status === 'current' && 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800 bg-purple-500 text-white',
                          status === 'answered' && 'bg-green-500 text-white hover:bg-green-600',
                          status === 'flagged' && 'bg-amber-500 text-white hover:bg-amber-600',
                          status === 'unanswered' && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-600"></div>
                    <span className="text-gray-600 dark:text-gray-400">Not Answered</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          style={{ left: showSidebar ? '288px' : '0' }}
        >
          {showSidebar ? (
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {currentQuestionIndex + 1}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentQuestion?.testQuestion?.question.questionType.replace('_', ' ')}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {currentQuestion?.testQuestion?.marks} mark{Number(currentQuestion?.testQuestion?.marks) !== 1 ? 's' : ''}
                      {Number(currentQuestion?.testQuestion?.negativeMarks) > 0 && (
                        <span className="text-red-500 ml-2">
                          (-{currentQuestion?.testQuestion?.negativeMarks} for wrong)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleFlag}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    currentResponse?.flaggedForReview
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <Flag className={cn('h-4 w-4', currentResponse?.flaggedForReview && 'fill-current')} />
                  {currentResponse?.flaggedForReview ? 'Flagged' : 'Flag for Review'}
                </button>
              </div>

              {/* Question Content */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                {renderQuestionContent()}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <button
                onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  Review & Submit
                </button>
              </div>

              <button
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === (attempt.responses?.length || 1) - 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Submit Test?
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.answered}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Answered</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.flagged}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Flagged</p>
                </div>
                <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {stats.unanswered}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Unanswered</p>
                </div>
              </div>

              {stats.unanswered > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      You have {stats.unanswered} unanswered question{stats.unanswered !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Are you sure you want to submit?
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Once submitted, you cannot change your answers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Review Answers
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
