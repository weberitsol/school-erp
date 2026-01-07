'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Users, AlertCircle, Clock, Zap } from 'lucide-react';

interface DashboardStats {
  totalTrips: number;
  completedTrips: number;
  onTimeTrips: number;
  lateTrips: number;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  averageDelay: number;
  vehicleUtilization: number;
  driverSafetyScore: number;
}

interface RouteMetrics {
  routeName: string;
  totalTrips: number;
  averageDelay: number;
  onTimeRate: number;
  studentCount: number;
  attendanceRate: number;
}

interface VehiclePerformance {
  registrationNo: string;
  totalTrips: number;
  onTimeTrips: number;
  averageDelay: number;
  fuelEfficiency: number;
  safetyScore: number;
  maintenanceStatus: 'GOOD' | 'FAIR' | 'NEEDS_SERVICE';
}

// Sample data
const DASHBOARD_STATS: DashboardStats = {
  totalTrips: 128,
  completedTrips: 126,
  onTimeTrips: 115,
  lateTrips: 11,
  totalStudents: 542,
  presentStudents: 518,
  absentStudents: 24,
  averageDelay: 4.2,
  vehicleUtilization: 87.5,
  driverSafetyScore: 92.3,
};

const ROUTE_METRICS: RouteMetrics[] = [
  {
    routeName: 'Morning Route A',
    totalTrips: 32,
    averageDelay: 2.1,
    onTimeRate: 93.75,
    studentCount: 145,
    attendanceRate: 95.2,
  },
  {
    routeName: 'Morning Route B',
    totalTrips: 28,
    averageDelay: 3.5,
    onTimeRate: 89.3,
    studentCount: 138,
    attendanceRate: 93.5,
  },
  {
    routeName: 'Evening Route A',
    totalTrips: 35,
    averageDelay: 4.8,
    onTimeRate: 88.6,
    studentCount: 152,
    attendanceRate: 94.1,
  },
  {
    routeName: 'Evening Route B',
    totalTrips: 33,
    averageDelay: 5.2,
    onTimeRate: 87.9,
    studentCount: 107,
    attendanceRate: 92.7,
  },
];

const VEHICLE_PERFORMANCE: VehiclePerformance[] = [
  {
    registrationNo: 'MH-01-AB-1234',
    totalTrips: 42,
    onTimeTrips: 39,
    averageDelay: 2.3,
    fuelEfficiency: 8.5,
    safetyScore: 95,
    maintenanceStatus: 'GOOD',
  },
  {
    registrationNo: 'MH-01-CD-5678',
    totalTrips: 41,
    onTimeTrips: 37,
    averageDelay: 4.1,
    fuelEfficiency: 7.8,
    safetyScore: 90,
    maintenanceStatus: 'FAIR',
  },
  {
    registrationNo: 'MH-01-EF-9012',
    totalTrips: 45,
    onTimeTrips: 40,
    averageDelay: 5.5,
    fuelEfficiency: 7.2,
    safetyScore: 88,
    maintenanceStatus: 'NEEDS_SERVICE',
  },
];

