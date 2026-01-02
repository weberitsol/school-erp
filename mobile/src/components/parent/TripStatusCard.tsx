/**
 * Trip Status Card - Timeline view of trip progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface TripMilestone {
  type: 'SCHEDULED_PICKUP' | 'BOARDED' | 'EN_ROUTE' | 'APPROACHING' | 'ARRIVED' | 'DROPPED_OFF';
  label: string;
  scheduledTime?: string;
  actualTime?: string;
  completed: boolean;
  isNext: boolean;
}

export interface TripStatusCardProps {
  milestones: TripMilestone[];
  currentStatus: string;
  timeRemaining?: number; // minutes
}

export const TripStatusCard: React.FC<TripStatusCardProps> = ({
  milestones,
  currentStatus,
  timeRemaining,
}) => {
  const getStatusIcon = (type: string, completed: boolean): string => {
    if (type === 'SCHEDULED_PICKUP') return 'my-location';
    if (type === 'BOARDED') return 'login';
    if (type === 'EN_ROUTE') return 'directions-bus';
    if (type === 'APPROACHING') return 'nearby';
    if (type === 'ARRIVED') return 'location-on';
    if (type === 'DROPPED_OFF') return 'logout';
    return 'info';
  };

  const getStatusColor = (type: string, completed: boolean, isNext: boolean): string => {
    if (completed) return '#10B981'; // Green
    if (isNext) return '#3B82F6'; // Blue
    return '#D1D5DB'; // Gray
  };

  const getBackgroundColor = (type: string, completed: boolean, isNext: boolean): string => {
    if (completed) return '#D1FAE5';
    if (isNext) return '#EFF6FF';
    return '#F3F4F6';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trip Status</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{currentStatus}</Text>
        </View>
      </View>

      {/* Time Remaining */}
      {timeRemaining !== undefined && timeRemaining > 0 && (
        <View style={styles.timeRemaining}>
          <MaterialIcons name="schedule" size={16} color="#F59E0B" />
          <Text style={styles.timeRemainingText}>
            {timeRemaining} minutes remaining
          </Text>
        </View>
      )}

      {/* Timeline */}
      <View style={styles.timeline}>
        {milestones.map((milestone, index) => (
          <View key={milestone.type}>
            {/* Milestone Item */}
            <View
              style={[
                styles.milestoneItem,
                {
                  backgroundColor: getBackgroundColor(
                    milestone.type,
                    milestone.completed,
                    milestone.isNext
                  ),
                },
              ]}
            >
              {/* Icon Circle */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: getStatusColor(
                      milestone.type,
                      milestone.completed,
                      milestone.isNext
                    ),
                  },
                ]}
              >
                <MaterialIcons
                  name={getStatusIcon(milestone.type, milestone.completed) as any}
                  size={16}
                  color="#FFFFFF"
                />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: milestone.completed ? '#10B981' : '#1F2937',
                      fontWeight: milestone.isNext ? '700' : '600',
                    },
                  ]}
                >
                  {milestone.label}
                </Text>

                <View style={styles.times}>
                  {milestone.scheduledTime && (
                    <Text style={styles.scheduledTime}>
                      Scheduled: {milestone.scheduledTime}
                    </Text>
                  )}

                  {milestone.actualTime && (
                    <Text style={styles.actualTime}>
                      Actual: {milestone.actualTime}
                    </Text>
                  )}
                </View>
              </View>

              {/* Completion Indicator */}
              {milestone.completed && (
                <MaterialIcons
                  name="check-circle"
                  size={24}
                  color="#10B981"
                  style={styles.completionIcon}
                />
              )}

              {milestone.isNext && !milestone.completed && (
                <View style={styles.nextIndicator}>
                  <Text style={styles.nextText}>Next</Text>
                </View>
              )}
            </View>

            {/* Connector Line */}
            {index < milestones.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor: milestone.completed ? '#10B981' : '#D1D5DB',
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Next</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  timeRemainingText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  timeline: {
    marginBottom: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  times: {
    gap: 2,
  },
  scheduledTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  actualTime: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  completionIcon: {
    marginLeft: 8,
  },
  nextIndicator: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  nextText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connector: {
    height: 2,
    marginLeft: 16,
    marginRight: 0,
    marginVertical: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
