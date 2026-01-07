'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { routesService, type Route, type BoardingPoint } from '@/services/transportation/routes.service';

interface RouteFormData {
  name: string;
  startPoint: string;
  endPoint: string;
  distance: string;
  departureTime: string;
  arrivalTime: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [boardingPointInput, setBoardingPointInput] = useState('');
  const [boardingPointTimeInput, setBoardingPointTimeInput] = useState('');
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([]);
  const [operatingDays, setOperatingDays] = useState<string[]>([]);
  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    startPoint: '',
    endPoint: '',
    distance: '',
    departureTime: '',
    arrivalTime: '',
    status: 'ACTIVE',
  });

  // Fetch routes on component mount
  useEffect(() => {
    fetchRoutes();
  }, []);

  const normalizeRoute = (route: Route) => {
    // Ensure all required fields have defaults
    return {
      ...route,
      startPoint: route.startPoint ?? '',
      endPoint: route.endPoint ?? '',
      distance: route.distance ?? 0,
      departureTime: route.departureTime ?? '',
      arrivalTime: route.arrivalTime ?? '',
      operatingDays: route.operatingDays ?? [],
      boardingPoints: route.boardingPoints ?? [],
      stops: route.stops ?? [],
    } as Required<Route>;
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routesService.getAll();
      console.log('Raw routes from API:', data);
      console.log('Routes type:', typeof data, 'Is array:', Array.isArray(data));

      if (!Array.isArray(data)) {
        console.error('Routes data is not an array:', data);
        setRoutes([]);
        return;
      }

      // Normalize all routes to ensure required fields exist
      const normalizedRoutes = data.map(normalizeRoute);
      console.log('Normalized routes:', normalizedRoutes);
      setRoutes(normalizedRoutes);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch routes';
      setError(errorMsg);
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const timeValidation = validateTimes();
    if (!timeValidation.valid) {
      alert(timeValidation.error || 'Time validation failed');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const routeData = {
        name: formData.name,
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        distance: parseFloat(formData.distance),
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        operatingDays: operatingDays,
        status: formData.status as 'ACTIVE' | 'INACTIVE',
        boardingPoints: [],
      };

      if (editingRoute) {
        // Update existing route
        await routesService.update(editingRoute.id, routeData);
      } else {
        // Create new route
        await routesService.create(routeData);
      }

      // Refresh the routes list
      await fetchRoutes();
      resetForm();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save route';
      setError(errorMsg);
      console.error('Error saving route:', err);
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (route: Route) => {
    const normalizedRoute = normalizeRoute(route);
    setEditingRoute(normalizedRoute);
    setFormData({
      name: route.name,
      startPoint: route.startPoint ?? '',
      endPoint: route.endPoint ?? '',
      distance: (route.distance ?? 0).toString(),
      departureTime: route.departureTime ?? '',
      arrivalTime: route.arrivalTime ?? '',
      status: route.status,
    });
    setBoardingPoints(route.boardingPoints ?? []);
    setOperatingDays(route.operatingDays ?? []);
    setShowForm(true);
  };

  const handleDelete = async (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      try {
        setSubmitting(true);
        setError(null);
        await routesService.delete(routeId);
        // Refresh the routes list
        await fetchRoutes();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete route';
        setError(errorMsg);
        console.error('Error deleting route:', err);
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
          <p className="text-gray-600">Loading routes...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Transportation Routes</h1>
          <button
            onClick={() => {
              setEditingRoute(null);
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingRoute ? 'Update Route' : 'Save Route'}
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
                routes.map((route) => {
                  // Ensure normalization for each row
                  const normalized = normalizeRoute(route);
                  return (
                    <tr key={route.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{normalized.name}</td>
                      <td className="px-6 py-4 text-gray-600">{normalized.startPoint || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{normalized.endPoint || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{normalized.distance || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {normalized.operatingDays?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {normalized.operatingDays.map((day) => (
                                <span key={day} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  {day.substring(0, 1)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {normalized.departureTime && normalized.arrivalTime ? (
                          <span className="font-medium">{normalized.departureTime} → {normalized.arrivalTime}</span>
                        ) : normalized.startTime && normalized.endTime ? (
                          <span className="font-medium">{normalized.startTime} → {normalized.endTime}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {normalized.boardingPoints?.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 mb-1">{normalized.boardingPoints.length} points</div>
                            <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                              {normalized.boardingPoints.map((point) => (
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
                        ) : normalized.stops?.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 mb-1">{normalized.stops.length} stops</div>
                            <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                              {normalized.stops.map((point) => (
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
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            normalized.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {normalized.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(normalized)}
                          disabled={submitting}
                          className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit route"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          disabled={submitting}
                          className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete route"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
