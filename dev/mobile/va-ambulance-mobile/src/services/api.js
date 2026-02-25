/**
 * API Service - Axios instance with auth interceptors
 * FIX: Uses AsyncStorage (not localStorage) for React Native
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.va.gov/ambulance/v1'; // Configure per environment

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - inject auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to retrieve auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear and redirect to login
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('token_expiry');
      // Navigation handled by auth state listener in App.js
    }
    return Promise.reject(error);
  }
);

export default api;
