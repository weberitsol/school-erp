'use client';

import { useState } from 'react';
import { MapPin, Clock, Users, AlertCircle, Navigation, Phone, CheckCircle, AlertTriangle } from 'lucide-react';

interface BusLocation {
  latitude: number;
  longitude: number;
  speed: number;
  bearing: number;
  lastUpdated: string;
}

interface CurrentTrip {
  id: string;
  routeName: string;
  departureTime: string;
  schoolArrivalTime: string;
  eta: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ARRIVED';
  currentStop: string;
  nextStop: string;
  studentsOnBus: number;
  driverName: string;
  driverPhone: string;
  vehicleReg: string;
  location: BusLocation;
}

interface StudentInfo {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  boardingStatus: 'PENDING' | 'BOARDED' | 'DROPPED_OFF';
  boardingTime?: string;
}

// Sample data
const STUDENT_INFO: StudentInfo = {
  id: 's123',
  name: 'Arjun Sharma',
  rollNumber: '12-A-045',
  class: '12-A',
  boardingStatus: 'BOARDED',
  boardingTime: '07:47',
};

const CURRENT_TRIP: CurrentTrip = {
  id: 't1',
  routeName: 'Morning Route A',
  departureTime: '07:20',
  schoolArrivalTime: '08:45',
  eta: '08:38',
  status: 'IN_PROGRESS',
  currentStop: 'Bus Station Central',
  nextStop: 'Market Complex',
  studentsOnBus: 30,
  driverName: 'Rajesh Kumar',
  driverPhone: '9876543210',
  vehicleReg: 'MH-01-AB-1234',
  location: {
    latitude: 19.0855,
    longitude: 72.8738,
    speed: 35,
    bearing: 45,
    lastUpdated: new Date().toISOString(),
  },
};

export default function BusTracking() {
  const [trip, setTrip] = useState<CurrentTrip>(CURRENT_TRIP);
  const [student, setStudent] = useState<StudentInfo>(STUDENT_INFO);
  const [showCallDriver, setShowCallDriver] = useState(false);

  const etaMinutes = parseInt(trip.eta.split(':')[1]) - new Date().getMinutes();
  const safetyScore = 94;
  const onTimePercentage = 92;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Student Info Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{student.name}</h1>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="opacity-75">Roll Number</p>
                  <p className="font-mono font-bold">{student.rollNumber}</p>
                </div>
                <div>
                  <p className="opacity-75">Class</p>
                  <p className="font-mono font-bold">{student.class}</p>
                </div>
                <div>
                  <p className="opacity-75">Boarding Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {student.boardingStatus === 'BOARDED' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-300" />
                        <span className="font-bold">Boarded</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-yellow-300" />
                        <span className="font-bold">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Left: Map Placeholder */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="w-full h-80 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center relative border-b border-gray-200">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-600 font-medium">Live Bus Tracker</p>
                  <p className="text-sm text-gray-500 mt-1">Map integration placeholder</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Current: {trip.location.latitude.toFixed(4)}, {trip.location.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Bus Details Card */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{trip.routeName}</h2>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Current Stop</p>
                    <p className="text-lg font-semibold text-gray-900">{trip.currentStop}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Next Stop</p>
                    <p className="text-lg font-semibold text-gray-900">{trip.nextStop}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">ETA to School</p>
                    <p className="text-lg font-semibold text-green-600">{trip.eta}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Journey Progress</span>
                    <span className="text-sm font-bold text-blue-600">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Trip & Driver Info */}
          <div className="space-y-6">
            {/* ETA Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                ETA Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Estimated Arrival</span>
                  <span className="text-lg font-bold text-blue-600">{trip.eta}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Remaining Time</span>
                  <span className="font-bold text-gray-900">~{etaMinutes} minutes</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Current Speed</span>
                  <span className="font-bold text-gray-900">{trip.location.speed} km/h</span>
                </div>
              </div>
            </div>

            {/* Driver Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Driver Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{trip.driverName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Phone</p>
                  <p className="font-mono font-semibold text-gray-900">{trip.driverPhone}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Vehicle</p>
                  <p className="font-mono font-semibold text-gray-900">{trip.vehicleReg}</p>
                </div>
                <button
                  onClick={() => setShowCallDriver(!showCallDriver)}
                  className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Call Driver
                </button>
              </div>
            </div>

            {/* Safety Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Safety & Reliability</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">Safety Score</span>
                    <span className="text-sm font-bold text-green-600">{safetyScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${safetyScore}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">On-Time Rate</span>
                    <span className="text-sm font-bold text-blue-600">{onTimePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${onTimePercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {trip.status === 'IN_PROGRESS' && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Student Boarded</p>
                <p className="text-sm text-green-700">Your ward was boarded at {student.boardingTime}</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Navigation className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">Bus on Route</p>
                <p className="text-sm text-blue-700">{trip.studentsOnBus} students on bus, running on time</p>
              </div>
            </div>
          </div>
        )}

        {/* Stops Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Route Timeline</h2>
          <div className="space-y-4">
            {[
              { sequence: 1, name: 'School Gate', time: '08:45', status: 'UPCOMING' },
              { sequence: 2, name: 'Main Gate', time: '08:20', status: 'COMPLETED', actualTime: '08:22' },
              { sequence: 3, name: 'Bus Station Central', time: '08:15', status: 'CURRENT', actualTime: '08:14' },
              { sequence: 4, name: 'Market Complex', time: '08:35', status: 'UPCOMING' },
            ].map((stop, index) => (
              <div key={stop.sequence} className="flex gap-4">
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
                  {index < 3 && (
                    <div
                      className={`w-1 h-20 ${stop.status === 'COMPLETED' ? 'bg-green-300' : 'bg-gray-300'}`}
                    ></div>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{stop.name}</h3>
                      <p className="text-sm text-gray-600">Expected: {stop.time}</p>
                      {stop.actualTime && <p className="text-sm text-gray-500">Actual: {stop.actualTime}</p>}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
