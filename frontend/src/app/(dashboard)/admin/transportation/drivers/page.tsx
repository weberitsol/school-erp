'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string; // Format: 'YYYY-MM-DD'
  licenseClass: string; // e.g., 'A', 'B', 'C', 'D'
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  assignedVehicles: string[]; // Vehicle IDs
  assignedRoutes: string[]; // Route IDs
  status: 'ACTIVE' | 'INACTIVE';
}

interface Vehicle {
  id: string;
  registrationNo: string;
}

interface Route {
  id: string;
  name: string;
}

// Sample data
const SAMPLE_VEHICLES: Vehicle[] = [
  { id: 'v1', registrationNo: 'MH-01-AB-1234' },
  { id: 'v2', registrationNo: 'MH-01-CD-5678' },
  { id: 'v3', registrationNo: 'MH-01-EF-9012' },
];

const SAMPLE_ROUTES: Route[] = [
  { id: 'r1', name: 'Morning Route A' },
  { id: 'r2', name: 'Morning Route B' },
  { id: 'r3', name: 'Evening Route A' },
  { id: 'r4', name: 'Evening Route B' },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    licenseClass: 'B',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    status: 'ACTIVE' as const,
  });
  const [assignedVehicles, setAssignedVehicles] = useState<string[]>([]);
  const [assignedRoutes, setAssignedRoutes] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseExpiry: '',
      licenseClass: 'B',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      status: 'ACTIVE',
    });
    setAssignedVehicles([]);
    setAssignedRoutes([]);
    setEditingDriver(null);
    setShowForm(false);
  };

  const isLicenseExpiringSoon = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry >= today;
  };

  const isLicenseExpired = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      alert('Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      alert('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      alert('Phone number is required');
      return;
    }
    if (!formData.licenseNumber.trim()) {
      alert('License number is required');
      return;
    }
    if (!formData.licenseExpiry) {
      alert('License expiry date is required');
      return;
    }

    // Check license expiry is in future
    if (new Date(formData.licenseExpiry) < new Date()) {
      alert('License expiry date must be in the future');
      return;
    }

    // Check if license number is unique (for new drivers)
    if (
      !editingDriver &&
      drivers.some((d) => d.licenseNumber === formData.licenseNumber)
    ) {
      alert('License number already exists');
      return;
    }

    if (editingDriver) {
      // Update existing driver
      const updatedDrivers = drivers.map((driver) =>
        driver.id === editingDriver.id
          ? {
              ...driver,
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              licenseNumber: formData.licenseNumber,
              licenseExpiry: formData.licenseExpiry,
              licenseClass: formData.licenseClass,
              address: formData.address,
              emergencyContact: formData.emergencyContact,
              emergencyPhone: formData.emergencyPhone,
              assignedVehicles: assignedVehicles,
              assignedRoutes: assignedRoutes,
              status: formData.status,
            }
          : driver
      );
      setDrivers(updatedDrivers);
    } else {
      // Create new driver
      const newDriver: Driver = {
        id: Math.random().toString(36).substr(2, 9),
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        licenseClass: formData.licenseClass,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        assignedVehicles: assignedVehicles,
        assignedRoutes: assignedRoutes,
        status: formData.status,
      };
      setDrivers([...drivers, newDriver]);
    }
    resetForm();
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      fullName: driver.fullName,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      licenseClass: driver.licenseClass,
      address: driver.address,
      emergencyContact: driver.emergencyContact,
      emergencyPhone: driver.emergencyPhone,
      status: driver.status,
    });
    setAssignedVehicles(driver.assignedVehicles);
    setAssignedRoutes(driver.assignedRoutes);
    setShowForm(true);
  };

  const handleDelete = (driverId: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      setDrivers(drivers.filter((driver) => driver.id !== driverId));
    }
  };

  const getVehicleName = (vehicleId: string) => {
    return SAMPLE_VEHICLES.find((v) => v.id === vehicleId)?.registrationNo || vehicleId;
  };

  const getRouteName = (routeId: string) => {
    return SAMPLE_ROUTES.find((r) => r.id === routeId)?.name || routeId;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Drivers Management</h1>
          <button
            onClick={() => {
              setEditingDriver(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Driver
          </button>
        </div>

        {/* Add/Edit Driver Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 123 Main Street"
                  />
                </div>
              </div>

              {/* License Information */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., DL-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry *</label>
                  <input
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Class *</label>
                  <select
                    value={formData.licenseClass}
                    onChange={(e) => setFormData({ ...formData, licenseClass: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="A">A - Motorcycle</option>
                    <option value="B">B - Car</option>
                    <option value="C">C - Truck</option>
                    <option value="D">D - Bus</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 9876543210"
                  />
                </div>
              </div>

              {/* Vehicle Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Vehicles</label>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_VEHICLES.map((vehicle) => (
                    <label key={vehicle.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignedVehicles.includes(vehicle.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedVehicles([...assignedVehicles, vehicle.id]);
                          } else {
                            setAssignedVehicles(assignedVehicles.filter((id) => id !== vehicle.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{vehicle.registrationNo}</span>
                    </label>
                  ))}
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
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
                  {editingDriver ? 'Update Driver' : 'Save Driver'}
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

        {/* Drivers List */}
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Driver Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">License Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">License Expiry</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Assigned Vehicles</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Assigned Routes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No drivers configured yet</p>
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{driver.fullName}</td>
                    <td className="px-6 py-4 text-gray-600">{driver.licenseNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isLicenseExpired(driver.licenseExpiry)
                            ? 'bg-red-100 text-red-800'
                            : isLicenseExpiringSoon(driver.licenseExpiry)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {new Date(driver.licenseExpiry).toLocaleDateString()}
                        {isLicenseExpired(driver.licenseExpiry) && ' (Expired)'}
                        {isLicenseExpiringSoon(driver.licenseExpiry) && !isLicenseExpired(driver.licenseExpiry) && ' (Expiring Soon)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="text-sm">
                        <div>{driver.phone}</div>
                        <div className="text-gray-500">{driver.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {driver.assignedVehicles.length > 0 ? (
                        <div className="text-sm">
                          {driver.assignedVehicles.map((vehicleId) => (
                            <span key={vehicleId} className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium mr-1 mb-1">
                              {getVehicleName(vehicleId)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {driver.assignedRoutes.length > 0 ? (
                        <div className="text-sm">
                          {driver.assignedRoutes.map((routeId) => (
                            <span key={routeId} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium mr-1 mb-1">
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
                          driver.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Edit driver"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Delete driver"
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
