'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react';
import { tripsService, type Trip } from '@/services/transportation/trips.service';
import { routesService, type Route } from '@/services/transportation/routes.service';
import { driversService, type Driver } from '@/services/transportation/drivers.service';
import { vehiclesService, type Vehicle } from '@/services/transportation/vehicles.service';

interface TripFormData {
  tripDate: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
  tripType: 'PICKUP' | 'DROPOFF' | 'ROUND_TRIP';
  studentsCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes: string;
}

const TRIP_TYPES = [
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DROPOFF', label: 'Drop-off' },
  { value: 'ROUND_TRIP', label: 'Round Trip' },
];

// Normalize trip data from API response
const normalizeTrip = (trip: Trip): Trip => {
  return {
    ...trip,
    tripDate: trip.tripDate ?? '',
    routeId: trip.routeId ?? '',
    driverId: trip.driverId ?? '',
    vehicleId: trip.vehicleId ?? '',
    tripType: trip.tripType ?? 'PICKUP',
    studentsCount: trip.studentsCount ?? 0,
    status: trip.status ?? 'SCHEDULED',
    notes: trip.notes ?? '',
    route: trip.route || { id: '', name: '', startTime: '', endTime: '' },
    vehicle: trip.vehicle || { id: '', registrationNumber: '', type: '', capacity: 0 },
    driver: trip.driver || { id: '', name: '', phone: '' },
  };
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<TripFormData>({
    tripDate: '',
    routeId: '',
    driverId: '',
    vehicleId: '',
    tripType: 'PICKUP',
    studentsCount: 0,
    status: 'PENDING',
    notes: '',
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch with individual error handling
      let tripsData: Trip[] = [];
      let routesData: Route[] = [];
      let driversData: Driver[] = [];
      let vehiclesData: Vehicle[] = [];

      try {
        tripsData = await tripsService.getAll();
      } catch (err) {
        console.error('Error fetching trips:', err);
        tripsData = [];
      }

      try {
        routesData = await routesService.getAll();
      } catch (err) {
        console.error('Error fetching routes:', err);
        routesData = [];
      }

      try {
        driversData = await driversService.getAll();
      } catch (err) {
        console.error('Error fetching drivers:', err);
        driversData = [];
      }

      try {
        vehiclesData = await vehiclesService.getAll();
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        vehiclesData = [];
      }

      // Ensure all data are arrays
      console.log('Raw API responses:', { tripsData, routesData, driversData, vehiclesData });

      const normalizedTrips = Array.isArray(tripsData)
        ? tripsData.map(normalizeTrip)
        : [];

      setTrips(normalizedTrips);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

      if (tripsData.length === 0 && routesData.length === 0) {
        setError('Unable to load transportation data. Please ensure you are logged in.');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMsg);
      console.error('Error fetching data:', err);
      // Ensure state is initialized with empty arrays on error
      setTrips([]);
      setRoutes([]);
      setDrivers([]);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const tripData = {
        tripDate: formData.tripDate,
        routeId: formData.routeId,
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
        tripType: formData.tripType as 'PICKUP' | 'DROPOFF' | 'ROUND_TRIP',
        studentsCount: formData.studentsCount,
        status: formData.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
        notes: formData.notes,
      };

      if (editingTrip) {
        // Update existing trip
        await tripsService.update(editingTrip.id, tripData);
      } else {
        // Create new trip
        await tripsService.create(tripData);
      }

      // Refresh the trips list
      await fetchAllData();
      resetForm();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save trip';
      setError(errorMsg);
      console.error('Error saving trip:', err);
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
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

  const handleDelete = async (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      try {
        setSubmitting(true);
        setError(null);
        await tripsService.delete(tripId);
        // Refresh the trips list
        await fetchAllData();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete trip';
        setError(errorMsg);
        console.error('Error deleting trip:', err);
        alert(errorMsg);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getRouteName = (trip: Trip) => {
    return trip.route?.name || trip.routeId || 'Unknown Route';
  };

  const getDriverName = (trip: Trip) => {
    return trip.driver?.name || trip.driverId || 'Unknown Driver';
  };

  const getVehicleReg = (trip: Trip) => {
    return trip.vehicle?.registrationNumber || trip.vehicleId || 'Unknown Vehicle';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trips Management</h1>
          <button
            onClick={() => {
              setEditingTrip(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                    {routes.map((route) => (
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
                    {drivers.map((driver) => (
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
                    {vehicles.map((vehicle) => (
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
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingTrip ? 'Update Trip' : 'Schedule Trip'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:opacity-50"
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
                        <span className="text-gray-900">{getRouteName(trip)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{trip.route?.startTime || 'N/A'} - {trip.route?.endTime || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{getDriverName(trip)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium">
                        {getVehicleReg(trip)}
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
                        disabled={submitting}
                        className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit trip"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        disabled={submitting}
                        className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
