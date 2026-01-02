'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  BookOpen,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  ExternalLink,
  Upload,
  Download,
  Eye,
  Settings,
  Grid,
  List,
  Filter,
  Loader2,
  RefreshCw,
  Library,
  BookMarked,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { booksApi, Book, BookCategory, BookStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function LibraryPage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('');

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isStudent = user?.role === 'STUDENT';

  // Fetch categories
  const fetchCategories = async () => {
    if (!accessToken) return;
    try {
      const response = await booksApi.getCategories(accessToken);
      if (response.success && response.data) {
        setCategories(response.data);
        // Auto-expand root categories
        const roots = response.data.filter(c => !c.parentId).map(c => c.id);
        setExpandedCategories(new Set(roots));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch books based on role
  const fetchBooks = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedClassLevel) params.classLevel = selectedClassLevel;
      if (searchQuery) params.search = searchQuery;

      let response;
      if (isStudent) {
        response = await booksApi.getAvailable(accessToken, params);
      } else {
        response = await booksApi.getAll(accessToken, params);
      }

      if (response.success && response.data) {
        setBooks(isStudent ? (response.data as Book[]) : (response.data as any).books || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch books',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [accessToken]);

  useEffect(() => {
    fetchBooks();
  }, [accessToken, selectedCategory, selectedClassLevel, searchQuery]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Build category tree
  const buildCategoryTree = (parentId: string | null = null): BookCategory[] => {
    return categories
      .filter(c => (parentId ? c.parentId === parentId : !c.parentId))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  };

  // Render category item
  const renderCategoryItem = (category: BookCategory, depth = 0) => {
    const children = categories.filter(c => c.parentId === category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id}>
        <button
          onClick={() => {
            setSelectedCategory(isSelected ? null : category.id);
            if (hasChildren) toggleCategory(category.id);
          }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all',
            isSelected
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )
          ) : (
            <span className="w-4" />
          )}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500" />
            )
          ) : (
            <BookOpen className="h-4 w-4 text-blue-500" />
          )}
          <span className="flex-1 text-left truncate">{category.name}</span>
          {category._count?.books ? (
            <span className="text-xs text-gray-400">{category._count.books}</span>
          ) : null}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children.map(child => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const classLevels = ['', '10', '11', '12'];

  const filteredBooks = books.filter(book => {
    if (searchQuery && !book.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    total: books.length,
    published: books.filter(b => b.status === 'PUBLISHED').length,
    categories: categories.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Library className="h-6 w-6" />
              <span className="text-sm font-medium text-emerald-200">Digital Library</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Books & Study Materials</h1>
            <p className="text-emerald-100 mt-2 max-w-md">
              {isTeacher
                ? 'Upload, organize and manage books for your students'
                : 'Access your study materials, textbooks, and notes'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBooks}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
            </button>
            {isTeacher && (
              <>
                <Link
                  href="/library/manage"
                  className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title="Manage Library"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <Link
                  href="/library/upload"
                  className="px-5 py-2.5 text-sm font-medium text-emerald-600 bg-white rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center gap-2 w-fit"
                >
                  <Upload className="h-4 w-4" />
                  Upload Book
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Books</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <BookMarked className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Folder className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.categories}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - Categories */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Categories</h2>
              {isTeacher && (
                <Link
                  href="/library/manage"
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Manage
                </Link>
              )}
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all mb-2',
                selectedCategory === null
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              )}
            >
              <Library className="h-4 w-4" />
              All Books
            </button>
            <div className="space-y-1">
              {buildCategoryTree().map(category => renderCategoryItem(category))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Filters */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedClassLevel}
                  onChange={e => setSelectedClassLevel(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">All Classes</option>
                  {classLevels.slice(1).map(level => (
                    <option key={level} value={level}>Class {level}</option>
                  ))}
                </select>

                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'text-gray-500'
                    )}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'text-gray-500'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading books...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Books Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredBooks.map((book, index) => (
                    <Link
                      key={book.id}
                      href={`/library/${book.id}`}
                      className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center relative">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-16 w-16 text-emerald-300 dark:text-emerald-700" />
                        )}
                        {book.sourceType === 'EXTERNAL_URL' && (
                          <div className="absolute top-3 right-3 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg">
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            by {book.author}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {book.subject && (
                            <span className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                              {book.subject.name}
                            </span>
                          )}
                          {book.classLevel && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                              Class {book.classLevel}
                            </span>
                          )}
                        </div>
                        {book.pageCount && (
                          <p className="text-xs text-gray-400 mt-2">
                            {book.pageCount} pages
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBooks.map(book => (
                    <Link
                      key={book.id}
                      href={`/library/${book.id}`}
                      className="flex items-center gap-4 p-4 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl flex items-center justify-center">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <FileText className="h-8 w-8 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {book.author || 'Unknown Author'}
                          {book.subject && ` - ${book.subject.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {book.classLevel && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            Class {book.classLevel}
                          </span>
                        )}
                        <Eye className="h-5 w-5 text-gray-400 group-hover:text-emerald-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {filteredBooks.length === 0 && (
                <div className="text-center py-16 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No books found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    {isTeacher
                      ? 'Upload your first book to get started'
                      : 'No books available in this category yet'}
                  </p>
                  {isTeacher && (
                    <Link
                      href="/library/upload"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg shadow-emerald-500/25"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Book
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
