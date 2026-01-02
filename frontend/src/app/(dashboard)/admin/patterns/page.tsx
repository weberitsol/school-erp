'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Clock,
  HelpCircle,
  Target,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Hash,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  patternsApi,
  subjectsApi,
  TestPattern,
  PatternType,
  PatternSection,
  QuestionType,
  CreatePatternData,
  Subject,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'add' | 'edit';

const patternTypeOptions: { value: PatternType; label: string }[] = [
  { value: 'JEE_MAIN', label: 'JEE Main' },
  { value: 'JEE_ADVANCED', label: 'JEE Advanced' },
  { value: 'NEET', label: 'NEET' },
  { value: 'CUSTOM', label: 'Custom' },
];

const questionTypeOptions: { value: QuestionType; label: string }[] = [
  { value: 'SINGLE_CORRECT', label: 'Single Correct (MCQ)' },
  { value: 'MULTIPLE_CORRECT', label: 'Multiple Correct' },
  { value: 'INTEGER_TYPE', label: 'Integer/Numerical' },
  { value: 'MATRIX_MATCH', label: 'Matrix Match' },
  { value: 'ASSERTION_REASONING', label: 'Assertion Reasoning' },
  { value: 'COMPREHENSION', label: 'Comprehension Based' },
  { value: 'MCQ', label: 'MCQ (General)' },
  { value: 'TRUE_FALSE', label: 'True/False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
  { value: 'FILL_IN_BLANK', label: 'Fill in the Blank' },
];

const defaultSection: PatternSection = {
  name: '',
  subjectId: '',
  subjectCode: '',
  subjectName: '',
  questionCount: 25,
  marksPerQuestion: 4,
  negativeMarks: 1,
  questionTypes: ['SINGLE_CORRECT'],
  questionRange: { start: 1, end: 25 },
  duration: 60,
  partialMarking: false,
  isOptional: false,
  optionalCount: 0,
};

interface PatternFormData {
  name: string;
  patternType: PatternType;
  sections: PatternSection[];
  scoringRules: {
    partialMarking: boolean;
    negativeMarkingEnabled: boolean;
  };
  totalMarks: number;
  totalQuestions: number;
  totalDuration: number;
}

const initialFormData: PatternFormData = {
  name: '',
  patternType: 'CUSTOM',
  sections: [{ ...defaultSection, name: 'Section 1', questionRange: { start: 1, end: 25 } }],
  scoringRules: {
    partialMarking: false,
    negativeMarkingEnabled: false,
  },
  totalMarks: 0,
  totalQuestions: 0,
  totalDuration: 60,
};

export default function PatternsPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [patterns, setPatterns] = useState<TestPattern[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PatternType | ''>('');
  const [formData, setFormData] = useState<PatternFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedPattern, setSelectedPattern] = useState<TestPattern | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!accessToken) return;
      try {
        const res = await subjectsApi.getAll(accessToken);
        if (res.success && res.data) {
          setSubjects(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    fetchSubjects();
  }, [accessToken]);

  // Fetch patterns
  const fetchPatterns = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await patternsApi.getAll(accessToken, {
        patternType: typeFilter || undefined,
      });
      if (res.success && res.data) {
        setPatterns(res.data);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch exam patterns',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, typeFilter, toast]);

  useEffect(() => {
    if (mode === 'list') {
      fetchPatterns();
    }
  }, [mode, fetchPatterns]);

  // Calculate totals when sections change
  useEffect(() => {
    const totalQuestions = formData.sections.reduce((sum, s) => sum + s.questionCount, 0);
    const totalMarks = formData.sections.reduce(
      (sum, s) => sum + s.questionCount * s.marksPerQuestion,
      0
    );
    setFormData((prev) => ({
      ...prev,
      totalQuestions,
      totalMarks,
    }));
  }, [formData.sections]);

  // Add section with auto-calculated question range
  const handleAddSection = () => {
    const lastSection = formData.sections[formData.sections.length - 1];
    const nextStart = lastSection?.questionRange?.end ? lastSection.questionRange.end + 1 : 1;
    const nextEnd = nextStart + 24; // Default 25 questions

    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, {
        ...defaultSection,
        name: `Section ${prev.sections.length + 1}`,
        questionRange: { start: nextStart, end: nextEnd },
        questionCount: 25,
      }],
    }));
    setExpandedSection(formData.sections.length);
  };

  // Remove section
  const handleRemoveSection = (index: number) => {
    if (formData.sections.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  // Update section
  const updateSection = (index: number, updates: Partial<PatternSection>) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.sections.length === 0) errors.sections = 'At least one section is required';
    if (formData.totalDuration < 1) errors.totalDuration = 'Duration must be at least 1 minute';

    formData.sections.forEach((s, i) => {
      if (!s.name.trim()) errors[`section_${i}_name`] = 'Section name is required';
      if (s.questionCount < 1) errors[`section_${i}_count`] = 'At least 1 question required';
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreatePatternData = {
        name: formData.name,
        patternType: formData.patternType,
        sections: formData.sections,
        scoringRules: formData.scoringRules,
        totalMarks: formData.totalMarks,
        totalQuestions: formData.totalQuestions,
        totalDuration: formData.totalDuration,
      };

      if (mode === 'add') {
        const res = await patternsApi.create(payload, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Pattern created successfully' });
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create pattern', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedPattern) {
        const res = await patternsApi.update(selectedPattern.id, payload, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Pattern updated successfully' });
          setSelectedPattern(null);
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update pattern', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving pattern:', error);
      toast({ title: 'Error', description: 'Failed to save pattern', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (pattern: TestPattern) => {
    if (!accessToken) return;
    if (pattern.isDefault) {
      toast({ title: 'Warning', description: 'Cannot delete default patterns', variant: 'destructive' });
      return;
    }
    if (!confirm(`Are you sure you want to delete "${pattern.name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await patternsApi.delete(pattern.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Pattern deleted successfully' });
        fetchPatterns();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete pattern', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting pattern:', error);
      toast({ title: 'Error', description: 'Failed to delete pattern', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit click
  const handleEdit = (pattern: TestPattern) => {
    setSelectedPattern(pattern);

    // Map existing sections to ensure all new fields are present
    let runningStart = 1;
    const mappedSections = pattern.sections.map((s: any) => {
      const questionCount = s.questionCount || 25;
      const start = s.questionRange?.start || runningStart;
      const end = s.questionRange?.end || (start + questionCount - 1);
      runningStart = end + 1;

      return {
        name: s.name || '',
        subjectId: s.subjectId || '',
        subjectCode: s.subjectCode || '',
        subjectName: s.subjectName || '',
        questionCount: questionCount,
        marksPerQuestion: s.marksPerQuestion || 4,
        negativeMarks: s.negativeMarks || 0,
        questionTypes: s.questionTypes || ['SINGLE_CORRECT'],
        questionRange: { start, end },
        duration: s.duration || 60,
        partialMarking: s.partialMarking || false,
        isOptional: s.isOptional || false,
        optionalCount: s.optionalCount || 0,
      };
    });

    setFormData({
      name: pattern.name,
      patternType: pattern.patternType,
      sections: mappedSections,
      scoringRules: {
        partialMarking: pattern.scoringRules?.partialMarking || false,
        negativeMarkingEnabled: pattern.scoringRules?.negativeMarkingEnabled || false,
      },
      totalMarks: pattern.totalMarks,
      totalQuestions: pattern.totalQuestions,
      totalDuration: pattern.totalDuration,
    });
    setFormErrors({});
    setExpandedSection(0);
    setMode('edit');
  };

  // Filter locally
  const filteredPatterns = patterns.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Exam Patterns
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage test patterns for JEE, NEET, and custom exams
          </p>
        </div>
        {mode === 'list' && (
          <button
            onClick={() => {
              setFormData(initialFormData);
              setFormErrors({});
              setExpandedSection(0);
              setMode('add');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Pattern
          </button>
        )}
      </div>

      {/* List View */}
      {mode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patterns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as PatternType | '')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {patternTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredPatterns.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No exam patterns found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pattern
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPatterns.map((pattern) => (
                    <tr key={pattern.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{pattern.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {pattern.sections.length} sections
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          {patternTypeOptions.find((p) => p.value === pattern.patternType)?.label}
                        </span>
                        {pattern.isDefault && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                          {pattern.totalQuestions}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                          <Target className="h-4 w-4 text-gray-400" />
                          {pattern.totalMarks}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {pattern.totalDuration} min
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(pattern)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {!pattern.isDefault && (
                            <button
                              onClick={() => handleDelete(pattern)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(mode === 'add' || mode === 'edit') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Create Exam Pattern' : 'Edit Exam Pattern'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedPattern(null);
                setFormData(initialFormData);
                setFormErrors({});
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pattern Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="e.g., JEE Main 2024"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pattern Type
                </label>
                <select
                  value={formData.patternType}
                  onChange={(e) => setFormData({ ...formData, patternType: e.target.value as PatternType })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {patternTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalDuration}
                  onChange={(e) => setFormData({ ...formData, totalDuration: parseInt(e.target.value) || 0 })}
                  min={1}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                    formErrors.totalDuration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.totalDuration && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.totalDuration}</p>
                )}
              </div>
            </div>

            {/* Scoring Rules */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Scoring Rules</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.scoringRules.partialMarking}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scoringRules: { ...formData.scoringRules, partialMarking: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Partial Marking</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.scoringRules.negativeMarkingEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scoringRules: { ...formData.scoringRules, negativeMarkingEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Negative Marking</span>
                </label>
              </div>
            </div>

            {/* Sections */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sections</h3>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Section
                </button>
              </div>

              <div className="space-y-3">
                {formData.sections.map((section, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Section Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {section.name || `Section ${index + 1}`}
                            </span>
                            {section.subjectName && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                {section.subjectName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>Q{section.questionRange?.start || 1}-{section.questionRange?.end || section.questionCount}</span>
                            <span>•</span>
                            <span>{section.questionCount} questions</span>
                            <span>•</span>
                            <span>{section.questionCount * section.marksPerQuestion} marks</span>
                            {section.duration && (
                              <>
                                <span>•</span>
                                <span>{section.duration} min</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {expandedSection === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Section Content */}
                    {expandedSection === index && (
                      <div className="p-4 space-y-4">
                        {/* Row 1: Section Name & Subject */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Section Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={section.name}
                              onChange={(e) => updateSection(index, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              placeholder="e.g., Physics Section A"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <BookOpen className="inline h-3.5 w-3.5 mr-1" />
                              Subject
                            </label>
                            <select
                              value={section.subjectId || ''}
                              onChange={(e) => {
                                const selectedSubject = subjects.find(s => s.id === e.target.value);
                                updateSection(index, {
                                  subjectId: e.target.value,
                                  subjectCode: selectedSubject?.code || '',
                                  subjectName: selectedSubject?.name || '',
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.name} ({subject.code})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Question Range & Duration */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Question Range (for Word file parsing)
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Start Question #
                              </label>
                              <input
                                type="number"
                                value={section.questionRange?.start || 1}
                                onChange={(e) =>
                                  updateSection(index, {
                                    questionRange: {
                                      start: parseInt(e.target.value) || 1,
                                      end: section.questionRange?.end || section.questionCount,
                                    },
                                  })
                                }
                                min={1}
                                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                End Question #
                              </label>
                              <input
                                type="number"
                                value={section.questionRange?.end || section.questionCount}
                                onChange={(e) =>
                                  updateSection(index, {
                                    questionRange: {
                                      start: section.questionRange?.start || 1,
                                      end: parseInt(e.target.value) || section.questionCount,
                                    },
                                    questionCount: (parseInt(e.target.value) || section.questionCount) - (section.questionRange?.start || 1) + 1,
                                  })
                                }
                                min={section.questionRange?.start || 1}
                                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <Timer className="inline h-3 w-3 mr-1" />
                                Duration (min)
                              </label>
                              <input
                                type="number"
                                value={section.duration || 60}
                                onChange={(e) =>
                                  updateSection(index, { duration: parseInt(e.target.value) || 60 })
                                }
                                min={1}
                                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Questions {section.questionRange?.start || 1} to {section.questionRange?.end || section.questionCount} in the Word file will be assigned to this section
                          </p>
                        </div>

                        {/* Row 3: Marks & Questions */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Total Questions
                            </label>
                            <input
                              type="number"
                              value={section.questionCount}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0;
                                const start = section.questionRange?.start || 1;
                                updateSection(index, {
                                  questionCount: count,
                                  questionRange: { start, end: start + count - 1 },
                                });
                              }}
                              min={1}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Marks/Question
                            </label>
                            <input
                              type="number"
                              value={section.marksPerQuestion}
                              onChange={(e) =>
                                updateSection(index, { marksPerQuestion: parseFloat(e.target.value) || 0 })
                              }
                              min={0}
                              step={0.5}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Negative Marks
                            </label>
                            <input
                              type="number"
                              value={section.negativeMarks}
                              onChange={(e) =>
                                updateSection(index, { negativeMarks: parseFloat(e.target.value) || 0 })
                              }
                              min={0}
                              step={0.25}
                              disabled={!formData.scoringRules.negativeMarkingEnabled}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={section.partialMarking || false}
                                onChange={(e) => updateSection(index, { partialMarking: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Partial Marking</span>
                            </label>
                          </div>
                        </div>

                        {/* Row 4: Question Types */}
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Allowed Question Types
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {questionTypeOptions.map((qt) => (
                              <label
                                key={qt.value}
                                className={cn(
                                  'flex items-center gap-1 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors',
                                  section.questionTypes.includes(qt.value)
                                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={section.questionTypes.includes(qt.value)}
                                  onChange={(e) => {
                                    const newTypes = e.target.checked
                                      ? [...section.questionTypes, qt.value]
                                      : section.questionTypes.filter((t) => t !== qt.value);
                                    updateSection(index, { questionTypes: newTypes.length > 0 ? newTypes : ['SINGLE_CORRECT'] });
                                  }}
                                  className="sr-only"
                                />
                                {qt.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Section Summary & Remove */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Section Total:
                            </span>{' '}
                            {section.questionCount} questions × {section.marksPerQuestion} marks = {' '}
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {section.questionCount * section.marksPerQuestion} marks
                            </span>
                            {section.duration && (
                              <span className="ml-3">| {section.duration} min</span>
                            )}
                          </div>
                          {formData.sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(index)}
                              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove Section
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Pattern Summary</h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Questions:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formData.totalQuestions}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Marks:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formData.totalMarks}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formData.totalDuration} min</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedPattern(null);
                  setFormData(initialFormData);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Create Pattern' : 'Update Pattern'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
