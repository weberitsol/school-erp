/**
 * Trip Service - Trip operations API calls
 */

import { apiService } from './api.service';
import { Trip, ApiResponse, LocationUpdate } from '../types/api.types';

class TripService {
  /**
   * Get active trips (SCHEDULED or IN_PROGRESS)
   */
  async getActiveTrips(): Promise<Trip[]> {
    try {
      return await apiService.get<Trip[]>('/transportation/trips/active');
    } catch (error) {
      console.error('Error fetching active trips:', error);
      throw error;
    }
  }

  /**
   * Get trip details by ID
   */
  async getTripDetails(tripId: string): Promise<Trip> {
    try {
      return await apiService.get<Trip>(`/transportation/trips/${tripId}`);
    } catch (error) {
      console.error('Error fetching trip details:', error);
      throw error;
    }
  }

  /**
   * Start a trip (transition SCHEDULED -> IN_PROGRESS)
   */
  async startTrip(tripId: string): Promise<Trip> {
    try {
      return await apiService.post<Trip>(`/transportation/trips/${tripId}/start`);
    } catch (error) {
      console.error('Error starting trip:', error);
      throw error;
    }
  }

  /**
   * Complete a trip (transition IN_PROGRESS -> COMPLETED)
   */
  async completeTrip(tripId: string): Promise<Trip> {
    try {
      return await apiService.post<Trip>(`/transportation/trips/${tripId}/complete`);
    } catch (error) {
      console.error('Error completing trip:', error);
      throw error;
    }
  }

  /**
   * Get trips by date
   */
  async getTripsByDate(date: string): Promise<Trip[]> {
    try {
      return await apiService.get<Trip[]>(`/transportation/trips/date/${date}`);
    } catch (error) {
      console.error('Error fetching trips for date:', error);
      throw error;
    }
  }

  /**
   * Get trip students
   */
  async getTripStudents(tripId: string) {
    try {
      return await apiService.get<any>(`/transportation/trips/${tripId}/students`);
    } catch (error) {
      console.error('Error fetching trip students:', error);
      throw error;
    }
  }

  /**
   * Get boarding summary for trip
   */
  async getBoardingSummary(tripId: string) {
    try {
      return await apiService.get<any>(`/transportation/trips/${tripId}/boarding/summary`);
    } catch (error) {
      console.error('Error fetching boarding summary:', error);
      throw error;
    }
  }

  /**
   * Get trip statistics
   */
  async getTripStatistics() {
    try {
      return await apiService.get<any>('/transportation/statistics');
    } catch (error) {
      console.error('Error fetching trip statistics:', error);
      throw error;
    }
  }

  /**
   * Get all trips with filters
   */
  async getTrips(filters?: { status?: string; date?: string; limit?: number; page?: number }) {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const query = params.toString();
      const url = `/transportation/trips${query ? `?${query}` : ''}`;
      return await apiService.get<Trip[]>(url);
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  }

  /**
   * Send location update
   */
  async sendLocationUpdate(location: LocationUpdate): Promise<any> {
    try {
      return await apiService.post<any>('/transportation/location', location);
    } catch (error) {
      console.error('Error sending location update:', error);
      throw error;
    }
  }
}

export const tripService = new TripService();
