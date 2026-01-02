/**
 * Auth Service - Authentication operations
 */

import { apiService } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest } from '../types/api.types';

class AuthService {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    try {
      const result = await apiService.login(email, password);
      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get stored user from AsyncStorage
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await apiService.isAuthenticated();
  }

  /**
   * Clear all auth data
   */
  async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.removeItem('user'),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }
}

export const authService = new AuthService();
