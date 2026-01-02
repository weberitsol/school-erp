/**
 * ActiveTripScreen - Real-time trip tracking with map and student checklist
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/trip.service';
import { gpsTrackingService } from '../../services/gps-tracking.service';
import { socketService } from '../../services/socket.service';
import { boardingService } from '../../services/boarding.service';
import { offlineQueueService } from '../../services/offline-queue.service';
import { emergencyService } from '../../services/emergency.service';
import { useTripStore } from '../../store/trip.store';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { TripMap } from '../../components/map/TripMap';
import { GPSStatusIndicator } from '../../components/trip/GPSStatusIndicator';
import { StudentChecklist } from '../../components/trip/StudentChecklist';
import { BoardingModal } from '../../components/trip/BoardingModal';
import { EmergencyButton } from '../../components/trip/EmergencyButton';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { Trip, TripStudent } from '../../types/api.types';

interface ActiveTripScreenProps {
  navigation: any;
  route: any;
}

export function ActiveTripScreen({ navigation, route }: ActiveTripScreenProps) {
  const tripId = route.params?.tripId;

  // Local state
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [gpsOnline, setGpsOnline] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsLastUpdate, setGpsLastUpdate] = useState<number | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TripStudent | null>(null);
  const [selectedAction, setSelectedAction] = useState<'boarding' | 'alighting' | 'absent' | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Network and offline state
  const networkStatus = useNetworkStatus();
  const [queuedCount, setQueuedCount] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Zustand store
  const { setCurrentTrip } = useTripStore();

  /**
   * Load trip details
   */
  const loadTripDetails = useCallback(async () => {
    if (!tripId) {
      setError('No trip ID provided');
      return;
    }

    try {
      setError(null);
      const tripDetails = await tripService.getTripDetails(tripId);
      setTrip(tripDetails);
      setCurrentTrip(tripDetails);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load trip details';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [tripId, setCurrentTrip]);

  /**
   * Start GPS tracking
   */
  const startGPSTracking = useCallback(async () => {
    try {
      const success = await gpsTrackingService.startTracking(
        (location) => {
          setCurrentLocation(location);
          setGpsLastUpdate(Date.now());
        },
        (isOnline) => {
          setGpsOnline(isOnline);
        }
      );

      if (!success) {
        Alert.alert('GPS Error', 'Failed to start GPS tracking. Please check your location permissions.');
      }
    } catch (err) {
      console.error('Error starting GPS tracking:', err);
      Alert.alert('GPS Error', 'An error occurred while starting GPS tracking');
    }
  }, []);

  /**
   * Initialize Socket.IO
   */
  const initializeSocket = useCallback(async () => {
    if (!tripId) return;

    try {
      const success = await socketService.connect(tripId);
      if (success) {
        setSocketConnected(true);

        // Listen for trip updates
        const unsubscribe = socketService.onTripUpdate((data) => {
          console.log('Trip update received:', data);
          // Refresh trip details when students board/alight
          loadTripDetails();
        });

        // Listen for connection status
        const unsubscribeConnection = socketService.onConnectionChange((isConnected) => {
          setSocketConnected(isConnected);
        });

        return () => {
          unsubscribe();
          unsubscribeConnection();
        };
      }
    } catch (err) {
      console.error('Error initializing Socket.IO:', err);
    }
  }, [tripId, loadTripDetails]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    loadTripDetails();
    startGPSTracking();

    const unsubscribeSocket = initializeSocket();

    return () => {
      gpsTrackingService.stopTracking();
      socketService.disconnect();
      unsubscribeSocket?.then((cleanup) => cleanup?.());
    };
  }, [loadTripDetails, startGPSTracking, initializeSocket]);

  /**
   * Monitor network status and process queue
   */
  useEffect(() => {
    const checkQueue = async () => {
      const size = await offlineQueueService.getQueueSize();
      setQueuedCount(size);

      // If online and has queued items, process queue
      if (networkStatus.isOnline && size > 0) {
        console.log(`[ActiveTrip] Network restored, processing ${size} queued requests`);
        await handleProcessQueue();
      }
    };

    checkQueue();
  }, [networkStatus.isOnline]);

  /**
   * Handle process queue
   */
  const handleProcessQueue = useCallback(async () => {
    setIsProcessingQueue(true);
    try {
      const result = await offlineQueueService.processQueue();
      console.log(
        `[ActiveTrip] Queue processed: ${result.success} succeeded, ${result.failed} failed`
      );

      // Update queue count
      const newSize = await offlineQueueService.getQueueSize();
      setQueuedCount(newSize);

      if (result.success > 0) {
        Alert.alert('Success', `${result.success} action${result.success !== 1 ? 's' : ''} synced`);
        // Reload trip to reflect changes
        await loadTripDetails();
      }
    } catch (error) {
      console.error('[ActiveTrip] Error processing queue:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  }, [loadTripDetails]);

  /**
   * Refresh on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadTripDetails();
    }, [loadTripDetails])
  );

  /**
   * Handle student boarding
   */
  const handleBoardingPress = useCallback((student: TripStudent) => {
    setSelectedStudent(student);
    setSelectedAction('boarding');
    setModalVisible(true);
  }, []);

  /**
   * Handle student alighting
   */
  const handleAlightingPress = useCallback((student: TripStudent) => {
    setSelectedStudent(student);
    setSelectedAction('alighting');
    setModalVisible(true);
  }, []);

  /**
   * Handle student absent
   */
  const handleAbsentPress = useCallback((student: TripStudent) => {
    setSelectedStudent(student);
    setSelectedAction('absent');
    setModalVisible(true);
  }, []);

  /**
   * Handle modal confirmation
   */
  const handleModalConfirm = useCallback(
    async (student: TripStudent, photo?: string, reason?: string) => {
      if (!tripId || !selectedAction) return;

      setIsSubmittingModal(true);
      try {
        let result;
        let isQueued = false;

        switch (selectedAction) {
          case 'boarding':
            try {
              result = await boardingService.recordBoardingAtPickup(tripId, student.id, photo);
              Alert.alert('Success', `${student.name} boarded successfully`);
            } catch (error: any) {
              if (error.code === 'QUEUED_FOR_SYNC') {
                isQueued = true;
                Alert.alert(
                  'Queued',
                  `${student.name} boarding recorded offline.\nIt will sync when internet is restored.`
                );
              } else {
                throw error;
              }
            }
            break;

          case 'alighting':
            try {
              result = await boardingService.recordAlightingAtDropoff(tripId, student.id, photo);
              Alert.alert('Success', `${student.name} alighted successfully`);
            } catch (error: any) {
              if (error.code === 'QUEUED_FOR_SYNC') {
                isQueued = true;
                Alert.alert(
                  'Queued',
                  `${student.name} alighting recorded offline.\nIt will sync when internet is restored.`
                );
              } else {
                throw error;
              }
            }
            break;

          case 'absent':
            try {
              result = await boardingService.markStudentAbsent(tripId, student.id, reason);
              Alert.alert('Success', `${student.name} marked as absent`);
            } catch (error: any) {
              if (error.code === 'QUEUED_FOR_SYNC') {
                isQueued = true;
                Alert.alert(
                  'Queued',
                  `${student.name} absence recorded offline.\nIt will sync when internet is restored.`
                );
              } else {
                throw error;
              }
            }
            break;
        }

        // Update queue count
        const newQueueSize = await offlineQueueService.getQueueSize();
        setQueuedCount(newQueueSize);

        // Update trip details to reflect the change (only if not queued)
        if (!isQueued) {
          await loadTripDetails();
        }

        // Close modal
        setModalVisible(false);
        setSelectedStudent(null);
        setSelectedAction(null);
      } catch (err: any) {
        Alert.alert('Error', err.message || `Failed to ${selectedAction} student`);
      } finally {
        setIsSubmittingModal(false);
      }
    },
    [tripId, selectedAction, loadTripDetails]
  );

  /**
   * Handle modal cancel
   */
  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setSelectedStudent(null);
    setSelectedAction(null);
  }, []);

  /**
   * Handle emergency button
   */
  const handleEmergency = useCallback(async () => {
    if (!trip) return;

    try {
      const result = await emergencyService.triggerEmergencyAlert(
        trip.id,
        'Driver triggered emergency alert during trip',
        currentLocation?.coords.latitude,
        currentLocation?.coords.longitude
      );

      console.log('[ActiveTrip] Emergency alert response:', result);

      if (result.status === 'SENT') {
        Alert.alert(
          'Emergency Alert Sent',
          'Your emergency alert has been sent to the school admin. Help is on the way.'
        );
      } else if (result.status === 'QUEUED') {
        Alert.alert(
          'Emergency Alert Queued',
          'Your emergency alert has been recorded. It will be sent when internet is restored.'
        );
      }
    } catch (error: any) {
      console.error('[ActiveTrip] Emergency error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send emergency alert'
      );
    }
  }, [trip, currentLocation]);

  /**
   * Handle COMPLETE TRIP button
   */
  const handleCompleteTrip = useCallback(async () => {
    if (!trip) return;

    // Check if all students have alighted
    const allAlighted = trip.students?.every((s) => s.boardingStatus === 'ALIGHTED') ?? true;

    if (!allAlighted) {
      Alert.alert('Warning', 'All students must alight before completing the trip');
      return;
    }

    Alert.alert('Complete Trip', 'Are you sure you want to complete this trip?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setIsCompleting(true);
          try {
            const completedTrip = await tripService.completeTrip(trip.id);
            Alert.alert('Success', 'Trip completed successfully');
            setTrip(completedTrip);

            // Navigate back to home after a short delay
            setTimeout(() => {
              navigation.navigate('HomeTab');
            }, 1000);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to complete trip');
          } finally {
            setIsCompleting(false);
          }
        },
        style: 'destructive',
      },
    ]);
  }, [trip, navigation]);

  /**
   * Get current stop info
   */
  const getCurrentStopInfo = () => {
    if (!trip?.route?.stops || !currentLocation) return null;

    // Find nearest stop
    let nearestStop = null;
    let minDistance = Infinity;

    trip.route.stops.forEach((stop: any) => {
      const stopData = stop.stop || stop;
      if (!stopData.latitude || !stopData.longitude) return;

      const distance = gpsTrackingService.calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        stopData.latitude,
        stopData.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStop = { stop: stopData, distance };
      }
    });

    return nearestStop;
  };

  const currentStop = getCurrentStopInfo();

  // Get boarding summary
  const boardingSummary = {
    total: trip?.students?.length || 0,
    boarded: trip?.students?.filter((s) => s.boardingStatus === 'BOARDED').length || 0,
    alighted: trip?.students?.filter((s) => s.boardingStatus === 'ALIGHTED').length || 0,
    pending: trip?.students?.filter((s) => s.boardingStatus === 'PENDING').length || 0,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorMessage}>{error || 'Unable to load trip details'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadTripDetails();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      <OfflineBanner
        visible={!networkStatus.isOnline}
        message="No internet connection"
        queuedCount={queuedCount}
        onRetryQueue={handleProcessQueue}
        isProcessing={isProcessingQueue}
      />

      {/* Map - Takes up 60% of screen */}
      <View style={styles.mapContainer}>
        <TripMap trip={trip} currentLocation={currentLocation} />
      </View>

      {/* Bottom Sheet with trip info */}
      <ScrollView style={styles.bottomSheet} scrollEventThrottle={16}>
        {/* Trip Header */}
        <View style={styles.tripHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{trip.route?.name || 'Unknown Route'}</Text>
            <Text style={styles.routeStatus}>{trip.status}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* GPS Status */}
        <GPSStatusIndicator isOnline={gpsOnline} lastUpdateTime={gpsLastUpdate} />

        {/* Current Stop Info */}
        {currentStop && (
          <View style={styles.currentStopContainer}>
            <Text style={styles.currentStopLabel}>Next Stop</Text>
            <View style={styles.stopInfo}>
              <View style={styles.stopDetails}>
                <Text style={styles.stopName}>{currentStop.stop.name}</Text>
                <Text style={styles.stopDistance}>
                  {Math.round(currentStop.distance)}m away
                </Text>
              </View>
              <MaterialIcons name="directions" size={24} color="#3B82F6" />
            </View>
          </View>
        )}

        {/* Boarding Summary */}
        <View style={styles.boardingContainer}>
          <Text style={styles.boardingTitle}>Boarding Summary</Text>
          <View style={styles.boardingGrid}>
            <View style={styles.boardingItem}>
              <Text style={styles.boardingValue}>{boardingSummary.total}</Text>
              <Text style={styles.boardingLabel}>Total</Text>
            </View>
            <View style={styles.boardingItem}>
              <Text style={[styles.boardingValue, { color: '#10B981' }]}>
                {boardingSummary.boarded}
              </Text>
              <Text style={styles.boardingLabel}>Boarded</Text>
            </View>
            <View style={styles.boardingItem}>
              <Text style={[styles.boardingValue, { color: '#3B82F6' }]}>
                {boardingSummary.alighted}
              </Text>
              <Text style={styles.boardingLabel}>Alighted</Text>
            </View>
            <View style={styles.boardingItem}>
              <Text style={[styles.boardingValue, { color: '#EF4444' }]}>
                {boardingSummary.pending}
              </Text>
              <Text style={styles.boardingLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Emergency Button */}
        <EmergencyButton onPress={handleEmergency} disabled={!trip} />

        {/* Student Checklist */}
        {trip && trip.students && trip.students.length > 0 && (
          <StudentChecklist
            students={trip.students}
            onBoardingPress={handleBoardingPress}
            onAlightingPress={handleAlightingPress}
            onAbsentPress={handleAbsentPress}
            isLoading={loading}
            isCompacting={isSubmittingModal}
          />
        )}

        {/* Complete Trip Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            (isCompleting ||
              boardingSummary.alighted !== boardingSummary.total) &&
              styles.completeButtonDisabled,
          ]}
          onPress={handleCompleteTrip}
          disabled={isCompleting || boardingSummary.alighted !== boardingSummary.total}
        >
          {isCompleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>COMPLETE TRIP</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Connection Status Info */}
        <View style={styles.connectionInfo}>
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: socketConnected ? '#10B981' : '#EF4444',
                },
              ]}
            />
            <Text style={{ color: socketConnected ? '#10B981' : '#EF4444' }}>
              {socketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          <Text style={styles.connectionLabel}>Real-time Updates</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Boarding Modal */}
      <BoardingModal
        visible={modalVisible}
        student={selectedStudent}
        action={selectedAction}
        currentLocation={currentLocation}
        isSubmitting={isSubmittingModal}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 0.6,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bottomSheet: {
    flex: 0.4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  routeStatus: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  currentStopContainer: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentStopLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  stopInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopDetails: {
    flex: 1,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  stopDistance: {
    fontSize: 12,
    color: '#3B82F6',
  },
  boardingContainer: {
    marginBottom: 16,
  },
  boardingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  boardingGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  boardingItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  boardingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  boardingLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  completeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  connectionInfo: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 32,
  },
});