export default function AnalyticsDashboard() {
  const [selectedMetric, setSelectedMetric] = useState<'routes' | 'vehicles'>('routes');

  const onTimePercentage = (DASHBOARD_STATS.onTimeTrips / DASHBOARD_STATS.completedTrips) * 100;
  const attendancePercentage = (DASHBOARD_STATS.presentStudents / DASHBOARD_STATS.totalStudents) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transportation Analytics</h1>
          <p className="text-gray-600">Comprehensive performance metrics and insights</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">On-Time Performance</p>
                <p className="text-4xl font-bold text-blue-600">{onTimePercentage.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-2">{DASHBOARD_STATS.onTimeTrips} of {DASHBOARD_STATS.completedTrips} trips</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Attendance Rate</p>
                <p className="text-4xl font-bold text-green-600">{attendancePercentage.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-2">{DASHBOARD_STATS.presentStudents} of {DASHBOARD_STATS.totalStudents} students</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Average Delay</p>
                <p className="text-4xl font-bold text-orange-600">{DASHBOARD_STATS.averageDelay}</p>
                <p className="text-xs text-gray-500 mt-2">minutes across all trips</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-2">Total Trips</p>
            <p className="text-2xl font-bold text-gray-900">{DASHBOARD_STATS.totalTrips}</p>
            <p className="text-xs text-green-600 mt-1">↑ 5.2% vs last week</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-2">Vehicle Utilization</p>
            <p className="text-2xl font-bold text-gray-900">{DASHBOARD_STATS.vehicleUtilization}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${DASHBOARD_STATS.vehicleUtilization}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-2">Safety Score</p>
            <p className="text-2xl font-bold text-gray-900">{DASHBOARD_STATS.driverSafetyScore}</p>
            <p className="text-xs text-green-600 mt-1">Excellent</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm mb-2">Late Trips</p>
            <p className="text-2xl font-bold text-red-600">{DASHBOARD_STATS.lateTrips}</p>
            <p className="text-xs text-gray-500 mt-1">{((DASHBOARD_STATS.lateTrips / DASHBOARD_STATS.completedTrips) * 100).toFixed(1)}% of trips</p>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Trip Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Trip Status Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Completed</span>
                  <span className="text-lg font-bold text-gray-900">
                    {((DASHBOARD_STATS.completedTrips / DASHBOARD_STATS.totalTrips) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${(DASHBOARD_STATS.completedTrips / DASHBOARD_STATS.totalTrips) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">In Progress</span>
                  <span className="text-lg font-bold text-gray-900">
                    {(((DASHBOARD_STATS.totalTrips - DASHBOARD_STATS.completedTrips) / DASHBOARD_STATS.totalTrips) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${((DASHBOARD_STATS.totalTrips - DASHBOARD_STATS.completedTrips) / DASHBOARD_STATS.totalTrips) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Student Attendance Summary</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Present</span>
                  <span className="text-lg font-bold text-green-600">{DASHBOARD_STATS.presentStudents}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${attendancePercentage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">Absent</span>
                  <span className="text-lg font-bold text-red-600">{DASHBOARD_STATS.absentStudents}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full"
                    style={{ width: `${100 - attendancePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setSelectedMetric('routes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetric === 'routes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Route Performance
            </button>
            <button
              onClick={() => setSelectedMetric('vehicles')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMetric === 'vehicles'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Vehicle Performance
            </button>
          </div>

          {selectedMetric === 'routes' && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Route Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Trips</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">On-Time Rate</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Avg. Delay</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Students</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {ROUTE_METRICS.map((route) => (
                    <tr key={route.routeName} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{route.routeName}</td>
                      <td className="px-6 py-4 text-gray-600">{route.totalTrips}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${route.onTimeRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{route.onTimeRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-medium">
                          {route.averageDelay.toFixed(1)}m
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{route.studentCount}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                          {route.attendanceRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedMetric === 'vehicles' && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Trips</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">On-Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Avg. Delay</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fuel Efficiency</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Safety Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  {VEHICLE_PERFORMANCE.map((vehicle) => (
                    <tr key={vehicle.registrationNo} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{vehicle.registrationNo}</td>
                      <td className="px-6 py-4 text-gray-600">{vehicle.totalTrips}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {vehicle.onTimeTrips} ({((vehicle.onTimeTrips / vehicle.totalTrips) * 100).toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-medium">
                          {vehicle.averageDelay.toFixed(1)}m
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{vehicle.fuelEfficiency} km/l</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                          {vehicle.safetyScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            vehicle.maintenanceStatus === 'GOOD'
                              ? 'bg-green-100 text-green-800'
                              : vehicle.maintenanceStatus === 'FAIR'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {vehicle.maintenanceStatus.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
