/**
 * EmergencyButton Component - Red emergency alert button
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface EmergencyButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

export function EmergencyButton({ onPress, disabled = false }: EmergencyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to trigger an emergency alert? This will notify the school admin immediately.',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Emergency cancelled'),
          style: 'cancel',
        },
        {
          text: 'Send Alert',
          onPress: async () => {
            setIsLoading(true);

            // Pulse animation
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]).start();

            try {
              await onPress();
              Alert.alert(
                'Success',
                'Emergency alert sent to school admin.\nThey will respond shortly.'
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to send emergency alert'
              );
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          (disabled || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.text}>EMERGENCY</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
});
