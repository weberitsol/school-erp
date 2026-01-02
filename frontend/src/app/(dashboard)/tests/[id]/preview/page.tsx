'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileQuestion,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  RefreshCw,
  Sparkles,
  Upload,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Wand2,
  FileSpreadsheet,
  Replace,
  Brain,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { testsApi, Question, QuestionType, DifficultyLevel } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RichText, RichTextBlock } from '@/components/ui/rich-text';

interface TestQuestion {
  id: string;
  testId: string;
  questionId: string;
  sequenceOrder: number;
  marks: number;
  question: Question & {
    difficulty?: DifficultyLevel;
    subTopic?: string;
    topic?: string;
    chapter?: string;
    passageId?: string;
    passage?: { id: string; title: string; content: string };
  };
}

interface SectionConfig {
  name: string;
  subject: string;
  startQuestion: number;
  endQuestion: number;
  questionType: string;
  marksPerQuestion: number;
  negativeMarks: number;
}

interface TestWithQuestions {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  subject?: { id: string; name: string };
  subjectId: string;
  class?: { id: string; name: string };
  classId: string;
  section?: { id: string; name: string };
  sectionId?: string;
  totalMarks: number;
  passingMarks: number;
  duration?: number;
  durationMinutes?: number;
  startDateTime?: string;
  endDateTime?: string;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  showAnswers?: boolean;
  allowReview?: boolean;
  status?: string;
  testType?: string;
  questionCount?: number;
  questions?: TestQuestion[];
  sectionConfig?: SectionConfig[];
  pattern?: { id: string; name: string; type: string };
}

const difficultyOptions: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const questionTypeLabels: Record<string, string> = {
  'SINGLE_CORRECT': 'Single Correct',
  'MULTIPLE_CORRECT': 'Multiple Correct',
  'MCQ': 'MCQ',
  'TRUE_FALSE': 'True/False',
  'INTEGER_TYPE': 'Integer Type',
  'NUMERICAL': 'Numerical',
  'MATRIX_MATCH': 'Matrix Match',
  'COMPREHENSION': 'Comprehension',
  'ASSERTION_REASONING': 'Assertion Reasoning',
  'FILL_BLANK': 'Fill in Blank',
  'SHORT_ANSWER': 'Short Answer',
  'LONG_ANSWER': 'Long Answer',
};

