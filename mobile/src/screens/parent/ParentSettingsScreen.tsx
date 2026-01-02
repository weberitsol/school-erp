/**
 * Parent Settings Screen - Profile, preferences, and account management
 * Story 5.6 - Settings and notifications preferences
 */

import React from 'react';
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useParentStore } from '../../store/parent.store';
import { parentAuthService } from '../../services/parent-auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function ParentSettingsScreen({ navigation }: { navigation: any }) {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationSharingEnabled, setLocationSharingEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [parentProfile, setParentProfile] = React.useState<any>(null);

  const { selectedChild, children } = useParentStore();

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Load parent profile
      const profile = await parentAuthService.getParentProfile();
      setParentProfile(profile);

      // Load preferences from AsyncStorage
      const prefs = await AsyncStorage.getItem('parent_preferences');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        setNotificationsEnabled(parsed.notificationsEnabled ?? true);
        setLocationSharingEnabled(parsed.locationSharingEnabled ?? true);
        setSoundEnabled(parsed.soundEnabled ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (key: string, value: boolean) => {
    try {
      const prefs = await AsyncStorage.getItem('parent_preferences');
      const parsed = prefs ? JSON.parse(prefs) : {};
      parsed[key] = value;
      await AsyncStorage.setItem('parent_preferences', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await savePreferences('notificationsEnabled', value);
  };

  const handleLocationToggle = async (value: boolean) => {
    setLocationSharingEnabled(value);
    await savePreferences('locationSharingEnabled', value);
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    await savePreferences('soundEnabled', value);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="settings" size={32} color="#3B82F6" />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        {parentProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>

            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {parentProfile.firstName?.[0]?.toUpperCase()}
                    {parentProfile.lastName?.[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {parentProfile.firstName} {parentProfile.lastName}
                  </Text>
                  <Text style={styles.profileEmail}>{parentProfile.email}</Text>
                  <Text style={styles.profilePhone}>{parentProfile.phone}</Text>
                </View>
              </View>

              {/* Children Overview */}
              <View style={styles.childrenOverview}>
                <Text style={styles.overviewTitle}>Your Children</Text>
                {children.map((child) => (
                  <View key={child.id} style={styles.childItem}>
                    <View style={styles.childItemLeft}>
                      <MaterialIcons name="person" size={16} color="#3B82F6" />
                      <View>
                        <Text style={styles.childName}>{child.name}</Text>
                        <Text style={styles.childClass}>
                          {child.class}-{child.section}
                        </Text>
                      </View>
                    </View>
                    {selectedChild?.id === child.id && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialIcons name="notifications" size={20} color="#3B82F6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive alerts about trips and events
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#D1D5DB', true: '#A5F3FC' }}
                thumbColor={notificationsEnabled ? '#3B82F6' : '#9CA3AF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialIcons name="volume-up" size={20} color="#F59E0B" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sound</Text>
                  <Text style={styles.settingDescription}>
                    Play sound for notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#D1D5DB', true: '#A5F3FC' }}
                thumbColor={soundEnabled ? '#F59E0B' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Safety</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialIcons name="location-on" size={20} color="#10B981" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Location Sharing</Text>
                  <Text style={styles.settingDescription}>
                    Share location to track bus
                  </Text>
                </View>
              </View>
              <Switch
                value={locationSharingEnabled}
                onValueChange={handleLocationToggle}
                trackColor={{ false: '#D1D5DB', true: '#A5F3FC' }}
                thumbColor={locationSharingEnabled ? '#10B981' : '#9CA3AF'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingContent}>
                <MaterialIcons name="lock" size={20} color="#6B7280" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                  <Text style={styles.settingDescription}>
                    View our privacy policy
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.settingCard}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Send Feedback</Text>
              <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Help & Support</Text>
              <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer Spacing */}
        <View style={styles.footer} />
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  childrenOverview: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  overviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  childItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  childItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  childName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  childClass: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  aboutValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 20,
  },
});
