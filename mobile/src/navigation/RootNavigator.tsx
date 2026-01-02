/**
 * Root Navigator - Conditional rendering based on auth status and user role
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { authService } from '../services/auth.service';
import { AuthNavigator } from './AuthNavigator';
import { DriverNavigator } from './DriverNavigator';
import { ParentNavigator } from './ParentNavigator';
import { User } from '../types/api.types';

type UserRole = 'TEACHER' | 'PARENT' | 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN' | null;

export function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();

      if (authenticated) {
        const user = await authService.getStoredUser();
        if (user) {
          setUserRole(user.role as UserRole);
        }
      }

      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : userRole === 'TEACHER' ? (
        <DriverNavigator />
      ) : userRole === 'PARENT' || userRole === 'STUDENT' ? (
        <ParentNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
