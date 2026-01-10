'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BarChart3, Users } from 'lucide-react';
import { messService, type Mess, type CreateMessDto } from '@/services/mess';

export default function MessManagementPage() {
  const [messes, setMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMess, setEditingMess] = useState<Mess | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStats, setSelectedStats] = useState<any>(null);

  const [formData, setFormData] = useState<CreateMessDto>({
    name: '',
    code: '',
    capacity: 0,
    location: '',
    manager: '',
    contactPhone: '',
    contactEmail: '',
  });

  useEffect(() => {
    fetchMesses();
  }, []);

  const fetchMesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messService.getAll({ search: searchTerm || undefined });
      setMesses(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mess data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim() || !formData.capacity) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setError(null);

      if (editingMess) {
        await messService.update(editingMess.id, formData);
      } else {
        await messService.create(formData);
      }

      await fetchMesses();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mess');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mess?')) return;

    try {
      await messService.delete(id);
      await fetchMesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mess');
    }
  };

  const handleEdit = (mess: Mess) => {
    setEditingMess(mess);
    setFormData({
      name: mess.name,
      code: mess.code,
      capacity: mess.capacity,
      location: mess.location,
      manager: mess.manager,
      contactPhone: mess.contactPhone,
      contactEmail: mess.contactEmail,
    });
    setShowForm(true);
  };

  const handleViewStats = async (mess: Mess) => {
    try {
      const stats = await messService.getStatistics(mess.id);
      setSelectedStats({ ...stats, name: mess.name });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      capacity: 0,
      location: '',
      manager: '',
      contactPhone: '',
      contactEmail: '',
    });
    setEditingMess(null);
    setShowForm(false);
  };

  const filteredMesses = messes.filter(mess =>
    mess.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mess.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Mess Management
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Mess
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Search mess by name or code..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              if (e.target.value) {
                setTimeout(fetchMesses, 300);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Statistics Modal */}
        {selectedStats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedStats.name} - Statistics</h2>
              <button
                onClick={() => setSelectedStats(null)}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Total Enrollments</p>
                <p className="text-3xl font-bold text-blue-600">{selectedStats.totalEnrollments}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Active Enrollments</p>
                <p className="text-3xl font-bold text-green-600">{selectedStats.activeEnrollments}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Total Staff</p>
                <p className="text-3xl font-bold text-purple-600">{selectedStats.totalStaff}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Utilization</p>
                <p className="text-3xl font-bold text-orange-600">
                  {selectedStats.utilizationPercentage}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingMess ? 'Edit Mess' : 'Add New Mess'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager
                  </label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingMess ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Capacity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Manager</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMesses.length > 0 ? (
                  filteredMesses.map(mess => (
                    <tr key={mess.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{mess.name}</td>
                      <td className="px-6 py-4 text-sm">{mess.code}</td>
                      <td className="px-6 py-4 text-sm">{mess.capacity}</td>
                      <td className="px-6 py-4 text-sm">{mess.location || '-'}</td>
                      <td className="px-6 py-4 text-sm">{mess.manager || '-'}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleViewStats(mess)}
                          className="text-purple-600 hover:text-purple-800 inline-flex items-center gap-1"
                        >
                          <Users className="w-4 h-4" />
                          Stats
                        </button>
                        <button
                          onClick={() => handleEdit(mess)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(mess.id)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No messes found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
