/**
 * HomeScreen - Driver Home Screen with Trip List
 * Displays all assigned trips with START TRIP and VIEW TRIP actions
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/trip.service';
import { authService } from '../../services/auth.service';
import { useTripStore } from '../../store/trip.store';
import { TripCard } from '../../components/trip/TripCard';
import { EmptyState } from '../../components/trip/EmptyState';
import { Trip } from '../../types/api.types';

interface HomeScreenProps {
  navigation: any;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Zustand store
  const { activeTrips, loading, error, lastRefresh, setActiveTrips, setLoading, setError, clearError, setLastRefresh } =
    useTripStore();

  // Auto-refresh interval
  const refreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  /**
   * Load trips from API
   */
  const loadTrips = useCallback(async () => {
    try {
      clearError();
      const trips = await tripService.getActiveTrips();
      setActiveTrips(trips);
      setLastRefresh(Date.now());
    } catch (err: any) {
      console.error('Error loading trips:', err);
      setError({
        message: err.message || 'Failed to load trips',
        details: err.details,
      });

      // Show error alert if not already showing
      if (err.message && !err.message.includes('refresh')) {
        Alert.alert('Error', err.message);
      }
    }
  }, [setActiveTrips, setError, clearError, setLastRefresh]);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await authService.getStoredUser();
        setUser(currentUser);
        await loadTrips();
      } finally {
        setInitialLoading(false);
      }
    };

    initialize();

    // Set up auto-refresh interval
    refreshIntervalRef.current = setInterval(() => {
      loadTrips();
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadTrips]);

  /**
   * Refresh when screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadTrips();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTrips]);

  /**
   * Handle START TRIP button
   */
  const handleStartTrip = useCallback(
    async (tripId: string) => {
      try {
        setLoading(true);
        const updatedTrip = await tripService.startTrip(tripId);
        setActiveTrips(activeTrips.map((t) => (t.id === tripId ? updatedTrip : t)));

        // Navigate to Active Trip screen
        setTimeout(() => {
          navigation.navigate('ActiveTrip', { tripId: updatedTrip.id });
        }, 500);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to start trip');
        console.error('Error starting trip:', err);
      } finally {
        setLoading(false);
      }
    },
    [activeTrips, setActiveTrips, navigation]
  );

  /**
   * Handle VIEW TRIP button
   */
  const handleViewTrip = useCallback(
    (trip: Trip) => {
      if (trip.status === 'IN_PROGRESS') {
        navigation.navigate('ActiveTrip', { tripId: trip.id });
      } else {
        // Could navigate to trip details screen
        Alert.alert('Trip Details', `Trip: ${trip.route?.name || 'Unknown'}\nStatus: ${trip.status}`);
      }
    },
    [navigation]
  );

  /**
   * Render header with driver info
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.driverInfo}>
          <MaterialIcons name="account-circle" size={32} color="#3B82F6" />
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.driverRole}>Driver</Text>
          </View>
        </View>
        <MaterialIcons name="notifications" size={24} color="#3B82F6" />
      </View>

      <View style={styles.dateInfo}>
        <Text style={styles.dateText}>
          Today, {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
      </View>
    </View>
  );

  /**
   * Render trip list
   */
  const renderTripList = () => {
    if (activeTrips.length === 0) {
      return <EmptyState />;
    }

    return (
      <FlatList
        data={activeTrips}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onStartTrip={handleStartTrip}
            onViewTrip={handleViewTrip}
            loading={loading}
          />
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.tripList}
      />
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[{ id: 'header' }, ...(activeTrips.length > 0 ? activeTrips : [{ id: 'empty' }])]}
        renderItem={({ item }) => {
          if (item.id === 'header') {
            return renderHeader();
          }
          if (item.id === 'empty') {
            return <EmptyState />;
          }
          return (
            <TripCard
              trip={item as Trip}
              onStartTrip={handleStartTrip}
              onViewTrip={handleViewTrip}
              loading={loading}
            />
          );
        }}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#3B82F6']} />}
        contentContainerStyle={styles.content}
      />

      {error && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 20,
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  driverRole: {
    fontSize: 13,
    color: '#6B7280',
  },
  dateInfo: {
    marginTop: 12,
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tripList: {
    paddingBottom: 20,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEE2E2',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
});
