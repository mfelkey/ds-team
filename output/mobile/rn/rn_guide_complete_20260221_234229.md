## 1. Project Setup & Configuration

To begin building a production-grade React Native app with Expo and TypeScript, we'll start by initializing the project with the TypeScript template and configuring essential tools like ESLint, Prettier, and path aliases.

### Initialize the Project

```bash
npx create-expo-app --template blank@latest my-travel-app
cd my-travel-app
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import eslint-plugin-unused-imports prettier
```

### Configure TypeScript

Create `tsconfig.json` at the root of your project:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "app.json", "babel.config.js"],
  "exclude": ["node_modules"]
}
```

### Directory Structure

We'll organize our app using the following structure:

```
src/
├── components/
├── hooks/
├── screens/
├── services/
├── store/
├── types/
├── utils/
├── theme.ts
└── App.tsx
```

### ESLint + Prettier Configuration

Create `.eslintrc.js`:

```js
module.exports = {
  root: true,
  extends: ['@react-native-community', 'plugin:import/recommended'],
  plugins: ['import', 'unused-imports'],
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
};
```

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Path Aliases with babel-plugin-module-resolver

Install the plugin:

```bash
npm install --save-dev babel-plugin-module-resolver
```

Update `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
```

### Environment Variables with expo-constants

Install `expo-constants`:

```bash
npx expo install expo-constants
```

Create `src/utils/env.ts`:

```ts
// src/utils/env.ts
import Constants from 'expo-constants';

const { manifest } = Constants;

const API_BASE_URL = manifest?.extra?.apiBaseUrl || 'https://api.example.com';

export const ENV = {
  API_BASE_URL,
};
```

## 2. Navigation Architecture

We'll implement a type-safe navigation architecture using React Navigation v6 with native stack, bottom tabs, and nested navigators.

### Install Dependencies

```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
```

### Define RootStackParamList

Create `src/types/navigation.ts`:

```ts
// src/types/navigation.ts
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  TripDetails: { id: string };
  CreateTrip: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Trips: undefined;
  Profile: undefined;
};
```

### Setup Navigation

Create `src/navigation/AppNavigator.tsx`:

```tsx
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { HomeScreen, TripsScreen, ProfileScreen } from '@screens';
import { LoginScreen, RegisterScreen } from '@screens/auth';
import { TripDetailsScreen, CreateTripScreen } from '@screens/trips';
import { AuthScreen } from '@screens/auth/AuthScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};

const TripsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Trips" component={TripsScreen} />
      <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme === 'dark' ? '#fff' : '#000',
        tabBarInactiveTintColor: theme === 'dark' ? '#aaa' : '#ccc',
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Trips" component={TripsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### Auth Flow

Create `src/screens/auth/AuthScreen.tsx`:

```tsx
// src/screens/auth/AuthScreen.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';

export const AuthScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Auth Screen</Text>
      <Button title="Login" onPress={() => {}} />
      <Button title="Register" onPress={() => {}} />
    </View>
  );
};
```

## 3. State Management

We'll use Zustand for state management with persistence and selectors.

### Install Zustand

```bash
npm install zustand zustand/middleware
```

### Create Stores

Create `src/store/authStore.ts`:

```ts
// src/store/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = {
  token: string | null;
  user: any | null;
  loading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (token: string, user: any) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  token: null,
  user: null,
  loading: false,
  error: null,
  login: (token, user) => set({ token, user, error: null }),
  logout: () => set({ token: null, user: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

Create `src/store/tripStore.ts`:

```ts
// src/store/tripStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist } from 'zustand/middleware';

type Trip = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
};

type TripState = {
  trips: Trip[];
  loading: boolean;
  error: string | null;
};

