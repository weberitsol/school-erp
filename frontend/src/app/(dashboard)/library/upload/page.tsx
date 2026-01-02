'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Plus,
  FolderUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { booksApi, BookCategory, subjectsApi, Subject } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type UploadMode = 'single' | 'bulk' | 'external';

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export default function UploadBookPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [isLoading, setIsLoading] = useState(false);

  // Categories and subjects
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Single upload form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    categoryId: '',
    subjectId: '',
    classLevel: '',
    chapterNumber: '',
    tags: '',
  });

  // External URL form
  const [externalForm, setExternalForm] = useState({
    title: '',
    description: '',
    author: '',
    externalUrl: '',
    externalProvider: '',
    categoryId: '',
    subjectId: '',
    classLevel: '',
    tags: '',
  });

  // Bulk upload
  const [bulkFiles, setBulkFiles] = useState<FileWithPreview[]>([]);
  const [bulkSettings, setBulkSettings] = useState({
    categoryId: '',
    subjectId: '',
    classLevel: '',
  });

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isTeacher) {
      router.push('/library');
    }
  }, [isTeacher, router]);

  // Fetch categories and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        const [catRes, subRes] = await Promise.all([
          booksApi.getCategories(accessToken),
          subjectsApi.getAll(accessToken),
        ]);
        if (catRes.success && catRes.data) setCategories(catRes.data);
        if (subRes.success && subRes.data) setSubjects(subRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [accessToken]);

  // Handle single file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please select a PDF file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      // Auto-fill title from filename
      if (!formData.title) {
        const title = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
        setFormData(prev => ({ ...prev, title }));
      }
    }
  };

  // Handle bulk file selection
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(f => f.type === 'application/pdf') as FileWithPreview[];
    pdfFiles.forEach(f => {
      f.uploadStatus = 'pending';
    });
    setBulkFiles(prev => [...prev, ...pdfFiles]);
  };

  // Remove file from bulk list
  const removeBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle single upload
  const handleSingleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !accessToken) return;

    if (!formData.categoryId) {
      toast({
        title: 'Category required',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await booksApi.upload(
        selectedFile,
        {
          title: formData.title,
          description: formData.description || undefined,
          author: formData.author || undefined,
          categoryId: formData.categoryId,
          subjectId: formData.subjectId || undefined,
          classLevel: formData.classLevel || undefined,
          chapterNumber: formData.chapterNumber ? parseInt(formData.chapterNumber) : undefined,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
        },
        accessToken
      );

      if (response.success) {
        toast({
          title: 'Book uploaded!',
          description: 'The book has been uploaded successfully.',
        });
        router.push('/library');
      } else {
        toast({
          title: 'Upload failed',
          description: response.error || 'Failed to upload book',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle external URL submission
  const handleExternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!externalForm.categoryId || !externalForm.externalUrl || !externalForm.title) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in title, URL, and category',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await booksApi.addExternal(
        {
          title: externalForm.title,
          description: externalForm.description || undefined,
          author: externalForm.author || undefined,
          externalUrl: externalForm.externalUrl,
          externalProvider: externalForm.externalProvider || undefined,
          categoryId: externalForm.categoryId,
          subjectId: externalForm.subjectId || undefined,
          classLevel: externalForm.classLevel || undefined,
          tags: externalForm.tags ? externalForm.tags.split(',').map(t => t.trim()) : undefined,
        },
        accessToken
      );

      if (response.success) {
        toast({
          title: 'Book added!',
          description: 'The external book link has been added.',
        });
        router.push('/library');
      } else {
        toast({
          title: 'Failed to add book',
          description: response.error || 'Failed to add external book',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!accessToken || bulkFiles.length === 0) return;

    if (!bulkSettings.categoryId) {
      toast({
        title: 'Category required',
        description: 'Please select a category for bulk upload',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await booksApi.bulkUpload(
        bulkFiles,
        {
          categoryId: bulkSettings.categoryId,
          subjectId: bulkSettings.subjectId || undefined,
          classLevel: bulkSettings.classLevel || undefined,
        },
        accessToken
      );

      if (response.success) {
        toast({
          title: 'Books uploaded!',
          description: `${bulkFiles.length} books have been uploaded.`,
        });
        router.push('/library');
      } else {
        toast({
          title: 'Upload failed',
          description: response.error || 'Failed to upload books',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const classLevels = ['10', '11', '12'];

  // Build flat category list with indentation
  const buildFlatCategories = (parentId: string | null = null, depth = 0): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = [];
    const children = categories.filter(c => (parentId ? c.parentId === parentId : !c.parentId));
    children.forEach(child => {
      result.push({ id: child.id, name: child.name, depth });
      result.push(...buildFlatCategories(child.id, depth + 1));
    });
    return result;
  };

  const flatCategories = buildFlatCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/library"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Books</h1>
          <p className="text-gray-500 dark:text-gray-400">Add new books to the library</p>
        </div>
      </div>

      {/* Upload Mode Tabs */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-1.5 inline-flex">
        <button
          onClick={() => setUploadMode('single')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2',
            uploadMode === 'single'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <Upload className="h-4 w-4" />
          Single Upload
        </button>
        <button
          onClick={() => setUploadMode('bulk')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2',
            uploadMode === 'bulk'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <FolderUp className="h-4 w-4" />
          Bulk Upload
        </button>
        <button
          onClick={() => setUploadMode('external')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2',
            uploadMode === 'external'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <ExternalLink className="h-4 w-4" />
          External URL
        </button>
      </div>

      {/* Single Upload Form */}
      {uploadMode === 'single' && (
        <form onSubmit={handleSingleUpload} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Upload Area */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">PDF File</h2>
                <label className="block">
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                      selectedFile
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                          <FileText className="h-8 w-8 text-emerald-600" />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedFile(null);
                          }}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-400">PDF files only (max 100MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Book Details</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    >
                      <option value="">Select category</option>
                      {flatCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {'  '.repeat(cat.depth)}{cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">Select subject</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Class Level
                    </label>
                    <select
                      value={formData.classLevel}
                      onChange={e => setFormData(prev => ({ ...prev, classLevel: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">Select class</option>
                      {classLevels.map(level => (
                        <option key={level} value={level}>Class {level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Chapter Number
                    </label>
                    <input
                      type="number"
                      value={formData.chapterNumber}
                      onChange={e => setFormData(prev => ({ ...prev, chapterNumber: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="physics, mechanics, ncert"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Link
                    href="/library"
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading || !selectedFile}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload Book
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Bulk Upload */}
      {uploadMode === 'bulk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Drop Area */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Select Files</h2>
                <label className="block mb-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                    <FolderUp className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Click to select multiple PDF files
                    </p>
                    <p className="text-sm text-gray-400">Up to 50 files at once</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleBulkFileSelect}
                    className="hidden"
                  />
                </label>

                {bulkFiles.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bulkFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                      >
                        <FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBulkFile(index)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Bulk Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  These settings will apply to all uploaded files
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={bulkSettings.categoryId}
                    onChange={e => setBulkSettings(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  >
                    <option value="">Select category</option>
                    {flatCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.depth)}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={bulkSettings.subjectId}
                    onChange={e => setBulkSettings(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="">Select subject</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class Level
                  </label>
                  <select
                    value={bulkSettings.classLevel}
                    onChange={e => setBulkSettings(prev => ({ ...prev, classLevel: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="">Select class</option>
                    {classLevels.map(level => (
                      <option key={level} value={level}>Class {level}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={isLoading || bulkFiles.length === 0}
                  className="w-full px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload {bulkFiles.length} Files
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External URL Form */}
      {uploadMode === 'external' && (
        <form onSubmit={handleExternalSubmit} className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">External Book Link</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Book URL *
                </label>
                <input
                  type="url"
                  value={externalForm.externalUrl}
                  onChange={e => setExternalForm(prev => ({ ...prev, externalUrl: e.target.value }))}
                  placeholder="https://drive.google.com/... or https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={externalForm.title}
                  onChange={e => setExternalForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={externalForm.description}
                  onChange={e => setExternalForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provider
                </label>
                <select
                  value={externalForm.externalProvider}
                  onChange={e => setExternalForm(prev => ({ ...prev, externalProvider: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Select provider</option>
                  <option value="google_drive">Google Drive</option>
                  <option value="onedrive">OneDrive</option>
                  <option value="dropbox">Dropbox</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={externalForm.author}
                  onChange={e => setExternalForm(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={externalForm.categoryId}
                  onChange={e => setExternalForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                >
                  <option value="">Select category</option>
                  {flatCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'  '.repeat(cat.depth)}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <select
                  value={externalForm.subjectId}
                  onChange={e => setExternalForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Select subject</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class Level
                </label>
                <select
                  value={externalForm.classLevel}
                  onChange={e => setExternalForm(prev => ({ ...prev, classLevel: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Select class</option>
                  {classLevels.map(level => (
                    <option key={level} value={level}>Class {level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={externalForm.tags}
                  onChange={e => setExternalForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="physics, mechanics, ncert"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link
                href="/library"
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Book
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
