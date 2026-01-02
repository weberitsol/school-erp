/**
 * StudentCard Component - Individual student item with swipe actions
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TripStudent } from '../../types/api.types';

interface StudentCardProps {
  student: TripStudent;
  section: 'pending' | 'boarded' | 'alighted';
  onBoardingPress: (student: TripStudent) => void;
  onAlightingPress: (student: TripStudent) => void;
  onAbsentPress: (student: TripStudent) => void;
}

export function StudentCard({
  student,
  section,
  onBoardingPress,
  onAlightingPress,
  onAbsentPress,
}: StudentCardProps) {
  const panX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: panX }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, { dx }) => {
        const threshold = 80; // pixels to trigger action

        if (dx > threshold) {
          // Swiped right
          if (section === 'pending') {
            onBoardingPress(student);
          } else if (section === 'boarded') {
            onAlightingPress(student);
          }
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        } else if (dx < -threshold) {
          // Swiped left
          if (section === 'pending') {
            onAbsentPress(student);
          }
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        } else {
          // Reset
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Determine stop information
  const stopInfo = () => {
    if (section === 'pending' && student.pickupStop) {
      return { name: student.pickupStop.name, type: 'Pickup' };
    }
    if ((section === 'boarded' || section === 'alighted') && student.dropoffStop) {
      return { name: student.dropoffStop.name, type: 'Drop' };
    }
    return null;
  };

  const stop = stopInfo();

  // Background color for different sections
  const getBackgroundColor = () => {
    switch (section) {
      case 'pending':
        return '#FEF3C7';
      case 'boarded':
        return '#D1FAE5';
      case 'alighted':
        return '#DBEAFE';
      default:
        return '#FFFFFF';
    }
  };

  const getStatusColor = () => {
    switch (section) {
      case 'pending':
        return '#F59E0B';
      case 'boarded':
        return '#10B981';
      case 'alighted':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = () => {
    switch (section) {
      case 'pending':
        return 'Pending';
      case 'boarded':
        return 'Boarded';
      case 'alighted':
        return 'Alighted';
      default:
        return '';
    }
  };

  // Swipe action indicators
  const rightActionOpacity = panX.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const leftActionOpacity = panX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Left action background (Mark Absent) */}
      {section === 'pending' && (
        <Animated.View
          style={[
            styles.actionBackground,
            styles.leftAction,
            { opacity: leftActionOpacity },
          ]}
        >
          <MaterialIcons name="close-circle" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Absent</Text>
        </Animated.View>
      )}

      {/* Right action background (Board/Alight) */}
      <Animated.View
        style={[
          styles.actionBackground,
          styles.rightAction,
          { opacity: rightActionOpacity },
        ]}
      >
        <MaterialIcons
          name={section === 'pending' ? 'login' : 'logout'}
          size={24}
          color="#FFFFFF"
        />
        <Text style={styles.actionText}>
          {section === 'pending' ? 'Board' : 'Alight'}
        </Text>
      </Animated.View>

      {/* Main card */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: getBackgroundColor(), transform: [{ translateX: panX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Student photo */}
        <View style={styles.photoContainer}>
          {student.photo ? (
            <Image
              source={{ uri: student.photo }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="person" size={28} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Student info */}
        <View style={styles.infoContainer}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentClass}>
            {student.class} - {student.section}
          </Text>

          {stop && (
            <View style={styles.stopInfo}>
              <MaterialIcons
                name={stop.type === 'Pickup' ? 'location-on' : 'pin-drop'}
                size={14}
                color="#3B82F6"
              />
              <Text style={styles.stopName}>
                {stop.type}: {stop.name}
              </Text>
            </View>
          )}
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusLabel()}</Text>
        </View>

        {/* Swipe hint */}
        <Text style={styles.swipeHint}>
          {section === 'pending' ? '← Swipe →' : '→ Swipe'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
  },
  photoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  infoContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  stopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopName: {
    fontSize: 11,
    color: '#3B82F6',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  swipeHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginRight: 4,
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  leftAction: {
    left: 0,
    backgroundColor: '#EF4444',
  },
  rightAction: {
    right: 0,
    backgroundColor: '#10B981',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
});
