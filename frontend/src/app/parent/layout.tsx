'use client';

import { LogOut, Home, MapPin, Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const navigationItems = [
    { href: '/parent/tracking', label: 'Bus Tracking', icon: MapPin },
    { href: '/parent/history', label: 'Trip History', icon: Home },
  ];

  const handleLogout = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/parent/tracking" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Parent Portal</span>
          </Link>

          <nav className="flex items-center gap-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">Notifications</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900">Bus Boarded</p>
                      <p className="text-xs text-gray-600 mt-1">Your ward boarded the bus at 07:47</p>
                    </div>
                    <div className="p-4 hover:bg-gray-50 cursor-pointer">
                      <p className="text-sm font-medium text-gray-900">ETA Update</p>
                      <p className="text-xs text-gray-600 mt-1">Estimated arrival at school: 08:38</p>
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
          </div>
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
                  <Link href="/parent/tracking" className="hover:text-blue-600">
                    Track Bus
                  </Link>
                </li>
                <li>
                  <Link href="/parent/history" className="hover:text-blue-600">
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
                    Support: 1800-123-456
                  </a>
                </li>
                <li>
                  <a href="mailto:support@school.com" className="hover:text-blue-600">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">App Info</h3>
              <p className="text-sm text-gray-600">Parent Portal v2.0</p>
              <p className="text-xs text-gray-500 mt-2">Real-time bus tracking & updates</p>
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
