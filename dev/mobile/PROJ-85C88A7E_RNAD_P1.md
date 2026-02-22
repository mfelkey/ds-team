# React Native Architecture Document (RNAD) – VA Ambulance Trip Analysis App

## 1. ARCHITECTURE OVERVIEW

### Technology Decisions Table

| Library | Version | Justification |
|--------|---------|---------------|
| React Native | 0.74 | Latest stable version with full support for Expo SDK 51, ensures parity across platforms |
| Expo SDK | 51 | Provides unified APIs and features while maintaining native capabilities |
| React Navigation 6 | 6.20 | Industry standard for cross-platform navigation with declarative routing |
| Zustand 4 | 4.5 | Lightweight, performant state management with minimal boilerplate |
| TanStack Query 5 | 5.29 | Advanced caching, background updates, and server state synchronization |
| Axios 1.6 | 1.6.8 | Robust HTTP client with interceptors, request/response handling |
| react-native-keychain 8 | 8.1.0 | Secure credential storage using native keychains |
| react-native-biometrics 3 | 3.0.0 | Cross-platform biometric authentication (Face ID, Touch ID, Android BiometricPrompt) |
| react-native-mmkv 2 | 2.12.2 | Fast, reliable local storage for persisting Zustand stores |
| react-native-reanimated 3 | 3.10.1 | High-performance animations and gesture handling |
| react-native-gesture-handler 2 | 2.18.0 | Enables complex gestures and interactions |
| expo-screen-capture | 5.0.0 | Detects screen capture to prevent unauthorized access |
| expo-haptics | 14.0.0 | Provides haptic feedback for enhanced UX |
| expo-auth-session 5 | 5.0.0 | Handles OAuth flows with PKCE for secure login |
| Jest 29 | 29.7 | Testing framework with built-in mocking and snapshot support |
| Detox 20 | 20.24.0 | End-to-end testing for native app behavior |

---

### Platform Adaptation — Three Patterns with Code Examples

#### Pattern A — Platform.OS (one or two properties differ):

```typescript
import { Platform } from 'react-native';

const fontSize = Platform.OS === 'ios' ? 34 : 24;
```

#### Pattern B — Platform.select (whole style block differs):

```typescript
import { Platform } from 'react-native';

const tabBarStyle = Platform.select({
  ios: { backgroundColor: '#003366', borderTopWidth: 0 },
  android: { backgroundColor: '#003366', elevation: 4 },
  default: {},
});
```

#### Pattern C — Platform file extensions (logic differs substantially):

- Create `Header.ios.tsx` and `Header.android.tsx` when platform-specific UI logic or components are required.
- React Native automatically resolves the correct file based on the target platform at build time.
- Example: `Header.tsx` might be a shared base component, but `Header.ios.tsx` could include iOS-specific styling or behavior, while `Header.android.tsx` handles Android-specific features.

---

## 2. NAVIGATION ARCHITECTURE

### navigation/types.ts

```typescript
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  BiometricPrompt: undefined;
};

export type MainTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Settings: undefined;
  About: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  TripList: { filters?: FilterOptions };
  TripDetail: { id: string };
};
```

---

### navigation/RootNavigator.tsx

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import { useColorScheme } from 'react-native';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer
      linking={linking}
      theme={colorScheme === 'dark' ? { colors: { background: '#000' } } : {}}
    >
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
```

---

### navigation/AuthNavigator.tsx

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Login } from '../screens/Login';
import { BiometricPrompt } from '../screens/BiometricPrompt';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="BiometricPrompt" component={BiometricPrompt} />
    </Stack.Navigator>
  );
};
```

---

### navigation/MainNavigator.tsx

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardNavigator } from './DashboardNavigator';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { backgroundColor: '#003366', borderTopWidth: 0 },
          android: { backgroundColor: '#003366', elevation: 4 },
          default: {},
        }),
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Dashboard') {
            iconName = 'analytics';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else if (route.name === 'About') {
            iconName = 'information-circle';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="About" component={AboutScreen} />
    </Tab.Navigator>
  );
};
```

---

### navigation/DashboardNavigator.tsx

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TripListScreen } from '../screens/TripListScreen';
import { TripDetailScreen } from '../screens/TripDetailScreen';
import { Platform } from 'react-native';

const Stack = createStackNavigator<DashboardStackParamList>();

export const DashboardNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerLargeTitle: Platform.OS === 'ios',
        headerLargeTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="TripList" component={TripListScreen} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
```

---

### navigation/NavigationService.ts

```typescript
import { NavigationContainerRef } from '@react-navigation/native';

export const navigationRef = React.createRef<NavigationContainerRef>();

export const navigate = (name: string, params?: any) => {
  navigationRef.current?.navigate(name, params);
};
```

---

## 3. STATE MANAGEMENT

### store/authStore.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isAuthenticated: boolean;
  setAuth: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      setAuth: (value) => set({ isAuthenticated: value }),
    }),
    {
      name: 'auth-storage',
      storage: AsyncStorage,
    }
  )
);
```

---

### store/sessionStore.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SessionState {
  lastActive: number | null;
  setLastActive: (timestamp: number) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      lastActive: null,
      setLastActive: (timestamp) => set({ lastActive: timestamp }),
    }),
    {
      name: 'session-storage',
      storage: AsyncStorage,
    }
  )
);
```

