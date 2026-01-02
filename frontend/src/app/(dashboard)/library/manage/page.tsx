'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Users,
  Shield,
  Clock,
  Check,
  X,
  Loader2,
  Settings,
  Eye,
  Download,
  Lock,
  Unlock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { booksApi, Book, BookCategory, BookAccess, classesApi, Class, Section, CreateBookCategoryData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ManageTab = 'categories' | 'books' | 'access';

export default function LibraryManagePage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ManageTab>('categories');
  const [isLoading, setIsLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BookCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CreateBookCategoryData>({
    name: '',
    description: '',
    parentId: undefined,
    boardType: 'NCERT',
    classLevel: '',
    subjectCode: '',
    displayOrder: 0,
    iconName: '',
  });

  // Books state
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Access control state
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [bookAccess, setBookAccess] = useState<BookAccess[]>([]);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [accessForm, setAccessForm] = useState({
    classId: '',
    sectionId: '',
    canDownload: true,
    canAnnotate: true,
    availableFrom: '',
    availableUntil: '',
  });

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isTeacher) {
      router.push('/library');
    }
  }, [isTeacher, router]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const [catRes, booksRes, classesRes] = await Promise.all([
          booksApi.getCategories(accessToken),
          booksApi.getAll(accessToken, { limit: 100 }),
          classesApi.getAll(accessToken),
        ]);

        if (catRes.success && catRes.data) setCategories(catRes.data);
        if (booksRes.success && booksRes.data) setBooks((booksRes.data as any).books || []);
        if (classesRes.success && classesRes.data) setClasses(classesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  // Fetch sections when class changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!accessToken || !accessForm.classId) {
        setSections([]);
        return;
      }
      try {
        const response = await classesApi.getSections(accessForm.classId, accessToken);
        if (response.success && response.data) {
          setSections(response.data);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };

    fetchSections();
  }, [accessToken, accessForm.classId]);

  // Fetch book access when book is selected
  useEffect(() => {
    const fetchBookAccess = async () => {
      if (!accessToken || !selectedBook) {
        setBookAccess([]);
        return;
      }
      try {
        const response = await booksApi.getAccess(selectedBook.id, accessToken);
        if (response.success && response.data) {
          setBookAccess(response.data);
        }
      } catch (error) {
        console.error('Error fetching book access:', error);
      }
    };

    fetchBookAccess();
  }, [accessToken, selectedBook]);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Category CRUD
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    try {
      if (editingCategory) {
        const response = await booksApi.updateCategory(editingCategory.id, categoryForm, accessToken);
        if (response.success) {
          setCategories(prev =>
            prev.map(c => (c.id === editingCategory.id ? { ...c, ...categoryForm } : c))
          );
          toast({ title: 'Category updated' });
        }
      } else {
        const response = await booksApi.createCategory(categoryForm, accessToken);
        if (response.success && response.data) {
          setCategories(prev => [...prev, response.data!]);
          toast({ title: 'Category created' });
        }
      }

      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        parentId: undefined,
        boardType: 'NCERT',
        classLevel: '',
        subjectCode: '',
        displayOrder: 0,
        iconName: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (category: BookCategory) => {
    if (!accessToken) return;
    if (!confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;

    try {
      const response = await booksApi.deleteCategory(category.id, accessToken);
      if (response.success) {
        setCategories(prev => prev.filter(c => c.id !== category.id));
        toast({ title: 'Category deleted' });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete category',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  // Access control
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedBook) return;

    try {
      const response = await booksApi.grantAccess(
        selectedBook.id,
        {
          classId: accessForm.classId,
          sectionId: accessForm.sectionId || undefined,
          canDownload: accessForm.canDownload,
          canAnnotate: accessForm.canAnnotate,
          availableFrom: accessForm.availableFrom || undefined,
          availableUntil: accessForm.availableUntil || undefined,
        },
        accessToken
      );

      if (response.success && response.data) {
        setBookAccess(prev => [...prev, response.data!]);
        setShowAccessForm(false);
        setAccessForm({
          classId: '',
          sectionId: '',
          canDownload: true,
          canAnnotate: true,
          availableFrom: '',
          availableUntil: '',
        });
        toast({ title: 'Access granted' });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to grant access',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to grant access',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeAccess = async (access: BookAccess) => {
    if (!accessToken || !selectedBook) return;
    if (!confirm('Revoke access for this class/section?')) return;

    try {
      const response = await booksApi.revokeAccess(selectedBook.id, access.id, accessToken);
      if (response.success) {
        setBookAccess(prev => prev.filter(a => a.id !== access.id));
        toast({ title: 'Access revoked' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke access',
        variant: 'destructive',
      });
    }
  };

  // Publish book
  const handlePublishBook = async (book: Book) => {
    if (!accessToken) return;
    try {
      const response = await booksApi.publish(book.id, accessToken);
      if (response.success) {
        setBooks(prev => prev.map(b => (b.id === book.id ? { ...b, status: 'PUBLISHED' } : b)));
        toast({ title: 'Book published' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish book',
        variant: 'destructive',
      });
    }
  };

  // Delete book
  const handleDeleteBook = async (book: Book) => {
    if (!accessToken) return;
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    try {
      const response = await booksApi.delete(book.id, accessToken);
      if (response.success) {
        setBooks(prev => prev.filter(b => b.id !== book.id));
        if (selectedBook?.id === book.id) setSelectedBook(null);
        toast({ title: 'Book deleted' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete book',
        variant: 'destructive',
      });
    }
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

    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group"
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <button
            onClick={() => hasChildren && toggleCategory(category.id)}
            className="p-1"
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
          </button>
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 text-amber-500" />
          )}
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={() => {
                setEditingCategory(category);
                setCategoryForm({
                  name: category.name,
                  description: category.description || '',
                  parentId: category.parentId || undefined,
                  boardType: category.boardType || 'NCERT',
                  classLevel: category.classLevel || '',
                  subjectCode: category.subjectCode || '',
                  displayOrder: category.displayOrder,
                  iconName: category.iconName || '',
                });
                setShowCategoryForm(true);
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              <Edit className="h-3.5 w-3.5 text-gray-500" />
            </button>
            <button
              onClick={() => handleDeleteCategory(category)}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children.map(child => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Build flat category list for select
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
  const classLevels = ['10', '11', '12'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage categories, books, and access control</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-1.5 inline-flex">
        {[
          { id: 'categories', label: 'Categories', icon: Folder },
          { id: 'books', label: 'Books', icon: BookOpen },
          { id: 'access', label: 'Access Control', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ManageTab)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2',
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Book Categories</h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({
                  name: '',
                  description: '',
                  parentId: undefined,
                  boardType: 'NCERT',
                  classLevel: '',
                  subjectCode: '',
                  displayOrder: 0,
                  iconName: '',
                });
                setShowCategoryForm(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {/* Category Tree */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-2">
            {buildCategoryTree().length > 0 ? (
              buildCategoryTree().map(category => renderCategoryItem(category))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No categories yet. Create your first category.
              </p>
            )}
          </div>

          {/* Category Form Modal */}
          {showCategoryForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Parent Category
                    </label>
                    <select
                      value={categoryForm.parentId || ''}
                      onChange={e => setCategoryForm(prev => ({ ...prev, parentId: e.target.value || undefined }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="">None (Root Category)</option>
                      {flatCategories
                        .filter(c => c.id !== editingCategory?.id)
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {'  '.repeat(cat.depth)}{cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Board Type
                      </label>
                      <select
                        value={categoryForm.boardType || ''}
                        onChange={e => setCategoryForm(prev => ({ ...prev, boardType: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">None</option>
                        <option value="NCERT">NCERT</option>
                        <option value="CBSE">CBSE</option>
                        <option value="STATE">State Board</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Class Level
                      </label>
                      <select
                        value={categoryForm.classLevel || ''}
                        onChange={e => setCategoryForm(prev => ({ ...prev, classLevel: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="">Any</option>
                        {classLevels.map(level => (
                          <option key={level} value={level}>Class {level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description || ''}
                      onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-600"
                    >
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">All Books</h2>
            <Link
              href="/library/upload"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload Book
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Class</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{book.title}</p>
                          <p className="text-xs text-gray-500">{book.author || 'No author'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {book.category?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {book.classLevel ? `Class ${book.classLevel}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          book.status === 'PUBLISHED'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                            : book.status === 'DRAFT'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                        )}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/library/${book.id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedBook(book);
                            setActiveTab('access');
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Manage Access"
                        >
                          <Shield className="h-4 w-4 text-gray-500" />
                        </button>
                        {book.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublishBook(book)}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                            title="Publish"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBook(book)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {books.length === 0 && (
              <p className="text-center text-gray-500 py-8">No books yet. Upload your first book.</p>
            )}
          </div>
        </div>
      )}

      {/* Access Control Tab */}
      {activeTab === 'access' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Book List */}
          <div className="lg:col-span-1 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Select Book</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {books.map(book => (
                <button
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl transition-all',
                    selectedBook?.id === book.id
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                  )}
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {book.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {book.category?.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Access Rules */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
            {selectedBook ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Access Rules: {selectedBook.title}
                    </h3>
                    <p className="text-sm text-gray-500">Configure which classes can access this book</p>
                  </div>
                  <button
                    onClick={() => setShowAccessForm(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Grant Access
                  </button>
                </div>

                {/* Access List */}
                <div className="space-y-3">
                  {bookAccess.map(access => (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {access.class?.name || 'Unknown Class'}
                            {access.section && ` - ${access.section.name}`}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn(
                              'flex items-center gap-1 text-xs',
                              access.canDownload ? 'text-green-600' : 'text-gray-400'
                            )}>
                              <Download className="h-3 w-3" />
                              Download
                            </span>
                            <span className={cn(
                              'flex items-center gap-1 text-xs',
                              access.canAnnotate ? 'text-green-600' : 'text-gray-400'
                            )}>
                              <Edit className="h-3 w-3" />
                              Annotate
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeAccess(access)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                        title="Revoke Access"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  ))}

                  {bookAccess.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No access rules configured. Grant access to classes.
                    </p>
                  )}
                </div>

                {/* Grant Access Form Modal */}
                {showAccessForm && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Grant Access
                      </h3>
                      <form onSubmit={handleGrantAccess} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Class *
                          </label>
                          <select
                            value={accessForm.classId}
                            onChange={e => setAccessForm(prev => ({ ...prev, classId: e.target.value, sectionId: '' }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                            required
                          >
                            <option value="">Select class</option>
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Section (optional)
                          </label>
                          <select
                            value={accessForm.sectionId}
                            onChange={e => setAccessForm(prev => ({ ...prev, sectionId: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                            disabled={!accessForm.classId}
                          >
                            <option value="">All Sections</option>
                            {sections.map(sec => (
                              <option key={sec.id} value={sec.id}>{sec.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={accessForm.canDownload}
                              onChange={e => setAccessForm(prev => ({ ...prev, canDownload: e.target.checked }))}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Allow Download</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={accessForm.canAnnotate}
                              onChange={e => setAccessForm(prev => ({ ...prev, canAnnotate: e.target.checked }))}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Allow Annotations</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Available From
                            </label>
                            <input
                              type="datetime-local"
                              value={accessForm.availableFrom}
                              onChange={e => setAccessForm(prev => ({ ...prev, availableFrom: e.target.value }))}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Available Until
                            </label>
                            <input
                              type="datetime-local"
                              value={accessForm.availableUntil}
                              onChange={e => setAccessForm(prev => ({ ...prev, availableUntil: e.target.value }))}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowAccessForm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-600"
                          >
                            Grant Access
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Shield className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Select a book to manage access</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
