/**
 * Parent Home Screen - Child selection and route information
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { parentAuthService, ParentChild, TodayTrip } from '../../services/parent-auth.service';
import { useParentStore } from '../../store/parent.store';

export function ParentHomeScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const { children, selectedChildId, selectedChild, todayTrips, setChildren, selectChild, setTodayTrips } =
    useParentStore();

  // Load parent profile and today's trips on focus
  useFocusEffect(
    React.useCallback(() => {
      loadParentData();
    }, [])
  );

  const loadParentData = async () => {
    try {
      setLoading(true);

      // Get parent profile with children
      const profile = await parentAuthService.getParentProfile();
      setChildren(profile.children);

      // Load today's trips for selected child
      if (selectedChildId || profile.children.length > 0) {
        const childId = selectedChildId || profile.children[0].id;
        const trips = await parentAuthService.getTodayTrips(childId);
        setTodayTrips(trips);
      }
    } catch (error) {
      console.error('Error loading parent data:', error);
      Alert.alert('Error', 'Failed to load your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleSelectChild = async (childId: string) => {
    selectChild(childId);

    try {
      const trips = await parentAuthService.getTodayTrips(childId);
      setTodayTrips(trips);
    } catch (error) {
      console.error('Error loading trips for child:', error);
      Alert.alert('Error', 'Failed to load trips for this child.');
    }
  };

  const handleTrackBus = () => {
    if (!selectedChildId) {
      Alert.alert('Error', 'Please select a child first');
      return;
    }

    if (todayTrips.length === 0) {
      Alert.alert('Info', 'No scheduled trip for your child today');
      return;
    }

    navigation.navigate('Track');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="child-care" size={32} color="#3B82F6" />
          <Text style={styles.headerTitle}>My Child</Text>
        </View>

        {/* Children Selection */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="people" size={16} color="#6B7280" /> Select Child
            </Text>

            <FlatList
              data={children}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.childCard,
                    selectedChildId === item.id && styles.childCardActive,
                  ]}
                  onPress={() => handleSelectChild(item.id)}
                >
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{item.name}</Text>
                    <Text style={styles.childClass}>
                      {item.class} - {item.section}
                    </Text>
                  </View>

                  {selectedChildId === item.id && (
                    <MaterialIcons name="check-circle" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Route Information */}
        {selectedChild && todayTrips.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="directions-bus" size={16} color="#6B7280" /> Route Info
              </Text>

              <View style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <Text style={styles.routeName}>{todayTrips[0].route.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          todayTrips[0].status === 'IN_PROGRESS'
                            ? '#10B981'
                            : todayTrips[0].status === 'COMPLETED'
                              ? '#3B82F6'
                              : '#F59E0B',
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>{todayTrips[0].status}</Text>
                  </View>
                </View>

                <View style={styles.routeDetails}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="directions-bus" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Vehicle: {todayTrips[0].vehicle.registrationNumber}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {new Date(todayTrips[0].startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.trackButton} onPress={handleTrackBus}>
                  <MaterialIcons name="location-on" size={20} color="#FFFFFF" />
                  <Text style={styles.trackButtonText}>TRACK BUS</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pickup & Drop Info */}
            <View style={styles.section}>
              <View style={styles.stopInfoGrid}>
                {selectedChild.pickupStop && (
                  <View style={styles.stopInfoCard}>
                    <MaterialIcons name="my-location" size={24} color="#10B981" />
                    <Text style={styles.stopLabel}>Pickup Stop</Text>
                    <Text style={styles.stopName}>{selectedChild.pickupStop.name}</Text>
                  </View>
                )}

                {selectedChild.dropStop && (
                  <View style={styles.stopInfoCard}>
                    <MaterialIcons name="location-on" size={24} color="#EF4444" />
                    <Text style={styles.stopLabel}>Drop Stop</Text>
                    <Text style={styles.stopName}>{selectedChild.dropStop.name}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Empty State */}
        {children.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="child-care" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Children Found</Text>
            <Text style={styles.emptyMessage}>
              No child records found associated with your account.
            </Text>
          </View>
        )}

        {selectedChild && todayTrips.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="directions-bus" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Trip Today</Text>
            <Text style={styles.emptyMessage}>
              {selectedChild.name} has no scheduled trip for today.
            </Text>
          </View>
        )}
      </ScrollView>
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  childCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  childCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  childClass: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    overflow: 'hidden',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#1F2937',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stopInfoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  stopInfoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    alignItems: 'center',
  },
  stopLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  stopName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
