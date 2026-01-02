'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  questionsApi,
  subjectsApi,
  classesApi,
  CreateQuestionData,
  Question,
  QuestionType,
  DifficultyLevel,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'view';
  question?: Question | null;
  accessToken: string;
  onSuccess?: () => void;
}

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True/False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
];

const difficultyLevels: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-700 border-red-300' },
];

export default function QuestionModal({
  isOpen,
  onClose,
  mode,
  question,
  accessToken,
  onSuccess,
}: QuestionModalProps) {
  const { toast } = useToast();

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('MCQ');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch subjects and classes
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const [subjectsRes, classesRes] = await Promise.all([
          subjectsApi.getAll(accessToken),
          classesApi.getAll(accessToken),
        ]);
        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(subjectsRes.data);
        }
        if (classesRes.success && classesRes.data) {
          setClasses(classesRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [accessToken, isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (question && (mode === 'edit' || mode === 'view')) {
      setQuestionText(question.questionText || '');
      setQuestionType(question.questionType || 'MCQ');
      setDifficulty(question.difficulty || 'MEDIUM');
      setMarks(question.marks || 1);
      // Handle both string[] and {id, text}[] option formats
      let optionsToSet: string[] = ['', '', '', ''];
      if (question.options && Array.isArray(question.options) && question.options.length > 0) {
        if (typeof question.options[0] === 'string') {
          optionsToSet = question.options as unknown as string[];
        } else {
          optionsToSet = (question.options as any[]).map(o => (typeof o === 'string' ? o : o.text || ''));
        }
      }
      setOptions(optionsToSet);
      setCorrectAnswer(question.correctAnswer || '');
      setExplanation(question.explanation || '');
      setSubjectId(question.subjectId || question.subject?.id || '');
      setClassId(question.classId || question.class?.id || '');
      setChapter(question.chapter || '');
      setTopic(question.topic || '');
      setTags(question.tags || []);
    } else if (mode === 'add') {
      resetForm();
    }
  }, [question, mode, isOpen]);

  const resetForm = () => {
    setQuestionText('');
    setQuestionType('MCQ');
    setDifficulty('MEDIUM');
    setMarks(1);
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setExplanation('');
    setSubjectId('');
    setClassId('');
    setChapter('');
    setTopic('');
    setTags([]);
    setTagInput('');
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer === String.fromCharCode(65 + index)) {
        setCorrectAnswer('');
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Question text is required',
        variant: 'destructive',
      });
      return;
    }

    if (!subjectId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a subject',
        variant: 'destructive',
      });
      return;
    }

    if ((questionType === 'MCQ' || questionType === 'TRUE_FALSE') && !correctAnswer) {
      toast({
        title: 'Validation Error',
        description: 'Please select the correct answer',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const data: CreateQuestionData = {
        questionText,
        questionType,
        difficulty,
        marks,
        subjectId,
        chapter: chapter || undefined,
        topic: topic || undefined,
        tags: tags.length > 0 ? tags : undefined,
        explanation: explanation || undefined,
      };

      if (questionType === 'MCQ') {
        data.options = options.filter((o) => o.trim());
        data.correctAnswer = correctAnswer;
      } else if (questionType === 'TRUE_FALSE') {
        data.options = ['True', 'False'];
        data.correctAnswer = correctAnswer;
      } else {
        data.correctAnswer = correctAnswer || undefined;
      }

      let response;
      if (mode === 'add') {
        response = await questionsApi.create(data, accessToken);
      } else if (mode === 'edit' && question) {
        response = await questionsApi.update(question.id, data, accessToken);
      }

      if (response?.success) {
        toast({
          title: 'Success',
          description: mode === 'add' ? 'Question created successfully' : 'Question updated successfully',
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response?.error || 'Failed to save question');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save question',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                mode === 'add' && 'bg-gradient-to-br from-green-500 to-emerald-500',
                mode === 'edit' && 'bg-gradient-to-br from-blue-500 to-indigo-500',
                mode === 'view' && 'bg-gradient-to-br from-purple-500 to-pink-500',
              )}>
                {mode === 'add' && <Plus className="h-5 w-5 text-white" />}
                {mode === 'edit' && <Edit className="h-5 w-5 text-white" />}
                {mode === 'view' && <Eye className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {mode === 'add' && 'Add New Question'}
                  {mode === 'edit' && 'Edit Question'}
                  {mode === 'view' && 'View Question'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {mode === 'add' && 'Create a new question for the question bank'}
                  {mode === 'edit' && 'Modify the question details'}
                  {mode === 'view' && 'Question details and information'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    disabled={isViewMode}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-60"
                    placeholder="Enter your question here..."
                  />
                </div>

                {/* Type, Difficulty, Marks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Type *
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                      disabled={isViewMode}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                    >
                      {questionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty *
                    </label>
                    <div className="flex gap-2">
                      {difficultyLevels.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => !isViewMode && setDifficulty(level.value)}
                          disabled={isViewMode}
                          className={cn(
                            'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                            difficulty === level.value
                              ? level.color + ' ring-2 ring-offset-1 ring-current'
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800',
                            isViewMode && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Marks *
                    </label>
                    <input
                      type="number"
                      value={marks}
                      onChange={(e) => setMarks(Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={isViewMode}
                      min={1}
                      max={100}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Subject and Class */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject *
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chapter and Topic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chapter
                    </label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      disabled={isViewMode}
                      placeholder="e.g., Trigonometry"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isViewMode}
                      placeholder="e.g., Sin and Cos Rules"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* MCQ Options */}
                {questionType === 'MCQ' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Options *
                    </label>
                    <div className="space-y-3">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => !isViewMode && setCorrectAnswer(String.fromCharCode(65 + index))}
                            disabled={isViewMode}
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all flex-shrink-0',
                              correctAnswer === String.fromCharCode(65 + index)
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
                              isViewMode && 'cursor-not-allowed'
                            )}
                          >
                            {String.fromCharCode(65 + index)}
                          </button>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            disabled={isViewMode}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                          />
                          {!isViewMode && options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!isViewMode && options.length < 6 && (
                        <button
                          type="button"
                          onClick={addOption}
                          className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Option
                        </button>
                      )}
                    </div>
                    {correctAnswer && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Correct answer: Option {correctAnswer}
                      </p>
                    )}
                  </div>
                )}

                {/* True/False Options */}
                {questionType === 'TRUE_FALSE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correct Answer *
                    </label>
                    <div className="flex gap-4">
                      {['True', 'False'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => !isViewMode && setCorrectAnswer(option)}
                          disabled={isViewMode}
                          className={cn(
                            'flex-1 px-6 py-3 rounded-xl font-medium transition-all',
                            correctAnswer === option
                              ? option === 'True'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
                            isViewMode && 'cursor-not-allowed opacity-60'
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answer for Short/Long Answer */}
                {(questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER' || questionType === 'FILL_BLANK') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Answer / Key Points
                    </label>
                    <textarea
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      disabled={isViewMode}
                      rows={3}
                      placeholder="Enter the expected answer or key points for evaluation..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                    />
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Answer Explanation
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    disabled={isViewMode}
                    rows={3}
                    placeholder="Provide an explanation for the correct answer..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-60"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm"
                      >
                        {tag}
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {!isViewMode && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add a tag..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {/* View Mode Additional Info */}
                {isViewMode && question && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <span className={cn(
                          'ml-2 px-2 py-0.5 rounded-full text-xs font-medium',
                          question.isVerified
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        )}>
                          {question.isVerified ? 'Verified' : 'Pending Review'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Source:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{question.source || 'Manual'}</span>
                      </div>
                      {question.createdAt && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Created:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(question.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {mode === 'add' ? 'Create Question' : 'Save Changes'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
