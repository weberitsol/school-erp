'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ParsedQuestion {
  id: string;
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  marks?: number;
  section?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'parsing' | 'completed' | 'failed';
  progress: number;
  parsedQuestions?: ParsedQuestion[];
  error?: string;
}

interface ParseResponse {
  success: boolean;
  data: ParsedQuestion[];
  message?: string;
  error?: string;
}

export default function TestUploadPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  // State management
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth check
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  // Handle file input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      addFiles(newFiles);
    }
  }, []);

  // Add files and validate
  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const validTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a valid Word document`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    const newUploadedFiles: UploadedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newUploadedFiles]);
  };

  // Upload and parse file
  const handleUploadFile = async (uploadFile: UploadedFile) => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f
      )
    );

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id && f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + 15, 40) }
              : f
          )
        );
      }, 300);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      // Upload and parse
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/upload/parse`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to parse document');
      }

      const parseData = (await response.json()) as ParseResponse;

      if (!parseData.success) {
        throw new Error(parseData.error || 'Failed to parse document');
      }

      // Simulate parsing progress
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'parsing', progress: 50 }
            : f
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mark as completed
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                parsedQuestions: parseData.data,
              }
            : f
        )
      );

      setSelectedFile({
        ...uploadFile,
        status: 'completed',
        progress: 100,
        parsedQuestions: parseData.data,
      });

      toast({
        title: 'Success',
        description: `${uploadFile.file.name} parsed successfully. Found ${parseData.data.length} questions.`,
      });
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'failed',
                error: error.message || 'Failed to parse document',
              }
            : f
        )
      );

      toast({
        title: 'Error',
        description: error.message || 'Failed to parse document',
        variant: 'destructive',
      });
    }
  };

  // Delete file
  const deleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  // Create test from parsed questions
  const handleCreateTest = async () => {
    if (!selectedFile?.parsedQuestions || selectedFile.parsedQuestions.length === 0) {
      toast({
        title: 'Error',
        description: 'No parsed questions available',
        variant: 'destructive',
      });
      return;
    }

    // Validate form
    const errors: Record<string, string> = {};
    if (!testName.trim()) {
      errors.testName = 'Test name is required';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tests/upload/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: testName,
            description: testDescription,
            questions: selectedFile.parsedQuestions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create test');
      }

      toast({
        title: 'Success',
        description: `Test "${testName}" created successfully with ${selectedFile.parsedQuestions.length} questions`,
      });

      // Reset form
      setTestName('');
      setTestDescription('');
      setCreateErrors({});
      setSelectedFile(null);
      setFiles((prev) => prev.filter((f) => f.id !== selectedFile.id));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Word Document Upload
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload Word documents to automatically extract and create tests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Upload Files
              </h2>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer',
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                )}
              >
                <input
                  type="file"
                  multiple
                  accept=".doc,.docx"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Drag & drop your Word documents here
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supported formats: .doc, .docx (Max 50MB)
                </p>
              </div>

              {/* Files List */}
              {files.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Uploaded Files ({files.length})
                  </h3>

                  <div className="space-y-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {file.file.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(file.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {file.status === 'pending' && (
                              <button
                                onClick={() => handleUploadFile(file)}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                            )}

                            {file.status === 'completed' && (
                              <>
                                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <button
                                  onClick={() => setSelectedFile(file)}
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  View
                                </button>
                              </>
                            )}

                            {file.status === 'failed' && (
                              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}

                            {(file.status === 'uploading' || file.status === 'parsing') && (
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                            )}

                            <button
                              onClick={() => deleteFile(file.id)}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {(file.status === 'uploading' || file.status === 'parsing') && (
                          <div className="mb-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {file.status === 'uploading' ? 'Uploading...' : 'Parsing...'}
                            </p>
                          </div>
                        )}

                        {/* Error Message */}
                        {file.status === 'failed' && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {file.error || 'Failed to parse document'}
                          </p>
                        )}

                        {/* Questions Count */}
                        {file.status === 'completed' && file.parsedQuestions && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            ✓ {file.parsedQuestions.length} questions extracted
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview & Create Test Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Create Test
              </h2>

              {selectedFile?.parsedQuestions && selectedFile.parsedQuestions.length > 0 ? (
                <div>
                  {/* Test Info */}
                  <div className="mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        ✓ Ready to create test
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        {selectedFile.parsedQuestions.length} questions extracted
                      </p>
                    </div>

                    {/* Test Name Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Test Name *
                      </label>
                      <input
                        type="text"
                        value={testName}
                        onChange={(e) => {
                          setTestName(e.target.value);
                          if (createErrors.testName) {
                            setCreateErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.testName;
                              return newErrors;
                            });
                          }
                        }}
                        placeholder="Enter test name"
                        className={cn(
                          'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors',
                          createErrors.testName
                            ? 'border-red-500 dark:border-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500'
                        )}
                      />
                      {createErrors.testName && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {createErrors.testName}
                        </p>
                      )}
                    </div>

                    {/* Test Description Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={testDescription}
                        onChange={(e) => setTestDescription(e.target.value)}
                        placeholder="Enter test description (optional)"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors resize-none h-24"
                      />
                    </div>
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={handleCreateTest}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Create Test
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload and select a Word document to create a test
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions Preview Modal */}
        {selectedFile?.parsedQuestions && selectedFile.parsedQuestions.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Questions Preview
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {selectedFile.parsedQuestions.map((question, idx) => (
                <div
                  key={question.id}
                  className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white break-words">
                        {question.questionText}
                      </p>

                      {question.options && question.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, optIdx) => (
                            <p
                              key={optIdx}
                              className={cn(
                                'text-sm pl-4',
                                option === question.correctAnswer
                                  ? 'text-green-600 dark:text-green-400 font-medium'
                                  : 'text-gray-600 dark:text-gray-400'
                              )}
                            >
                              {String.fromCharCode(65 + optIdx)}) {option}
                            </p>
                          ))}
                        </div>
                      )}

                      {question.section && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Section: {question.section}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
