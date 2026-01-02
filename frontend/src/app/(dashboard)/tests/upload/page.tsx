'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  File,
  X,
  Brain,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Target,
  Hash,
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  Save,
  Send,
  ShieldCheck,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth.store';
import { RichText, RichTextBlock } from '@/components/ui/rich-text';
import {
  patternsApi,
  testUploadApi,
  classesApi,
  subjectsApi,
  TestPattern,
  PatternSection,
  Class,
  Section,
  Subject,
} from '@/lib/api';

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string | string[];
  section?: string;
  subjectId?: string;
  subjectName?: string;
  questionType?: string;
  marks?: number;
  negativeMarks?: number;
  solution?: string;
  solutionHtml?: string;
  matrixData?: {
    leftColumn: { id: string; text: string }[];
    rightColumn: { id: string; text: string }[];
    correctMatches?: Record<string, string[]>;
  };
}

interface UploadResult {
  success: boolean;
  questions: ParsedQuestion[];
  totalQuestions: number;
  sectionBreakdown: {
    section: string;
    subject: string;
    startQ: number;
    endQ: number;
    count: number;
  }[];
  errors?: string[];
}

export default function TestUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { accessToken } = useAuthStore();

  const [patterns, setPatterns] = useState<TestPattern[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<TestPattern | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [primarySubjectId, setPrimarySubjectId] = useState(''); // For test's main subject
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(180);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  // AI Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerificationResults, setAiVerificationResults] = useState<Map<number, {
    isCorrect: boolean;
    confidence: 'high' | 'medium' | 'low';
    aiSolution?: string;
    suggestedAnswer?: string;
    reasoning?: string;
  }>>(new Map());

  // Fetch patterns, classes, and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const [patternsRes, classesRes, subjectsRes] = await Promise.all([
          patternsApi.getAll(accessToken),
          classesApi.getAll(accessToken),
          subjectsApi.getAll(accessToken),
        ]);

        if (patternsRes.success && patternsRes.data) {
          setPatterns(Array.isArray(patternsRes.data) ? patternsRes.data : []);
        }
        if (classesRes.success && classesRes.data) {
          setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        }
        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [accessToken, toast]);

  // Fetch sections when class changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!accessToken || !selectedClassId) {
        setSections([]);
        return;
      }
      try {
        const response = await classesApi.getSections(selectedClassId, accessToken);
        if (response.success && response.data) {
          setSections(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    fetchSections();
  }, [accessToken, selectedClassId]);

  const handlePatternSelect = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId);
    setSelectedPattern(pattern || null);
    if (pattern) {
      setTestTitle(`${pattern.name} - ${new Date().toLocaleDateString()}`);
      setDurationMinutes(pattern.totalDuration || 180);

      // Auto-select subjects from pattern sections
      const patternSubjectIds = pattern.sections
        .map((s: PatternSection) => s.subjectId)
        .filter((id: string | undefined): id is string => !!id);
      const uniqueSubjectIds = Array.from(new Set(patternSubjectIds));
      setSelectedSubjectIds(uniqueSubjectIds);

      // Set primary subject as the first one
      if (uniqueSubjectIds.length > 0) {
        setPrimarySubjectId(uniqueSubjectIds[0]);
      }
    } else {
      setSelectedSubjectIds([]);
      setPrimarySubjectId('');
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds(prev => {
      if (prev.includes(subjectId)) {
        // Remove subject
        const newIds = prev.filter(id => id !== subjectId);
        // If removing primary subject, set new primary
        if (primarySubjectId === subjectId && newIds.length > 0) {
          setPrimarySubjectId(newIds[0]);
        } else if (newIds.length === 0) {
          setPrimarySubjectId('');
        }
        return newIds;
      } else {
        // Add subject
        const newIds = [...prev, subjectId];
        // If first subject, set as primary
        if (newIds.length === 1) {
          setPrimarySubjectId(subjectId);
        }
        return newIds;
      }
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/msword') {
        setFile(file);
      } else {
        toast({
          title: 'Invalid file',
          description: 'Please upload a Word document (.doc or .docx)',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!accessToken || !file || !selectedPattern) {
      toast({
        title: 'Missing information',
        description: 'Please select a pattern and upload a Word file',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedClassId) {
      toast({
        title: 'Missing class',
        description: 'Please select a class for this test',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await testUploadApi.parseWithPattern(
        file,
        selectedPattern.id,
        accessToken
      );

      if (response.success && response.data) {
        setUploadResult(response.data);
        toast({
          title: 'File parsed successfully',
          description: `Found ${response.data.totalQuestions} questions`,
        });
      } else {
        toast({
          title: 'Error parsing file',
          description: response.error || 'Failed to parse Word file',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTest = async (publish = false) => {
    if (!accessToken || !selectedPattern || !uploadResult) return;

    if (!testTitle.trim()) {
      toast({
        title: 'Missing title',
        description: 'Please enter a test title',
        variant: 'destructive',
      });
      return;
    }

    if (selectedSubjectIds.length === 0 || !primarySubjectId) {
      toast({
        title: 'Missing subject',
        description: 'Please select at least one subject for this test',
        variant: 'destructive',
      });
      return;
    }

    if (!durationMinutes || durationMinutes <= 0) {
      toast({
        title: 'Invalid duration',
        description: 'Please enter a valid test duration',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await testUploadApi.createTestFromParsed({
        testName: testTitle,
        description: testDescription,
        patternId: selectedPattern.id,
        subjectId: primarySubjectId, // Primary subject for the test
        subjectIds: selectedSubjectIds, // All subjects for questions
        classId: selectedClassId,
        sectionId: selectedSectionId || undefined,
        durationMinutes: durationMinutes,
        questions: uploadResult.questions,
        publish,
      }, accessToken);

      if (response.success && response.data) {
        toast({
          title: publish ? 'Test published!' : 'Test created!',
          description: publish ? 'Test is now available for students' : 'Test saved as draft',
        });
        // Backend returns { test, questionsCreated, passagesCreated }
        const data = response.data as any;
        const testId = data.test?.id || data.id;
        router.push(`/tests/${testId}/preview`);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create test',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // AI Verification handler
  const handleVerifyWithAI = async () => {
    if (!accessToken || !uploadResult?.questions?.length) return;

    setIsVerifying(true);
    try {
      const response = await testUploadApi.verifyWithAI(
        uploadResult.questions,
        accessToken
      );

      if (response.success && response.data) {
        const resultsMap = new Map<number, typeof aiVerificationResults extends Map<number, infer V> ? V : never>();
        response.data.verificationResults.forEach(r => {
          resultsMap.set(r.questionNumber, {
            isCorrect: r.isCorrect,
            confidence: r.confidence,
            aiSolution: r.aiSolution,
            suggestedAnswer: r.suggestedAnswer,
            reasoning: r.reasoning,
          });
        });
        setAiVerificationResults(resultsMap);

        toast({
          title: 'AI Verification Complete',
          description: `${response.data.summary.verified} of ${response.data.summary.total} answers verified as correct`,
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: response.error || 'Could not verify questions with AI',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify with AI',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

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
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8">
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
                  Pattern-Based Upload
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Upload Test from Word File
              </h1>
              <p className="text-purple-100">
                Select a pattern, upload your Word file, and create a test automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Pattern */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Exam Pattern
              </h2>
            </div>

            <div className="space-y-4">
              <select
                value={selectedPattern?.id || ''}
                onChange={(e) => handlePatternSelect(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Select a pattern...</option>
                {patterns.filter(p => p.isDefault).length > 0 && (
                  <optgroup label="Default Patterns">
                    {patterns.filter(p => p.isDefault).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalQuestions} questions, {p.totalMarks} marks)
                      </option>
                    ))}
                  </optgroup>
                )}
                {patterns.filter(p => !p.isDefault).length > 0 && (
                  <optgroup label="Custom Patterns">
                    {patterns.filter(p => !p.isDefault).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalQuestions} questions, {p.totalMarks} marks)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Pattern Preview */}
              {selectedPattern && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">
                      {selectedPattern.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <Hash className="h-4 w-4" />
                        {selectedPattern.totalQuestions} questions
                      </span>
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Target className="h-4 w-4" />
                        {selectedPattern.totalMarks} marks
                      </span>
                      <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
                        <Clock className="h-4 w-4" />
                        {selectedPattern.totalDuration} min
                      </span>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                      Sections (Question ranges in Word file):
                    </p>
                    {selectedPattern.sections.map((section: PatternSection, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {section.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {section.subjectName || 'No subject assigned'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            Q{section.questionRange?.start || 1} - Q{section.questionRange?.end || section.questionCount}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {section.questionCount} questions
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {section.marksPerQuestion} marks each
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Upload Word File */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                selectedPattern
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  : "bg-gray-300 dark:bg-gray-600"
              )}>
                2
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Word File
              </h2>
            </div>

            {!selectedPattern ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Please select a pattern first
              </p>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'relative border-2 border-dashed rounded-xl transition-all duration-300',
                  isDragging
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                )}
              >
                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-8 text-center">
                  {file ? (
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setUploadResult(null);
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <X className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        Drop your Word file here
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        or click to browse
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {file && !uploadResult && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Parsing Word file...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    Parse Questions
                  </>
                )}
              </button>
            )}
          </div>

          {/* Step 3: Review & Create */}
          {uploadResult && (
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                  3
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Review & Create Test
                </h2>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {uploadResult.totalQuestions}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Questions Found</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {uploadResult.sectionBreakdown.length}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Sections</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {uploadResult.errors?.length || 0}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Warnings</p>
                </div>
              </div>

              {/* Verify with AI Button */}
              <div className="mb-6">
                <button
                  onClick={handleVerifyWithAI}
                  disabled={isVerifying}
                  className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying with AI... (This may take a moment)
                    </>
                  ) : aiVerificationResults.size > 0 ? (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Re-verify with AI ({aiVerificationResults.size} verified)
                    </>
                  ) : (
                    <>
                      <Bot className="h-5 w-5" />
                      Verify Answers with AI
                    </>
                  )}
                </button>
                {aiVerificationResults.size > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <ShieldCheck className="h-4 w-4" />
                      {Array.from(aiVerificationResults.values()).filter(r => r.isCorrect).length} Correct
                    </span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      {Array.from(aiVerificationResults.values()).filter(r => !r.isCorrect).length} Need Review
                    </span>
                  </div>
                )}
              </div>

              {/* Section Breakdown */}
              <div className="space-y-2 mb-6">
                {uploadResult.sectionBreakdown.map((section, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {section.section}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({section.subject})
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Q{section.startQ}-Q{section.endQ} ({section.count} questions)
                        </span>
                        {expandedSections.includes(index) ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedSections.includes(index) && (
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {uploadResult.questions
                          .filter(q => q.section === section.section)
                          .map((q, qIndex) => {
                            const aiResult = aiVerificationResults.get(q.questionNumber);
                            return (
                            <div
                              key={qIndex}
                              className={cn(
                                "p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border",
                                aiResult
                                  ? aiResult.isCorrect
                                    ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10"
                                    : "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10"
                                  : "border-gray-200 dark:border-gray-700"
                              )}
                            >
                              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-start gap-2">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">Q{q.questionNumber}.</span>
                                {aiResult && (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                                      aiResult.isCorrect
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    )}
                                    title={aiResult.reasoning || 'AI Verified'}
                                  >
                                    {aiResult.isCorrect ? (
                                      <ShieldCheck className="h-3 w-3" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3" />
                                    )}
                                    AI {aiResult.isCorrect ? 'Verified' : 'Review'}
                                  </span>
                                )}
                                <RichText text={q.questionText} className="flex-1" />
                              </div>
                              {/* Matrix Match Table Display */}
                              {q.questionType === 'MATRIX_MATCH' && q.matrixData && (
                                <div className="ml-4 mb-3">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                      <thead>
                                        <tr className="bg-indigo-50 dark:bg-indigo-900/30">
                                          <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-300 dark:border-gray-600">
                                            Column I
                                          </th>
                                          <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                            Column II
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(() => {
                                          const maxRows = Math.max(
                                            q.matrixData.leftColumn?.length || 0,
                                            q.matrixData.rightColumn?.length || 0
                                          );
                                          return Array.from({ length: maxRows }).map((_, rowIndex) => {
                                            const leftItem = q.matrixData!.leftColumn?.[rowIndex];
                                            const rightItem = q.matrixData!.rightColumn?.[rowIndex];
                                            return (
                                              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 align-top">
                                                  {leftItem && (
                                                    <div className="flex items-start gap-2">
                                                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 min-w-[24px]">
                                                        ({leftItem.id})
                                                      </span>
                                                      <RichText text={leftItem.text} className="flex-1" />
                                                    </div>
                                                  )}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 align-top">
                                                  {rightItem && (
                                                    <div className="flex items-start gap-2">
                                                      <span className="font-semibold text-purple-600 dark:text-purple-400 min-w-[24px]">
                                                        ({rightItem.id})
                                                      </span>
                                                      <RichText text={rightItem.text} className="flex-1" />
                                                    </div>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          });
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                  {/* Correct Matches Display */}
                                  {q.matrixData.correctMatches && Object.keys(q.matrixData.correctMatches).length > 0 && (
                                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">Correct Matches: </span>
                                      {Object.entries(q.matrixData.correctMatches).map(([left, rights], i) => (
                                        <span key={left}>
                                          {left} → {(rights as string[]).join(', ')}
                                          {i < Object.keys(q.matrixData!.correctMatches!).length - 1 ? ' | ' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Regular Options Display (non-matrix) */}
                              {q.questionType !== 'MATRIX_MATCH' && q.options && q.options.length > 0 && (
                                <div className="ml-4 space-y-1 mb-2">
                                  {q.options.map((opt: any, optIndex: number) => (
                                    <div key={optIndex} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                      <span className={cn(
                                        "font-medium min-w-[20px]",
                                        (q.correctAnswer === opt.id || (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id)))
                                          ? "text-green-600 dark:text-green-400"
                                          : ""
                                      )}>
                                        ({opt.id})
                                      </span>
                                      <RichText text={opt.text} className="flex-1" />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                {/* Show question type badge */}
                                {q.questionType && (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded font-medium",
                                    q.questionType === 'MATRIX_MATCH'
                                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                      : q.questionType === 'INTEGER_TYPE'
                                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                      : q.questionType === 'MULTIPLE_CORRECT'
                                      ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                  )}>
                                    {q.questionType.replace(/_/g, ' ')}
                                  </span>
                                )}
                                {/* Show matrix info or options count */}
                                {q.questionType === 'MATRIX_MATCH' && q.matrixData ? (
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                    {q.matrixData.leftColumn?.length || 0} × {q.matrixData.rightColumn?.length || 0} matrix
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                    {q.options?.length || 0} options
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                                  Answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || 'Not set'}
                                </span>
                                {aiResult && !aiResult.isCorrect && aiResult.suggestedAnswer && (
                                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                                    AI suggests: {aiResult.suggestedAnswer}
                                  </span>
                                )}
                              </div>
                              {/* Solution Display */}
                              {q.solution && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    Solution (from uploaded file):
                                  </p>
                                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <RichTextBlock text={q.solution} className="text-sm text-gray-700 dark:text-gray-300" />
                                  </div>
                                </div>
                              )}
                              {/* AI Generated Solution */}
                              {aiResult?.aiSolution && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                                    <Bot className="h-3 w-3" />
                                    AI Generated Solution:
                                  </p>
                                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiResult.aiSolution}</p>
                                  </div>
                                  {aiResult.reasoning && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                      {aiResult.reasoning}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )})}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Test Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Enter test title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Enter test description"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCreateTest(false)}
                  disabled={isUploading}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Save as Draft
                </button>
                <button
                  onClick={() => handleCreateTest(true)}
                  disabled={isUploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  Create & Publish
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Test Configuration */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Test Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subjects * <span className="text-xs text-gray-500">(from pattern)</span>
                </label>
                {!selectedPattern ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                    Select a pattern to see subjects
                  </div>
                ) : (() => {
                  // Get unique subject IDs from pattern sections
                  const patternSubjectIds = Array.from(new Set(
                    selectedPattern.sections
                      .map((s: PatternSection) => s.subjectId)
                      .filter((id: string | undefined): id is string => !!id)
                  ));
                  // Filter subjects to only those in pattern
                  const patternSubjects = subjects.filter(s => patternSubjectIds.includes(s.id));

                  if (patternSubjects.length === 0) {
                    return (
                      <div className="p-4 text-center text-sm text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                        No subjects configured in this pattern. Please configure subjects in pattern sections.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                      {patternSubjects.map(s => (
                        <label
                          key={s.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            selectedSubjectIds.includes(s.id)
                              ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubjectIds.includes(s.id)}
                            onChange={() => handleSubjectToggle(s.id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">{s.name}</span>
                          {primarySubjectId === s.id && (
                            <span className="text-xs px-2 py-0.5 bg-purple-500 text-white rounded-full">Primary</span>
                          )}
                          {selectedSubjectIds.includes(s.id) && primarySubjectId !== s.id && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setPrimarySubjectId(s.id);
                              }}
                              className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800"
                            >
                              Set Primary
                            </button>
                          )}
                        </label>
                      ))}
                    </div>
                  );
                })()}
                {selectedSubjectIds.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {selectedSubjectIds.length} subject(s) selected
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section (optional)
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={!selectedClassId || sections.length === 0}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Sections</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Enter duration in minutes"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Word File Format
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>Format your Word file like this:</p>
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg font-mono text-xs">
                <p><strong>1.</strong> What is Newton's first law?</p>
                <p className="ml-4">a) Law of inertia</p>
                <p className="ml-4">b) Law of motion</p>
                <p className="ml-4">c) Law of gravity</p>
                <p className="ml-4">d) Law of force</p>
                <p className="mt-2"><strong>Answer:</strong> a</p>
              </div>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Number questions sequentially
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Use a), b), c), d) for options
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Mark correct answer clearly
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  Questions will be assigned by number range
                </li>
              </ul>
            </div>
          </div>

          {/* Preview Button */}
          {uploadResult && (
            <button
              onClick={() => router.push('/tests')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <Eye className="h-5 w-5" />
              View All Tests
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
