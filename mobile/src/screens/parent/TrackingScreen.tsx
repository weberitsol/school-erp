/**
 * Tracking Screen - Real-time bus tracking with map
 * Story 5.3 & 5.4 - Live bus tracking, ETA, and notifications
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import { BusTrackingMap, MapStop } from '../../components/map/BusTrackingMap';
import { ConnectionStatus } from '../../components/parent/ConnectionStatus';
import { TripStatusCard, TripMilestone } from '../../components/parent/TripStatusCard';
import { NotificationBanner, NotificationType } from '../../components/common/NotificationBanner';
import { useBusTracking } from '../../hooks/useBusTracking';
import { parentAuthService } from '../../services/parent-auth.service';
import { notificationService } from '../../services/notification.service';
import { formatETA, formatDistance, formatArrivalTime, isApproachingStop } from '../../utils/eta.util';
import { useParentStore } from '../../store/parent.store';

export function TrackingScreen() {
  const mapRef = useRef<MapView>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [routeData, setRouteData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [milestones, setMilestones] = React.useState<TripMilestone[]>([]);
  const [currentNotification, setCurrentNotification] = React.useState<{
    visible: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({ visible: false, type: 'INFO', title: '', message: '' });
  const [approachingStopNotified, setApproachingStopNotified] = React.useState<string | null>(null);

  const { selectedChild, activeTrip } = useParentStore();

  const busTracking = useBusTracking({
    vehicleId: activeTrip?.vehicleId || '',
    pickupLat: selectedChild?.pickupStop?.latitude,
    pickupLon: selectedChild?.pickupStop?.longitude,
    dropLat: selectedChild?.dropStop?.latitude,
    dropLon: selectedChild?.dropStop?.longitude,
    averageSpeed: 40,
    updateInterval: 10000,
  });

  // Load route data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTrackingData();
    }, [selectedChild?.routeId, activeTrip?.id])
  );

  const loadTrackingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedChild?.routeId || !activeTrip?.id) {
        setError('Missing route or trip information');
        return;
      }

      // Get route details with all stops
      const route = await parentAuthService.getRouteDetails(selectedChild.routeId);
      setRouteData(route);
    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError('Failed to load tracking information');
      Alert.alert('Error', 'Could not load bus tracking data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const buildMilestones = (): TripMilestone[] => {
    if (!activeTrip) return [];

    const now = new Date();
    const tripMillestones: TripMilestone[] = [
      {
        type: 'SCHEDULED_PICKUP',
        label: `Pickup at ${selectedChild?.pickupStop?.name}`,
        scheduledTime: activeTrip.scheduledPickupTime ? new Date(activeTrip.scheduledPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        actualTime: activeTrip.actualPickupTime ? new Date(activeTrip.actualPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        completed: activeTrip.status === 'IN_PROGRESS' || activeTrip.status === 'COMPLETED',
        isNext: activeTrip.status === 'SCHEDULED',
      },
      {
        type: 'BOARDED',
        label: `${selectedChild?.name} Boarded`,
        actualTime: activeTrip.actualPickupTime ? new Date(activeTrip.actualPickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        completed: activeTrip.status === 'IN_PROGRESS' || activeTrip.status === 'COMPLETED',
        isNext: activeTrip.status === 'IN_PROGRESS' && !activeTrip.actualPickupTime,
      },
      {
        type: 'EN_ROUTE',
        label: 'Bus En Route',
        completed: activeTrip.status === 'IN_PROGRESS' || activeTrip.status === 'COMPLETED',
        isNext: activeTrip.status === 'IN_PROGRESS' && activeTrip.actualPickupTime && !activeTrip.actualDropTime,
      },
      {
        type: 'APPROACHING',
        label: `Approaching ${selectedChild?.dropStop?.name}`,
        completed: activeTrip.status === 'COMPLETED',
        isNext: activeTrip.status === 'IN_PROGRESS' && activeTrip.actualPickupTime && busTracking.pickupETA && busTracking.pickupETA.eta <= 5,
      },
      {
        type: 'ARRIVED',
        label: `Arrived at ${selectedChild?.dropStop?.name}`,
        completed: activeTrip.status === 'COMPLETED',
        isNext: activeTrip.status === 'IN_PROGRESS' && busTracking.pickupETA && busTracking.pickupETA.eta <= 1,
      },
      {
        type: 'DROPPED_OFF',
        label: `${selectedChild?.name} Dropped Off`,
        scheduledTime: activeTrip.scheduledDropTime ? new Date(activeTrip.scheduledDropTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        actualTime: activeTrip.actualDropTime ? new Date(activeTrip.actualDropTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        completed: activeTrip.status === 'COMPLETED',
        isNext: activeTrip.status === 'COMPLETED' || (activeTrip.status === 'IN_PROGRESS' && busTracking.pickupETA && busTracking.pickupETA.eta <= 1),
      },
    ];

    return tripMillestones;
  };

  const showNotification = (type: NotificationType, title: string, message: string) => {
    setCurrentNotification({
      visible: true,
      type,
      title,
      message,
    });
  };

  const dismissNotification = () => {
    setCurrentNotification(prev => ({ ...prev, visible: false }));
  };

  // Initialize notification service and listen for Socket.IO trip events
  useEffect(() => {
    // Build initial milestones
    const initialMilestones = buildMilestones();
    setMilestones(initialMilestones);

    // Listen for trip events from Socket.IO
    const unsubscribeBoarded = busTracking.tripEvents?.onStudentBoarded?.(() => {
      showNotification(
        'STUDENT_BOARDED',
        `${selectedChild?.name} Boarded`,
        `Your child has been picked up at ${selectedChild?.pickupStop?.name}`
      );
      // Update milestones
      setMilestones(prev =>
        prev.map(m =>
          m.type === 'BOARDED'
            ? { ...m, completed: true, actualTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
            : m
        )
      );
    });

    const unsubscribeAlighted = busTracking.tripEvents?.onStudentAlighted?.(() => {
      showNotification(
        'STUDENT_ALIGHTED',
        `${selectedChild?.name} Dropped Off`,
        `Your child has been dropped off at ${selectedChild?.dropStop?.name}`
      );
      // Update milestones
      setMilestones(prev =>
        prev.map(m =>
          m.type === 'DROPPED_OFF'
            ? { ...m, completed: true, actualTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
            : m
        )
      );
    });

    const unsubscribeTripStarted = busTracking.tripEvents?.onTripStarted?.(() => {
      showNotification(
        'TRIP_STARTED',
        'Trip Started',
        `Bus is on the way to ${selectedChild?.pickupStop?.name}`
      );
    });

    return () => {
      unsubscribeBoarded?.();
      unsubscribeAlighted?.();
      unsubscribeTripStarted?.();
    };
  }, [selectedChild?.name, selectedChild?.pickupStop?.name, selectedChild?.dropStop?.name, busTracking.tripEvents]);

  // Detect approaching stop and trigger notification
  useEffect(() => {
    if (
      busTracking.currentLocation &&
      selectedChild?.pickupStop &&
      activeTrip?.status === 'IN_PROGRESS' &&
      !approachingStopNotified
    ) {
      const isApproaching = isApproachingStop(
        busTracking.currentLocation.latitude,
        busTracking.currentLocation.longitude,
        selectedChild.pickupStop.latitude,
        selectedChild.pickupStop.longitude,
        2 // 2km radius
      );

      if (isApproaching && !approachingStopNotified) {
        showNotification(
          'APPROACHING',
          'Bus Approaching',
          `Bus is approaching ${selectedChild?.pickupStop?.name}`
        );
        setApproachingStopNotified(selectedChild.pickupStop.id);
      }
    }
  }, [busTracking.currentLocation, selectedChild?.pickupStop, activeTrip?.status, approachingStopNotified]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (currentNotification.visible) {
      const timer = setTimeout(() => {
        dismissNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentNotification.visible]);

  // Update milestones when trip status or tracking data changes
  useEffect(() => {
    const updatedMilestones = buildMilestones();
    setMilestones(updatedMilestones);
  }, [activeTrip?.status, activeTrip?.actualPickupTime, activeTrip?.actualDropTime, busTracking.pickupETA]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Connecting to live tracking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !activeTrip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <MaterialIcons name="location-on" size={32} color="#3B82F6" />
          <Text style={styles.headerTitle}>Live Tracking</Text>
        </View>

        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>{error || 'No active trip'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTrackingData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pickupStop: MapStop | undefined = selectedChild?.pickupStop
    ? {
        id: selectedChild.pickupStop.id,
        name: selectedChild.pickupStop.name,
        latitude: selectedChild.pickupStop.latitude,
        longitude: selectedChild.pickupStop.longitude,
        type: 'PICKUP',
      }
    : undefined;

  const dropStop: MapStop | undefined = selectedChild?.dropStop
    ? {
        id: selectedChild.dropStop.id,
        name: selectedChild.dropStop.name,
        latitude: selectedChild.dropStop.latitude,
        longitude: selectedChild.dropStop.longitude,
        type: 'DROP',
      }
    : undefined;

  const routeCoordinates = routeData?.stops?.map((stop: any) => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Notification Banner */}
      <NotificationBanner
        visible={currentNotification.visible}
        type={currentNotification.type}
        title={currentNotification.title}
        message={currentNotification.message}
        duration={5000}
        onDismiss={dismissNotification}
      />

      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="location-on" size={32} color="#3B82F6" />
        <Text style={styles.headerTitle}>Live Tracking</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.contentScroll}>
        {/* Map */}
        {busTracking.currentLocation ? (
          <>
            <View style={styles.mapContainer}>
              <BusTrackingMap
                ref={mapRef}
                busLatitude={busTracking.currentLocation.latitude}
                busLongitude={busTracking.currentLocation.longitude}
                pickupStop={pickupStop}
                dropStop={dropStop}
                routeCoordinates={routeCoordinates}
              />
            </View>

            {/* Bottom Info Card */}
            <View style={styles.infoPanel}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {/* Connection Status */}
                <View style={styles.infoPanelSection}>
                  <ConnectionStatus
                    isLive={busTracking.isLive}
                    lastUpdated={busTracking.currentLocation?.timestamp}
                  />
                </View>

                {/* Pickup ETA */}
                {busTracking.pickupETA && (
                  <View style={[styles.infoPanelSection, styles.etaCard]}>
                    <View style={styles.etaHeader}>
                      <MaterialIcons name="my-location" size={16} color="#10B981" />
                      <Text style={styles.etaLabel}>Pickup ETA</Text>
                    </View>
                    <Text style={styles.etaTime}>{formatArrivalTime(busTracking.pickupETA.arrivalTime)}</Text>
                    <Text style={styles.etaDuration}>{formatETA(busTracking.pickupETA.eta)}</Text>
                    <Text style={styles.etaDistance}>{formatDistance(busTracking.pickupETA.distance)}</Text>
                  </View>
                )}

                {/* Drop ETA */}
                {busTracking.dropETA && (
                  <View style={[styles.infoPanelSection, styles.etaCard]}>
                    <View style={styles.etaHeader}>
                      <MaterialIcons name="location-on" size={16} color="#EF4444" />
                      <Text style={styles.etaLabel}>Drop ETA</Text>
                    </View>
                    <Text style={styles.etaTime}>{formatArrivalTime(busTracking.dropETA.arrivalTime)}</Text>
                    <Text style={styles.etaDuration}>{formatETA(busTracking.dropETA.eta)}</Text>
                    <Text style={styles.etaDistance}>{formatDistance(busTracking.dropETA.distance)}</Text>
                  </View>
                )}

                {/* Speed Info */}
                {busTracking.currentLocation?.speed !== undefined && (
                  <View style={[styles.infoPanelSection, styles.etaCard]}>
                    <View style={styles.etaHeader}>
                      <MaterialIcons name="speed" size={16} color="#3B82F6" />
                      <Text style={styles.etaLabel}>Speed</Text>
                    </View>
                    <Text style={styles.etaTime}>{Math.round(busTracking.currentLocation.speed)} km/h</Text>
                    <Text style={styles.etaDistance}>
                      Accuracy: {Math.round(busTracking.currentLocation.accuracy || 0)}m
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Trip Status Timeline */}
            {milestones.length > 0 && (
              <View style={styles.tripStatusContainer}>
                <TripStatusCard
                  milestones={milestones}
                  currentStatus={activeTrip?.status || 'UNKNOWN'}
                  timeRemaining={busTracking.pickupETA ? Math.ceil(busTracking.pickupETA.eta) : undefined}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.mapPlaceholder}>
              <MaterialIcons name="map" size={80} color="#D1D5DB" />
              <Text style={styles.mapText}>Waiting for location data...</Text>
            </View>

            <View style={styles.infoPanel}>
              <View style={styles.infoPanelSection}>
                <ConnectionStatus isLive={false} lastUpdated={new Date()} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentScroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  mapPlaceholder: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  mapText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  infoPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoPanelSection: {
    marginRight: 12,
  },
  etaCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 120,
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  etaLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  etaTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  etaDuration: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
  },
  etaDistance: {
    fontSize: 11,
    color: '#6B7280',
  },
  tripStatusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
