'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { classesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Section {
  id: string;
  name: string;
  capacity: number;
  classTeacherId?: string;
  classTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  class: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    students: number;
  };
}

interface ClassOption {
  id: string;
  name: string;
  code: string;
  sections: Section[];
}

type PageMode = 'list' | 'add' | 'edit';

interface SectionFormData {
  name: string;
  capacity: number;
  classId: string;
}

const initialFormData: SectionFormData = {
  name: '',
  capacity: 40,
  classId: '',
};

export default function BatchesPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [formData, setFormData] = useState<SectionFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Mark component as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch classes with sections
  const fetchClasses = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await classesApi.getAll(accessToken);
      if (res.success && res.data) {
        setClasses(res.data as ClassOption[]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    if (mode === 'list' && mounted) {
      fetchClasses();
    }
  }, [mode, fetchClasses, mounted]);

  // Get all sections flattened
  const allSections = classes.flatMap((c) =>
    (c.sections || []).map((s) => ({ ...s, class: { id: c.id, name: c.name, code: c.code } }))
  );

  // Filter sections
  const filteredSections = allSections.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClassFilter || s.class.id === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Section name is required';
    if (!formData.classId) errors.classId = 'Class is required';
    if (formData.capacity < 1) errors.capacity = 'Capacity must be at least 1';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'add') {
        const res = await classesApi.createSection(formData.classId, {
          name: formData.name,
          capacity: formData.capacity,
        }, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Batch created successfully' });
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create batch', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedSection) {
        const res = await classesApi.updateSection(selectedSection.id, {
          name: formData.name,
          capacity: formData.capacity,
        }, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Batch updated successfully' });
          setSelectedSection(null);
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update batch', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving batch:', error);
      toast({ title: 'Error', description: 'Failed to save batch', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (section: Section) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete batch "${section.name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await classesApi.deleteSection(section.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Batch deleted successfully' });
        fetchClasses();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete batch', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({ title: 'Error', description: 'Failed to delete batch', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit click
  const handleEdit = (section: Section) => {
    setSelectedSection(section);
    setFormData({
      name: section.name,
      capacity: section.capacity,
      classId: section.class.id,
    });
    setFormErrors({});
    setMode('edit');
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="h-7 w-7 text-blue-600" />
              Batches (Sections)
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage class sections/batches</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="h-7 w-7 text-blue-600" />
            Batches (Sections)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage class sections/batches</p>
        </div>
        {mode === 'list' && (
          <button
            onClick={() => {
              setFormData(initialFormData);
              setFormErrors({});
              setMode('add');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Batch
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
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
            ) : filteredSections.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No batches found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class Teacher
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSections.map((section) => (
                    <tr key={section.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{section.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                          {section.class.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 dark:text-white">{section.capacity}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {section._count?.students || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {section.classTeacher ? (
                          <p className="text-gray-900 dark:text-white">
                            {section.classTeacher.firstName} {section.classTeacher.lastName}
                          </p>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(section)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(section)}
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
        </div>
      )}

      {/* Add/Edit Form */}
      {(mode === 'add' || mode === 'edit') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Add New Batch' : 'Edit Batch'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedSection(null);
                setFormData(initialFormData);
                setFormErrors({});
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  disabled={mode === 'edit'}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50',
                    formErrors.classId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formErrors.classId && <p className="text-red-500 text-sm mt-1">{formErrors.classId}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Batch/Section Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="A, B, C, etc."
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  min={1}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                    formErrors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.capacity && <p className="text-red-500 text-sm mt-1">{formErrors.capacity}</p>}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedSection(null);
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
                {mode === 'add' ? 'Create Batch' : 'Update Batch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
