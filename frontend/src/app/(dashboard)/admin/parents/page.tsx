'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  relation: string;
  phone: string;
  email?: string;
  occupation?: string;
  city?: string;
  children: { student: { firstName: string; lastName: string } }[];
  user: { isActive: boolean };
}

interface ParentsResponse {
  data: Parent[];
}

interface StatsResponse {
  data: {
    totalParents?: number;
    emailCoverage?: number;
    fathersCount?: number;
    mothersCount?: number;
  };
}

export default function ParentsPage() {
  const { accessToken } = useAuthStore();
  const [parents, setParents] = useState<Parent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRelation, setFilterRelation] = useState('ALL');

  useEffect(() => {
    if (accessToken) {
      fetchParents();
      fetchStats();
    }
  }, [accessToken]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ParentsResponse>('/api/v1/parents');
      setParents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<StatsResponse>('/api/v1/parents/stats');
      setStats(response.data || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getRelationColor = (relation: string) => {
    const colors: { [key: string]: string } = {
      'Father': 'bg-blue-100 text-blue-800',
      'Mother': 'bg-pink-100 text-pink-800',
      'Guardian': 'bg-purple-100 text-purple-800',
    };
    return colors[relation] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Parents Management</h1>
            <p className="text-gray-600 mt-1">Manage parent profiles and relationships</p>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Total Parents</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalParents || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Email Coverage</p>
                <p className="text-2xl font-bold text-green-600">{stats.emailCoverage || 0}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Fathers</p>
                <p className="text-2xl font-bold text-purple-600">{stats.fathersCount || 0}</p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Mothers</p>
                <p className="text-2xl font-bold text-pink-600">{stats.mothersCount || 0}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterRelation}
                onChange={(e) => setFilterRelation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Relations</option>
                <option value="Father">Fathers</option>
                <option value="Mother">Mothers</option>
                <option value="Guardian">Guardians</option>
              </select>
            </div>
            <button
              onClick={fetchParents}
              className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Search
            </button>
          </div>

          {/* Parents List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : parents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No parents found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {parents.map((parent) => (
                  <div
                    key={parent.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {parent.firstName} {parent.lastName}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getRelationColor(
                              parent.relation
                            )}`}
                          >
                            {parent.relation}
                          </span>
                          {parent.email && (
                            <span className="text-green-600 text-sm font-medium">✓ Email</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              📞 Phone: <strong>{parent.phone}</strong>
                            </p>
                            {parent.email && (
                              <p className="text-gray-600">
                                ✉️ Email: <strong>{parent.email}</strong>
                              </p>
                            )}
                          </div>
                          <div>
                            {parent.occupation && (
                              <p className="text-gray-600">
                                💼 Occupation: <strong>{parent.occupation}</strong>
                              </p>
                            )}
                            {parent.city && (
                              <p className="text-gray-600">
                                📍 City: <strong>{parent.city}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                        {parent.children.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                              👧 Children: ({parent.children.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {parent.children.map((child, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {child.student.firstName} {child.student.lastName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          parent.user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {parent.user.isActive ? '✓ Active' : '✗ Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
