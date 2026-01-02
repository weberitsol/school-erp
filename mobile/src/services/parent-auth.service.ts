/**
 * Parent Auth Service - Parent-specific authentication and data operations
 */

import { apiService } from './api.service';
import { User } from '../types/api.types';

export interface Parent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  children: ParentChild[];
}

export interface ParentChild {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  classId: string;
  sectionId: string;
  routeId?: string;
  route?: {
    id: string;
    name: string;
    startPoint: string;
    endPoint: string;
  };
  pickupStop?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  dropStop?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface TodayTrip {
  id: string;
  childId: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  route: {
    id: string;
    name: string;
  };
  vehicle: {
    id: string;
    registrationNumber: string;
  };
}

export interface HistoryTrip {
  id: string;
  childId: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  actualPickupTime?: string;
  actualDropTime?: string;
  route: {
    id: string;
    name: string;
    startPoint: string;
    endPoint: string;
  };
  vehicle: {
    id: string;
    registrationNumber: string;
  };
  attendance?: {
    boarded: boolean;
    boardedTime?: string;
    alighted: boolean;
    alightedTime?: string;
    markedAbsent: boolean;
    absenceReason?: string;
  };
}

export interface AttendanceStats {
  totalTrips: number;
  presentTrips: number;
  absentTrips: number;
  missedTrips: number;
  attendancePercentage: number;
  currentStreak: number;
}

class ParentAuthService {
  /**
   * Get parent profile with all children
   */
  async getParentProfile(): Promise<Parent> {
    try {
      const result = await apiService.get<Parent>('/transportation/parents/profile');
      console.log('[ParentAuth] ✓ Parent profile loaded:', result.children.length, 'children');
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching parent profile:', error);
      throw error;
    }
  }

  /**
   * Get specific child details
   */
  async getChildDetails(childId: string): Promise<ParentChild> {
    try {
      const result = await apiService.get<ParentChild>(`/transportation/students/${childId}`);
      console.log('[ParentAuth] ✓ Child details loaded:', result.name);
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching child details:', error);
      throw error;
    }
  }

  /**
   * Get child's current route assignment
   */
  async getChildRoute(childId: string): Promise<any> {
    try {
      const result = await apiService.get<any>(`/transportation/students/${childId}/route`);
      console.log('[ParentAuth] ✓ Child route loaded:', result.name);
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching child route:', error);
      throw error;
    }
  }

  /**
   * Get today's trips for a child
   */
  async getTodayTrips(childId: string): Promise<TodayTrip[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await apiService.get<TodayTrip[]>(
        `/transportation/trips?studentId=${childId}&date=${today}`
      );
      console.log('[ParentAuth] ✓ Today trips loaded:', result.length);
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching today trips:', error);
      throw error;
    }
  }

  /**
   * Get active trip for a child (if any)
   */
  async getActiveTrip(childId: string): Promise<any> {
    try {
      const result = await apiService.get<any>(
        `/transportation/trips/active?studentId=${childId}`
      );
      console.log('[ParentAuth] ✓ Active trip loaded:', result.id);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log('[ParentAuth] No active trip for child');
        return null;
      }
      console.error('[ParentAuth] Error fetching active trip:', error);
      throw error;
    }
  }

  /**
   * Get route details with all stops
   */
  async getRouteDetails(routeId: string): Promise<any> {
    try {
      const result = await apiService.get<any>(`/transportation/routes/${routeId}`);
      console.log('[ParentAuth] ✓ Route details loaded:', result.name);
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching route details:', error);
      throw error;
    }
  }

  /**
   * Get vehicle information
   */
  async getVehicleInfo(vehicleId: string): Promise<any> {
    try {
      const result = await apiService.get<any>(`/transportation/vehicles/${vehicleId}`);
      console.log('[ParentAuth] ✓ Vehicle info loaded:', result.registrationNumber);
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching vehicle info:', error);
      throw error;
    }
  }

  /**
   * Get current location of vehicle
   */
  async getVehicleLocation(vehicleId: string): Promise<any> {
    try {
      const result = await apiService.get<any>(`/transportation/vehicles/${vehicleId}/location`);
      console.log('[ParentAuth] ✓ Vehicle location loaded');
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching vehicle location:', error);
      throw error;
    }
  }

  /**
   * Get trip details
   */
  async getTripDetails(tripId: string): Promise<any> {
    try {
      const result = await apiService.get<any>(`/transportation/trips/${tripId}`);
      console.log('[ParentAuth] ✓ Trip details loaded');
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching trip details:', error);
      throw error;
    }
  }

  /**
   * Get trip history for a child with optional date range filter
   */
  async getTripHistory(
    childId: string,
    startDate?: string,
    endDate?: string
  ): Promise<HistoryTrip[]> {
    try {
      let url = `/transportation/trips/history?studentId=${childId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const result = await apiService.get<HistoryTrip[]>(url);
      console.log('[ParentAuth] ✓ Trip history loaded:', result.length, 'trips');
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching trip history:', error);
      throw error;
    }
  }

  /**
   * Get attendance statistics for a child
   */
  async getAttendanceStats(childId: string, days: number = 30): Promise<AttendanceStats> {
    try {
      const result = await apiService.get<AttendanceStats>(
        `/transportation/students/${childId}/attendance/stats?days=${days}`
      );
      console.log('[ParentAuth] ✓ Attendance stats loaded');
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching attendance stats:', error);
      throw error;
    }
  }

  /**
   * Get attendance details for a specific trip
   */
  async getTripAttendance(tripId: string, childId: string): Promise<any> {
    try {
      const result = await apiService.get<any>(
        `/transportation/trips/${tripId}/attendance?studentId=${childId}`
      );
      console.log('[ParentAuth] ✓ Trip attendance loaded');
      return result;
    } catch (error) {
      console.error('[ParentAuth] Error fetching trip attendance:', error);
      throw error;
    }
  }
}

export const parentAuthService = new ParentAuthService();