type TripActions = {
  fetchTrips: () => Promise<void>;
  addTrip: (trip: Trip) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useTripStore = create<TripState & TripActions>(
  persist(
    (set) => ({
      trips: [],
      loading: false,
      error: null,
      fetchTrips: async () => {
        set({ loading: true });
        try {
          // Simulate API call
          const data = await AsyncStorage.getItem('trips');
          if (data) {
            set({ trips: JSON.parse(data) });
          }
        } catch (err) {
          set({ error: 'Failed to fetch trips' });
        } finally {
          set({ loading: false });
        }
      },
      addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'trip-storage',
      partialize: (state) => ({ trips: state.trips }),
    }
  )
);
```

Create `src/store/settingsStore.ts`:

```ts
// src/store/settingsStore.ts
import { create } from 'zustand';

type SettingsState = {
  darkMode: boolean;
  language: string;
};

type SettingsActions = {
  toggleDarkMode: () => void;
  setLanguage: (lang: string) => void;
};

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  darkMode: false,
  language: 'en',
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setLanguage: (lang) => set({ language: lang }),
}));
```

## 4. API Layer

We'll set up Axios with interceptors, type-safe API clients, and React Query for caching.

### Install Dependencies

```bash
npm install axios react-query
```

### Axios Instance

Create `src/services/api.ts`:

```ts
// src/services/api.ts
import axios from 'axios';
import { ENV } from '@utils/env';
import { useAuthStore } from '@store/authStore';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Refresh token logic here
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Type-Safe API Clients

Create `src/services/trips.ts`:

```ts
// src/services/trips.ts
import api from './api';

export type Trip = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
};

export const fetchTrips = async (): Promise<Trip[]> => {
  const response = await api.get('/trips');
  return response.data;
};

export const createTrip = async (trip: Omit<Trip, 'id'>): Promise<Trip> => {
  const response = await api.post('/trips', trip);
  return response.data;
};

export const getTripById = async (id: string): Promise<Trip> => {
  const response = await api.get(`/trips/${id}`);
  return response.data;
};
```

### React Query Setup

Create `src/utils/queryClient.ts`:

```ts
// src/utils/queryClient.ts
import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
```

### Custom Hooks

Create `src/hooks/useTrips.ts`:

```ts
// src/hooks/useTrips.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchTrips, createTrip, Trip } from '@services/trips';

export const useTrips = () => {
  return useQuery<Trip[], Error>('trips', fetchTrips);
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation<Trip, Error, Omit<Trip, 'id'>>((trip) => createTrip(trip), {
    onSuccess: () => {
      queryClient.invalidateQueries('trips');
    },
  });
};
```

## 5. Shared UI Components

We'll create reusable components with TypeScript props and accessibility support.

### Theme File

Create `src/theme.ts`:

```ts
// src/theme.ts
import { StyleSheet } from 'react-native';

export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#34C759',
    background: '#FFFFFF',
    text: '#000000',
    border: '#E5E5EA',
    error: '#FF3B30',
    success: '#34C759',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
  },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
```

### Button Component

Create `src/components/Button.tsx`:

```tsx
// src/components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '@theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  const backgroundColor = variant === 'primary' ? theme.colors.primary : theme.colors.secondary;
  const textColor = variant === 'primary' ? theme.colors.background : theme.colors.text;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={title}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

### Card Component

Create `src/components/Card.tsx`:

```tsx
// src/components/Card.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, styles } from '@theme';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <View style={[styles.card, styles.container]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
});
```

These components provide a solid foundation for a React Native application with proper state management, API integration, and reusable UI elements. They're designed to be extensible and maintainable.

---

## 6. Screen Implementations

### HomeScreen

```tsx
// src/screens/HomeScreen.tsx
import React, { useCallback, useState } from 'react';
import { FlatList, View, RefreshControl, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTrips } from '@hooks/useTrips';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { theme } from '@theme';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: trips, isLoading, isError, refetch, isRefetching } = useTrips();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderTrip = ({ item }: { item: any }) => (
    <Card title={item.title}>
      <Text>{item.description}</Text>
      <Button
        title="View Details"
        onPress={() => navigation.navigate('TripDetail', { id: item.id })}
      />
    </Card>
  );

  if (isLoading || isRefetching) {
    return <Text>Loading trips...</Text>;
  }

  if (isError) {
    return <Text>Error loading trips</Text>;
  }

  return (
    <View style={theme.styles.container}>
      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          // Implement infinite scroll logic if needed
        }}
      />
      <Button
        title="Create New Trip"
        onPress={() => navigation.navigate('CreateTrip')}
      />
    </View>
  );
};
```

### TripDetailScreen

```tsx
// src/screens/TripDetailScreen.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery } from 'react-query';
import { getTripById, Trip } from '@services/trips';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { theme } from '@theme';

