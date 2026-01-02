'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Play,
  CheckCircle,
  XCircle,
  Filter,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { transportationApi, Trip } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type TripStatus = 'all' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export default function TripsPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TripStatus>('all');
  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const loadTrips = useCallback(async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await transportationApi.getTrips(
        {
          date: dateFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
        accessToken
      );

      if (response.success && response.data) {
        setTrips(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load trips',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load trips',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter, dateFilter, toast]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleStartTrip = async (tripId: string) => {
    if (!accessToken) return;

    try {
      setIsActioning(tripId);
      const response = await transportationApi.startTrip(tripId, accessToken);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Trip started successfully',
        });
        loadTrips();
        setSelectedTrip(null);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to start trip',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start trip',
        variant: 'destructive',
      });
    } finally {
      setIsActioning(null);
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    if (!accessToken || !confirm('Mark this trip as completed?')) return;

    try {
      setIsActioning(tripId);
      const response = await transportationApi.completeTrip(tripId, accessToken);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Trip completed successfully',
        });
        loadTrips();
        setSelectedTrip(null);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to complete trip',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete trip',
        variant: 'destructive',
      });
    } finally {
      setIsActioning(null);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!accessToken || !reason) return;

    try {
      setIsActioning(tripId);
      const response = await transportationApi.cancelTrip(
        tripId,
        reason,
        accessToken
      );

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Trip cancelled successfully',
        });
        loadTrips();
        setSelectedTrip(null);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to cancel trip',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel trip',
        variant: 'destructive',
      });
    } finally {
      setIsActioning(null);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${trip.driver.firstName} ${trip.driver.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Calendar className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Zap className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const stats = {
    total: trips.length,
    scheduled: trips.filter((t) => t.status === 'SCHEDULED').length,
    inProgress: trips.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: trips.filter((t) => t.status === 'COMPLETED').length,
    cancelled: trips.filter((t) => t.status === 'CANCELLED').length,
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-1">Monitor and control school bus trips</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Total Trips</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Scheduled</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.scheduled}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">In Progress</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.inProgress}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Cancelled</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by route, vehicle, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {(['all', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? 'All' : status === 'IN_PROGRESS' ? 'In Progress' : status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-4">Loading trips...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No trips found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTrips.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={cn(
                      'hover:bg-gray-50 cursor-pointer',
                      selectedTrip?.id === trip.id && 'bg-blue-50'
                    )}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{trip.route.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {trip.vehicle.registrationNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {trip.driver.firstName} {trip.driver.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTime(trip.startTime)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>
                          {trip.boardedCount}/{trip.studentCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'text-xs font-semibold px-3 py-1 rounded inline-flex items-center gap-2',
                          getStatusColor(trip.status)
                        )}
                      >
                        {getStatusIcon(trip.status)}
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {trip.status === 'SCHEDULED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTrip(trip.id);
                            }}
                            disabled={isActioning === trip.id}
                            className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded disabled:opacity-50"
                          >
                            {isActioning === trip.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {trip.status === 'IN_PROGRESS' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTrip(trip.id);
                            }}
                            disabled={isActioning === trip.id}
                            className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded disabled:opacity-50"
                          >
                            {isActioning === trip.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {(trip.status === 'SCHEDULED' || trip.status === 'IN_PROGRESS') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelTrip(trip.id);
                            }}
                            disabled={isActioning === trip.id}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            {isActioning === trip.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Trip Details */}
      {selectedTrip && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedTrip.route.name}</h2>
              <p className="text-gray-600 mt-1">
                {new Date(selectedTrip.date).toLocaleDateString()}
              </p>
            </div>
            <span
              className={cn(
                'text-sm font-semibold px-4 py-2 rounded inline-flex items-center gap-2',
                getStatusColor(selectedTrip.status)
              )}
            >
              {getStatusIcon(selectedTrip.status)}
              {selectedTrip.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Vehicle</p>
              <p className="text-gray-900 font-medium mt-2">
                {selectedTrip.vehicle.registrationNumber}
              </p>
              <p className="text-xs text-gray-600 mt-1">{selectedTrip.vehicle.type}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Driver</p>
              <p className="text-gray-900 font-medium mt-2">
                {selectedTrip.driver.firstName} {selectedTrip.driver.lastName}
              </p>
              <p className="text-xs text-gray-600 mt-1">{selectedTrip.driver.phone}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Start Time</p>
              <p className="text-gray-900 font-medium mt-2">{formatTime(selectedTrip.startTime)}</p>
              {selectedTrip.actualPickupTime && (
                <p className="text-xs text-green-600 mt-1">
                  Actual: {formatTime(selectedTrip.actualPickupTime)}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Students</p>
              <p className="text-gray-900 font-medium mt-2">
                {selectedTrip.boardedCount}/{selectedTrip.studentCount}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {selectedTrip.alightedCount} alighted
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Boarded</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{selectedTrip.boardedCount}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Alighted</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{selectedTrip.alightedCount}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Absent</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{selectedTrip.absentCount}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {selectedTrip.studentCount > 0
                  ? Math.round(((selectedTrip.boardedCount + selectedTrip.alightedCount) / selectedTrip.studentCount) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
