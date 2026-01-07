'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { vehiclesService, type Vehicle } from '@/services/transportation/vehicles.service';
import { routesService, type Route } from '@/services/transportation/routes.service';
import { driversService, type Driver } from '@/services/transportation/drivers.service';

interface VehicleFormData {
  registrationNumber: string;
  model: string;
  capacity: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export default function TransportationVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [formData, setFormData] = useState<VehicleFormData>({
    registrationNumber: '',
    model: '',
    capacity: '',
    status: 'ACTIVE',
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vehiclesData, routesData, driversData] = await Promise.all([
        vehiclesService.getAll(),
        routesService.getAll(),
        driversService.getAll(),
      ]);
      setVehicles(vehiclesData);
      setRoutes(routesData);
      setDrivers(driversData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMsg);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ registrationNumber: '', model: '', capacity: '', status: 'ACTIVE' });
    setSelectedRoutes([]);
    setSelectedDrivers([]);
    setEditingVehicle(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const vehicleData = {
        registrationNo: formData.registrationNumber,
        make: 'Not Specified',
        model: formData.model,
        year: new Date().getFullYear(),
        capacity: parseInt(formData.capacity),
        type: 'BUS' as const,
        status: formData.status as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE',
      };

      if (editingVehicle) {
        // Update existing vehicle
        await vehiclesService.update(editingVehicle.id, vehicleData);
      } else {
        // Create new vehicle
        await vehiclesService.create(vehicleData);
      }

      // Refresh the vehicles list
      await fetchAllData();
      resetForm();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save vehicle';
      setError(errorMsg);
      console.error('Error saving vehicle:', err);
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNo,
      model: vehicle.model,
      capacity: vehicle.capacity.toString(),
      status: vehicle.status,
    });
    setSelectedRoutes([]);
    setSelectedDrivers([]);
    setShowForm(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        setSubmitting(true);
        setError(null);
        await vehiclesService.delete(vehicleId);
        // Refresh the vehicles list
        await fetchAllData();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete vehicle';
        setError(errorMsg);
        console.error('Error deleting vehicle:', err);
        alert(errorMsg);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <button
            onClick={() => {
              setEditingVehicle(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>

        {/* Add/Edit Vehicle Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., DL-01-AB-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., Tata Sumo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Assign to Routes</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                  {routes.length > 0 ? (
                    routes.map((route) => (
                      <label key={route.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRoutes.includes(route.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoutes([...selectedRoutes, route.id]);
                            } else {
                              setSelectedRoutes(selectedRoutes.filter((id) => id !== route.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{route.name}</div>
                          <div className="text-xs text-gray-600">
                            {route.startPoint} → {route.endPoint} ({route.distance} km)
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          route.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {route.status}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm py-2">No routes available</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Assign Drivers</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                  {drivers.length > 0 ? (
                    drivers.map((driver) => (
                      <label key={driver.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDrivers.includes(driver.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDrivers([...selectedDrivers, driver.id]);
                            } else {
                              setSelectedDrivers(selectedDrivers.filter((id) => id !== driver.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{driver.fullName}</div>
                          <div className="text-xs text-gray-600">
                            License: {driver.licenseNumber} | Phone: {driver.phone}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          driver.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {driver.status}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm py-2">No drivers available</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
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

        {/* Vehicles List */}
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Registration No.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Model</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Capacity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Boarding Points</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Assigned Routes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Assigned Drivers</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No vehicles configured yet</p>
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{vehicle.registrationNo}</td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.model}</td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.capacity} seats</td>
                    <td className="px-6 py-4 text-gray-600">-</td>
                    <td className="px-6 py-4 text-gray-600">-</td>
                    <td className="px-6 py-4 text-gray-600">-</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          vehicle.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : vehicle.status === 'MAINTENANCE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        disabled={submitting}
                        className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit vehicle"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        disabled={submitting}
                        className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete vehicle"
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
