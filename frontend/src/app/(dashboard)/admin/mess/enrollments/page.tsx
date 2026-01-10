'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { enrollmentService, MessEnrollment } from '@/services/mess/enrollment.service';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<MessEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const [formData, setFormData] = useState({
    studentId: '',
    messId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    dietaryPreferences: [] as string[],
  });

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await enrollmentService.getAll();
      setEnrollments(response.data);
      setTotalRecords(response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update enrollment
        const updated = await enrollmentService.update(editingId, {
          studentId: formData.studentId,
          messId: formData.messId,
          planId: formData.planId,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          dietaryPreferences: formData.dietaryPreferences,
        });
        setEnrollments(
          enrollments.map((e) => (e.id === editingId ? updated : e))
        );
        setEditingId(null);
      } else {
        // Create enrollment
        const newEnrollment = await enrollmentService.create({
          studentId: formData.studentId,
          messId: formData.messId,
          planId: formData.planId,
          startDate: new Date(formData.startDate),
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          dietaryPreferences: formData.dietaryPreferences,
        });
        setEnrollments([newEnrollment, ...enrollments]);
      }
      setShowForm(false);
      setFormData({
        studentId: '',
        messId: '',
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        dietaryPreferences: [],
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        await enrollmentService.delete(id);
        setEnrollments(enrollments.filter((e) => e.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleEndEnrollment = async (id: string) => {
    if (window.confirm('End this enrollment?')) {
      try {
        const updated = await enrollmentService.endEnrollment(id);
        setEnrollments(
          enrollments.map((e) => (e.id === id ? updated : e))
        );
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Enrollments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          New Enrollment
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {editingId ? 'Edit Enrollment' : 'New Enrollment'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) =>
                  setFormData({ ...formData, studentId: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mess ID</label>
              <input
                type="text"
                value={formData.messId}
                onChange={(e) =>
                  setFormData({ ...formData, messId: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plan ID</label>
              <input
                type="text"
                value={formData.planId}
                onChange={(e) =>
                  setFormData({ ...formData, planId: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dietary Preferences</label>
              <input
                type="text"
                placeholder="Comma-separated"
                value={formData.dietaryPreferences.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dietaryPreferences: e.target.value
                      .split(',')
                      .map((p) => p.trim())
                      .filter((p) => p),
                  })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="col-span-2 flex gap-4 justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading enrollments...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Mess</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Start Date</th>
                <th className="px-4 py-3 text-left">End Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{enrollment.student?.firstName || 'N/A'}</td>
                  <td className="px-4 py-3">{enrollment.mess?.name || 'N/A'}</td>
                  <td className="px-4 py-3">{enrollment.plan?.name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    {new Date(enrollment.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {enrollment.endDate
                      ? new Date(enrollment.endDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        enrollment.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {enrollment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {enrollment.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleEndEnrollment(enrollment.id)}
                        className="text-orange-600 hover:text-orange-800"
                        title="End Enrollment"
                      >
                        ⏹
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(enrollment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-sm text-gray-600">
            Total: {totalRecords} enrollment(s)
          </div>
        </div>
      )}
    </div>
  );
}
