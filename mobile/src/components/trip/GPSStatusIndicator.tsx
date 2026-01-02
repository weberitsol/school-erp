/**
 * GPSStatusIndicator Component - Shows GPS online/offline status
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface GPSStatusIndicatorProps {
  isOnline: boolean;
  lastUpdateTime?: number | null;
}

export function GPSStatusIndicator({ isOnline, lastUpdateTime }: GPSStatusIndicatorProps) {
  const pulseAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOnline) {
      // Start pulse animation when online
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isOnline, pulseAnimation]);

  const pulseDotOpacity = pulseAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 1],
  });

  const formatLastUpdate = () => {
    if (!lastUpdateTime) return 'Never';

    const now = Date.now();
    const diff = now - lastUpdateTime;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: isOnline ? '#ECFDF5' : '#FEF2F2' }]}>
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          {isOnline && (
            <Animated.View
              style={[
                styles.pulseDot,
                {
                  opacity: pulseDotOpacity,
                },
              ]}
            />
          )}
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
          <Text style={[styles.statusText, { color: isOnline ? '#059669' : '#DC2626' }]}>
            {isOnline ? 'GPS Online' : 'GPS Offline'}
          </Text>
        </View>

        {isOnline && lastUpdateTime && (
          <Text style={styles.updateText}>Last update: {formatLastUpdate()}</Text>
        )}
      </View>

      <MaterialIcons name={isOnline ? 'check-circle' : 'error'} size={20} color={isOnline ? '#10B981' : '#EF4444'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pulseDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  updateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
});
