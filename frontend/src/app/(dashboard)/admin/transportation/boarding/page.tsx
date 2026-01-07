'use client';

import { useState } from 'react';
import { Users, Check, X, AlertCircle, BarChart3 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  status: 'PENDING' | 'BOARDED' | 'ABSENT';
  boardingTime?: string;
}

interface BoardingPoint {
  id: string;
  name: string;
  stopSequence: number;
  students: Student[];
  expectedArrivalTime: string;
}

interface Trip {
  id: string;
  date: string;
  routeName: string;
  driverId: string;
  vehicleId: string;
  boardingPoints: BoardingPoint[];
  totalStudents: number;
}

// Sample data
const SAMPLE_TRIPS: Trip[] = [
  {
    id: 't1',
    date: '2026-01-07',
    routeName: 'Morning Route A',
    driverId: 'd1',
    vehicleId: 'v1',
    totalStudents: 12,
    boardingPoints: [
      {
        id: 'bp1',
        name: 'Main Gate',
        stopSequence: 1,
        expectedArrivalTime: '07:45',
        students: [
          { id: 's1', name: 'Aarav Kumar', rollNumber: '101', status: 'PENDING' },
          { id: 's2', name: 'Bhavna Singh', rollNumber: '102', status: 'PENDING' },
          { id: 's3', name: 'Chirag Patel', rollNumber: '103', status: 'PENDING' },
          { id: 's4', name: 'Deepa Nair', rollNumber: '104', status: 'BOARDED', boardingTime: '07:47' },
        ],
      },
      {
        id: 'bp2',
        name: 'Bus Station Central',
        stopSequence: 2,
        expectedArrivalTime: '08:15',
        students: [
          { id: 's5', name: 'Esha Gupta', rollNumber: '105', status: 'PENDING' },
          { id: 's6', name: 'Faisal Khan', rollNumber: '106', status: 'PENDING' },
          { id: 's7', name: 'Gita Das', rollNumber: '107', status: 'ABSENT' },
          { id: 's8', name: 'Harish Rao', rollNumber: '108', status: 'BOARDED', boardingTime: '08:14' },
        ],
      },
    ],
  },
];

export default function BoardingPage() {
  const [selectedTripId, setSelectedTripId] = useState<string>(SAMPLE_TRIPS[0]?.id || '');
  const [trips, setTrips] = useState<Trip[]>(SAMPLE_TRIPS);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const updateStudentStatus = (
    tripId: string,
    pointId: string,
    studentId: string,
    newStatus: 'BOARDED' | 'ABSENT'
  ) => {
    const updatedTrips = trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            boardingPoints: trip.boardingPoints.map((point) =>
              point.id === pointId
                ? {
                    ...point,
                    students: point.students.map((student) =>
                      student.id === studentId
                        ? {
                            ...student,
                            status: newStatus,
                            boardingTime: newStatus === 'BOARDED' ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined,
                          }
                        : student
                    ),
                  }
                : point
            ),
          }
        : trip
    );
    setTrips(updatedTrips);
  };

  const calculateBoardingStats = (trip: Trip) => {
    let boarded = 0;
    let absent = 0;
    let pending = 0;

    trip.boardingPoints.forEach((point) => {
      point.students.forEach((student) => {
        if (student.status === 'BOARDED') boarded++;
        else if (student.status === 'ABSENT') absent++;
        else pending++;
      });
    });

    const total = boarded + absent + pending;
    const successRate = total > 0 ? ((boarded / total) * 100).toFixed(1) : '0';

    return { boarded, absent, pending, total, successRate };
  };

  const stats = selectedTrip ? calculateBoardingStats(selectedTrip) : { boarded: 0, absent: 0, pending: 0, total: 0, successRate: '0' };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Boarding Management</h1>

          {/* Trip Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Trip</label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.date} - {trip.routeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTrip && (
          <>
            {/* Boarding Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-200" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Boarded</p>
                    <p className="text-3xl font-bold text-green-600">{stats.boarded}</p>
                  </div>
                  <Check className="w-12 h-12 text-green-200" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-yellow-200" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Success Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.successRate}%</p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Boarding Points */}
            <div className="space-y-6">
              {selectedTrip.boardingPoints.map((point) => {
                const pointStats = {
                  pending: point.students.filter((s) => s.status === 'PENDING').length,
                  boarded: point.students.filter((s) => s.status === 'BOARDED').length,
                  absent: point.students.filter((s) => s.status === 'ABSENT').length,
                };

                return (
                  <div key={point.id} className="bg-white rounded-lg shadow">
                    {/* Point Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">
                            Stop {point.stopSequence}: {point.name}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">Expected Arrival: {point.expectedArrivalTime}</p>
                        </div>
                        <div className="text-right">
                          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                            Boarded: {pointStats.boarded}
                          </div>
                          <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mr-2">
                            Pending: {pointStats.pending}
                          </div>
                          <div className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                            Absent: {pointStats.absent}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Students List */}
                    <div className="divide-y divide-gray-200">
                      {point.students.map((student) => (
                        <div key={student.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                              {student.boardingTime && (
                                <p className="text-xs text-gray-500 mt-1">Boarded at: {student.boardingTime}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Status Badge */}
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  student.status === 'BOARDED'
                                    ? 'bg-green-100 text-green-800'
                                    : student.status === 'ABSENT'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {student.status}
                              </span>

                              {/* Action Buttons */}
                              {student.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => updateStudentStatus(selectedTrip.id, point.id, student.id, 'BOARDED')}
                                    className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors text-green-600"
                                    title="Mark as boarded"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => updateStudentStatus(selectedTrip.id, point.id, student.id, 'ABSENT')}
                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-red-600"
                                    title="Mark as absent"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Section */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Boarding Summary</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Success Rate</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${stats.successRate}%` }}
                    ></div>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-2">{stats.successRate}%</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Status Breakdown</p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-green-600">{stats.boarded}</span> Boarded
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-yellow-600">{stats.pending}</span> Pending
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-red-600">{stats.absent}</span> Absent
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Actions</p>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Finalize Boarding
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
