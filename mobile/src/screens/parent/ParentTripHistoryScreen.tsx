/**
 * Parent Trip History Screen - View past trips and attendance
 * Story 5.5 - Trip history, attendance records, and statistics
 */

import React, { useEffect } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { parentAuthService, HistoryTrip, AttendanceStats } from '../../services/parent-auth.service';
import { useParentStore } from '../../store/parent.store';

type DateRange = '7' | '30' | '90';

export function ParentTripHistoryScreen() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange>('30');
  const [tripHistory, setTripHistory] = React.useState<HistoryTrip[]>([]);
  const [attendanceStats, setAttendanceStats] = React.useState<AttendanceStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { selectedChild } = useParentStore();

  useFocusEffect(
    React.useCallback(() => {
      loadHistoryData();
    }, [selectedChild?.id, dateRange])
  );

  const loadHistoryData = async () => {
    if (!selectedChild?.id) {
      setError('No child selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Load trip history and attendance stats in parallel
      const [history, stats] = await Promise.all([
        parentAuthService.getTripHistory(selectedChild.id, startDateStr, endDateStr),
        parentAuthService.getAttendanceStats(selectedChild.id, parseInt(dateRange)),
      ]);

      setTripHistory(history);
      setAttendanceStats(stats);
    } catch (err) {
      console.error('Error loading history data:', err);
      setError('Failed to load trip history');
      Alert.alert('Error', 'Could not load trip history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHistoryData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return '#10B981';
      case 'IN_PROGRESS':
        return '#3B82F6';
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
      case 'IN_PROGRESS':
        return 'schedule';
      case 'CANCELLED':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading trip history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && tripHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <MaterialIcons name="history" size={32} color="#3B82F6" />
          <Text style={styles.headerTitle}>Trip History</Text>
        </View>

        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistoryData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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

      <FlatList
        data={tripHistory}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            {/* Attendance Statistics Card */}
            {attendanceStats && (
              <View style={styles.statsCard}>
                <View style={styles.statsHeader}>
                  <Text style={styles.statsTitle}>Attendance Summary</Text>
                  <Text style={styles.attendancePercentage}>{attendanceStats.attendancePercentage}%</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Trips</Text>
                    <Text style={styles.statValue}>{attendanceStats.totalTrips}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <MaterialIcons name="check-circle" size={20} color="#10B981" />
                    <Text style={styles.statLabel}>Present</Text>
                    <Text style={styles.statValue}>{attendanceStats.presentTrips}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <MaterialIcons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.statLabel}>Absent</Text>
                    <Text style={styles.statValue}>{attendanceStats.absentTrips}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <MaterialIcons name="trending-up" size={20} color="#F59E0B" />
                    <Text style={styles.statLabel}>Streak</Text>
                    <Text style={styles.statValue}>{attendanceStats.currentStreak}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${attendanceStats.attendancePercentage}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Date Range Filter */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, dateRange === '7' && styles.filterButtonActive]}
                onPress={() => setDateRange('7')}
              >
                <Text style={[styles.filterButtonText, dateRange === '7' && styles.filterButtonTextActive]}>
                  7 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, dateRange === '30' && styles.filterButtonActive]}
                onPress={() => setDateRange('30')}
              >
                <Text style={[styles.filterButtonText, dateRange === '30' && styles.filterButtonTextActive]}>
                  30 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, dateRange === '90' && styles.filterButtonActive]}
                onPress={() => setDateRange('90')}
              >
                <Text style={[styles.filterButtonText, dateRange === '90' && styles.filterButtonTextActive]}>
                  90 Days
                </Text>
              </TouchableOpacity>
            </View>

            {/* Trips Header */}
            <View style={styles.tripsHeader}>
              <Text style={styles.tripsTitle}>
                {tripHistory.length} Trip{tripHistory.length !== 1 ? 's' : ''} Found
              </Text>
            </View>
          </>
        }
        renderItem={({ item: trip }) => (
          <View style={styles.tripCard}>
            {/* Trip Header */}
            <View style={styles.tripCardHeader}>
              <View style={styles.tripHeaderLeft}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                  <MaterialIcons
                    name={getStatusIcon(trip.status) as any}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
                <View>
                  <Text style={styles.routeName}>{trip.route.name}</Text>
                  <Text style={styles.tripDate}>{formatDate(trip.date)}</Text>
                </View>
              </View>
              <View style={styles.tripHeaderRight}>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(trip.status) },
                  ]}
                >
                  {trip.status}
                </Text>
              </View>
            </View>

            {/* Route Details */}
            <View style={styles.routeDetails}>
              <View style={styles.routePoint}>
                <MaterialIcons name="my-location" size={16} color="#10B981" />
                <Text style={styles.routePointText}>{trip.route.startPoint}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <MaterialIcons name="location-on" size={16} color="#EF4444" />
                <Text style={styles.routePointText}>{trip.route.endPoint}</Text>
              </View>
            </View>

            {/* Timing Information */}
            <View style={styles.timingSection}>
              <View style={styles.timingItem}>
                <Text style={styles.timingLabel}>Scheduled Pickup</Text>
                <Text style={styles.timingValue}>{formatTime(trip.startTime)}</Text>
              </View>

              <View style={styles.timingDivider} />

              {trip.attendance?.boardedTime ? (
                <>
                  <View style={styles.timingItem}>
                    <Text style={styles.timingLabel}>Actual Pickup</Text>
                    <Text style={[styles.timingValue, { color: '#10B981' }]}>
                      {formatTime(trip.attendance.boardedTime)}
                    </Text>
                  </View>
                  <View style={styles.timingDivider} />
                </>
              ) : null}

              {trip.attendance?.alightedTime ? (
                <View style={styles.timingItem}>
                  <Text style={styles.timingLabel}>Dropped Off</Text>
                  <Text style={[styles.timingValue, { color: '#10B981' }]}>
                    {formatTime(trip.attendance.alightedTime)}
                  </Text>
                </View>
              ) : null}

              {trip.attendance?.markedAbsent ? (
                <View style={styles.timingItem}>
                  <Text style={[styles.timingLabel, { color: '#EF4444' }]}>Marked Absent</Text>
                  <Text style={[styles.timingValue, { color: '#EF4444' }]}>
                    {trip.attendance.absenceReason || 'No reason provided'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Vehicle Info */}
            <View style={styles.vehicleInfo}>
              <MaterialIcons name="directions-bus" size={16} color="#6B7280" />
              <Text style={styles.vehicleText}>{trip.vehicle.registrationNumber}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Trips Found</Text>
            <Text style={styles.emptyMessage}>
              There are no trips in the selected date range
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  attendancePercentage: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  tripsHeader: {
    marginBottom: 12,
  },
  tripsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  tripDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tripHeaderRight: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeDetails: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  routePointText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  routeLine: {
    height: 8,
    marginLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#D1D5DB',
  },
  timingSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  timingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timingLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  timingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  timingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vehicleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
