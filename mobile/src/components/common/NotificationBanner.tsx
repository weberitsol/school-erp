/**
 * Notification Banner - Toast-style in-app notification display
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export type NotificationType =
  | 'TRIP_STARTED'
  | 'STUDENT_BOARDED'
  | 'STUDENT_ALIGHTED'
  | 'APPROACHING'
  | 'DELAYED'
  | 'ARRIVED'
  | 'INFO';

export interface NotificationBannerProps {
  visible: boolean;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // milliseconds (0 = indefinite)
  onDismiss?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          dismiss();
        }, duration);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const getIconName = (): string => {
    switch (type) {
      case 'TRIP_STARTED':
        return 'directions-bus';
      case 'STUDENT_BOARDED':
        return 'login';
      case 'STUDENT_ALIGHTED':
        return 'logout';
      case 'APPROACHING':
        return 'nearby';
      case 'DELAYED':
        return 'schedule';
      case 'ARRIVED':
        return 'check-circle';
      default:
        return 'info';
    }
  };

  const getBackgroundColor = (): string => {
    switch (type) {
      case 'TRIP_STARTED':
        return '#3B82F6';
      case 'STUDENT_BOARDED':
        return '#10B981';
      case 'STUDENT_ALIGHTED':
        return '#10B981';
      case 'APPROACHING':
        return '#F59E0B';
      case 'DELAYED':
        return '#EF4444';
      case 'ARRIVED':
        return '#06B6D4';
      default:
        return '#6B7280';
    }
  };

  if (!visible) return null;

  const backgroundColor = getBackgroundColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.banner, { backgroundColor }]}>
        {/* Icon */}
        <MaterialIcons
          name={getIconName() as any}
          size={24}
          color="#FFFFFF"
          style={styles.icon}
        />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismiss}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <MaterialIcons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {duration > 0 && (
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: backgroundColor,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                opacity: 0.3,
                width: `100%`,
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  progressBar: {
    height: 3,
    marginTop: 8,
    opacity: 0.4,
  },
  progressFill: {
    height: 3,
  },
});
