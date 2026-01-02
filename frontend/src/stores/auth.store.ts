import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, LoginCredentials, RegisterData, AuthResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        const result = await authApi.login(credentials);

        if (result.success && result.data) {
          // Extract user data, handling nested profile structure from backend
          const userData = result.data.user as any;
          const user: User = {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName || userData.profile?.firstName || userData.admin?.firstName || userData.teacher?.firstName || userData.student?.firstName || '',
            lastName: userData.lastName || userData.profile?.lastName || userData.admin?.lastName || userData.teacher?.lastName || userData.student?.lastName || '',
            profilePicture: userData.profilePicture || userData.profile?.profileImage,
          };

          set({
            user,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({
          isLoading: false,
          error: result.error || 'Login failed',
        });
        return false;
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        const result = await authApi.register(data);

        if (result.success && result.data) {
          set({
            user: result.data.user,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({
          isLoading: false,
          error: result.error || 'Registration failed',
        });
        return false;
      },

      logout: async () => {
        const { accessToken } = get();
        if (accessToken) {
          await authApi.logout(accessToken);
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken, accessToken } = get();
        if (!refreshToken || !accessToken) return false;

        const result = await authApi.refreshToken(refreshToken, accessToken);

        if (result.success && result.data) {
          set({
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
          });
          return true;
        }

        // If refresh fails, logout
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        return false;
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'school-erp-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
