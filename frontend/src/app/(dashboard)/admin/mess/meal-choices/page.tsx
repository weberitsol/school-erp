'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, Users } from 'lucide-react';
import { mealChoiceService, type StudentMealChoice } from '@/services/mess';

export default function MealChoicesManagementPage() {
  const [choices, setChoices] = useState<StudentMealChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<StudentMealChoice | null>(null);

  const [filters, setFilters] = useState({
    studentId: '',
    variantId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await mealChoiceService.getAll(filters);
      setChoices(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meal choices');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this choice?')) return;

    try {
      await mealChoiceService.delete(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete choice');
    }
  };

  const handleViewDetails = (choice: StudentMealChoice) => {
    setSelectedChoice(choice);
    setShowDetailsModal(true);
  };

  const getVariantTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      VEG: 'bg-green-100 text-green-800',
      NON_VEG: 'bg-red-100 text-red-800',
      VEGAN: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Student Meal Choices
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Filter by Student ID"
              value={filters.studentId}
              onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Filter by Variant ID"
              value={filters.variantId}
              onChange={(e) => setFilters({ ...filters, variantId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-gray-600 text-sm font-medium">Total Choices</h3>
            <p className="text-3xl font-bold text-blue-600 mt-1">{choices.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-gray-600 text-sm font-medium">Unique Students</h3>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {new Set(choices.map(c => c.studentId)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-gray-600 text-sm font-medium">Recent Choices</h3>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {choices.filter(c => {
                const date = new Date(c.chosenAt);
                const today = new Date();
                return date.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
        </div>

        {/* Choices Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Variant ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Chosen Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Last Updated</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {choices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No meal choices found
                  </td>
                </tr>
              ) : (
                choices.map((choice) => (
                  <tr key={choice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{choice.studentId}</td>
                    <td className="px-6 py-4 text-sm">{choice.variantId}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(choice.chosenAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(choice.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewDetails(choice)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteChoice(choice.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedChoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold">Meal Choice Details</h3>
              </div>
              <div className="space-y-3 border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Student ID:</span>
                  <span className="font-semibold">{selectedChoice.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Variant ID:</span>
                  <span className="font-semibold">{selectedChoice.variantId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chosen Date:</span>
                  <span className="font-semibold">
                    {new Date(selectedChoice.chosenAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-semibold">
                    {new Date(selectedChoice.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Verify this choice complies with the student's dietary requirements and allergies before meal service.
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
