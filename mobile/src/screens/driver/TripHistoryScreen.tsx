/**
 * TripHistoryScreen - View past completed trips
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/trip.service';
import { Trip } from '../../types/api.types';

export function TripHistoryScreen({ navigation }: any) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>(
    'all'
  );

  // Load trips on mount
  useEffect(() => {
    loadTrips();
  }, []);

  // Filter trips when filter changes
  useEffect(() => {
    applyFilter(selectedFilter);
  }, [trips, selectedFilter]);

  const loadTrips = async () => {
    try {
      setLoading(true);

      // Get completed and cancelled trips
      const completedTrips = await tripService.getTrips({
        status: 'COMPLETED',
      });

      const cancelledTrips = await tripService.getTrips({
        status: 'CANCELLED',
      });

      const allTrips = [...(completedTrips || []), ...(cancelledTrips || [])];

      // Sort by date descending (newest first)
      const sorted = allTrips.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      setTrips(sorted);
    } catch (error) {
      console.error('Error loading trip history:', error);
      Alert.alert('Error', 'Failed to load trip history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filter: 'all' | 'today' | 'week' | 'month') => {
    let filtered = [...trips];
    const now = new Date();

    switch (filter) {
      case 'today':
        filtered = filtered.filter((trip) => {
          const tripDate = new Date(trip.completedAt || trip.createdAt);
          return (
            tripDate.getDate() === now.getDate() &&
            tripDate.getMonth() === now.getMonth() &&
            tripDate.getFullYear() === now.getFullYear()
          );
        });
        break;

      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (trip) => new Date(trip.completedAt || trip.createdAt) >= weekAgo
        );
        break;

      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (trip) => new Date(trip.completedAt || trip.createdAt) >= monthAgo
        );
        break;
    }

    setFilteredTrips(filtered);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return '#10B981';
      case 'CANCELLED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'check-circle';
      case 'CANCELLED':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const renderTripCard = ({ item: trip }: { item: Trip }) => {
    const boarded = trip.students?.filter((s) => s.boardingStatus === 'BOARDED').length || 0;
    const alighted = trip.students?.filter((s) => s.boardingStatus === 'ALIGHTED').length || 0;
    const total = trip.students?.length || 0;

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => {
          Alert.alert(
            trip.route?.name || 'Trip Details',
            `Route: ${trip.route?.name}\nStatus: ${trip.status}\nStudents: ${boarded}/${total} boarded\nAlighted: ${alighted}/${total}`,
            [{ text: 'Close', onPress: () => {} }]
          );
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.routeName}>{trip.route?.name || 'Unknown Route'}</Text>
            <Text style={styles.tripDate}>
              {formatDate(trip.completedAt || trip.createdAt)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(trip.status) },
            ]}
          >
            <MaterialIcons
              name={getStatusIcon(trip.status) as any}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>{trip.status}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {formatTime(trip.completedAt || trip.createdAt)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <MaterialIcons name="groups" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {boarded} of {total} boarded
            </Text>
          </View>

          <View style={styles.detailItem}>
            <MaterialIcons name="logout" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{alighted} alighted</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.tapHint}>Tap for more details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Trip History</Text>
      <Text style={styles.emptyMessage}>
        You don't have any {selectedFilter !== 'all' ? selectedFilter : ''} trips yet.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading trip history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="history" size={32} color="#3B82F6" />
        <Text style={styles.headerTitle}>Trip History</Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {(['all', 'today', 'week', 'month'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trip List */}
      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripCard}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDetails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#1F2937',
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tapHint: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