---

## 4. API LAYER

### api/types.ts

```typescript
export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface KPISummary {
  totalTrips: number;
  completedTrips: number;
  pendingTrips: number;
  avgDuration: number;
}
```

---

### api/authApi.ts

```typescript
import { apiClient } from './client';

export const login = async (code: string, redirectUri: string) => {
  const response = await apiClient.post('/auth/login', {
    code,
    redirectUri,
  });
  return response.data;
};

export const refreshToken = async (refreshToken: string) => {
  const response = await apiClient.post('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};
```

---

### api/dashboardApi.ts

```typescript
import { apiClient } from './client';
import { FilterOptions, KPISummary } from './types';

export const getKPISummary = async (filters: FilterOptions): Promise<KPISummary> => {
  const response = await apiClient.get('/dashboard/kpi', { params: filters });
  return response.data;
};
```

---

### api/tripsApi.ts

```typescript
import { apiClient } from './client';
import { FilterOptions } from './types';

export const getTrips = async (page: number, filters: FilterOptions) => {
  const response = await apiClient.get('/trips', {
    params: { page, ...filters },
  });
  return response.data;
};

export const getTripDetail = async (id: string) => {
  const response = await apiClient.get(`/trips/${id}`);
  return response.data;
};
```

---

### api/client.ts

```typescript
import axios, { AxiosError } from 'axios';
import { logout } from './authApi';

const apiClient = axios.create({
  baseURL: 'https://api.example.com',
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

---

## 5. AUTHENTICATION ARCHITECTURE

### shared/services/AuthService.ts

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { setGenericPassword, getGenericPassword, resetGenericPassword } from 'react-native-keychain';
import { login, refreshToken, logout } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

class AuthService {
  private static clientId = 'your-client-id';
  private static redirectUri = 'your-redirect-uri';

  static async login() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=openid profile email`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, this.redirectUri);
    if (result.type === 'success') {
      const code = new URLSearchParams(result.url).get('code');
      if (code) {
        const tokens = await login(code, this.redirectUri);
        await setGenericPassword('access_token', tokens.access_token);
        await setGenericPassword('refresh_token', tokens.refresh_token);
        useAuthStore.getState().setAuth(true);
      }
    }
  }

  static async handleCallback(code: string) {
    const tokens = await login(code, this.redirectUri);
    await setGenericPassword('access_token', tokens.access_token);
    await setGenericPassword('refresh_token', tokens.refresh_token);
    useAuthStore.getState().setAuth(true);
  }

  static async refreshTokenAsync() {
    const { username, password } = await getGenericPassword();
    if (password) {
      const tokens = await refreshToken(password);
      await setGenericPassword('access_token', tokens.access_token);
      await setGenericPassword('refresh_token', tokens.refresh_token);
    }
  }

  static async logout() {
    await resetGenericPassword();
    useAuthStore.getState().setAuth(false);
    await logout();
  }

  static async biometricLogin() {
    const { isSensorAvailable, BiometryType } = require('react-native-biometrics');
    const available = await isSensorAvailable();
    if (available) {
      const result = await require('react-native-biometrics').simplePrompt({
        promptMessage: 'Authenticate to access the app',
      });
      if (result.success) {
        useAuthStore.getState().setAuth(true);
      }
    }
  }

  static async checkBiometricAvailability() {
    const { isSensorAvailable, BiometryType } = require('react-native-biometrics');
    const available = await isSensorAvailable();
    if (available) {
      return BiometryType;
    }
    return null;
  }
}

export default AuthService;
```

---

### shared/services/SessionManager.ts

```typescript
import { AppState } from 'react-native';
import { useSessionStore } from '../../store/sessionStore';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/authApi';

class SessionManager {
  private backgroundedAt: number | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: string) => {
    const now = Date.now();
    if (nextAppState === 'background') {
      this.backgroundedAt = now;
    } else if (nextAppState === 'active') {
      this.checkIdleTimeout();
    }
  };

  private checkIdleTimeout = () => {
    if (this.backgroundedAt) {
      const diff = Date.now() - this.backgroundedAt;
      if (diff > 15 * 60 * 1000) {
        this.logout();
      } else {
        this.resetTimer();
      }
    }
  };

  private resetTimer = () => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.logout();
    }, 10 * 60 * 1000); // 10 minutes
  };

  private logout = async () => {
    await logout();
    useAuthStore.getState().setAuth(false);
    useSessionStore.getState().setLastActive(null);
  };

  static instance = new SessionManager();
}

export default SessionManager;
```

---

### shared/hooks/useSession.ts

```typescript
import { useEffect } from 'react';
import SessionManager from '../services/SessionManager';

export const useSession = () => {
  useEffect(() => {
    const sessionManager = SessionManager.instance;
    return () => {
      if (sessionManager.timer) clearTimeout(sessionManager.timer);
    };
  }, []);

  const resetTimer = () => {
    SessionManager.instance.resetTimer();
  };

  return { resetTimer };
};
```