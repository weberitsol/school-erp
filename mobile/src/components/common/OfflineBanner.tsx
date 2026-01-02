/**
 * OfflineBanner Component - Shows when network is unavailable
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface OfflineBannerProps {
  visible: boolean;
  message?: string;
  queuedCount?: number;
  onRetryQueue?: () => void;
  isProcessing?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function OfflineBanner({
  visible,
  message = 'No internet connection',
  queuedCount = 0,
  onRetryQueue,
  isProcessing = false,
}: OfflineBannerProps) {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name="wifi-off" size={20} color="#FFFFFF" />

        <View style={styles.textContainer}>
          <Text style={styles.message}>{message}</Text>
          {queuedCount > 0 && (
            <Text style={styles.queuedText}>
              {queuedCount} action{queuedCount !== 1 ? 's' : ''} queued
            </Text>
          )}
        </View>

        {queuedCount > 0 && onRetryQueue && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetryQueue}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="sync" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  queuedText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  retryButton: {
    padding: 8,
  },
});
