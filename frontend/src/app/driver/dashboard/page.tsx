'use client';

import { useState } from 'react';
import { MapPin, Clock, Users, AlertCircle, Play, CheckCircle, Navigation, Bell } from 'lucide-react';

interface Trip {
  id: string;
  routeName: string;
  departureTime: string;
  arrivalTime: string;
  status: 'UPCOMING' | 'STARTED' | 'COMPLETED';
  studentsToBoard: number;
  studentsBoarded: number;
  currentStop?: string;
  stops: TripStop[];
}

interface TripStop {
  sequence: number;
  name: string;
  expectedTime: string;
  status: 'UPCOMING' | 'CURRENT' | 'COMPLETED';
  boardedCount?: number;
}

interface DriverInfo {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  vehicleReg: string;
  status: 'ONLINE' | 'OFFLINE';
}

// Sample data
const DRIVER_INFO: DriverInfo = {
  id: 'd1',
  name: 'Rajesh Kumar',
  licenseNumber: 'DL-2024-001',
  phone: '9876543210',
  vehicleReg: 'MH-01-AB-1234',
  status: 'ONLINE',
};

const TODAY_TRIPS: Trip[] = [
  {
    id: 't1',
    routeName: 'Morning Route A',
    departureTime: '07:20',
    arrivalTime: '08:45',
    status: 'STARTED',
    studentsToBoard: 45,
    studentsBoarded: 30,
    currentStop: 'Bus Station Central',
    stops: [
      { sequence: 1, name: 'Main Gate', expectedTime: '07:45', status: 'COMPLETED', boardedCount: 12 },
      { sequence: 2, name: 'Bus Station Central', expectedTime: '08:15', status: 'CURRENT', boardedCount: 18 },
      { sequence: 3, name: 'Market Complex', expectedTime: '08:35', status: 'UPCOMING' },
      { sequence: 4, name: 'School Gate', expectedTime: '08:45', status: 'UPCOMING' },
    ],
  },
  {
    id: 't2',
    routeName: 'Evening Route A',
    departureTime: '14:30',
    arrivalTime: '16:00',
    status: 'UPCOMING',
    studentsToBoard: 42,
    studentsBoarded: 0,
    stops: [
      { sequence: 1, name: 'School Gate', expectedTime: '14:30', status: 'UPCOMING' },
      { sequence: 2, name: 'Market Complex', expectedTime: '14:50', status: 'UPCOMING' },
      { sequence: 3, name: 'Central Hub', expectedTime: '15:15', status: 'UPCOMING' },
      { sequence: 4, name: 'Main Gate', expectedTime: '16:00', status: 'UPCOMING' },
    ],
  },
];

export default function DriverDashboard() {
  const [trips, setTrips] = useState<Trip[]>(TODAY_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<Trip>(TODAY_TRIPS[0]);
  const [shareLocation, setShareLocation] = useState(true);

  const handleStartTrip = (tripId: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, status: 'STARTED' as const } : trip
      )
    );
  };

  const handleCompleteTrip = (tripId: string) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, status: 'COMPLETED' as const } : trip
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'STARTED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const upcomingTrips = trips.filter((t) => t.status === 'UPCOMING').length;
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Driver Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{DRIVER_INFO.name}</h1>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="opacity-75">License</p>
                  <p className="font-mono font-bold">{DRIVER_INFO.licenseNumber}</p>
                </div>
                <div>
                  <p className="opacity-75">Vehicle</p>
                  <p className="font-mono font-bold">{DRIVER_INFO.vehicleReg}</p>
                </div>
                <div>
                  <p className="opacity-75">Contact</p>
                  <p className="font-mono font-bold">{DRIVER_INFO.phone}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">{DRIVER_INFO.status}</span>
              </div>
              <label className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/30 transition-colors">
                <Navigation className="w-4 h-4" />
                <input
                  type="checkbox"
                  checked={shareLocation}
                  onChange={(e) => setShareLocation(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Share Location</span>
              </label>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Total Trips Today</p>
            <p className="text-3xl font-bold text-gray-900">{trips.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedTrips}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-yellow-600">{upcomingTrips}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Total Students</p>
            <p className="text-3xl font-bold text-blue-600">
              {trips.reduce((sum, t) => sum + t.studentsToBoard, 0)}
            </p>
          </div>
        </div>

        {/* Trips Overview */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Trip List */}
          <div className="col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Today's Trips</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`p-6 cursor-pointer transition-colors ${
                    selectedTrip.id === trip.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{trip.routeName}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        {trip.departureTime} → {trip.arrivalTime}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {trip.studentsBoarded}/{trip.studentsToBoard} students
                      </span>
                    </div>
                    {trip.currentStop && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{trip.currentStop}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {trip.status === 'UPCOMING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTrip(trip.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                      >
                        <Play className="w-4 h-4" />
                        Start Trip
                      </button>
                    )}
                    {trip.status === 'STARTED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteTrip(trip.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Trip
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Messages */}
          <div className="space-y-6">
            {/* Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Slight Delay</p>
                    <p className="text-yellow-700">Currently 4 min behind schedule</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Boarding In Progress</p>
                    <p className="text-blue-700">15 more students to board</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Vehicle Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fuel Level</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Temperature</span>
                  <span className="font-medium text-gray-900">38°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tire Pressure</span>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    Normal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Trip Details */}
        {selectedTrip && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{selectedTrip.routeName} - Route Timeline</h2>

            <div className="space-y-4">
              {selectedTrip.stops.map((stop, index) => (
                <div key={stop.sequence} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        stop.status === 'COMPLETED'
                          ? 'bg-green-600'
                          : stop.status === 'CURRENT'
                            ? 'bg-blue-600 animate-pulse'
                            : 'bg-gray-300'
                      }`}
                    >
                      {stop.sequence}
                    </div>
                    {index < selectedTrip.stops.length - 1 && (
                      <div
                        className={`w-1 h-20 ${
                          stop.status === 'COMPLETED' ? 'bg-green-300' : 'bg-gray-300'
                        }`}
                      ></div>
                    )}
                  </div>

                  {/* Stop Details */}
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{stop.name}</h3>
                        <p className="text-sm text-gray-600">{stop.expectedTime}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          stop.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : stop.status === 'CURRENT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {stop.status}
                      </span>
                    </div>
                    {stop.boardedCount !== undefined && (
                      <p className="text-sm text-gray-600">{stop.boardedCount} students boarded</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
