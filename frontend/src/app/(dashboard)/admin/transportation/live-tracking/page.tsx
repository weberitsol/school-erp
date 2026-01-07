'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Zap, AlertCircle, Eye, Filter, RefreshCw } from 'lucide-react';

interface Vehicle {
  id: string;
  registrationNo: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  speed: number;
  bearing: number;
  status: 'IDLE' | 'IN_TRANSIT' | 'AT_STOP' | 'COMPLETED';
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
  lastUpdated: string;
  currentStop?: string;
  nextStop?: string;
  eta?: string;
  tripId: string;
  students: number;
}

// Sample data
const SAMPLE_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    registrationNo: 'MH-01-AB-1234',
    currentLocation: { lat: 19.0855, lng: 72.8738 },
    speed: 35,
    bearing: 45,
    status: 'IN_TRANSIT',
    routeId: 'r1',
    routeName: 'Morning Route A',
    driverId: 'd1',
    driverName: 'Rajesh Kumar',
    lastUpdated: new Date().toISOString(),
    currentStop: 'Bus Station Central',
    nextStop: 'Market Complex',
    eta: '08:35',
    tripId: 't1',
    students: 18,
  },
  {
    id: 'v2',
    registrationNo: 'MH-01-CD-5678',
    currentLocation: { lat: 19.0912, lng: 72.8654 },
    speed: 28,
    bearing: 120,
    status: 'IN_TRANSIT',
    routeId: 'r2',
    routeName: 'Morning Route B',
    driverId: 'd2',
    driverName: 'Priya Singh',
    lastUpdated: new Date(Date.now() - 30000).toISOString(),
    currentStop: 'Main Gate',
    nextStop: 'Central Hub',
    eta: '08:20',
    tripId: 't2',
    students: 21,
  },
  {
    id: 'v3',
    registrationNo: 'MH-01-EF-9012',
    currentLocation: { lat: 19.0765, lng: 72.8845 },
    speed: 0,
    bearing: 0,
    status: 'AT_STOP',
    routeId: 'r3',
    routeName: 'Evening Route A',
    driverId: 'd3',
    driverName: 'Amit Patel',
    lastUpdated: new Date(Date.now() - 5000).toISOString(),
    currentStop: 'School Gate',
    nextStop: 'Home Dropoff',
    eta: '16:45',
    tripId: 't3',
    students: 15,
  },
];

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(SAMPLE_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(SAMPLE_VEHICLES[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRoute, setFilterRoute] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((vehicle) => ({
          ...vehicle,
          currentLocation: {
            lat: vehicle.currentLocation.lat + (Math.random() - 0.5) * 0.001,
            lng: vehicle.currentLocation.lng + (Math.random() - 0.5) * 0.001,
          },
          speed: Math.max(0, Math.min(50, vehicle.speed + (Math.random() - 0.5) * 5)),
          lastUpdated: new Date().toISOString(),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredVehicles = vehicles.filter((v) => {
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (filterRoute !== 'all' && v.routeId !== filterRoute) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'AT_STOP':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'IDLE':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return <Navigation className="w-4 h-4 text-green-600" />;
      case 'AT_STOP':
        return <MapPin className="w-4 h-4 text-yellow-600" />;
      case 'COMPLETED':
        return <Zap className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const routes = [...new Set(vehicles.map((v) => v.routeId))];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking Dashboard</h1>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Left Panel: Map Placeholder */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Map Container */}
              <div className="w-full h-96 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden border-b border-gray-200">
                {/* Vehicle Markers */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-2 opacity-50" />
                    <p className="text-gray-600 font-medium">Map Integration Placeholder</p>
                    <p className="text-sm text-gray-500 mt-1">Live vehicle markers will appear here</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Ready for Google Maps / Mapbox integration
                    </p>
                  </div>
                </div>

                {/* Vehicle Positions Overlay */}
                {filteredVehicles.map((vehicle) => {
                  const x = ((vehicle.currentLocation.lng - 72.86) / (72.9 - 72.86)) * 100;
                  const y = ((19.1 - vehicle.currentLocation.lat) / (19.1 - 19.07)) * 100;

                  return (
                    <div
                      key={vehicle.id}
                      className="absolute w-8 h-8 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div
                        className={`w-full h-full rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedVehicle?.id === vehicle.id
                            ? 'ring-4 ring-blue-500 scale-125'
                            : 'hover:scale-110'
                        } ${
                          vehicle.status === 'IN_TRANSIT'
                            ? 'bg-green-500 border-green-600'
                            : vehicle.status === 'AT_STOP'
                              ? 'bg-yellow-500 border-yellow-600'
                              : 'bg-blue-500 border-blue-600'
                        }`}
                      >
                        <Navigation
                          className="w-4 h-4 text-white"
                          style={{ transform: `rotate(${vehicle.bearing}deg)` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Filters */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="AT_STOP">At Stop</option>
                      <option value="IDLE">Idle</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Route:</label>
                    <select
                      value={filterRoute}
                      onChange={(e) => setFilterRoute(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">All Routes</option>
                      {routes.map((routeId) => {
                        const routeName = vehicles.find((v) => v.routeId === routeId)?.routeName;
                        return (
                          <option key={routeId} value={routeId}>
                            {routeName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="px-6 py-3 bg-white border-t border-gray-200 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-700">In Transit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-700">At Stop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700">Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Vehicle List */}
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Active Vehicles</h2>
              <p className="text-sm text-gray-600">{filteredVehicles.length} vehicles</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No vehicles match filters</p>
                  </div>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`px-6 py-4 cursor-pointer transition-colors ${
                        selectedVehicle?.id === vehicle.id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{vehicle.registrationNo}</p>
                          <p className="text-xs text-gray-600">{vehicle.routeName}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${getStatusColor(vehicle.status)}`}>
                          {getStatusIcon(vehicle.status)}
                          {vehicle.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>
                          <span className="font-medium">Driver:</span> {vehicle.driverName}
                        </p>
                        <p>
                          <span className="font-medium">Speed:</span> {vehicle.speed.toFixed(0)} km/h
                        </p>
                        <p>
                          <span className="font-medium">Students:</span> {vehicle.students}
                        </p>
                        <p>
                          <span className="font-medium">ETA:</span> {vehicle.eta}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Vehicle Details */}
        {selectedVehicle && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Vehicle Details - {selectedVehicle.registrationNo}</h2>

            <div className="grid grid-cols-4 gap-6">
              {/* Location */}
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Current Location</p>
                <p className="text-lg font-mono text-gray-900">
                  {selectedVehicle.currentLocation.lat.toFixed(4)}, {selectedVehicle.currentLocation.lng.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Updated: {new Date(selectedVehicle.lastUpdated).toLocaleTimeString()}</p>
              </div>

              {/* Trip Info */}
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Trip Information</p>
                <div className="space-y-1 text-sm text-gray-900">
                  <p>
                    <span className="font-medium">Route:</span> {selectedVehicle.routeName}
                  </p>
                  <p>
                    <span className="font-medium">Driver:</span> {selectedVehicle.driverName}
                  </p>
                  <p>
                    <span className="font-medium">Students:</span> {selectedVehicle.students}
                  </p>
                </div>
              </div>

              {/* Stop Info */}
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Stop Information</p>
                <div className="space-y-1 text-sm text-gray-900">
                  <p>
                    <span className="font-medium">Current:</span> {selectedVehicle.currentStop || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Next:</span> {selectedVehicle.nextStop || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">ETA:</span> {selectedVehicle.eta}
                  </p>
                </div>
              </div>

              {/* Speed & Status */}
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Real-time Metrics</p>
                <div className="space-y-1 text-sm text-gray-900">
                  <p>
                    <span className="font-medium">Speed:</span> {selectedVehicle.speed.toFixed(1)} km/h
                  </p>
                  <p>
                    <span className="font-medium">Bearing:</span> {selectedVehicle.bearing}°
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedVehicle.status)}`}>
                      {selectedVehicle.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
