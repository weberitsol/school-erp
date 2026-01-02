/**
 * API Service - Axios wrapper with JWT auth and token refresh
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ApiError, LoginRequest, LoginResponse, RefreshTokenRequest } from '../types/api.types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.106:5000/api/v1';

class ApiService {
  private api: AxiosInstance;
  private refreshing: boolean = false;
  private failedQueue: Array<(token: string) => void> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors for auth handling
   */
  private setupInterceptors(): void {
    // Request interceptor - attach JWT token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add schoolId to headers for multi-tenancy
        const user = await this.getStoredUser();
        if (user?.schoolId) {
          config.headers['X-School-Id'] = user.schoolId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle 401 and refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            // Queue failed requests while refreshing
            return new Promise((resolve) => {
              this.failedQueue.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.failedQueue.forEach((callback) => callback(newToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout user
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.refreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<ApiResponse<{ accessToken: string }>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken }
      );

      const newToken = response.data.data?.accessToken;
      if (newToken) {
        await AsyncStorage.setItem('accessToken', newToken);
        return newToken;
      }

      throw new Error('No access token in refresh response');
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  /**
   * Get stored user from AsyncStorage
   */
  private async getStoredUser() {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens and user
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return { accessToken, refreshToken, user };
      }

      throw new Error('Login failed: ' + (response.data.data?.user?.id ? 'Invalid response' : 'No data'));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user - clear stored tokens and user
   */
  async logout(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.removeItem('user'),
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * GET request
   */
  async get<T>(url: string, config = {}): Promise<T> {
    try {
      const response = await this.api.get<ApiResponse<T>>(url, config);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config = {}): Promise<T> {
    try {
      const response = await this.api.post<ApiResponse<T>>(url, data, config);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config = {}): Promise<T> {
    try {
      const response = await this.api.put<ApiResponse<T>>(url, data, config);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config = {}): Promise<T> {
    try {
      const response = await this.api.delete<ApiResponse<T>>(url, config);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message || 'An error occurred';
      const code = error.code;

      return {
        message,
        code,
        status,
        details: error.response?.data,
      };
    }

    return {
      message: error.message || 'An unexpected error occurred',
    };
  }

  /**
   * Generic request method for advanced operations
   */
  async request<T>(config: any): Promise<T> {
    try {
      const response = await this.api.request<ApiResponse<T>>(config);
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get raw axios instance for advanced operations
   */
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
