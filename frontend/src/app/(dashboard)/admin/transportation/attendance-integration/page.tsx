'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Download, RefreshCw, TrendingUp, Calendar } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentName: string;
  rollNumber: string;
  className: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'SYNC_PENDING';
  tripId: string;
  syncedAt?: string;
}

interface SyncStatus {
  id: string;
  date: string;
  tripId: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  recordsToSync: number;
  recordsSynced: number;
  failureReason?: string;
  syncedAt?: string;
}

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  weeklyPresenceRate: number;
  weeklyAbsenceRate: number;
}

// Sample data
const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', studentName: 'Aarav Kumar', rollNumber: '101', className: '10-A', date: '2026-01-07', status: 'PRESENT', tripId: 't1', syncedAt: '2026-01-07T08:30:00' },
  { id: 'a2', studentName: 'Bhavna Singh', rollNumber: '102', className: '10-A', date: '2026-01-07', status: 'ABSENT', tripId: 't1' },
  { id: 'a3', studentName: 'Chirag Patel', rollNumber: '103', className: '10-A', date: '2026-01-07', status: 'SYNC_PENDING', tripId: 't1' },
  { id: 'a4', studentName: 'Deepa Nair', rollNumber: '104', className: '10-B', date: '2026-01-07', status: 'PRESENT', tripId: 't2', syncedAt: '2026-01-07T08:45:00' },
  { id: 'a5', studentName: 'Esha Gupta', rollNumber: '201', className: '10-B', date: '2026-01-07', status: 'PRESENT', tripId: 't2' },
];

const SAMPLE_SYNC_HISTORY: SyncStatus[] = [
  { id: 's1', date: '2026-01-06', tripId: 't1', status: 'SYNCED', recordsToSync: 45, recordsSynced: 45, syncedAt: '2026-01-06T16:15:00' },
  { id: 's2', date: '2026-01-06', tripId: 't2', status: 'SYNCED', recordsToSync: 52, recordsSynced: 52, syncedAt: '2026-01-06T16:20:00' },
  { id: 's3', date: '2026-01-05', tripId: 't1', status: 'SYNCED', recordsToSync: 45, recordsSynced: 45, syncedAt: '2026-01-05T16:10:00' },
  { id: 's4', date: '2026-01-05', tripId: 't2', status: 'SYNCED', recordsToSync: 50, recordsSynced: 50, syncedAt: '2026-01-05T16:22:00' },
];

export default function AttendanceIntegrationPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(SAMPLE_ATTENDANCE);
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>(SAMPLE_SYNC_HISTORY);
  const [selectedTab, setSelectedTab] = useState<'today' | 'sync' | 'reports'>('today');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const stats: AttendanceStats = {
    totalStudents: 97,
    presentToday: 5,
    absentToday: 1,
    weeklyPresenceRate: 94.2,
    weeklyAbsenceRate: 5.8,
  };

  const handleSync = async (syncId: string) => {
    setSyncingId(syncId);
    // Simulate sync operation
    setTimeout(() => {
      setSyncHistory((prev) =>
        prev.map((sync) =>
          sync.id === syncId
            ? {
                ...sync,
                status: 'SYNCED' as const,
                recordsSynced: sync.recordsToSync,
                syncedAt: new Date().toISOString(),
              }
            : sync
        )
      );
      setSyncingId(null);
    }, 2000);
  };

  const handleSyncAll = () => {
    setSyncingId('all');
    setTimeout(() => {
      setSyncHistory((prev) =>
        prev.map((sync) => ({
          ...sync,
          status: 'SYNCED' as const,
          recordsSynced: sync.recordsToSync,
          syncedAt: new Date().toISOString(),
        }))
      );
      setSyncingId(null);
    }, 2000);
  };

  const exportData = (format: 'csv' | 'pdf') => {
    // Simulate export
    alert(`Exporting attendance data as ${format.toUpperCase()}...`);
  };

  const pendingSyncs = syncHistory.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Attendance Integration</h1>
          <p className="text-gray-600">Manage and sync attendance records from transportation trips</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Weekly Presence</p>
                <p className="text-3xl font-bold text-purple-600">{stats.weeklyPresenceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('today')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              selectedTab === 'today'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Today's Attendance
          </button>
          <button
            onClick={() => setSelectedTab('sync')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              selectedTab === 'sync'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Sync Status
            {pendingSyncs > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingSyncs}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('reports')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              selectedTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Reports
          </button>
        </div>

        {/* Today's Attendance Tab */}
        {selectedTab === 'today' && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Roll No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trip</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Synced At</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{record.studentName}</td>
                    <td className="px-6 py-4 text-gray-600">{record.rollNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{record.className}</td>
                    <td className="px-6 py-4 text-gray-600">{record.tripId}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          record.status === 'PRESENT'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'ABSENT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {record.syncedAt ? new Date(record.syncedAt).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sync Status Tab */}
        {selectedTab === 'sync' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-blue-900 font-medium">Sync Pending Records</p>
                <p className="text-blue-700 text-sm">{pendingSyncs > 0 ? `${pendingSyncs} batches waiting to sync` : 'All records synced'}</p>
              </div>
              <button
                onClick={handleSyncAll}
                disabled={syncingId !== null || pendingSyncs === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {syncingId === 'all' ? 'Syncing...' : 'Sync All'}
              </button>
            </div>

            {/* Sync History Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trip ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Records</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Synced At</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistory.map((sync) => (
                    <tr key={sync.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{sync.date}</td>
                      <td className="px-6 py-4 text-gray-600">{sync.tripId}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {sync.recordsSynced}/{sync.recordsToSync}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            sync.status === 'SYNCED'
                              ? 'bg-green-100 text-green-800'
                              : sync.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {sync.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {sync.syncedAt ? new Date(sync.syncedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSync(sync.id)}
                          disabled={syncingId === sync.id || sync.status === 'SYNCED'}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {syncingId === sync.id ? 'Syncing...' : 'Sync'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Export Options */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Export Attendance Reports</h2>
              <div className="space-y-3">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-900 font-medium"
                >
                  <Download className="w-5 h-5" />
                  Export as CSV
                </button>
                <button
                  onClick={() => exportData('pdf')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-900 font-medium"
                >
                  <Download className="w-5 h-5" />
                  Export as PDF
                </button>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Summary</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">Presence Rate</span>
                    <span className="text-lg font-bold text-green-600">{stats.weeklyPresenceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${stats.weeklyPresenceRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">Absence Rate</span>
                    <span className="text-lg font-bold text-red-600">{stats.weeklyAbsenceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${stats.weeklyAbsenceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Class-wise Report */}
            <div className="bg-white rounded-lg shadow p-6 col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Class-wise Attendance</h2>
              <div className="space-y-3">
                {['10-A', '10-B', '11-A', '11-B'].map((className) => (
                  <div key={className} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">{className}</span>
                    <span className="text-sm text-gray-600">28/30 students present (93.3%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
