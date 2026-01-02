/**
 * Parent Navigator - Bottom tab navigator for parent/student app
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { ParentHomeScreen } from '../screens/parent/ParentHomeScreen';
import { TrackingScreen } from '../screens/parent/TrackingScreen';
import { ParentTripHistoryScreen } from '../screens/parent/ParentTripHistoryScreen';
import { ParentSettingsScreen } from '../screens/parent/ParentSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeScreen" component={ParentHomeScreen} />
    </Stack.Navigator>
  );
}

export function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Track') {
            iconName = focused ? 'location-on' : 'location-on';
          } else if (route.name === 'History') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings';
          }

          return <MaterialIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeTabStack}
        options={{
          title: 'My Child',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Track"
        component={TrackingScreen}
        options={{
          title: 'Track Bus',
          tabBarLabel: 'Track',
        }}
      />
      <Tab.Screen
        name="History"
        component={ParentTripHistoryScreen}
        options={{
          title: 'Trip History',
          tabBarLabel: 'History',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={ParentSettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
