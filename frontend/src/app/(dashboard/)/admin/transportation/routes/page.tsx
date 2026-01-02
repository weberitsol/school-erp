'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Loader2,
  AlertCircle,
  MapPin,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { transportationApi, Route, RouteStop } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type RouteStatus = 'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

interface RouteFormData {
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  status: RouteStatus;
}

const initialFormData: RouteFormData = {
  name: '',
  startPoint: '',
  endPoint: '',
  distance: 0,
  status: 'ACTIVE',
};

export default function RoutesPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RouteStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RouteFormData>(initialFormData);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const loadRoutes = useCallback(async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await transportationApi.getRoutes(accessToken);

      if (response.success && response.data) {
        setRoutes(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load routes',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load routes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    try {
      setIsSubmitting(true);

      const response = editingId
        ? await transportationApi.updateRoute(editingId, formData, accessToken)
        : await transportationApi.createRoute(formData, accessToken);

      if (response.success) {
        toast({
          title: 'Success',
          description: editingId ? 'Route updated successfully' : 'Route created successfully',
        });
        setFormData(initialFormData);
        setEditingId(null);
        setShowForm(false);
        loadRoutes();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to save route',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save route',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (route: Route) => {
    setFormData(route as RouteFormData);
    setEditingId(route.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || !confirm('Are you sure you want to delete this route?')) return;

    try {
      const response = await transportationApi.deleteRoute(id, accessToken);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Route deleted successfully',
        });
        loadRoutes();
        setSelectedRoute(null);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete route',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete route',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    const matchesSearch =
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.startPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.endPoint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: routes.length,
    active: routes.filter((r) => r.status === 'ACTIVE').length,
    inactive: routes.filter((r) => r.status === 'INACTIVE').length,
    suspended: routes.filter((r) => r.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600 mt-1">Manage school bus routes and stops</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Route
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Total Routes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Inactive</p>
          <p className="text-3xl font-bold text-gray-600 mt-2">{stats.inactive}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm font-medium">Suspended</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.suspended}</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Route' : 'Add New Route'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Route Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Route 1 - North City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Point</label>
                <input
                  type="text"
                  value={formData.startPoint}
                  onChange={(e) =>
                    setFormData({ ...formData, startPoint: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Main Gate"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Point</label>
                <input
                  type="text"
                  value={formData.endPoint}
                  onChange={(e) =>
                    setFormData({ ...formData, endPoint: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="School Building"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
                  <input
                    type="number"
                    value={formData.distance}
                    onChange={(e) =>
                      setFormData({ ...formData, distance: parseFloat(e.target.value) })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15.5"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : editingId ? (
                    'Update Route'
                  ) : (
                    'Add Route'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by route name, start, or end point..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((status) => (
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
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-4">Loading routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No routes found</p>
          </div>
        ) : (
          filteredRoutes.map((route) => (
            <div
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className={cn(
                'bg-white rounded-lg border-2 p-6 cursor-pointer transition-all',
                selectedRoute?.id === route.id
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">{route.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{route.distance} km</p>
                </div>
                <span className={cn('text-xs font-semibold px-3 py-1 rounded', getStatusColor(route.status))}>
                  {route.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Start Point</p>
                    <p className="text-sm font-medium text-gray-900">{route.startPoint}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Navigation className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">End Point</p>
                    <p className="text-sm font-medium text-gray-900">{route.endPoint}</p>
                  </div>
                </div>

                {route.stops && route.stops.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Stops ({route.stops.length})</p>
                    <div className="space-y-1">
                      {route.stops.slice(0, 3).map((stop) => (
                        <p key={stop.id} className="text-xs text-gray-700">
                          • {stop.name}
                        </p>
                      ))}
                      {route.stops.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{route.stops.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(route);
                  }}
                  className="flex-1 text-blue-600 hover:text-blue-700 py-2 rounded hover:bg-blue-50 font-medium text-sm"
                >
                  <Edit className="w-4 h-4 inline mr-2" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(route.id);
                  }}
                  className="flex-1 text-red-600 hover:text-red-700 py-2 rounded hover:bg-red-50 font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Route Details */}
      {selectedRoute && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{selectedRoute.name} - Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Distance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{selectedRoute.distance} km</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Total Stops</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{selectedRoute.stops?.length || 0}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Assigned Vehicles</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{selectedRoute.assignedVehicles?.length || 0}</p>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-3">Route Stops</h3>
          {selectedRoute.stops && selectedRoute.stops.length > 0 ? (
            <div className="space-y-2">
              {selectedRoute.stops
                .sort((a, b) => a.sequence - b.sequence)
                .map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      {stop.sequence}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{stop.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)} • {stop.type}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600">No stops assigned yet</p>
          )}
        </div>
      )}
    </div>
  );
}
