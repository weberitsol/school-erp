/**
 * Trip Store - Zustand state management for trips
 */

import { create } from 'zustand';
import { Trip, ApiError } from '../types/api.types';

interface TripState {
  // State
  activeTrips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: ApiError | null;
  lastRefresh: number | null;

  // Actions
  setActiveTrips: (trips: Trip[]) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
  setLastRefresh: (timestamp: number) => void;

  // Helpers
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  removeTrip: (tripId: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  // Initial state
  activeTrips: [],
  currentTrip: null,
  loading: false,
  error: null,
  lastRefresh: null,

  // Actions
  setActiveTrips: (trips) => set({ activeTrips: trips }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastRefresh: (timestamp) => set({ lastRefresh: timestamp }),

  // Helpers
  addTrip: (trip) =>
    set((state) => ({
      activeTrips: [trip, ...state.activeTrips],
    })),

  updateTrip: (updatedTrip) =>
    set((state) => ({
      activeTrips: state.activeTrips.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip)),
      currentTrip: state.currentTrip?.id === updatedTrip.id ? updatedTrip : state.currentTrip,
    })),

  removeTrip: (tripId) =>
    set((state) => ({
      activeTrips: state.activeTrips.filter((trip) => trip.id !== tripId),
      currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
    })),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      activeTrips: [],
      currentTrip: null,
      loading: false,
      error: null,
      lastRefresh: null,
    }),
}));
