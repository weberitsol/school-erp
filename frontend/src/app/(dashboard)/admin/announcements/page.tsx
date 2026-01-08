'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string[];
  isPublished: boolean;
  publishedAt?: string;
  expiresAt?: string;
  attachments?: string[];
  createdAt: string;
}

interface AnnouncementsResponse {
  data: Announcement[];
}

interface StatsResponse {
  data: {
    totalAnnouncements?: number;
    publishedCount?: number;
    activeCount?: number;
  };
}

export default function AnnouncementsPage() {
  const { accessToken } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchAnnouncements();
      fetchStats();
    }
  }, [accessToken]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<AnnouncementsResponse>('/api/v1/announcements');
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<StatsResponse>('/api/v1/announcements/stats');
      setStats(response.data || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const publishAnnouncement = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/announcements/${id}/publish`, {});
      fetchAnnouncements();
      alert('Announcement published successfully');
    } catch (error) {
      alert('Failed to publish announcement');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiClient.delete(`/api/v1/announcements/${id}`);
      fetchAnnouncements();
      setSelectedAnnouncement(null);
      alert('Announcement deleted successfully');
    } catch (error) {
      alert('Failed to delete announcement');
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                <p className="text-gray-600 mt-1">Create and manage school announcements</p>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">TOTAL</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAnnouncements || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">PUBLISHED</p>
                    <p className="text-2xl font-bold text-green-600">{stats.publishedCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">ACTIVE</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeCount || 0}</p>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="p-6 space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No announcements yet</p>
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedAnnouncement(ann)}
                      className={`p-3 border rounded-lg cursor-pointer transition ${
                        selectedAnnouncement?.id === ann.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{ann.title}</h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ann.content}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {ann.targetAudience.map((aud) => (
                              <span key={aud} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {aud}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {ann.isPublished ? (
                            <span className="text-green-600 text-xs font-semibold">✓ Published</span>
                          ) : (
                            <span className="text-yellow-600 text-xs font-semibold">⏳ Draft</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-1">
            {selectedAnnouncement ? (
              <div className="bg-white rounded-lg shadow sticky top-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-900">Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Title</p>
                    <p className="text-gray-900 font-semibold mt-1">{selectedAnnouncement.title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Content</p>
                    <p className="text-gray-700 text-sm mt-1 line-clamp-4">{selectedAnnouncement.content}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Audience</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAnnouncement.targetAudience.map((aud) => (
                        <span key={aud} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                          {aud}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Status</p>
                    <div className="mt-2">
                      {selectedAnnouncement.isPublished ? (
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          ✓ Published
                        </span>
                      ) : (
                        <button
                          onClick={() => publishAnnouncement(selectedAnnouncement.id)}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedAnnouncement.expiresAt && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Expires</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {new Date(selectedAnnouncement.expiresAt).toLocaleDateString()}
                        {isExpired(selectedAnnouncement.expiresAt) && (
                          <span className="ml-2 text-red-600 font-semibold">(Expired)</span>
                        )}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => deleteAnnouncement(selectedAnnouncement.id)}
                    className="w-full mt-4 px-3 py-2 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
                <p>Select an announcement to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
