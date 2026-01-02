'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Layers,
  ChevronDown,
  ChevronRight,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { classesApi, subjectsApi, Class, Subject, Section } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type TabType = 'classes' | 'subjects';
type PageMode = 'list' | 'add' | 'edit';

interface ClassFormData {
  name: string;
  displayOrder: number;
}

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
}

interface SectionFormData {
  name: string;
  capacity: number;
}

const initialClassFormData: ClassFormData = { name: '', displayOrder: 0 };
const initialSubjectFormData: SubjectFormData = { name: '', code: '', description: '' };
const initialSectionFormData: SectionFormData = { name: '', capacity: 40 };

export default function ClassesSubjectsPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('classes');
  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Classes state
  const [classes, setClasses] = useState<Class[]>([]);
  const [classFormData, setClassFormData] = useState<ClassFormData>(initialClassFormData);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<string[]>([]);
  const [classSections, setClassSections] = useState<Record<string, Section[]>>({});

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectFormData, setSubjectFormData] = useState<SubjectFormData>(initialSubjectFormData);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Section modal state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionFormData, setSectionFormData] = useState<SectionFormData>(initialSectionFormData);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionParentClassId, setSectionParentClassId] = useState<string>('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await classesApi.getAll(accessToken);
      if (res.success && res.data) {
        setClasses(res.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ title: 'Error', description: 'Failed to fetch classes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await subjectsApi.getAll(accessToken);
      if (res.success && res.data) {
        setSubjects(res.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({ title: 'Error', description: 'Failed to fetch subjects', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  // Fetch sections for a class
  const fetchSections = async (classId: string) => {
    if (!accessToken) return;
    try {
      const res = await classesApi.getSections(classId, accessToken);
      if (res.success && res.data) {
        setClassSections(prev => ({ ...prev, [classId]: res.data || [] }));
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  useEffect(() => {
    if (mode === 'list') {
      if (activeTab === 'classes') {
        fetchClasses();
      } else {
        fetchSubjects();
      }
    }
  }, [mode, activeTab, fetchClasses, fetchSubjects]);

  // Toggle class expansion
  const toggleClassExpand = async (classId: string) => {
    if (expandedClasses.includes(classId)) {
      setExpandedClasses(prev => prev.filter(id => id !== classId));
    } else {
      setExpandedClasses(prev => [...prev, classId]);
      if (!classSections[classId]) {
        await fetchSections(classId);
      }
    }
  };

  // Handle class form submit
  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const errors: Record<string, string> = {};
    if (!classFormData.name.trim()) errors.name = 'Name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'add') {
        const res = await classesApi.create(classFormData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Class created successfully' });
          setClassFormData(initialClassFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create class', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedClass) {
        const res = await classesApi.update(selectedClass.id, classFormData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Class updated successfully' });
          setSelectedClass(null);
          setClassFormData(initialClassFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update class', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving class:', error);
      toast({ title: 'Error', description: 'Failed to save class', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subject form submit
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const errors: Record<string, string> = {};
    if (!subjectFormData.name.trim()) errors.name = 'Name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'add') {
        const res = await subjectsApi.create(subjectFormData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Subject created successfully' });
          setSubjectFormData(initialSubjectFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create subject', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedSubject) {
        const res = await subjectsApi.update(selectedSubject.id, subjectFormData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Subject updated successfully' });
          setSelectedSubject(null);
          setSubjectFormData(initialSubjectFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update subject', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      toast({ title: 'Error', description: 'Failed to save subject', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete class
  const handleDeleteClass = async (cls: Class) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete "${cls.name}"? This will also delete all sections.`)) return;

    setIsLoading(true);
    try {
      const res = await classesApi.delete(cls.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Class deleted successfully' });
        fetchClasses();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete class', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({ title: 'Error', description: 'Failed to delete class', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete subject
  const handleDeleteSubject = async (subject: Subject) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await subjectsApi.delete(subject.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Subject deleted successfully' });
        fetchSubjects();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete subject', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle section submit
  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !sectionParentClassId) return;

    setIsLoading(true);
    try {
      if (editingSection) {
        const res = await classesApi.updateSection(editingSection.id, sectionFormData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Section updated successfully' });
          fetchSections(sectionParentClassId);
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update section', variant: 'destructive' });
        }
      } else {
        const res = await classesApi.createSection(sectionParentClassId, sectionFormData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Section created successfully' });
          fetchSections(sectionParentClassId);
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create section', variant: 'destructive' });
        }
      }
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionFormData(initialSectionFormData);
    } catch (error) {
      console.error('Error saving section:', error);
      toast({ title: 'Error', description: 'Failed to save section', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete section
  const handleDeleteSection = async (section: Section, classId: string) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete section "${section.name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await classesApi.deleteSection(section.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Section deleted successfully' });
        fetchSections(classId);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete section', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data
  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="h-7 w-7 text-indigo-600" />
            Classes & Subjects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage classes, sections, and subjects</p>
        </div>
        {mode === 'list' && (
          <button
            onClick={() => {
              setFormErrors({});
              if (activeTab === 'classes') {
                setClassFormData(initialClassFormData);
              } else {
                setSubjectFormData(initialSubjectFormData);
              }
              setMode('add');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === 'classes' ? 'Class' : 'Subject'}
          </button>
        )}
      </div>

      {/* Tabs */}
      {mode === 'list' && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('classes'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'classes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Classes
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('subjects'); setSearchTerm(''); }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'subjects'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </span>
          </button>
        </div>
      )}

      {/* List View */}
      {mode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Classes List */}
          {activeTab === 'classes' && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No classes found</p>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <div key={cls.id}>
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleClassExpand(cls.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {expandedClasses.includes(cls.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{cls.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {cls._count?.students || 0} students
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSectionParentClassId(cls.id);
                            setSectionFormData(initialSectionFormData);
                            setEditingSection(null);
                            setShowSectionModal(true);
                          }}
                          className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          + Section
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClass(cls);
                            setClassFormData({ name: cls.name, displayOrder: cls.displayOrder || 0 });
                            setFormErrors({});
                            setMode('edit');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sections */}
                    {expandedClasses.includes(cls.id) && (
                      <div className="bg-gray-50 dark:bg-gray-900/30 px-4 py-2 ml-12 mr-4 mb-4 rounded-lg">
                        {classSections[cls.id]?.length === 0 ? (
                          <p className="text-sm text-gray-500 py-2">No sections</p>
                        ) : (
                          <div className="space-y-2">
                            {classSections[cls.id]?.map((section) => (
                              <div
                                key={section.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Layers className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium">{section.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({section._count?.students || 0}/{section.capacity || '?'} students)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setSectionParentClassId(cls.id);
                                      setEditingSection(section);
                                      setSectionFormData({
                                        name: section.name,
                                        capacity: section.capacity || 40,
                                      });
                                      setShowSectionModal(true);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSection(section, cls.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Subjects List */}
          {activeTab === 'subjects' && (
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No subjects found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{subject.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {subject.code || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                          {subject.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedSubject(subject);
                                setSubjectFormData({
                                  name: subject.name,
                                  code: subject.code || '',
                                  description: subject.description || '',
                                });
                                setFormErrors({});
                                setMode('edit');
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(subject)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Class Form */}
      {(mode === 'add' || mode === 'edit') && activeTab === 'classes' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Add New Class' : 'Edit Class'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedClass(null);
                setClassFormData(initialClassFormData);
                setFormErrors({});
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleClassSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={classFormData.name}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500',
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="e.g., Class 10, Grade 12"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={classFormData.displayOrder}
                  onChange={(e) => setClassFormData({ ...classFormData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedClass(null);
                  setClassFormData(initialClassFormData);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Create Class' : 'Update Class'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Subject Form */}
      {(mode === 'add' || mode === 'edit') && activeTab === 'subjects' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Add New Subject' : 'Edit Subject'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedSubject(null);
                setSubjectFormData(initialSubjectFormData);
                setFormErrors({});
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubjectSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500',
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="e.g., Mathematics, Physics"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={subjectFormData.code}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., MATH, PHY"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={subjectFormData.description}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of the subject"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedSubject(null);
                  setSubjectFormData(initialSubjectFormData);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Create Subject' : 'Update Subject'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSection ? 'Edit Section' : 'Add Section'}
              </h3>
              <button
                onClick={() => {
                  setShowSectionModal(false);
                  setEditingSection(null);
                  setSectionFormData(initialSectionFormData);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sectionFormData.name}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., A, B, Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={sectionFormData.capacity}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: parseInt(e.target.value) || 40 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="40"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionModal(false);
                    setEditingSection(null);
                    setSectionFormData(initialSectionFormData);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