export const TripDetailScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };

  const { data: trip, isLoading, isError } = useQuery<Trip, Error>(
    ['trip', id],
    () => getTripById(id)
  );

  if (isLoading) {
    return <Text>Loading trip details...</Text>;
  }

  if (isError || !trip) {
    return <Text>Error loading trip</Text>;
  }

  return (
    <View style={theme.styles.container}>
      <Card title={trip.title}>
        <Text>{trip.description}</Text>
        <Text>Start Date: {trip.startDate}</Text>
        <Text>End Date: {trip.endDate}</Text>
        <Button title="Edit Trip" onPress={() => {}} />
      </Card>
    </View>
  );
};
```

### CreateTripScreen

```tsx
// src/screens/CreateTripScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Button } from '@components/Button';
import { theme } from '@theme';

export const CreateTripScreen: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = () => {
    // Submit logic here
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text>Step 1: Trip Details</Text>
            {/* Form fields for title, description */}
            <Button title="Next" onPress={nextStep} />
          </View>
        );
      case 2:
        return (
          <View>
            <Text>Step 2: Date Range</Text>
            {/* Date picker fields */}
            <Button title="Next" onPress={nextStep} />
            <Button title="Back" onPress={prevStep} />
          </View>
        );
      case 3:
        return (
          <View>
            <Text>Step 3: Review</Text>
            <Button title="Submit" onPress={handleSubmit} />
            <Button title="Back" onPress={prevStep} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={theme.styles.container}>
      {renderStep()}
    </ScrollView>
  );
};
```

### ProfileScreen

```tsx
// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { theme } from '@theme';

export const ProfileScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    // Logout logic
  };

  return (
    <View style={theme.styles.container}>
      <Card title="User Profile">
        <Text>Name: John Doe</Text>
        <Text>Email: john@example.com</Text>
      </Card>

      <Card title="Settings">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Dark Mode</Text>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
          />
        </View>
      </Card>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};
```

### SearchScreen

```tsx
// src/screens/SearchScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text } from 'react-native';
import { Card } from '@components/Card';
import { theme } from '@theme';

export const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [filterChips, setFilterChips] = useState(['All', 'Upcoming', 'Past']);

  useEffect(() => {
    // Simulate search logic
    const results = [];
    setFilteredTrips(results);
  }, [searchQuery]);

  const renderTrip = ({ item }: { item: any }) => (
    <Card title={item.title}>
      <Text>{item.description}</Text>
    </Card>
  );

  return (
    <View style={theme.styles.container}>
      <TextInput
        placeholder="Search trips..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: theme.spacing.md,
          margin: theme.spacing.md,
        }}
      />

      <FlatList
        data={filteredTrips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

## 7. Forms & Validation

### FormField Component

```tsx
// src/components/FormField.tsx
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { theme } from '@theme';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  placeholder?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  placeholder,
}) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        accessibilityLabel={label}
        accessibilityInvalid={!!error}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
});
```

### Zod Schemas

```ts
// src/schemas/authSchema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
```

### LoginScreen with React Hook Form

```tsx
// src/screens/LoginScreen.tsx
import React from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@schemas/authSchema';
import { FormField } from '@components/FormField';
import { Button } from '@components/Button';
import { theme } from '@theme';

export const LoginScreen: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: any) => {
    // Handle login logic
  };

  return (
    <View style={theme.styles.container}>
      <FormField
        label="Email"
        value={control._formValues.email}
        onChangeText={(text) => control._formValues.email = text}
        error={errors.email?.message as string}
        placeholder="Enter your email"
      />
      <FormField
        label="Password"
        value={control._formValues.password}
        onChangeText={(text) => control._formValues.password = text}
        error={errors.password?.message as string}
        secureTextEntry
        placeholder="Enter your password"
      />
      <Button title="Login" onPress={handleSubmit(onSubmit)} />
    </View>
  );
};
```

## 8. Navigation Setup

```ts
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens/HomeScreen';
import { TripDetailScreen } from '@screens/TripDetailScreen';
import { CreateTripScreen } from '@screens/CreateTripScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { LoginScreen } from '@screens/LoginScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TripDetail" component={TripDetailScreen} />
        <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

## 9. Offline Support

```ts
// src/utils/offline.ts
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isConnected;
};

export const handleOfflineRequest = (request: any) => {
  // Store request in local storage
  // Retry when online
};
```

## 10. Error Handling

```ts
// src/utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error:', error.response.status, error.response.data);
    return error.response.data.message;
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network Error:', error.request);
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    console.error('Error:', error.message);
    return 'An unexpected error occurred.';
  }
};
```