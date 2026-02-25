/**
 * Zustand Stores - Trip and App state management
 * FIX: Uses AsyncStorage for token persistence (not localStorage)
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TripService from '../services/TripService';
import DashboardService from '../services/DashboardService';

// ── Trip Store ──────────────────────────────────────────────
export const useTripStore = create((set, get) => ({
  trips: [],
  selectedTrip: null,
  loading: false,
  error: null,
  filters: { status: null, type: null, region: null },

  setFilters: (filters) => set({ filters }),

  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const trips = await TripService.getAllTrips(filters);
      set({ trips, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTripById: async (tripId) => {
    set({ loading: true, error: null });
    try {
      const trip = await TripService.getTripById(tripId);
      set({ selectedTrip: trip, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createTrip: async (tripData) => {
    set({ loading: true, error: null });
    try {
      const newTrip = await TripService.createTrip(tripData);
      set((state) => ({
        trips: [newTrip, ...state.trips],
        loading: false,
      }));
      return newTrip;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTrip: async (tripId, tripData) => {
    set({ loading: true, error: null });
    try {
      const updated = await TripService.updateTrip(tripId, tripData);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === tripId ? updated : t)),
        selectedTrip: updated,
        loading: false,
      }));
      return updated;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTrip: async (tripId) => {
    set({ loading: true, error: null });
    try {
      await TripService.deleteTrip(tripId);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        selectedTrip: null,
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

// ── App Store ───────────────────────────────────────────────
export const useAppStore = create((set) => ({
  token: null,
  tokenExpiry: null,
  isAuthenticated: false,
  dashboardStats: null,
  dashboardLoading: false,

  setAuth: async (token, expiry) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('token_expiry', expiry);
    set({ token, tokenExpiry: expiry, isAuthenticated: true });
  },

  clearAuth: async () => {
    await AsyncStorage.multiRemove(['auth_token', 'token_expiry']);
    set({ token: null, tokenExpiry: null, isAuthenticated: false });
  },

  restoreAuth: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    const expiry = await AsyncStorage.getItem('token_expiry');
    if (token && expiry && new Date(expiry) > new Date()) {
      set({ token, tokenExpiry: expiry, isAuthenticated: true });
      return true;
    }
    return false;
  },

  fetchDashboardStats: async () => {
    set({ dashboardLoading: true });
    try {
      const stats = await DashboardService.getStats();
      set({ dashboardStats: stats, dashboardLoading: false });
    } catch (error) {
      set({ dashboardLoading: false });
    }
  },
}));
