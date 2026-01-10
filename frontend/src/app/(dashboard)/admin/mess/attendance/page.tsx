'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { mealAttendanceService, MealAttendance, SafeVariant } from '@/services/mess/meal-attendance.service';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<MealAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [safeVariants, setSafeVariants] = useState<SafeVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    enrollmentId: '',
    mealId: '',
    variantId: '',
    status: 'PRESENT' as const,
    attendanceDate: new Date().toISOString().split('T')[0],
  });

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const response = await mealAttendanceService.getAll();
      setAttendances(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, []);

  const loadSafeVariants = async (studentId: string, mealId: string) => {
    if (!studentId || !mealId) return;
    try {
      setLoadingVariants(true);
      const result = await mealAttendanceService.getSafeVariants(studentId, mealId);
      setSafeVariants(result.safeVariants);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleMealChange = (mealId: string) => {
    setFormData({ ...formData, mealId, variantId: '' });
    if (formData.studentId) {
      loadSafeVariants(formData.studentId, mealId);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setFormData({ ...formData, studentId });
    if (formData.mealId) {
      loadSafeVariants(studentId, formData.mealId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAttendance = await mealAttendanceService.markAttendance({
        studentId: formData.studentId,
        enrollmentId: formData.enrollmentId,
        mealId: formData.mealId,
        variantId: formData.variantId,
        status: formData.status,
        attendanceDate: new Date(formData.attendanceDate),
      });
      setAttendances([newAttendance, ...attendances]);
      setShowForm(false);
      setFormData({
        studentId: '',
        enrollmentId: '',
        mealId: '',
        variantId: '',
        status: 'PRESENT',
        attendanceDate: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this attendance record?')) {
      try {
        await mealAttendanceService.delete(id);
        setAttendances(attendances.filter((a) => a.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meal Attendance</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          Mark Attendance
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
            <h2 className="text-2xl font-bold">Mark Attendance</h2>
            <button onClick={() => setShowForm(false)}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student ID</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Enrollment ID</label>
              <input
                type="text"
                value={formData.enrollmentId}
                onChange={(e) =>
                  setFormData({ ...formData, enrollmentId: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meal ID</label>
              <input
                type="text"
                value={formData.mealId}
                onChange={(e) => handleMealChange(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="HOLIDAY">Holiday</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Safe Variants</label>
              {loadingVariants ? (
                <p className="text-gray-600">Loading variants...</p>
              ) : safeVariants.length > 0 ? (
                <select
                  value={formData.variantId}
                  onChange={(e) =>
                    setFormData({ ...formData, variantId: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select a variant</option>
                  {safeVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.variantType} - ₹{v.variantCost}
                      {!v.isSafe && ' (UNSAFE)'}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-600">Select meal to see safe variants</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Attendance Date</label>
              <input
                type="date"
                value={formData.attendanceDate}
                onChange={(e) =>
                  setFormData({ ...formData, attendanceDate: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="col-span-2 flex gap-4 justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Mark Attendance
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading attendance records...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Meal</th>
                <th className="px-4 py-3 text-left">Variant</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Allergy Verified</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((attendance) => (
                <tr key={attendance.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{attendance.enrollment?.student?.firstName || 'N/A'}</td>
                  <td className="px-4 py-3">{attendance.meal?.name || 'N/A'}</td>
                  <td className="px-4 py-3">{attendance.variant?.variantType || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        attendance.status === 'PRESENT'
                          ? 'bg-green-100 text-green-800'
                          : attendance.status === 'ABSENT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {attendance.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(attendance.attendanceDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {attendance.allergyVerified ? '✓' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(attendance.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
