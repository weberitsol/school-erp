/**
 * Boarding Service - Student boarding/alighting operations
 */

import { apiService } from './api.service';
import { offlineQueueService } from './offline-queue.service';
import { BoardingRequest, AlightingRequest, MarkAbsentRequest, TripStudent } from '../types/api.types';

class BoardingService {
  /**
   * Record student boarding at pickup
   */
  async recordBoardingAtPickup(
    tripId: string,
    studentId: string,
    photo?: string
  ): Promise<TripStudent> {
    try {
      const payload: BoardingRequest = {
        studentId,
        photo,
      };

      const endpoint = `/transportation/trips/${tripId}/boarding/pickup`;

      try {
        const result = await apiService.post<TripStudent>(endpoint, payload);
        console.log('[Boarding] ✓ Student boarded:', studentId);
        return result;
      } catch (error: any) {
        // Queue the request for offline sync
        console.warn('[Boarding] Failed to board student, queuing for offline sync:', error);

        await offlineQueueService.enqueue({
          endpoint,
          method: 'POST',
          payload,
        });

        console.log('[Boarding] Request queued for offline sync:', endpoint);

        // Return a placeholder response - actual sync will happen when online
        throw {
          message: 'Request queued for sync when online',
          code: 'QUEUED_FOR_SYNC',
        };
      }
    } catch (error) {
      console.error('[Boarding] Error recording boarding:', error);
      throw error;
    }
  }

  /**
   * Record student alighting at dropoff
   */
  async recordAlightingAtDropoff(
    tripId: string,
    studentId: string,
    photo?: string
  ): Promise<TripStudent> {
    try {
      const payload: AlightingRequest = {
        studentId,
        photo,
      };

      const endpoint = `/transportation/trips/${tripId}/alighting/dropoff`;

      try {
        const result = await apiService.post<TripStudent>(endpoint, payload);
        console.log('[Boarding] ✓ Student alighted:', studentId);
        return result;
      } catch (error: any) {
        // Queue the request for offline sync
        console.warn('[Boarding] Failed to alight student, queuing for offline sync:', error);

        await offlineQueueService.enqueue({
          endpoint,
          method: 'POST',
          payload,
        });

        console.log('[Boarding] Request queued for offline sync:', endpoint);

        // Return a placeholder response - actual sync will happen when online
        throw {
          message: 'Request queued for sync when online',
          code: 'QUEUED_FOR_SYNC',
        };
      }
    } catch (error) {
      console.error('[Boarding] Error recording alighting:', error);
      throw error;
    }
  }

  /**
   * Mark student absent
   */
  async markStudentAbsent(
    tripId: string,
    studentId: string,
    reason?: string
  ): Promise<TripStudent> {
    try {
      const payload: MarkAbsentRequest = {
        studentId,
        reason,
      };

      const endpoint = `/transportation/trips/${tripId}/attendance/absent`;

      try {
        const result = await apiService.post<TripStudent>(endpoint, payload);
        console.log('[Boarding] ✓ Student marked absent:', studentId);
        return result;
      } catch (error: any) {
        // Queue the request for offline sync
        console.warn('[Boarding] Failed to mark absent, queuing for offline sync:', error);

        await offlineQueueService.enqueue({
          endpoint,
          method: 'POST',
          payload,
        });

        console.log('[Boarding] Request queued for offline sync:', endpoint);

        // Return a placeholder response - actual sync will happen when online
        throw {
          message: 'Request queued for sync when online',
          code: 'QUEUED_FOR_SYNC',
        };
      }
    } catch (error) {
      console.error('[Boarding] Error marking student absent:', error);
      throw error;
    }
  }

  /**
   * Get pending boarding students (not yet boarded)
   */
  async getPendingBoardingStudents(tripId: string): Promise<TripStudent[]> {
    try {
      return await apiService.get<TripStudent[]>(
        `/transportation/trips/${tripId}/boarding/pending`
      );
    } catch (error) {
      console.error('Error getting pending boarding students:', error);
      throw error;
    }
  }

  /**
   * Get pending alighting students (boarded but not yet alighted)
   */
  async getPendingAlightingStudents(tripId: string): Promise<TripStudent[]> {
    try {
      return await apiService.get<TripStudent[]>(
        `/transportation/trips/${tripId}/alighting/pending`
      );
    } catch (error) {
      console.error('Error getting pending alighting students:', error);
      throw error;
    }
  }

  /**
   * Get boarding summary for trip
   */
  async getBoardingSummary(tripId: string) {
    try {
      return await apiService.get<any>(
        `/transportation/trips/${tripId}/boarding/summary`
      );
    } catch (error) {
      console.error('Error getting boarding summary:', error);
      throw error;
    }
  }
}

export const boardingService = new BoardingService();
