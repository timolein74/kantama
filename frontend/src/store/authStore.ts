import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { auth } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    company_name?: string;
    business_id?: string;
  }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await auth.login(email, password);
        const { access_token, user } = response.data;
        
        localStorage.setItem('token', access_token);
        set({ user, token: access_token, isAuthenticated: true, isLoading: false });
      },

      register: async (data) => {
        const response = await auth.register(data);
        const { access_token, user } = response.data;
        
        localStorage.setItem('token', access_token);
        set({ user, token: access_token, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await auth.me();
          set({ user: response.data, token, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

