'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface Room {
  id: string;
  roomNumber: string;
  floorNumber: number;
  capacity: number;
  type: string;
  amenities?: string[];
  available: boolean;
}

interface BoardingData {
  totalStudents: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyPercentage: number;
  totalFacilities: number;
}

interface RoomsResponse {
  data: Room[];
}

interface StatsResponse {
  data: BoardingData;
}

export default function BoardingPage() {
  const { accessToken } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<BoardingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (accessToken) {
      fetchRooms();
      fetchStats();
    }
  }, [accessToken]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<RoomsResponse>('/api/v1/boarding/rooms');
      setRooms(response.data || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<StatsResponse>('/api/v1/boarding/stats');
      setStats(response.data || null);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getRoomTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'SINGLE': 'bg-purple-100 text-purple-800',
      'DOUBLE': 'bg-blue-100 text-blue-800',
      'TRIPLE': 'bg-green-100 text-green-800',
      'DORMITORY': 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredRooms = filterType === 'ALL' ? rooms : rooms.filter(r => r.type === filterType);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Boarding/Hostel Management</h1>
            <p className="text-gray-600 mt-1">Manage hostel rooms and student accommodations</p>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 font-semibold uppercase">Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 font-semibold uppercase">Rooms</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalRooms}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 font-semibold uppercase">Occupied</p>
                <p className="text-2xl font-bold text-green-600">{stats.occupiedRooms}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 font-semibold uppercase">Available</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.availableRooms}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 font-semibold uppercase">Occupancy</p>
                <p className="text-2xl font-bold text-purple-600">{stats.occupancyPercentage}%</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Room Types</option>
              <option value="SINGLE">Single Rooms</option>
              <option value="DOUBLE">Double Rooms</option>
              <option value="TRIPLE">Triple Rooms</option>
              <option value="DORMITORY">Dormitory</option>
            </select>
          </div>

          {/* Rooms Grid */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No rooms found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Room {room.roomNumber}</h3>
                        <p className="text-sm text-gray-600">Floor {room.floorNumber}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold ${getRoomTypeColor(
                          room.type
                        )}`}
                      >
                        {room.type}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity:</span>
                        <span className="font-semibold text-gray-900">{room.capacity} students</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span
                          className={`text-xs font-semibold ${
                            room.available
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {room.available ? '✓ Available' : '✗ Full'}
                        </span>
                      </div>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Amenities:</p>
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
