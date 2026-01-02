/**
 * Notification Service - Handle push and local notifications
 */

import * as Notifications from 'expo-notifications';
import { useParentStore, ParentNotification } from '../store/parent.store';

export type NotificationType =
  | 'TRIP_STARTED'
  | 'STUDENT_BOARDED'
  | 'STUDENT_ALIGHTED'
  | 'APPROACHING'
  | 'DELAYED'
  | 'ARRIVED';

export interface TripNotification {
  id: string;
  type: NotificationType;
  childId: string;
  childName: string;
  title: string;
  message: string;
  tripId?: string;
  data?: Record<string, any>;
}

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private isInitialized = false;
  private notificationCallbacks: ((notification: TripNotification) => void)[] = [];

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        console.warn('[Notification] Notification permissions not granted');
        return;
      }

      // Listen to notifications received while app is in foreground
      this._subscribeToNotifications();

      this.isInitialized = true;
      console.log('[Notification] ✓ Notification service initialized');
    } catch (error) {
      console.error('[Notification] Error initializing notification service:', error);
    }
  }

  /**
   * Subscribe to notification events
   */
  private _subscribeToNotifications(): void {
    Notifications.addNotificationReceivedListener((notification) => {
      const { data } = notification.request.content;
      console.log('[Notification] Received notification:', data);

      // Trigger local notification event
      if (data.type) {
        const tripNotification: TripNotification = {
          id: notification.request.identifier,
          type: data.type,
          childId: data.childId || '',
          childName: data.childName || 'Child',
          title: notification.request.content.title || 'Trip Update',
          message: notification.request.content.body || '',
          tripId: data.tripId,
          data,
        };

        this._notifyCallbacks(tripNotification);
      }
    });
  }

  /**
   * Register callback for notifications
   */
  onNotification(callback: (notification: TripNotification) => void): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  private _notifyCallbacks(notification: TripNotification): void {
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('[Notification] Error in notification callback:', error);
      }
    });
  }

  /**
   * Show local notification
   */
  async showLocalNotification(notification: TripNotification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          sound: true,
          badge: 1,
          data: {
            type: notification.type,
            childId: notification.childId,
            childName: notification.childName,
            tripId: notification.tripId,
          },
        },
        trigger: null, // Show immediately
      });

      console.log('[Notification] ✓ Local notification shown:', notification.title);

      // Also add to app store for in-app display
      this._addToAppStore(notification);
    } catch (error) {
      console.error('[Notification] Error showing local notification:', error);
    }
  }

  /**
   * Add notification to app store
   */
  private _addToAppStore(notification: TripNotification): void {
    try {
      const store = useParentStore.getState();
      const parentNotification: ParentNotification = {
        id: notification.id,
        type: notification.type,
        childId: notification.childId,
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(),
        read: false,
      };

      store.addNotification(parentNotification);
    } catch (error) {
      console.error('[Notification] Error adding notification to store:', error);
    }
  }

  /**
   * Handle trip started notification
   */
  async tripStarted(childId: string, childName: string, routeName: string): Promise<void> {
    const notification: TripNotification = {
      id: `trip-started-${childId}-${Date.now()}`,
      type: 'TRIP_STARTED',
      childId,
      childName,
      title: `Trip Started: ${routeName}`,
      message: `${childName}'s bus is on the way!`,
      data: { routeName },
    };

    await this.showLocalNotification(notification);
  }

  /**
   * Handle student boarded notification
   */
  async studentBoarded(childId: string, childName: string, stopName: string): Promise<void> {
    const notification: TripNotification = {
      id: `boarded-${childId}-${Date.now()}`,
      type: 'STUDENT_BOARDED',
      childId,
      childName,
      title: `${childName} Boarded`,
      message: `${childName} has been picked up at ${stopName}`,
      data: { stopName },
    };

    await this.showLocalNotification(notification);
  }

  /**
   * Handle student alighted notification
   */
  async studentAlighted(childId: string, childName: string, stopName: string): Promise<void> {
    const notification: TripNotification = {
      id: `alighted-${childId}-${Date.now()}`,
      type: 'STUDENT_ALIGHTED',
      childId,
      childName,
      title: `${childName} Dropped Off`,
      message: `${childName} has been dropped off at ${stopName}`,
      data: { stopName },
    };

    await this.showLocalNotification(notification);
  }

  /**
   * Handle approaching notification
   */
  async busApproaching(childId: string, childName: string, stopName: string, eta: number): Promise<void> {
    const notification: TripNotification = {
      id: `approaching-${childId}-${Date.now()}`,
      type: 'APPROACHING',
      childId,
      childName,
      title: `Bus Approaching ${stopName}`,
      message: `Bus arriving at ${stopName} in ~${eta} minutes`,
      data: { stopName, eta },
    };

    await this.showLocalNotification(notification);
  }

  /**
   * Handle delayed notification
   */
  async busDelayed(childId: string, childName: string, delayMinutes: number, newETA: string): Promise<void> {
    const notification: TripNotification = {
      id: `delayed-${childId}-${Date.now()}`,
      type: 'DELAYED',
      childId,
      childName,
      title: `Bus Running Late`,
      message: `Bus is ${delayMinutes} minutes late. New ETA: ${newETA}`,
      data: { delayMinutes, newETA },
    };

    await this.showLocalNotification(notification);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      const store = useParentStore.getState();
      store.clearNotifications();
      console.log('[Notification] ✓ All notifications cleared');
    } catch (error) {
      console.error('[Notification] Error clearing notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
