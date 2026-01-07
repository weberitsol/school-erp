'use client';

import { LogOut, Settings, Phone, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/driver/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Driver Portal</span>
          </Link>

          <nav className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">Notifications</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">Trip Reminder</p>
                      <p className="text-xs text-gray-600 mt-1">Evening Route A starts in 30 minutes</p>
                    </div>
                    <div className="p-4 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">Vehicle Alert</p>
                      <p className="text-xs text-gray-600 mt-1">Scheduled maintenance due next week</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/driver/dashboard" className="hover:text-blue-600">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/driver/trip-history" className="hover:text-blue-600">
                    Trip History
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="tel:1800123456" className="hover:text-blue-600">
                    Help Line: 1800-123-456
                  </a>
                </li>
                <li>
                  <a href="mailto:support@school.com" className="hover:text-blue-600">
                    Email Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">App Version</h3>
              <p className="text-sm text-gray-600">Driver Portal v2.0</p>
              <p className="text-xs text-gray-500 mt-2">Last updated: Jan 7, 2026</p>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>&copy; 2026 School ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
