'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react';

interface Trip {
  id: string;
  tripDate: string; // Format: 'YYYY-MM-DD'
  routeId: string;
  driverId: string;
  vehicleId: string;
  tripType: 'PICKUP' | 'DROPOFF' | 'ROUND_TRIP';
  studentsCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  eta?: string; // Format: 'HH:mm'
  notes?: string;
}

interface Route {
  id: string;
  name: string;
  departureTime: string;
  arrivalTime: string;
}

interface Driver {
  id: string;
  fullName: string;
}

interface Vehicle {
  id: string;
  registrationNo: string;
}

// Sample data
const SAMPLE_ROUTES: Route[] = [
  { id: 'r1', name: 'Morning Route A', departureTime: '07:20', arrivalTime: '08:45' },
  { id: 'r2', name: 'Morning Route B', departureTime: '08:00', arrivalTime: '09:15' },
  { id: 'r3', name: 'Evening Route A', departureTime: '14:30', arrivalTime: '16:00' },
  { id: 'r4', name: 'Evening Route B', departureTime: '15:00', arrivalTime: '16:45' },
];

const SAMPLE_DRIVERS: Driver[] = [
  { id: 'd1', fullName: 'Rajesh Kumar' },
  { id: 'd2', fullName: 'Priya Singh' },
  { id: 'd3', fullName: 'Amit Patel' },
];

const SAMPLE_VEHICLES: Vehicle[] = [
  { id: 'v1', registrationNo: 'MH-01-AB-1234' },
  { id: 'v2', registrationNo: 'MH-01-CD-5678' },
  { id: 'v3', registrationNo: 'MH-01-EF-9012' },
];

const TRIP_TYPES = [
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DROPOFF', label: 'Drop-off' },
  { value: 'ROUND_TRIP', label: 'Round Trip' },
];

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState({
    tripDate: '',
    routeId: '',
    driverId: '',
    vehicleId: '',
    tripType: 'PICKUP' as const,
    studentsCount: 0,
    status: 'PENDING' as const,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      tripDate: '',
      routeId: '',
      driverId: '',
      vehicleId: '',
      tripType: 'PICKUP',
      studentsCount: 0,
      status: 'PENDING',
      notes: '',
    });
    setEditingTrip(null);
    setShowForm(false);
  };

  const validateForm = (): boolean => {
    if (!formData.tripDate) {
      alert('Trip date is required');
      return false;
    }
    if (!formData.routeId) {
      alert('Route is required');
      return false;
    }
    if (!formData.driverId) {
      alert('Driver is required');
      return false;
    }
    if (!formData.vehicleId) {
      alert('Vehicle is required');
      return false;
    }
    if (formData.studentsCount < 0) {
      alert('Students count cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const route = SAMPLE_ROUTES.find((r) => r.id === formData.routeId);

    if (editingTrip) {
      // Update existing trip
      const updatedTrips = trips.map((trip) =>
        trip.id === editingTrip.id
          ? {
              ...trip,
              tripDate: formData.tripDate,
              routeId: formData.routeId,
              driverId: formData.driverId,
              vehicleId: formData.vehicleId,
              tripType: formData.tripType,
              studentsCount: formData.studentsCount,
              status: formData.status,
              eta: route?.arrivalTime,
              notes: formData.notes,
            }
          : trip
      );
      setTrips(updatedTrips);
    } else {
      // Create new trip
      const newTrip: Trip = {
        id: Math.random().toString(36).substr(2, 9),
        tripDate: formData.tripDate,
        routeId: formData.routeId,
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
        tripType: formData.tripType,
        studentsCount: formData.studentsCount,
        status: formData.status,
        eta: route?.arrivalTime,
        notes: formData.notes,
      };
      setTrips([...trips, newTrip]);
    }
    resetForm();
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      tripDate: trip.tripDate,
      routeId: trip.routeId,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      tripType: trip.tripType,
      studentsCount: trip.studentsCount,
      status: trip.status,
      notes: trip.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      setTrips(trips.filter((trip) => trip.id !== tripId));
    }
  };

  const getRouteName = (routeId: string) => {
    return SAMPLE_ROUTES.find((r) => r.id === routeId)?.name || routeId;
  };

  const getDriverName = (driverId: string) => {
    return SAMPLE_DRIVERS.find((d) => d.id === driverId)?.fullName || driverId;
  };

  const getVehicleReg = (vehicleId: string) => {
    return SAMPLE_VEHICLES.find((v) => v.id === vehicleId)?.registrationNo || vehicleId;
  };

  const getRouteTime = (routeId: string) => {
    const route = SAMPLE_ROUTES.find((r) => r.id === routeId);
    return route ? `${route.departureTime} → ${route.arrivalTime}` : '';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
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

  const getTripTypeLabel = (type: string) => {
    return TRIP_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trips Management</h1>
          <button
            onClick={() => {
              setEditingTrip(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Trip
          </button>
        </div>

        {/* Add/Edit Trip Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTrip ? 'Edit Trip' : 'Schedule New Trip'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Trip Date and Type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Date *</label>
                  <input
                    type="date"
                    value={formData.tripDate}
                    onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type *</label>
                  <select
                    value={formData.tripType}
                    onChange={(e) => setFormData({ ...formData, tripType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {TRIP_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Students Count *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.studentsCount}
                    onChange={(e) => setFormData({ ...formData, studentsCount: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 45"
                  />
                </div>
              </div>

              {/* Route, Driver, Vehicle */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select a route</option>
                    {SAMPLE_ROUTES.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver *</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select a driver</option>
                    {SAMPLE_DRIVERS.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select a vehicle</option>
                    {SAMPLE_VEHICLES.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.registrationNo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., Extra stop at main gate"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingTrip ? 'Update Trip' : 'Schedule Trip'}
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

        {/* Trips List */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Route</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Driver</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Students</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No trips scheduled yet</p>
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {new Date(trip.tripDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{getRouteName(trip.routeId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {getRouteTime(trip.routeId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{getDriverName(trip.driverId)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium">
                        {getVehicleReg(trip.vehicleId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{getTripTypeLabel(trip.tripType)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded text-sm font-medium">
                        {trip.studentsCount} students
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(trip)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Edit trip"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Delete trip"
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
