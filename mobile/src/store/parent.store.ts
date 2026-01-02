/**
 * Parent Store - Zustand store for parent app state
 */

import { create } from 'zustand';
import { ParentChild, TodayTrip } from '../services/parent-auth.service';

export interface ParentNotification {
  id: string;
  type: 'TRIP_STARTED' | 'STUDENT_BOARDED' | 'STUDENT_ALIGHTED' | 'APPROACHING' | 'DELAYED';
  childId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ParentStore {
  // Parent data
  children: ParentChild[];
  selectedChildId: string | null;
  selectedChild: ParentChild | null;

  // Trip data
  todayTrips: TodayTrip[];
  activeTrip: any | null;
  currentRoute: any | null;
  currentVehicle: any | null;

  // Notifications
  notifications: ParentNotification[];
  unreadCount: number;

  // Loading states
  isLoadingProfile: boolean;
  isLoadingTrips: boolean;
  isLoadingVehicle: boolean;
  error: string | null;

  // Actions
  setChildren: (children: ParentChild[]) => void;
  selectChild: (childId: string) => void;
  setTodayTrips: (trips: TodayTrip[]) => void;
  setActiveTrip: (trip: any) => void;
  setCurrentRoute: (route: any) => void;
  setCurrentVehicle: (vehicle: any) => void;
  addNotification: (notification: ParentNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  setLoading: (key: string, value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  children: [],
  selectedChildId: null,
  selectedChild: null,
  todayTrips: [],
  activeTrip: null,
  currentRoute: null,
  currentVehicle: null,
  notifications: [],
  unreadCount: 0,
  isLoadingProfile: false,
  isLoadingTrips: false,
  isLoadingVehicle: false,
  error: null,
};

export const useParentStore = create<ParentStore>((set) => ({
  ...initialState,

  setChildren: (children) =>
    set((state) => {
      // If first child and no selection, auto-select first child
      const selectedChildId = state.selectedChildId || (children.length > 0 ? children[0].id : null);
      return {
        children,
        selectedChildId,
        selectedChild: children.find((c) => c.id === selectedChildId) || null,
      };
    }),

  selectChild: (childId) =>
    set((state) => ({
      selectedChildId: childId,
      selectedChild: state.children.find((c) => c.id === childId) || null,
    })),

  setTodayTrips: (trips) =>
    set({
      todayTrips: trips,
    }),

  setActiveTrip: (trip) =>
    set({
      activeTrip: trip,
    }),

  setCurrentRoute: (route) =>
    set({
      currentRoute: route,
    }),

  setCurrentVehicle: (vehicle) =>
    set({
      currentVehicle: vehicle,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markNotificationAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),

  setLoading: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
    })),

  setError: (error) =>
    set({
      error,
    }),

  reset: () => set(initialState),
}));
