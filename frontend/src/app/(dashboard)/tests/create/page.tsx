'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Calendar,
  Settings,
  Save,
  Send,
  Brain,
  Search,
  CheckCircle,
  FileText,
  Award,
  Users,
  Sparkles,
  Target,
  X,
  Layers,
  LayoutList,
  Timer,
  Shuffle,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';
import {
  testsApi,
  questionsApi,
  subjectsApi,
  classesApi,
  patternsApi,
  chaptersApi,
  Question,
  Subject,
  Class,
  Section,
  CreateTestData,
  TestPattern,
  Chapter,
  QuestionType,
} from '@/lib/api';

export default function CreateTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { accessToken } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    subjectId: '', // Primary subject for test categorization
    classId: '',
    sectionId: '',
    patternId: '', // Selected test pattern
    totalMarks: 0,
    passingMarks: 0,
    duration: 60,
    startTime: '',
    endTime: '',
    validityExpiry: '', // Validity expiry date
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: true,
    showAnswers: false,
    allowReview: true,
    negativeMarksEnabled: false,
    defaultNegativeMarks: 0.25, // Default negative marks per wrong answer
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [patterns, setPatterns] = useState<TestPattern[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Multi-subject selection for question filtering
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('');
  const [filterChapterId, setFilterChapterId] = useState<string>('');
  const [filterQuestionType, setFilterQuestionType] = useState<QuestionType | ''>('');

  // Question types for JEE/NEET
  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'SINGLE_CORRECT', label: 'Single Correct' },
    { value: 'MULTIPLE_CORRECT', label: 'Multiple Correct' },
    { value: 'INTEGER_TYPE', label: 'Integer Type' },
    { value: 'MATRIX_MATCH', label: 'Matrix Match' },
    { value: 'ASSERTION_REASONING', label: 'Assertion Reasoning' },
    { value: 'COMPREHENSION', label: 'Comprehension' },
    { value: 'MCQ', label: 'MCQ (Legacy)' },
    { value: 'TRUE_FALSE', label: 'True/False' },
    { value: 'FILL_BLANK', label: 'Fill in the Blank' },
    { value: 'SHORT_ANSWER', label: 'Short Answer' },
    { value: 'LONG_ANSWER', label: 'Long Answer' },
  ];

  // Fetch subjects, classes, patterns on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      setIsLoading(true);
      try {
        // Fetch subjects, classes, and patterns in parallel
        const [subjectsRes, classesRes, patternsRes] = await Promise.all([
          subjectsApi.getAll(accessToken),
          classesApi.getAll(accessToken),
          patternsApi.getAll(accessToken),
        ]);

        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
        }

        if (classesRes.success && classesRes.data) {
          setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        }

        if (patternsRes.success && patternsRes.data) {
          setPatterns(Array.isArray(patternsRes.data) ? patternsRes.data : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  // Fetch chapters when subject is selected for filtering
  useEffect(() => {
    const fetchChapters = async () => {
      if (!accessToken || selectedSubjectIds.length === 0) {
        setChapters([]);
        return;
      }

      try {
        // Fetch chapters for all selected subjects
        const allChapters: Chapter[] = [];
        for (const subjectId of selectedSubjectIds) {
          const response = await chaptersApi.getBySubject(subjectId, accessToken);
          if (response.success && response.data) {
            const chaptersData = Array.isArray(response.data) ? response.data : [];
            allChapters.push(...chaptersData);
          }
        }
        setChapters(allChapters);
      } catch (error) {
        console.error('Error fetching chapters:', error);
      }
    };

    fetchChapters();
  }, [accessToken, selectedSubjectIds]);

  // Apply pattern settings when pattern is selected
  const handlePatternChange = (patternId: string) => {
    setFormData((prev) => ({ ...prev, patternId }));

    if (patternId) {
      const selectedPattern = patterns.find((p) => p.id === patternId);
      if (selectedPattern) {
        setFormData((prev) => ({
          ...prev,
          patternId,
          totalMarks: selectedPattern.totalMarks,
          duration: selectedPattern.totalDuration,
          negativeMarksEnabled: selectedPattern.scoringRules?.negativeMarkingEnabled || false,
        }));
        toast({
          title: 'Pattern Applied',
          description: `Applied ${selectedPattern.name} pattern settings`,
        });
      }
    }
  };

  // Fetch sections when class is selected
  useEffect(() => {
    const fetchSections = async () => {
      if (!accessToken || !formData.classId) {
        setSections([]);
        return;
      }

      setIsLoadingSections(true);
      try {
        const response = await classesApi.getSections(formData.classId, accessToken);
        if (response.success && response.data) {
          setSections(Array.isArray(response.data) ? response.data : []);
        } else {
          setSections([]);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
        setSections([]);
      } finally {
        setIsLoadingSections(false);
      }
    };

    fetchSections();
    // Reset section when class changes
    setFormData((prev) => ({ ...prev, sectionId: '' }));
  }, [accessToken, formData.classId]);

  // Fetch questions from selected subjects
  const fetchQuestions = async () => {
    if (!accessToken) return;

    setIsLoadingQuestions(true);
    try {
      // Build params for question filtering
      const buildParams = (subjectId?: string) => {
        const params: any = { limit: 100 };
        if (subjectId) params.subjectId = subjectId;
        if (searchQuery) params.search = searchQuery;
        if (filterQuestionType) params.questionType = filterQuestionType;
        return params;
      };

      // If multiple subjects selected, fetch from all; otherwise fetch all
      if (selectedSubjectIds.length > 0) {
        // Fetch questions from each selected subject
        const allQuestions: Question[] = [];
        for (const subjectId of selectedSubjectIds) {
          const params = buildParams(subjectId);
          const response = await questionsApi.getAll(accessToken, params);
          if (response.success && response.data) {
            const data = response.data as any;
            const questions = Array.isArray(data) ? data : (data.questions || []);
            allQuestions.push(...questions);
          }
        }
        // Apply chapter filter client-side if selected
        if (filterChapterId) {
          const chapter = chapters.find((c) => c.id === filterChapterId);
          if (chapter) {
            setAvailableQuestions(
              allQuestions.filter((q) => q.chapter === chapter.name)
            );
          } else {
            setAvailableQuestions(allQuestions);
          }
        } else {
          setAvailableQuestions(allQuestions);
        }
      } else {
        // Fetch all questions if no subject filter
        const params = buildParams(filterSubjectId || undefined);
        const response = await questionsApi.getAll(accessToken, params);
        if (response.success && response.data) {
          const data = response.data as any;
          const questions = Array.isArray(data) ? data : (data.questions || []);
          setAvailableQuestions(questions);
        } else {
          setAvailableQuestions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setAvailableQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Toggle subject selection
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  useEffect(() => {
    if (showQuestionPicker) {
      fetchQuestions();
    }
  }, [showQuestionPicker, selectedSubjectIds, filterSubjectId, filterChapterId, filterQuestionType]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCheckboxChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev],
    }));
  };

  const addQuestion = (question: Question) => {
    if (!selectedQuestions.find((q) => q.id === question.id)) {
      setSelectedQuestions((prev) => [...prev, question]);
      setFormData((prev) => ({
        ...prev,
        totalMarks: prev.totalMarks + question.marks,
      }));
    }
  };

  const removeQuestion = (questionId: string) => {
    const question = selectedQuestions.find((q) => q.id === questionId);
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId));
    if (question) {
      setFormData((prev) => ({
        ...prev,
        totalMarks: prev.totalMarks - question.marks,
      }));
    }
  };

  const handleSave = async (publish = false) => {
    if (!accessToken) return;

    if (!formData.title || !formData.subjectId || !formData.classId) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (selectedQuestions.length === 0) {
      toast({
        title: 'No questions',
        description: 'Please add at least one question to the test',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const testData: CreateTestData = {
        title: formData.title,
        description: formData.description || undefined,
        instructions: formData.instructions || undefined,
        subjectId: formData.subjectId,
        classId: formData.classId,
        sectionId: formData.sectionId || undefined,
        totalMarks: formData.totalMarks,
        passingMarks: formData.passingMarks,
        duration: Number(formData.duration),
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        maxAttempts: Number(formData.maxAttempts),
        shuffleQuestions: formData.shuffleQuestions,
        shuffleOptions: formData.shuffleOptions,
        showResults: formData.showResults,
        showAnswers: formData.showAnswers,
        allowReview: formData.allowReview,
        questionIds: selectedQuestions.map((q) => q.id),
      };

      const response = await testsApi.create(testData, accessToken);

      if (response.success && response.data) {
        // If publish flag is set, publish the test immediately
        if (publish) {
          await testsApi.publish(response.data.id, accessToken);
        }

        toast({
          title: publish ? 'Test published!' : 'Test saved!',
          description: publish
            ? 'Your test is now available for students'
            : 'Your test has been saved as draft',
        });

        router.push('/tests');
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: 'Error',
        description: 'Failed to save test',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = availableQuestions.filter(
    (q) =>
      !selectedQuestions.find((sq) => sq.id === q.id) &&
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-gradient-to-r from-emerald-500 to-green-400 text-white';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white';
      case 'HARD':
        return 'bg-gradient-to-r from-rose-500 to-red-400 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const settingsConfig = [
    { key: 'shuffleQuestions', label: 'Shuffle questions', icon: Shuffle, description: 'Randomize question order for each student' },
    { key: 'shuffleOptions', label: 'Shuffle options', icon: Layers, description: 'Randomize answer options for MCQs' },
    { key: 'showResults', label: 'Show results', icon: Eye, description: 'Display score after submission' },
    { key: 'showAnswers', label: 'Show answers', icon: CheckCircle, description: 'Reveal correct answers after test' },
    { key: 'allowReview', label: 'Allow review', icon: RotateCcw, description: 'Let students review their answers' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/tests"
              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors border border-white/10"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 text-xs font-semibold bg-white/20 backdrop-blur-sm text-white rounded-full">
                  Test Builder
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Create New Test
              </h1>
              <p className="text-purple-100">
                Configure settings and add questions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="group px-4 py-2.5 text-sm font-medium text-purple-600 bg-white rounded-xl hover:bg-purple-50 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
              )}
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="group px-4 py-2.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              )}
              Publish Test
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg shadow-violet-500/25">
              <LayoutList className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedQuestions.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shadow-emerald-500/25">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formData.totalMarks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Marks</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
              <Timer className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formData.duration}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Minutes</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg shadow-amber-500/25">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formData.passingMarks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pass Marks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg shadow-violet-500/25">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Unit Test - Trigonometry"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Section <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <select
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleChange}
                    disabled={!formData.classId || isLoadingSections}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s._count?.students ? `(${s._count.students} students)` : ''}
                      </option>
                    ))}
                  </select>
                  {isLoadingSections && (
                    <p className="text-xs text-gray-400 mt-1">Loading sections...</p>
                  )}
                </div>
              </div>

              {/* Test Pattern Selection */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                    Test Pattern
                  </label>
                  <span className="text-xs text-indigo-500 dark:text-indigo-400">(JEE/NEET/Custom)</span>
                </div>
                <select
                  value={formData.patternId}
                  onChange={(e) => handlePatternChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">Custom (No Pattern)</option>
                  {patterns.filter(p => p.isDefault).length > 0 && (
                    <optgroup label="Default Patterns">
                      {patterns.filter(p => p.isDefault).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.totalMarks} marks, {p.totalDuration} min)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {patterns.filter(p => !p.isDefault).length > 0 && (
                    <optgroup label="Custom Patterns">
                      {patterns.filter(p => !p.isDefault).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.totalMarks} marks, {p.totalDuration} min)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {formData.patternId && patterns.find(p => p.id === formData.patternId) && (
                  <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2">Pattern Details:</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded">
                        <p className="font-bold text-indigo-900 dark:text-indigo-200">{patterns.find(p => p.id === formData.patternId)?.totalQuestions}</p>
                        <p className="text-indigo-600 dark:text-indigo-400">Questions</p>
                      </div>
                      <div className="text-center p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded">
                        <p className="font-bold text-indigo-900 dark:text-indigo-200">{patterns.find(p => p.id === formData.patternId)?.totalMarks}</p>
                        <p className="text-indigo-600 dark:text-indigo-400">Marks</p>
                      </div>
                      <div className="text-center p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded">
                        <p className="font-bold text-indigo-900 dark:text-indigo-200">{patterns.find(p => p.id === formData.patternId)?.totalDuration}</p>
                        <p className="text-indigo-600 dark:text-indigo-400">Minutes</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brief description of the test..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Instructions for students taking the test..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 shadow-lg shadow-indigo-500/25">
                  <LayoutList className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Questions
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedQuestions.length} questions | {formData.totalMarks} marks total
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQuestionPicker(true)}
                  className="group px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 flex items-center gap-2 border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                  Add from Bank
                </button>
                <Link
                  href="/document-ai/upload"
                  className="group px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <Brain className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Extract with AI
                </Link>
              </div>
            </div>

            {selectedQuestions.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {selectedQuestions.map((question, index) => (
                  <div key={question.id} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center gap-3 text-gray-400">
                      <GripVertical className="h-5 w-5 cursor-move hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-violet-500/25">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium leading-relaxed line-clamp-2">
                        {question.questionText}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {question.subject && (
                          <span className="px-2.5 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            {question.subject.name}
                          </span>
                        )}
                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                          {question.questionType.replace('_', ' ')}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                        </span>
                        <span className={cn(
                          'px-2.5 py-1 text-xs font-medium rounded-lg shadow-sm',
                          getDifficultyStyles(question.difficulty)
                        )}>
                          {question.difficulty}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <LayoutList className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No questions added</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                  Add questions from the question bank or extract from documents using AI.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowQuestionPicker(true)}
                    className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  >
                    Browse Question Bank
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time & Marks */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Time & Marks
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passing Marks
                </label>
                <input
                  type="number"
                  name="passingMarks"
                  value={formData.passingMarks}
                  onChange={handleChange}
                  min="0"
                  max={formData.totalMarks}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  name="maxAttempts"
                  value={formData.maxAttempts}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg shadow-amber-500/25">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Schedule
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Validity Expiry <span className="text-gray-400 text-xs">(Results available until)</span>
                </label>
                <input
                  type="datetime-local"
                  name="validityExpiry"
                  value={formData.validityExpiry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Negative Marking */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-400 shadow-lg shadow-red-500/25">
                <Award className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Negative Marking
              </h2>
            </div>
            <div className="space-y-4">
              <div
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                onClick={() => handleCheckboxChange('negativeMarksEnabled')}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  formData.negativeMarksEnabled
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                )}>
                  <Target className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Negative Marks</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deduct marks for wrong answers</p>
                </div>
                <div className="relative">
                  <div className={cn(
                    "w-10 h-6 rounded-full transition-colors duration-200",
                    formData.negativeMarksEnabled
                      ? "bg-gradient-to-r from-red-500 to-rose-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                      formData.negativeMarksEnabled
                        ? "left-5"
                        : "left-1"
                    )}></div>
                  </div>
                </div>
              </div>

              {formData.negativeMarksEnabled && (
                <div className="pl-10">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Negative marks per wrong answer
                  </label>
                  <input
                    type="number"
                    name="defaultNegativeMarks"
                    value={formData.defaultNegativeMarks}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.25"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Common: 0.25 (JEE Main), 0.33 (JEE Advanced), 1 (NEET)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 shadow-lg shadow-violet-500/25">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Settings
              </h2>
            </div>
            <div className="space-y-4">
              {settingsConfig.map((setting) => {
                const Icon = setting.icon;
                return (
                  <div
                    key={setting.key}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => handleCheckboxChange(setting.key)}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      formData[setting.key as keyof typeof formData]
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{setting.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                    </div>
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-6 rounded-full transition-colors duration-200",
                        formData[setting.key as keyof typeof formData]
                          ? "bg-gradient-to-r from-violet-500 to-purple-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                          formData[setting.key as keyof typeof formData]
                            ? "left-5"
                            : "left-1"
                        )}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Question Picker Modal */}
      {showQuestionPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-400 shadow-lg shadow-indigo-500/25">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Question Bank
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Select subjects and add questions to your test
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchQuestions}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoadingQuestions && "animate-spin")} />
                  </button>
                  <button
                    onClick={() => setShowQuestionPicker(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Multi-Subject Selection */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Select Subjects (click to toggle)
                </p>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubjectSelection(subject.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                        selectedSubjectIds.includes(subject.id)
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      {subject.name}
                      {selectedSubjectIds.includes(subject.id) && (
                        <span className="ml-1.5">✓</span>
                      )}
                    </button>
                  ))}
                  {selectedSubjectIds.length > 0 && (
                    <button
                      onClick={() => setSelectedSubjectIds([])}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {selectedSubjectIds.length > 0 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    {selectedSubjectIds.length} subject{selectedSubjectIds.length > 1 ? 's' : ''} selected - showing questions from all
                  </p>
                )}
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Question Type
                  </label>
                  <select
                    value={filterQuestionType}
                    onChange={(e) => setFilterQuestionType(e.target.value as QuestionType | '')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="">All Types</option>
                    <optgroup label="JEE/NEET Types">
                      {questionTypes.slice(0, 6).map((qt) => (
                        <option key={qt.value} value={qt.value}>{qt.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Types">
                      {questionTypes.slice(6).map((qt) => (
                        <option key={qt.value} value={qt.value}>{qt.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Chapter
                  </label>
                  <select
                    value={filterChapterId}
                    onChange={(e) => setFilterChapterId(e.target.value)}
                    disabled={chapters.length === 0}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="">All Chapters</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        Ch {ch.chapterNumber}: {ch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {isLoadingQuestions ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Loading questions...</p>
                </div>
              ) : filteredQuestions.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer flex items-start gap-4 transition-colors"
                      onClick={() => addQuestion(question)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-medium line-clamp-2">{question.questionText}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {question.subject && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                              {question.subject.name}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {question.questionType.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                            {question.marks} marks
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded',
                            getDifficultyStyles(question.difficulty)
                          )}>
                            {question.difficulty}
                          </span>
                          {question.chapter && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                              {question.chapter}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                        <Plus className="h-5 w-5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No matching questions found' : 'No questions available. Create some in the Question Bank first.'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredQuestions.length} questions available
              </p>
              <button
                onClick={() => setShowQuestionPicker(false)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
