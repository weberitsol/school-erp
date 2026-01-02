/**
 * TripCard Component - Displays a single trip with actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Trip } from '../../types/api.types';

interface TripCardProps {
  trip: Trip;
  onStartTrip?: (tripId: string) => Promise<void>;
  onViewTrip?: (trip: Trip) => void;
  loading?: boolean;
}

export function TripCard({ trip, onStartTrip, onViewTrip, loading = false }: TripCardProps) {
  const [isStarting, setIsStarting] = React.useState(false);

  const handleStartTrip = async () => {
    if (!onStartTrip || isStarting) return;

    setIsStarting(true);
    try {
      await onStartTrip(trip.id);
    } finally {
      setIsStarting(false);
    }
  };

  const isScheduled = trip.status === 'SCHEDULED';
  const isInProgress = trip.status === 'IN_PROGRESS';

  // Format time - extract hour and minute
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return dateString;
    }
  };

  const statusColor = {
    SCHEDULED: '#10B981',
    IN_PROGRESS: '#3B82F6',
    COMPLETED: '#6B7280',
    CANCELLED: '#EF4444',
  }[trip.status] || '#6B7280';

  const studentCount = trip.students?.length || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <MaterialIcons name="directions-bus" size={24} color="#3B82F6" />
          <View style={styles.routeDetails}>
            <Text style={styles.routeName}>{trip.route?.name || 'Unknown Route'}</Text>
            <Text style={styles.departureTime}>{formatTime(trip.startTime)}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{trip.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <MaterialIcons name="people" size={18} color="#6B7280" />
          <Text style={styles.detailText}>{studentCount} students</Text>
        </View>

        {trip.vehicle && (
          <View style={styles.detailItem}>
            <MaterialIcons name="directions-car" size={18} color="#6B7280" />
            <Text style={styles.detailText}>{trip.vehicle.registrationNumber}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        {isScheduled && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isStarting && styles.buttonDisabled]}
            onPress={handleStartTrip}
            disabled={isStarting || loading}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>START TRIP</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isInProgress && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => onViewTrip?.(trip)}
          >
            <MaterialIcons name="map" size={20} color="#3B82F6" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>VIEW TRIP</Text>
          </TouchableOpacity>
        )}

        {!isScheduled && !isInProgress && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => onViewTrip?.(trip)}
          >
            <MaterialIcons name="visibility" size={20} color="#3B82F6" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>VIEW DETAILS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  departureTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  details: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
});
