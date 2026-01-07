'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Navigation } from 'lucide-react';

interface Stop {
  id: string;
  name: string;
  location: string; // Location description or address
  latitude?: number;
  longitude?: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'BOTH';
  geofenceRadius: number; // in meters
  expectedArrivalTime?: string; // Format: 'HH:mm'
  assignedRoutes: string[];
  sequence: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Route {
  id: string;
  name: string;
}

// Sample data
const SAMPLE_ROUTES: Route[] = [
  { id: 'r1', name: 'Morning Route A' },
  { id: 'r2', name: 'Morning Route B' },
  { id: 'r3', name: 'Evening Route A' },
  { id: 'r4', name: 'Evening Route B' },
];

const STOP_TYPES = [
  { value: 'PICKUP', label: 'Pickup Only' },
  { value: 'DROPOFF', label: 'Drop-off Only' },
  { value: 'BOTH', label: 'Both' },
];

export default function StopsPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    stopType: 'PICKUP' as 'PICKUP' | 'DROPOFF' | 'BOTH',
    geofenceRadius: 100,
    expectedArrivalTime: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [assignedRoutes, setAssignedRoutes] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      latitude: '',
      longitude: '',
      stopType: 'PICKUP',
      geofenceRadius: 100,
      expectedArrivalTime: '',
      status: 'ACTIVE',
    });
    setAssignedRoutes([]);
    setEditingStop(null);
    setShowForm(false);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      alert('Stop name is required');
      return false;
    }
    if (!formData.location.trim()) {
      alert('Location is required');
      return false;
    }
    if (formData.geofenceRadius <= 0) {
      alert('Geofence radius must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const nextSequence = Math.max(0, ...stops.map((s) => s.sequence)) + 1;

    if (editingStop) {
      // Update existing stop
      const updatedStops = stops.map((stop) =>
        stop.id === editingStop.id
          ? {
              ...stop,
              name: formData.name,
              location: formData.location,
              latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
              longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
              stopType: formData.stopType,
              geofenceRadius: formData.geofenceRadius,
              expectedArrivalTime: formData.expectedArrivalTime,
              assignedRoutes: assignedRoutes,
              status: formData.status,
            }
          : stop
      );
      setStops(updatedStops);
    } else {
      // Create new stop
      const newStop: Stop = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        location: formData.location,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        stopType: formData.stopType,
        geofenceRadius: formData.geofenceRadius,
        expectedArrivalTime: formData.expectedArrivalTime,
        assignedRoutes: assignedRoutes,
        sequence: nextSequence,
        status: formData.status,
      };
      setStops([...stops, newStop]);
    }
    resetForm();
  };

  const handleEdit = (stop: Stop) => {
    setEditingStop(stop);
    setFormData({
      name: stop.name,
      location: stop.location,
      latitude: stop.latitude?.toString() || '',
      longitude: stop.longitude?.toString() || '',
      stopType: stop.stopType,
      geofenceRadius: stop.geofenceRadius,
      expectedArrivalTime: stop.expectedArrivalTime || '',
      status: stop.status,
    });
    setAssignedRoutes(stop.assignedRoutes);
    setShowForm(true);
  };

  const handleDelete = (stopId: string) => {
    if (confirm('Are you sure you want to delete this stop?')) {
      setStops(stops.filter((stop) => stop.id !== stopId));
    }
  };

  const getRouteName = (routeId: string) => {
    return SAMPLE_ROUTES.find((r) => r.id === routeId)?.name || routeId;
  };

  const getStopTypeLabel = (type: string) => {
    return STOP_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Stops Management</h1>
          <button
            onClick={() => {
              setEditingStop(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Stop
          </button>
        </div>

        {/* Add/Edit Stop Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingStop ? 'Edit Stop' : 'Add New Stop'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Stop Name and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stop Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., Main Gate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stop Type *</label>
                  <select
                    value={formData.stopType}
                    onChange={(e) => setFormData({ ...formData, stopType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {STOP_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Address *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 123 School Street, Downtown"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 19.0760"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 72.8777"
                  />
                </div>
              </div>

              {/* Geofence Radius and Arrival Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geofence Radius (meters) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.geofenceRadius}
                    onChange={(e) => setFormData({ ...formData, geofenceRadius: parseInt(e.target.value) || 100 })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Arrival Time</label>
                  <input
                    type="time"
                    value={formData.expectedArrivalTime}
                    onChange={(e) => setFormData({ ...formData, expectedArrivalTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Route Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Routes</label>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_ROUTES.map((route) => (
                    <label key={route.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignedRoutes.includes(route.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedRoutes([...assignedRoutes, route.id]);
                          } else {
                            setAssignedRoutes(assignedRoutes.filter((id) => id !== route.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{route.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingStop ? 'Update Stop' : 'Save Stop'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stops List */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Seq</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stop Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Geofence</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ETA</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Routes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stops.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No stops configured yet</p>
                  </td>
                </tr>
              ) : (
                stops
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((stop) => (
                    <tr key={stop.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">
                          {stop.sequence}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{stop.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 text-sm">{stop.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{getStopTypeLabel(stop.stopType)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm font-medium">
                          {stop.geofenceRadius}m
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {stop.expectedArrivalTime ? (
                          <span className="font-mono">{stop.expectedArrivalTime}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {stop.assignedRoutes.length > 0 ? (
                          <div className="text-sm space-y-1">
                            {stop.assignedRoutes.map((routeId) => (
                              <span key={routeId} className="inline-block bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-medium mr-1 mb-1">
                                {getRouteName(routeId)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            stop.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {stop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(stop)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Edit stop"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(stop.id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title="Delete stop"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
