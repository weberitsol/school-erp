'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';

interface BoardingPoint {
  id: string;
  name: string;
  sequence: number;
  arrivalTime: string; // Format: 'HH:mm', e.g., '07:45'
}

interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  departureTime: string; // Format: 'HH:mm', e.g., '07:30'
  arrivalTime: string; // Format: 'HH:mm', e.g., '08:45'
  operatingDays: string[]; // e.g., ['MON', 'TUE', 'WED', 'THU', 'FRI']
  boardingPoints: BoardingPoint[];
  status: 'ACTIVE' | 'INACTIVE';
}

const DAYS_OF_WEEK = [
  { value: 'MON', label: 'Mon' },
  { value: 'TUE', label: 'Tue' },
  { value: 'WED', label: 'Wed' },
  { value: 'THU', label: 'Thu' },
  { value: 'FRI', label: 'Fri' },
  { value: 'SAT', label: 'Sat' },
  { value: 'SUN', label: 'Sun' },
];

export default function TransportationRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [boardingPointInput, setBoardingPointInput] = useState('');
  const [boardingPointTimeInput, setBoardingPointTimeInput] = useState('');
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([]);
  const [operatingDays, setOperatingDays] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    startPoint: '',
    endPoint: '',
    distance: '',
    departureTime: '',
    arrivalTime: '',
    status: 'ACTIVE' as const,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      startPoint: '',
      endPoint: '',
      distance: '',
      departureTime: '',
      arrivalTime: '',
      status: 'ACTIVE',
    });
    setBoardingPoints([]);
    setBoardingPointInput('');
    setBoardingPointTimeInput('');
    setOperatingDays([]);
    setEditingRoute(null);
    setShowForm(false);
  };

  const addBoardingPoint = () => {
    if (boardingPointInput.trim() && boardingPointTimeInput.trim()) {
      const newPoint: BoardingPoint = {
        id: Math.random().toString(36).substr(2, 9),
        name: boardingPointInput,
        sequence: boardingPoints.length + 1,
        arrivalTime: boardingPointTimeInput,
      };
      setBoardingPoints([...boardingPoints, newPoint]);
      setBoardingPointInput('');
      setBoardingPointTimeInput('');
    }
  };

  const removeBoardingPoint = (id: string) => {
    const updatedPoints = boardingPoints
      .filter((point) => point.id !== id)
      .map((point, index) => ({ ...point, sequence: index + 1 }));
    setBoardingPoints(updatedPoints);
  };

  const validateTimes = (): { valid: boolean; error?: string } => {
    if (!formData.departureTime) {
      return { valid: false, error: 'Departure time is required' };
    }
    if (!formData.arrivalTime) {
      return { valid: false, error: 'Arrival time is required' };
    }
    if (formData.departureTime >= formData.arrivalTime) {
      return { valid: false, error: 'Arrival time must be after departure time' };
    }

    // Check if boarding point times are between departure and arrival times
    for (const point of boardingPoints) {
      if (point.arrivalTime <= formData.departureTime || point.arrivalTime >= formData.arrivalTime) {
        return { valid: false, error: `Boarding point "${point.name}" time must be between departure and arrival times` };
      }
    }

    return { valid: true };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const timeValidation = validateTimes();
    if (!timeValidation.valid) {
      alert(timeValidation.error || 'Time validation failed');
      return;
    }

    if (editingRoute) {
      // Update existing route
      const updatedRoutes = routes.map((route) =>
        route.id === editingRoute.id
          ? {
              ...route,
              name: formData.name,
              startPoint: formData.startPoint,
              endPoint: formData.endPoint,
              distance: parseFloat(formData.distance),
              departureTime: formData.departureTime,
              arrivalTime: formData.arrivalTime,
              operatingDays: operatingDays,
              boardingPoints: boardingPoints,
              status: formData.status,
            }
          : route
      );
      setRoutes(updatedRoutes);
    } else {
      // Create new route
      const newRoute: Route = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        distance: parseFloat(formData.distance),
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        operatingDays: operatingDays,
        boardingPoints: boardingPoints,
        status: formData.status,
      };
      setRoutes([...routes, newRoute]);
    }
    resetForm();
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distance: route.distance.toString(),
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      status: route.status,
    });
    setBoardingPoints(route.boardingPoints);
    setOperatingDays(route.operatingDays || []);
    setShowForm(true);
  };

  const handleDelete = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      setRoutes(routes.filter((route) => route.id !== routeId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transportation Routes</h1>
          <button
            onClick={() => {
              setEditingRoute(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Route
          </button>
        </div>

        {/* Add/Edit Route Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingRoute ? 'Edit Route' : 'Add New Route'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., Route 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Point *</label>
                  <input
                    type="text"
                    value={formData.startPoint}
                    onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., Main Gate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Point *</label>
                  <input
                    type="text"
                    value={formData.endPoint}
                    onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., School"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km) *</label>
                  <input
                    type="number"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    required
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g., 5.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time *</label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operating Days *</label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <label
                      key={day.value}
                      className="flex items-center justify-center px-2 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors"
                      style={{
                        backgroundColor: operatingDays.includes(day.value) ? '#3b82f6' : 'white',
                        borderColor: operatingDays.includes(day.value) ? '#3b82f6' : '#d1d5db',
                      }}
                    >
                      <input
                        type="checkbox"
                        value={day.value}
                        checked={operatingDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOperatingDays([...operatingDays, day.value]);
                          } else {
                            setOperatingDays(operatingDays.filter((d) => d !== day.value));
                          }
                        }}
                        className="sr-only"
                      />
                      <span
                        className="font-medium text-sm"
                        style={{
                          color: operatingDays.includes(day.value) ? 'white' : '#374151',
                        }}
                      >
                        {day.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
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
                    placeholder="e.g., Central Bus Stand"
                  />
                  <input
                    type="time"
                    value={boardingPointTimeInput}
                    onChange={(e) => setBoardingPointTimeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBoardingPoint();
                      }
                    }}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                          <span className="text-gray-500 text-xs ml-2 bg-gray-200 px-2 py-0.5 rounded">
                            {point.arrivalTime}
                          </span>
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
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingRoute ? 'Update Route' : 'Save Route'}
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

        {/* Routes List */}
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Route Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">From</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">To</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Distance (km)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Schedule</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Boarding Points</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No routes configured yet</p>
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{route.name}</td>
                    <td className="px-6 py-4 text-gray-600">{route.startPoint}</td>
                    <td className="px-6 py-4 text-gray-600">{route.endPoint}</td>
                    <td className="px-6 py-4 text-gray-600">{route.distance}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {route.operatingDays && route.operatingDays.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {route.operatingDays.map((day) => (
                              <span key={day} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {day.substring(0, 1)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No schedule</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {route.departureTime && route.arrivalTime ? (
                        <span className="font-medium">{route.departureTime} → {route.arrivalTime}</span>
                      ) : (
                        <span className="text-gray-500">No times</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {route.boardingPoints.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 mb-1">{route.boardingPoints.length} points</div>
                          <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                            {route.boardingPoints.map((point) => (
                              <div key={point.id} className="flex items-center gap-1">
                                <span className="inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                  {point.sequence}
                                </span>
                                {point.name}
                                <span className="text-gray-500 text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                                  {point.arrivalTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No boarding points</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          route.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(route)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Edit route"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Delete route"
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
