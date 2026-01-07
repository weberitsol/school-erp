'use client';

import { useState } from 'react';
import { MapPin, Clock, Navigation, AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface TripSegment {
  id: string;
  sequence: number;
  stopName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  expectedArrival: string;
  actualArrival?: string;
  distance: number;
  duration: number;
  studentsBoarded?: number;
}

interface Trip {
  id: string;
  date: string;
  routeName: string;
  driverName: string;
  vehicleReg: string;
  departureTime: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  currentSpeed: number;
  segments: TripSegment[];
  totalDistance: number;
  totalDuration: number;
  elapsedTime: number;
  remainingTime: number;
  totalStudents: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

// Sample data
const SAMPLE_TRIP: Trip = {
  id: 't1',
  date: '2026-01-07',
  routeName: 'Morning Route A',
  driverName: 'Rajesh Kumar',
  vehicleReg: 'MH-01-AB-1234',
  departureTime: '07:20',
  currentLocation: {
    lat: 19.0855,
    lng: 72.8738,
  },
  currentSpeed: 35,
  status: 'IN_PROGRESS',
  totalDistance: 12.5,
  totalDuration: 85,
  elapsedTime: 35,
  remainingTime: 50,
  totalStudents: 45,
  segments: [
    {
      id: 's1',
      sequence: 1,
      stopName: 'Main Gate',
      status: 'COMPLETED',
      expectedArrival: '07:45',
      actualArrival: '07:47',
      distance: 2.3,
      duration: 15,
      studentsBoarded: 12,
    },
    {
      id: 's2',
      sequence: 2,
      stopName: 'Bus Station Central',
      status: 'IN_PROGRESS',
      expectedArrival: '08:15',
      distance: 5.2,
      duration: 25,
      studentsBoarded: 18,
    },
    {
      id: 's3',
      sequence: 3,
      stopName: 'Market Complex',
      status: 'NOT_STARTED',
      expectedArrival: '08:35',
      distance: 3.0,
      duration: 20,
      studentsBoarded: 10,
    },
    {
      id: 's4',
      sequence: 4,
      stopName: 'School Gate',
      status: 'NOT_STARTED',
      expectedArrival: '08:45',
      distance: 2.0,
      duration: 10,
      studentsBoarded: 5,
    },
  ],
};

export default function TripProgressPage() {
  const [trip, setTrip] = useState<Trip>(SAMPLE_TRIP);

  const getSegmentIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'IN_PROGRESS':
        return <Zap className="w-6 h-6 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getSegmentBg = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const currentSegment = trip.segments.find((s) => s.status === 'IN_PROGRESS');
  const progressPercentage = (trip.elapsedTime / trip.totalDuration) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.routeName}</h1>
              <p className="text-gray-600">
                {trip.date} • {trip.driverName} • {trip.vehicleReg}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                trip.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-800'
                  : trip.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {trip.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Current Speed</p>
            <p className="text-3xl font-bold text-blue-600">{trip.currentSpeed}</p>
            <p className="text-xs text-gray-500">km/h</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Distance Covered</p>
            <p className="text-3xl font-bold text-purple-600">{trip.totalDistance - (trip.remainingTime / trip.totalDuration) * trip.totalDistance}</p>
            <p className="text-xs text-gray-500">km</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Remaining Distance</p>
            <p className="text-3xl font-bold text-orange-600">{((trip.remainingTime / trip.totalDuration) * trip.totalDistance).toFixed(1)}</p>
            <p className="text-xs text-gray-500">km</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Elapsed Time</p>
            <p className="text-3xl font-bold text-green-600">{Math.floor(trip.elapsedTime / 60)}m {trip.elapsedTime % 60}s</p>
            <p className="text-xs text-gray-500">minutes</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-1">Students Boarded</p>
            <p className="text-3xl font-bold text-indigo-600">
              {trip.segments.reduce((sum, s) => sum + (s.studentsBoarded || 0), 0)}/{trip.totalStudents}
            </p>
            <p className="text-xs text-gray-500">students</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
            <span className="text-lg font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {trip.elapsedTime}/{trip.totalDuration} minutes elapsed
          </p>
        </div>

        {/* Trip Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Trip Timeline</h2>

          <div className="space-y-4">
            {trip.segments.map((segment, index) => (
              <div key={segment.id} className={`border rounded-lg p-6 ${getSegmentBg(segment.status)}`}>
                <div className="flex gap-6">
                  {/* Timeline Indicator */}
                  <div className="flex flex-col items-center">
                    <div className="mb-2">{getSegmentIcon(segment.status)}</div>
                    {index < trip.segments.length - 1 && (
                      <div
                        className={`w-1 h-16 ${
                          segment.status === 'COMPLETED'
                            ? 'bg-green-300'
                            : segment.status === 'IN_PROGRESS'
                              ? 'bg-blue-300'
                              : 'bg-gray-300'
                        }`}
                      ></div>
                    )}
                  </div>

                  {/* Segment Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Stop {segment.sequence}: {segment.stopName}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {segment.distance} km • {segment.duration} minutes
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {segment.status === 'COMPLETED'
                          ? '✓ Completed'
                          : segment.status === 'IN_PROGRESS'
                            ? '⚡ Active'
                            : '⏱ Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Expected Arrival</p>
                        <p className="font-mono text-lg font-bold text-gray-900">{segment.expectedArrival}</p>
                      </div>
                      {segment.actualArrival && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Actual Arrival</p>
                          <p className="font-mono text-lg font-bold text-green-600">{segment.actualArrival}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Students</p>
                        <p className="font-mono text-lg font-bold text-blue-600">{segment.studentsBoarded || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ETA and Alerts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* ETA Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ETA Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Current Stop</span>
                <span className="text-lg font-bold text-blue-600">{currentSegment?.stopName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Next Stop ETA</span>
                <span className="text-lg font-bold text-orange-600">
                  {trip.segments.find((s) => s.status === 'NOT_STARTED')?.expectedArrival || 'Completed'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">School Arrival ETA</span>
                <span className="text-lg font-bold text-green-600">
                  {trip.segments[trip.segments.length - 1]?.expectedArrival}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Remaining Time</span>
                <span className="text-lg font-bold text-purple-600">~{trip.remainingTime}m</span>
              </div>
            </div>
          </div>

          {/* Status Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Alerts & Notifications</h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">On Time</p>
                  <p className="text-sm text-green-700">Trip is running on schedule</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Route Active</p>
                  <p className="text-sm text-blue-700">Currently on Main Route A</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Boarding In Progress</p>
                  <p className="text-sm text-yellow-700">18 of 45 students boarded</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Live Map</h3>
          <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Map integration placeholder</p>
              <p className="text-sm text-gray-500 mt-1">Current location: {trip.currentLocation.lat.toFixed(4)}, {trip.currentLocation.lng.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