export default function TestPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [test, setTest] = useState<TestWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isStudentView, setIsStudentView] = useState(false);

  // Editing states
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedDifficulty, setEditedDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [editedSubTopic, setEditedSubTopic] = useState('');

  // AI states
  const [isVerifyingAnswers, setIsVerifyingAnswers] = useState(false);
  const [isGeneratingExplanations, setIsGeneratingExplanations] = useState(false);
  const [aiVerificationResults, setAiVerificationResults] = useState<Record<string, { correct: boolean; suggestion?: string }>>({});

  // Replace question states
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replacingQuestion, setReplacingQuestion] = useState<TestQuestion | null>(null);
  const [alternativeQuestions, setAlternativeQuestions] = useState<Question[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (accessToken && testId) {
      fetchTestDetails();
    }
  }, [accessToken, testId]);

  const fetchTestDetails = async () => {
    setIsLoading(true);
    try {
      const response = await testsApi.getById(testId, accessToken!);

      if (response.success && response.data) {
        setTest(response.data as TestWithQuestions);
        // Expand all questions by default
        const allQuestionIds = new Set<string>((response.data as any).questions?.map((q: TestQuestion) => q.id) || []);
        setExpandedQuestions(allQuestionIds);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load test details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (id: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set(test?.questions?.map(q => q.id) || []);
    setExpandedQuestions(allIds);
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  const handleEditQuestion = (question: TestQuestion) => {
    setEditingQuestion(question.id);
    setEditedDifficulty(question.question.difficulty || 'MEDIUM');
    setEditedSubTopic(question.question.topic || question.question.subTopic || '');
  };

  const handleSaveEdit = async (questionId: string) => {
    try {
      // Call API to update question
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          difficulty: editedDifficulty,
          topic: editedSubTopic, // Backend uses 'topic' field
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Question updated successfully' });
        fetchTestDetails(); // Refresh
      } else {
        toast({ title: 'Error', description: 'Failed to update question', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update question', variant: 'destructive' });
    }
    setEditingQuestion(null);
  };

  const handleRemoveQuestion = async (testQuestionId: string) => {
    if (!confirm('Are you sure you want to remove this question from the test?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/${testId}/questions/${testQuestionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Question removed from test' });
        fetchTestDetails();
      } else {
        toast({ title: 'Error', description: 'Failed to remove question', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove question', variant: 'destructive' });
    }
  };

  const handleReplaceQuestion = async (testQuestion: TestQuestion) => {
    setReplacingQuestion(testQuestion);
    setShowReplaceModal(true);
    setIsLoadingAlternatives(true);

    try {
      // Fetch alternative questions from AI or question bank
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/questions/alternatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          questionId: testQuestion.questionId,
          subjectId: test?.subjectId,
          classId: test?.classId,
          questionType: testQuestion.question.questionType,
          difficulty: testQuestion.question.difficulty,
          excludeIds: test?.questions?.map(q => q.questionId) || [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlternativeQuestions(data.data || []);
      } else {
        toast({ title: 'Info', description: 'No alternative questions found' });
        setAlternativeQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching alternatives:', error);
      setAlternativeQuestions([]);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const confirmReplaceQuestion = async (newQuestionId: string) => {
    if (!replacingQuestion) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/${testId}/questions/${replacingQuestion.id}/replace`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newQuestionId }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Question replaced successfully' });
        setShowReplaceModal(false);
        setReplacingQuestion(null);
        fetchTestDetails();
      } else {
        toast({ title: 'Error', description: 'Failed to replace question', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to replace question', variant: 'destructive' });
    }
  };

  const handleVerifyAllAnswers = async () => {
    setIsVerifyingAnswers(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/${testId}/verify-answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAiVerificationResults(data.data || {});
        toast({ title: 'Verification Complete', description: 'AI has verified all answers' });
      } else {
        toast({ title: 'Error', description: 'Failed to verify answers', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to verify answers', variant: 'destructive' });
    } finally {
      setIsVerifyingAnswers(false);
    }
  };

  const handleGenerateExplanations = async () => {
    setIsGeneratingExplanations(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/${testId}/generate-explanations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'AI explanations generated for all questions' });
        fetchTestDetails(); // Refresh to show new explanations
      } else {
        toast({ title: 'Error', description: 'Failed to generate explanations', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate explanations', variant: 'destructive' });
    } finally {
      setIsGeneratingExplanations(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/${testId}/upload-updates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Questions updated from Excel file' });
        fetchTestDetails();
      } else {
        toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    // Download Excel template for question updates
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/${testId}/export-template`, '_blank');
  };

  const getSectionForQuestion = (index: number): SectionConfig | null => {
    if (!test?.sectionConfig) return null;
    return test.sectionConfig.find(s => index + 1 >= s.startQuestion && index + 1 <= s.endQuestion) || null;
  };

  const groupQuestionsBySection = () => {
    if (!test?.questions) return [];

    // Sort questions by sequence order and show in one continuous list
    const sortedQuestions = [...test.questions].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    // If we have section config, use it for section headers
    if (test.sectionConfig && test.sectionConfig.length > 0) {
      return test.sectionConfig.map(section => ({
        section: `${section.subject} - ${section.name} (Q${section.startQuestion}-${section.endQuestion})`,
        questions: sortedQuestions.filter(q =>
          q.sequenceOrder >= section.startQuestion && q.sequenceOrder <= section.endQuestion
        ),
      }));
    }

    // No section config - show all questions in one sequential list
    return [{
      section: 'All Questions',
      questions: sortedQuestions,
    }];
  };

  const getDifficultyBadge = (difficulty?: DifficultyLevel) => {
    const option = difficultyOptions.find(d => d.value === difficulty) || difficultyOptions[1];
    return (
      <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', option.color)}>
        {option.label}
      </span>
    );
  };

  const getQuestionTypeBadge = (type: string) => {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        {questionTypeLabels[type] || type}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading test preview...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Test not found</h3>
          <Link href="/tests" className="text-purple-600 hover:text-purple-700">Back to Tests</Link>
        </div>
      </div>
    );
  }

  const sections = groupQuestionsBySection();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/tests"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStudentView(!isStudentView)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2 transition-all',
              isStudentView
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            )}
          >
            <GraduationCap className="h-4 w-4" />
            {isStudentView ? 'Student View' : 'Teacher View'}
          </button>
        </div>
      </div>

      {/* Test Info Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="h-5 w-5 text-purple-200" />
            <span className="text-sm font-medium text-purple-200">
              {test.subject?.name || 'General'} • {test.class?.name || 'All Classes'}
              {test.pattern && ` • ${test.pattern.name}`}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">{test.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-purple-100 text-sm">
            <div className="flex items-center gap-1">
              <FileQuestion className="h-4 w-4" />
              {test.questions?.length || 0} Questions
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {test.totalMarks} Marks
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {(test as any).durationMinutes || test.duration} Minutes
            </div>
          </div>
        </div>
      </div>

      {/* Section Summary */}
      {sections.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            Test Structure
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{section.section}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {section.questions.length} questions
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isStudentView && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2 transition-all',
                showAnswers
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              )}
            >
              {showAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>

            <button onClick={expandAll} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Expand All
            </button>

            <button onClick={collapseAll} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Collapse All
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            <button
              onClick={handleVerifyAllAnswers}
              disabled={isVerifyingAnswers}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
            >
              {isVerifyingAnswers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Verify Answers with AI
            </button>

            <button
              onClick={handleGenerateExplanations}
              disabled={isGeneratingExplanations}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {isGeneratingExplanations ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate AI Explanations
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Upload Excel
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Template
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-4">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
              <h3 className="font-semibold text-purple-900 dark:text-purple-200">
                {section.section}
              </h3>
            </div>

            {/* Questions in Section */}
            {section.questions.map((tq, qIdx) => {
              const q = tq.question;
              const globalIndex = test.questions!.indexOf(tq);
              const isExpanded = expandedQuestions.has(tq.id);
              const isEditing = editingQuestion === tq.id;
              const verificationResult = aiVerificationResults[q.id];

              return (
                <div
                  key={tq.id}
                  className={cn(
                    'bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border overflow-hidden transition-all',
                    verificationResult?.correct === false
                      ? 'border-red-300 dark:border-red-700'
                      : verificationResult?.correct === true
                      ? 'border-green-300 dark:border-green-700'
                      : 'border-gray-100 dark:border-gray-700/50'
                  )}
                >
                  {/* Question Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    onClick={() => toggleQuestion(tq.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {globalIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {getQuestionTypeBadge(q.questionType)}
                            {getDifficultyBadge(q.difficulty as DifficultyLevel)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {tq.marks} marks
                            </span>
                            {(q.topic || q.subTopic) && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                {q.topic || q.subTopic}
                              </span>
                            )}
                            {verificationResult && (
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                                verificationResult.correct
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}>
                                {verificationResult.correct ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                {verificationResult.correct ? 'AI Verified' : 'Check Required'}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-900 dark:text-white">
                            <RichText text={q.questionText || 'Question text not available'} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isStudentView && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditQuestion(tq); }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit Question"
                            >
                              <Edit3 className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReplaceQuestion(tq); }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Replace Question"
                            >
                              <Replace className="h-4 w-4 text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(tq.id); }}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove Question"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </>
                        )}
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700/50 p-4 space-y-4">
                      {/* Edit Form */}
                      {isEditing && !isStudentView && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                              <select
                                value={editedDifficulty}
                                onChange={(e) => setEditedDifficulty(e.target.value as DifficultyLevel)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                              >
                                {difficultyOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sub Topic</label>
                              <input
                                type="text"
                                value={editedSubTopic}
                                onChange={(e) => setEditedSubTopic(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                placeholder="Enter sub topic"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingQuestion(null)}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(q.id)}
                              className="px-3 py-1.5 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-1"
                            >
                              <Save className="h-3 w-3" /> Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Question HTML if available */}
                      {(q as any).questionHtml && (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: (q as any).questionHtml }}
                        />
                      )}

                      {/* Options for MCQ type questions */}
                      {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</p>
                          <div className="grid gap-2">
                            {q.options.map((option: any, optIdx: number) => {
                              const optionId = typeof option === 'string' ? String.fromCharCode(97 + optIdx) : (option.id || String.fromCharCode(97 + optIdx));
                              const optionText = typeof option === 'string' ? option : option.text || option.label || '';
                              const optionLetter = optionId.toUpperCase();

                              // Check if this option is correct (match by id: a, b, c, d)
                              const correctAnswerLower = q.correctAnswer?.toLowerCase?.() || '';
                              const correctAnswersLower = (q.correctAnswers || []).map((a: string) => a.toLowerCase());
                              const isCorrect = showAnswers && !isStudentView && (
                                correctAnswerLower === optionId.toLowerCase() ||
                                correctAnswersLower.includes(optionId.toLowerCase())
                              );

                              return (
                                <div
                                  key={optIdx}
                                  className={cn(
                                    'flex items-start gap-3 p-3 rounded-lg border transition-all',
                                    isCorrect
                                      ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
                                      : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                                  )}
                                >
                                  <span className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                    isCorrect
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                  )}>
                                    {optionLetter}
                                  </span>
                                  <span className={cn(
                                    'text-sm flex-1',
                                    isCorrect ? 'text-green-800 dark:text-green-200 font-medium' : 'text-gray-700 dark:text-gray-300'
                                  )}>
                                    <RichText text={optionText} />
                                  </span>
                                  {isCorrect && (
                                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Correct Answer for Integer/Numerical type questions (no options) */}
                      {showAnswers && !isStudentView && (q.questionType === 'INTEGER_TYPE' || q.questionType === 'NUMERICAL' || (!q.options || q.options.length === 0)) && q.correctAnswer && (
                        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-400 dark:border-green-600">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                              Correct Answer: <span className="text-lg">{typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : q.correctAnswer}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Solution display for teachers/admins */}
                      {showAnswers && !isStudentView && (q as any).solution && (q as any).solution !== ':' && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-300 dark:border-amber-700">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Solution:</p>
                              <div className="text-sm text-amber-700 dark:text-amber-300 solution-content">
                                <RichTextBlock
                                  text={(q as any).solution}
                                  imageClassName="max-h-48 w-auto my-2 rounded border border-amber-200"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {showAnswers && !isStudentView && (q as any).answerExplanation && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Explanation</p>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-300">{(q as any).answerExplanation}</p>
                        </div>
                      )}

                      {/* AI Verification Suggestion */}
                      {verificationResult && verificationResult.suggestion && !isStudentView && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">AI Suggestion</p>
                          </div>
                          <p className="text-sm text-amber-800 dark:text-amber-300">{verificationResult.suggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Replace Question Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Replace className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Replace Question</h3>
              </div>
              <button
                onClick={() => { setShowReplaceModal(false); setReplacingQuestion(null); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Current Question */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Question:</p>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="text-sm text-gray-900 dark:text-white">
                    <RichText text={replacingQuestion?.question.questionText || ''} />
                  </div>
                </div>
              </div>

              {/* Alternative Questions */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isLoadingAlternatives ? 'Finding alternatives...' : 'Alternative Questions:'}
                </p>

                {isLoadingAlternatives ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : alternativeQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {alternativeQuestions.map((altQ) => (
                      <div
                        key={altQ.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                        onClick={() => confirmReplaceQuestion(altQ.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getQuestionTypeBadge(altQ.questionType)}
                              {getDifficultyBadge(altQ.difficulty)}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              <RichText text={altQ.questionText} />
                            </div>
                          </div>
                          <button className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No alternative questions found</p>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center gap-2 mx-auto"
                    >
                      <Wand2 className="h-4 w-4" />
                      Generate with AI
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
