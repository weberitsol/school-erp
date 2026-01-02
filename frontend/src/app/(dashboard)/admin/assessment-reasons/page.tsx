'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { assessmentReasonsApi, AssessmentReason } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'add' | 'edit';

interface FormData {
  name: string;
  code: string;
  description: string;
}

const initialFormData: FormData = {
  name: '',
  code: '',
  description: '',
};

export default function AssessmentReasonsPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [reasons, setReasons] = useState<AssessmentReason[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedReason, setSelectedReason] = useState<AssessmentReason | null>(null);

  // Fetch assessment reasons
  const fetchReasons = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await assessmentReasonsApi.getAll(accessToken, { search: searchTerm || undefined });
      if (res.success && res.data) {
        setReasons(res.data);
      }
    } catch (error) {
      console.error('Error fetching assessment reasons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch assessment reasons',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, searchTerm, toast]);

  useEffect(() => {
    if (mode === 'list') {
      fetchReasons();
    }
  }, [mode, fetchReasons]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.code.trim()) errors.code = 'Code is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'add') {
        const res = await assessmentReasonsApi.create(formData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Assessment reason created successfully' });
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedReason) {
        const res = await assessmentReasonsApi.update(selectedReason.id, formData, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Assessment reason updated successfully' });
          setSelectedReason(null);
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (reason: AssessmentReason) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete "${reason.name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await assessmentReasonsApi.delete(reason.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Deleted successfully' });
        fetchReasons();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit click
  const handleEdit = (reason: AssessmentReason) => {
    setSelectedReason(reason);
    setFormData({
      name: reason.name,
      code: reason.code,
      description: reason.description || '',
    });
    setFormErrors({});
    setMode('edit');
  };

  // Filter locally
  const filteredReasons = reasons.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileCheck className="h-7 w-7 text-blue-600" />
            Assessment Reasons
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage reasons for assessments (Scholarship, Promotion, etc.)
          </p>
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
            Add Reason
          </button>
        )}
      </div>

      {/* List View */}
      {mode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessment reasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredReasons.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No assessment reasons found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReasons.map((reason) => (
                    <tr key={reason.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{reason.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {reason.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs">
                          {reason.description || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                            reason.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {reason.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(reason)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reason)}
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
              {mode === 'add' ? 'Add Assessment Reason' : 'Edit Assessment Reason'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedReason(null);
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="e.g., Scholarship Evaluation"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                    formErrors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="e.g., SCHOLARSHIP"
                />
                {formErrors.code && <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the assessment reason..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedReason(null);
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
                {mode === 'add' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
