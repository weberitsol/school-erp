'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if store is already hydrated from localStorage
    const state = useAuthStore.getState();
    if (state.accessToken) {
      setHydrated(true);
    }

    // Subscribe to future auth changes
    const unsubscribe = useAuthStore.subscribe(
      (state) => {
        if (state.accessToken) {
          setHydrated(true);
        }
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (mounted && hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, hydrated, isAuthenticated, router]);

  // Show loading while hydrating store
  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
          <div className="absolute inset-2 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-500 dark:border-t-purple-400 animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  // Show loading after checking if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
          <div className="absolute inset-2 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-500 dark:border-t-purple-400 animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 relative">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="flex relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 overflow-auto relative z-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
