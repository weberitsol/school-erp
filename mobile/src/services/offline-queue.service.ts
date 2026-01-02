/**
 * Offline Queue Service - Queue management for offline requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api.service';

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueueService {
  private static readonly QUEUE_KEY = 'offline_request_queue';
  private static readonly MAX_RETRIES = 3;
  private isProcessing = false;

  /**
   * Add request to offline queue
   */
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const queuedRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: OfflineQueueService.MAX_RETRIES,
      };

      queue.push(queuedRequest);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));

      console.log(`[OfflineQueue] Enqueued request: ${request.endpoint} (${queue.length} items)`);
    } catch (error) {
      console.error('[OfflineQueue] Error enqueuing request:', error);
      throw error;
    }
  }

  /**
   * Get current queue
   */
  async getQueue(): Promise<QueuedRequest[]> {
    try {
      const data = await AsyncStorage.getItem(this.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineQueue] Error reading queue:', error);
      return [];
    }
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<{ success: number; failed: number }> {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing queue');
      return { success: 0, failed: 0 };
    }

    this.isProcessing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const queue = await this.getQueue();

      if (queue.length === 0) {
        console.log('[OfflineQueue] Queue is empty');
        return { success: 0, failed: 0 };
      }

      console.log(`[OfflineQueue] Processing ${queue.length} queued requests...`);

      for (const request of queue) {
        try {
          // Make API call
          const response = await apiService.request({
            method: request.method,
            url: request.endpoint,
            data: request.payload,
          });

          console.log(`[OfflineQueue] ✓ Successfully processed: ${request.endpoint}`);
          successCount++;

          // Remove from queue
          await this.removeFromQueue(request.id);
        } catch (error: any) {
          const errorMsg = error?.message || 'Unknown error';
          console.error(`[OfflineQueue] ✗ Failed to process: ${request.endpoint} - ${errorMsg}`);

          // Increment retry count
          request.retryCount++;

          if (request.retryCount >= request.maxRetries) {
            console.log(`[OfflineQueue] Max retries reached for ${request.endpoint}, removing from queue`);
            await this.removeFromQueue(request.id);
            failedCount++;
          } else {
            // Update retry count in queue
            await this.updateRetryCount(request.id, request.retryCount);
          }
        }
      }

      console.log(
        `[OfflineQueue] Processing complete: ${successCount} succeeded, ${failedCount} failed`
      );
    } catch (error) {
      console.error('[OfflineQueue] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Remove single request from queue
   */
  private async removeFromQueue(requestId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter((r) => r.id !== requestId);
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[OfflineQueue] Error removing request from queue:', error);
    }
  }

  /**
   * Update retry count for request
   */
  private async updateRetryCount(requestId: string, retryCount: number): Promise<void> {
    try {
      const queue = await this.getQueue();
      const request = queue.find((r) => r.id === requestId);
      if (request) {
        request.retryCount = retryCount;
      }
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineQueue] Error updating retry count:', error);
    }
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
      console.log('[OfflineQueue] Queue cleared');
    } catch (error) {
      console.error('[OfflineQueue] Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    try {
      const queue = await this.getQueue();
      return queue.length;
    } catch (error) {
      console.error('[OfflineQueue] Error getting queue size:', error);
      return 0;
    }
  }

  /**
   * Get queue stats
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    failed: number;
    oldestRequest?: QueuedRequest;
  }> {
    try {
      const queue = await this.getQueue();
      const failed = queue.filter((r) => r.retryCount >= r.maxRetries).length;

      return {
        total: queue.length,
        pending: queue.length - failed,
        failed,
        oldestRequest: queue.length > 0 ? queue[0] : undefined,
      };
    } catch (error) {
      console.error('[OfflineQueue] Error getting queue stats:', error);
      return { total: 0, pending: 0, failed: 0 };
    }
  }

  /**
   * Check if queue has pending items
   */
  async hasPendingItems(): Promise<boolean> {
    const size = await this.getQueueSize();
    return size > 0;
  }
}

export const offlineQueueService = new OfflineQueueService();
