/**
 * Emergency Service - Emergency alert operations
 */

import { apiService } from './api.service';
import { offlineQueueService } from './offline-queue.service';

interface EmergencyAlert {
  tripId: string;
  reason?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}

interface EmergencyResponse {
  id: string;
  status: 'SENT' | 'QUEUED';
  message: string;
  timestamp: string;
}

class EmergencyService {
  /**
   * Trigger emergency alert
   */
  async triggerEmergencyAlert(
    tripId: string,
    reason?: string,
    latitude?: number,
    longitude?: number
  ): Promise<EmergencyResponse> {
    try {
      const payload: EmergencyAlert = {
        tripId,
        reason,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      };

      const endpoint = '/transportation/emergency';

      try {
        const result = await apiService.post<EmergencyResponse>(endpoint, payload);
        console.log('[Emergency] ✓ Emergency alert sent:', result);
        return result;
      } catch (error: any) {
        // Queue the emergency alert for offline sync
        console.warn('[Emergency] Failed to send alert, queuing for offline sync:', error);

        await offlineQueueService.enqueue({
          endpoint,
          method: 'POST',
          payload,
        });

        console.log('[Emergency] Emergency alert queued for offline sync');

        // Return queued response
        return {
          id: `queued-${Date.now()}`,
          status: 'QUEUED',
          message: 'Emergency alert queued. Will be sent when internet is restored.',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('[Emergency] Error triggering emergency alert:', error);
      throw error;
    }
  }

  /**
   * Get emergency alert history
   */
  async getEmergencyHistory(tripId?: string): Promise<EmergencyAlert[]> {
    try {
      const endpoint = tripId
        ? `/transportation/emergency/history?tripId=${tripId}`
        : '/transportation/emergency/history';

      return await apiService.get<EmergencyAlert[]>(endpoint);
    } catch (error) {
      console.error('[Emergency] Error fetching emergency history:', error);
      throw error;
    }
  }

  /**
   * Cancel emergency alert (if not yet sent)
   */
  async cancelEmergencyAlert(alertId: string): Promise<any> {
    try {
      return await apiService.post<any>(`/transportation/emergency/${alertId}/cancel`);
    } catch (error) {
      console.error('[Emergency] Error cancelling emergency alert:', error);
      throw error;
    }
  }
}

export const emergencyService = new EmergencyService();
