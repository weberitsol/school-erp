/**
 * Connection Status Component - Live/Offline indicator
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface ConnectionStatusProps {
  isLive: boolean;
  lastUpdated?: Date;
  onPressed?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isLive, lastUpdated, onPressed }) => {
  const [pulseAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isLive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [isLive, pulseAnim]);

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) {
      return 'just now';
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''} ago`;
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLive ? '#D1FAE5' : '#F3F4F6',
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: isLive ? pulseOpacity : 1,
            },
          ]}
        >
          <MaterialIcons
            name={isLive ? 'cloud-done' : 'cloud-off'}
            size={16}
            color={isLive ? '#10B981' : '#6B7280'}
          />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={[styles.status, { color: isLive ? '#10B981' : '#6B7280' }]}>
            {isLive ? 'Live' : 'Last location'}
          </Text>

          {lastUpdated && (
            <Text style={styles.timestamp}>{formatLastUpdated(lastUpdated)}</Text>
          )}
        </View>
      </View>

      {!isLive && (
        <MaterialIcons name="info" size={16} color="#6B7280" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
