/**
 * BoardingModal Component - Photo capture, location verification, and confirmation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { TripStudent } from '../../types/api.types';

interface BoardingModalProps {
  visible: boolean;
  student: TripStudent | null;
  action: 'boarding' | 'alighting' | 'absent' | null;
  currentLocation: Location.LocationObject | null;
  isSubmitting?: boolean;
  onConfirm: (
    student: TripStudent,
    photo?: string,
    reason?: string
  ) => Promise<void>;
  onCancel: () => void;
}

const GEOFENCE_RADIUS = 50; // meters

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert to meters
}

export function BoardingModal({
  visible,
  student,
  action,
  currentLocation,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: BoardingModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Validate location when modal opens or location updates
  React.useEffect(() => {
    if (!visible || !student || !currentLocation) return;

    const validateLocation = async () => {
      setLoadingLocation(true);

      try {
        // Get stop location based on action
        const stop =
          action === 'boarding' ? student.pickupStop : student.dropoffStop;

        if (!stop) {
          setIsLocationValid(false);
          setLoadingLocation(false);
          return;
        }

        // Calculate distance from current location to stop
        const dist = calculateDistance(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          stop.latitude,
          stop.longitude
        );

        setDistance(dist);
        setIsLocationValid(dist <= GEOFENCE_RADIUS);
      } catch (error) {
        console.error('Error validating location:', error);
        setIsLocationValid(false);
      } finally {
        setLoadingLocation(false);
      }
    };

    validateLocation();
  }, [visible, student, action, currentLocation]);

  // Request camera permissions and capture photo
  const handleCapturePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.cancelled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhoto(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!student) return;

    // Check location for boarding/alighting
    if (action !== 'absent' && !isLocationValid) {
      Alert.alert(
        'Location Required',
        `You must be at the ${action === 'boarding' ? 'pickup' : 'drop-off'} stop to ${action} students.`
      );
      return;
    }

    try {
      await onConfirm(student, photo || undefined, reason || undefined);
      // Reset form after successful submission
      setPhoto(null);
      setReason('');
    } catch (error) {
      console.error('Error confirming action:', error);
    }
  }, [student, action, isLocationValid, photo, reason, onConfirm]);

  if (!visible || !student || !action) return null;

  const stop =
    action === 'boarding' ? student.pickupStop : student.dropoffStop;

  const getTitle = () => {
    switch (action) {
      case 'boarding':
        return 'Record Boarding';
      case 'alighting':
        return 'Record Alighting';
      case 'absent':
        return 'Mark Absent';
      default:
        return '';
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'boarding':
        return '#10B981';
      case 'alighting':
        return '#3B82F6';
      case 'absent':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <TouchableOpacity
            onPress={onCancel}
            disabled={isSubmitting}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Student Info */}
          <View style={styles.studentInfoCard}>
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{student.name}</Text>
              <View
                style={[
                  styles.actionBadge,
                  { backgroundColor: getActionColor() },
                ]}
              >
                <Text style={styles.actionBadgeText}>
                  {action === 'boarding' ? 'Boarding' : action === 'alighting' ? 'Alighting' : 'Absent'}
                </Text>
              </View>
            </View>
            <Text style={styles.studentClass}>
              {student.class} - {student.section}
            </Text>

            {stop && (
              <View style={styles.stopSection}>
                <MaterialIcons
                  name={action === 'boarding' ? 'location-on' : 'pin-drop'}
                  size={16}
                  color="#3B82F6"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopType}>
                    {action === 'boarding' ? 'Pickup' : 'Drop-off'} Stop
                  </Text>
                  <Text style={styles.stopName}>{stop.name}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Location Verification (for boarding/alighting) */}
          {action !== 'absent' && (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <MaterialIcons
                  name={isLocationValid ? 'check-circle' : 'error'}
                  size={20}
                  color={isLocationValid ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.locationTitle, { color: isLocationValid ? '#10B981' : '#EF4444' }]}>
                  Location Verification
                </Text>
              </View>

              {loadingLocation ? (
                <View style={styles.locationLoading}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.locationLoadingText}>Checking location...</Text>
                </View>
              ) : distance !== null ? (
                <View>
                  <Text style={styles.distanceText}>
                    Distance: <Text style={styles.distanceValue}>{Math.round(distance)}m</Text>
                  </Text>
                  <Text
                    style={[
                      styles.locationMessage,
                      { color: isLocationValid ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {isLocationValid
                      ? `You are at the stop (within ${GEOFENCE_RADIUS}m)`
                      : `You are too far from the stop (needs to be within ${GEOFENCE_RADIUS}m)`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.locationError}>Unable to verify location</Text>
              )}
            </View>
          )}

          {/* Photo Section */}
          {action !== 'absent' && (
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Student Photo (Optional)</Text>

              {photo ? (
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: photo }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={handleRemovePhoto}
                    disabled={isSubmitting}
                  >
                    <MaterialIcons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapturePhoto}
                  disabled={isSubmitting}
                >
                  <MaterialIcons name="camera-alt" size={32} color="#3B82F6" />
                  <Text style={styles.captureButtonText}>Capture Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Absence Reason Section */}
          {action === 'absent' && (
            <View style={styles.reasonSection}>
              <Text style={styles.sectionTitle}>Reason for Absence</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Enter reason (optional)"
                placeholderTextColor="#9CA3AF"
                value={reason}
                onChangeText={setReason}
                editable={!isSubmitting}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {/* Location Error for Boarding/Alighting */}
          {action !== 'absent' && !isLocationValid && (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: '#FEF2F2' },
              ]}
            >
              <MaterialIcons name="warning" size={20} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Location Required</Text>
                <Text style={styles.warningMessage}>
                  You must be at the stop to record {action}.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              {
                backgroundColor: getActionColor(),
                opacity: action !== 'absent' && !isLocationValid ? 0.5 : 1,
              },
            ]}
            onPress={handleConfirm}
            disabled={
              isSubmitting ||
              (action !== 'absent' && !isLocationValid)
            }
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  studentInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  studentClass: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  stopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stopType: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  stopName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationLoading: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  distanceText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  distanceValue: {
    fontWeight: '700',
    color: '#1F2937',
  },
  locationMessage: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationError: {
    fontSize: 12,
    color: '#EF4444',
  },
  photoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 280,
    backgroundColor: '#F3F4F6',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    opacity: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  reasonSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  warningMessage: {
    fontSize: 12,
    color: '#7F1D1D',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
