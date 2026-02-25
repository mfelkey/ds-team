/**
 * Auth Service - Token management, biometric auth, refresh
 * NEW: Was referenced but not implemented in original output
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import api from './api';

const AUTH_TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

const AuthService = {
  /**
   * Login with VA credentials
   */
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    const { token, expiresAt } = response.data;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
    return response.data;
  },

  /**
   * Logout - clear stored credentials
   */
  async logout() {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, TOKEN_EXPIRY_KEY]);
  },

  /**
   * Get stored auth token
   */
  async getToken() {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Check if token is valid (not expired)
   */
  async isTokenValid() {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const expiry = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return false;
    return new Date(expiry) > new Date();
  },

  /**
   * Refresh auth token
   */
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      const { token, expiresAt } = response.data;
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
      return token;
    } catch (error) {
      await this.logout();
      throw error;
    }
  },

  /**
   * Check if device supports biometric auth
   */
  async isBiometricAvailable() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access VA Ambulance',
      cancelLabel: 'Use Password',
      disableDeviceFallback: false,
    });
    return result.success;
  },

  /**
   * Enable/disable biometric auth preference
   */
  async setBiometricEnabled(enabled) {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
  },

  async isBiometricEnabled() {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value ? JSON.parse(value) : false;
  },
};

export default AuthService;
