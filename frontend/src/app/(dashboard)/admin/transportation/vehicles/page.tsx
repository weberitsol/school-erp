'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';

interface BoardingPoint {
  id: string;
  name: string;
  sequence: number;
}

interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  boardingPoints: BoardingPoint[];
  status: 'ACTIVE' | 'INACTIVE';
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  capacity: number;
  boardingPoints: BoardingPoint[];
  assignedRoutes: Route[];
  assignedDrivers: Driver[];
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export default function TransportationVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Downtown Express',
      startPoint: 'City Center',
      endPoint: 'School Campus',
      distance: 8.5,
      boardingPoints: [
        { id: '1', name: 'Central Bus Stand', sequence: 1 },
        { id: '2', name: 'Market Square', sequence: 2 },
        { id: '3', name: 'Railway Station', sequence: 3 },
      ],
      status: 'ACTIVE',
    },
  ]);
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: '1', name: 'Rajesh Kumar', licenseNumber: 'DL-1234567890', phoneNumber: '9876543210', status: 'ACTIVE' },
    { id: '2', name: 'Amit Singh', licenseNumber: 'DL-0987654321', phoneNumber: '9123456789', status: 'ACTIVE' },
    { id: '3', name: 'Priya Sharma', licenseNumber: 'DL-1122334455', phoneNumber: '9654321987', status: 'ACTIVE' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [boardingPointInput, setBoardingPointInput] = useState('');
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    model: '',
    capacity: '',
    status: 'ACTIVE' as const,
  });

  const resetForm = () => {
    setFormData({ registrationNumber: '', model: '', capacity: '', status: 'ACTIVE' });
    setBoardingPoints([]);
    setSelectedRoutes([]);
    setSelectedDrivers([]);
    setEditingVehicle(null);
    setShowForm(false);
  };

  const addBoardingPoint = () => {
    if (boardingPointInput.trim()) {
      const newPoint: BoardingPoint = {
        id: Math.random().toString(36).substr(2, 9),
        name: boardingPointInput,
        sequence: boardingPoints.length + 1,
      };
      setBoardingPoints([...boardingPoints, newPoint]);
      setBoardingPointInput('');
    }
  };

  const removeBoardingPoint = (id: string) => {
    const updatedPoints = boardingPoints
      .filter((point) => point.id !== id)
      .map((point, index) => ({ ...point, sequence: index + 1 }));
    setBoardingPoints(updatedPoints);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedRoutes = routes.filter((route) => selectedRoutes.includes(route.id));
    const assignedDriversList = drivers.filter((driver) => selectedDrivers.includes(driver.id));

    if (editingVehicle) {
      // Update existing vehicle
      const updatedVehicles = vehicles.map((vehicle) =>
        vehicle.id === editingVehicle.id
          ? {
              ...vehicle,
              registrationNumber: formData.registrationNumber,
              model: formData.model,
              capacity: parseInt(formData.capacity),
              boardingPoints: boardingPoints,
              assignedRoutes: assignedRoutes,
              assignedDrivers: assignedDriversList,
              status: formData.status,
            }
          : vehicle
      );
      setVehicles(updatedVehicles);
    } else {
      // Create new vehicle
      const newVehicle: Vehicle = {
        id: Math.random().toString(36).substr(2, 9),
        registrationNumber: formData.registrationNumber,
        model: formData.model,
        capacity: parseInt(formData.capacity),
        boardingPoints: boardingPoints,
        assignedRoutes: assignedRoutes,
        assignedDrivers: assignedDriversList,
        status: formData.status,
      };
      setVehicles([...vehicles, newVehicle]);
    }
    resetForm();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      model: vehicle.model,
      capacity: vehicle.capacity.toString(),
      status: vehicle.status,
    });
    setBoardingPoints(vehicle.boardingPoints);
    setSelectedRoutes(vehicle.assignedRoutes.map((r) => r.id));
    setSelectedDrivers(vehicle.assignedDrivers.map((d) => d.id));
    setShowForm(true);
  };

  const handleDelete = (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles(vehicles.filter((vehicle) => vehicle.id !== vehicleId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <button
            onClick={() => {
              setEditingVehicle(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Boarding Points</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={boardingPointInput}
                    onChange={(e) => setBoardingPointInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBoardingPoint();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., School Gate"
                  />
                  <button
                    type="button"
                    onClick={addBoardingPoint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Point
                  </button>
                </div>
                {boardingPoints.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {boardingPoints.map((point) => (
                      <div key={point.id} className="flex items-center justify-between py-2 px-2 hover:bg-gray-100 rounded">
                        <span className="text-sm">
                          <span className="font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-2">
                            {point.sequence}
                          </span>
                          {point.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBoardingPoint(point.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                          <div className="font-medium text-gray-900">{driver.name}</div>
                          <div className="text-xs text-gray-600">
                            License: {driver.licenseNumber} | Phone: {driver.phoneNumber}
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
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
                    <td className="px-6 py-4 font-medium text-gray-900">{vehicle.registrationNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.model}</td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.capacity} seats</td>
                    <td className="px-6 py-4">
                      {vehicle.boardingPoints.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 mb-1">{vehicle.boardingPoints.length} points</div>
                          <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                            {vehicle.boardingPoints.map((point) => (
                              <div key={point.id} className="flex items-center gap-1">
                                <span className="inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                  {point.sequence}
                                </span>
                                {point.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No boarding points</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.assignedRoutes.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 mb-1">{vehicle.assignedRoutes.length} route(s)</div>
                          <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                            {vehicle.assignedRoutes.map((route) => (
                              <div key={route.id} className="flex items-center gap-1">
                                <span className="inline-block bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                  {route.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No routes assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.assignedDrivers.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 mb-1">{vehicle.assignedDrivers.length} driver(s)</div>
                          <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                            {vehicle.assignedDrivers.map((driver) => (
                              <div key={driver.id} className="flex items-center gap-1">
                                <span className="inline-block bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                  {driver.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No drivers assigned</span>
                      )}
                    </td>
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
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Edit vehicle"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
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
