/**
 * SettingsScreen - Driver profile, preferences, and settings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../../services/auth.service';

interface DriverProfile {
  name: string;
  email: string;
  licenseNumber?: string;
  vehicle?: string;
}

interface AppSettings {
  notificationsEnabled: boolean;
  gpsUpdateInterval: '15' | '30' | '60'; // seconds
  locationSharingEnabled: boolean;
}

export function SettingsScreen({ navigation }: any) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    gpsUpdateInterval: '15',
    locationSharingEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load profile and settings on mount
  useEffect(() => {
    loadProfileAndSettings();
  }, []);

  const loadProfileAndSettings = async () => {
    try {
      setLoading(true);

      // Load user profile
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setProfile({
          name: user.name || 'Unknown',
          email: user.email || 'No email',
          licenseNumber: user.licenseNumber || 'N/A',
          vehicle: user.assignedVehicle?.registration || 'N/A',
        });
      }

      // Load app settings
      const settingsJson = await AsyncStorage.getItem('app_settings');
      if (settingsJson) {
        setSettings(JSON.parse(settingsJson));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleToggleNotifications = (value: boolean) => {
    const newSettings = { ...settings, notificationsEnabled: value };
    saveSettings(newSettings);
  };

  const handleToggleLocationSharing = (value: boolean) => {
    const newSettings = { ...settings, locationSharingEnabled: value };
    saveSettings(newSettings);
  };

  const handleGPSIntervalChange = (interval: '15' | '30' | '60') => {
    const newSettings = { ...settings, gpsUpdateInterval: interval };
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authService.logout();
            // Navigation will happen automatically when auth state changes
            navigation.reset({
              index: 0,
              routes: [{ name: 'AuthNavigator' }],
            });
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout');
            setIsLoggingOut(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="settings" size={32} color="#3B82F6" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="person" size={18} color="#6B7280" /> Profile
          </Text>

          <View style={styles.card}>
            <View style={styles.profileItem}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{profile?.name || 'Loading...'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profileItem}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{profile?.email || 'Loading...'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profileItem}>
              <Text style={styles.label}>License Number</Text>
              <Text style={styles.value}>{profile?.licenseNumber || 'N/A'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profileItem}>
              <Text style={styles.label}>Assigned Vehicle</Text>
              <Text style={styles.value}>{profile?.vehicle || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="notifications" size={18} color="#6B7280" /> Notifications
          </Text>

          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive alerts for trip updates
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={settings.notificationsEnabled ? '#10B981' : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* GPS Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="location-on" size={18} color="#6B7280" /> GPS Settings
          </Text>

          <View style={styles.card}>
            <Text style={styles.settingLabel}>Location Update Interval</Text>
            <Text style={styles.settingDescription}>
              How often to send location updates to server
            </Text>

            <View style={styles.intervalButtons}>
              {(['15', '30', '60'] as const).map((interval) => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.intervalButton,
                    settings.gpsUpdateInterval === interval &&
                      styles.intervalButtonActive,
                  ]}
                  onPress={() => handleGPSIntervalChange(interval)}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      settings.gpsUpdateInterval === interval &&
                        styles.intervalButtonTextActive,
                    ]}
                  >
                    {interval}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.intervalHint}>
              ⚠️ Shorter intervals use more battery but provide better accuracy
            </Text>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="privacy-tip" size={18} color="#6B7280" /> Privacy
          </Text>

          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Location Sharing</Text>
                <Text style={styles.settingDescription}>
                  Allow real-time location tracking during trips
                </Text>
              </View>
              <Switch
                value={settings.locationSharingEnabled}
                onValueChange={handleToggleLocationSharing}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={settings.locationSharingEnabled ? '#10B981' : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="info" size={18} color="#6B7280" /> App Information
          </Text>

          <View style={styles.card}>
            <View style={styles.profileItem}>
              <Text style={styles.label}>App Version</Text>
              <Text style={styles.value}>1.0.0</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profileItem}>
              <Text style={styles.label}>Build</Text>
              <Text style={styles.value}>Build 1</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  intervalButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  intervalButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  intervalButtonTextActive: {
    color: '#3B82F6',
  },
  intervalHint: {
    fontSize: 12,
    color: '#F59E0B',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomPadding: {
    height: 32,
  },
});
