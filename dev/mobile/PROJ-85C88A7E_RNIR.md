# React Native Implementation Report (RNIR)
# VA Ambulance Trip Analysis App
# Generated: 2026-02-22T04:19:28.997256

---

# PART 1: Auth & Dashboard (Screens 1-5)

```typescript
// features/auth/screens/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StatusBar } from 'react-native';
import { NavigationService } from 'navigation/NavigationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from 'services/AuthService';
import { VA_LOGO } from 'assets/images';

const SplashScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const isExpired = AuthService.isTokenExpired(token);
          if (!isExpired) {
            NavigationService.navigate('Main');
            return;
          }
          const refreshedToken = await AuthService.silentRefresh();
          if (refreshedToken) {
            NavigationService.navigate('Main');
            return;
          }
        }
      } catch (error) {
        console.error('Token check error:', error);
      }
      NavigationService.navigate('Auth');
    };

    const timer = setTimeout(() => {
      checkToken();
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#003366',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <StatusBar barStyle="light-content" />
      <Animated.Image
        source={VA_LOGO}
        style={{
          width: 120,
          height: 120,
          opacity: fadeAnim,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

export default SplashScreen;
```
```typescript
// features/auth/screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { VAButton } from 'components/VAButton';
import { ErrorBanner } from 'components/ErrorBanner';
import { AuthService } from 'services/AuthService';
import { NavigationService } from 'navigation/NavigationService';
import { useBiometricAvailability } from 'hooks/useBiometricAvailability';
import { VA_LOGO } from 'assets/images';

const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { checkBiometricAvailability } = useBiometricAvailability();

  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkBiometricAvailability();
      setBiometricAvailable(available);
    };
    checkAvailability();
  }, [checkBiometricAvailability]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.login();
      NavigationService.navigate('Main');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.biometricLogin();
    } catch (err) {
      setError('Biometric authentication failed.');
      console.error('Biometric login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ marginBottom: 20 }}>
              <VA_LOGO width={100} height={100} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
              VA Ambulance Trip Analysis
            </Text>
            <Text style={{ fontSize: 16, color: '#666666' }}>
              Secure access to trip data
            </Text>
          </View>

          <VAButton
            title="Sign in with VA Credentials"
            onPress={handleLogin}
            disabled={isLoading}
            variant="primary"
          />

          {isLoading && (
            <View style={{ marginTop: 10 }}>
              <ActivityIndicator size="large" color="#003366" />
            </View>
          )}

          {error && <ErrorBanner message={error} />}

          {biometricAvailable && (
            <TouchableOpacity
              onPress={handleBiometricLogin}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: '#003366', textAlign: 'center' }}>
                Use Face ID / Fingerprint
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
```
```typescript
// features/auth/screens/BiometricPromptScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { NavigationService } from 'navigation/NavigationService';
import { AuthService } from 'services/AuthService';
import { VAButton } from 'components/VAButton';

const BiometricPromptScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.biometricLogin();
      NavigationService.goBack();
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Biometric login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    NavigationService.goBack();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={styles.lockIcon}>
              <Text style={{ fontSize: 48, color: '#003366' }}>🔒</Text>
            </View>
            <Text style={styles.modalTitle}>Authentication Required</Text>
            <Text style={styles.modalSubtitle}>
              Please authenticate to access protected health information
            </Text>
          </View>

          {error && (
            <View style={{ marginBottom: 15 }}>
              <Text style={{ color: '#d32f2f', textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          )}

          <VAButton
            title="Authenticate"
            onPress={handleBiometricLogin}
            disabled={isLoading}
            variant="primary"
          />

          <TouchableOpacity
            style={{ marginTop: 10 }}
            onPress={handleCancel}
          >
            <Text style={{ color: '#003366', textAlign: 'center' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 20,
  },
});

export default BiometricPromptScreen;
```
```typescript
// features/dashboard/screens/DashboardScreen.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useKPISummary } from 'hooks/useKPISummary';
import { KPICard } from 'components/KPICard';
import { LineChart } from 'react-native-chart-kit';
import { queryClient } from 'services/QueryClient';
import { useDashboardStore } from 'stores/DashboardStore';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingSkeleton } from 'components/LoadingSkeleton';
import { ErrorBanner } from 'components/ErrorBanner';

const DashboardScreen: React.FC = () => {
  const { filters } = useDashboardStore();
  const {
    data: kpiData,
    isLoading,
    isError,
    error,
    refetch,
  } = useKPISummary(filters);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries(['kpiSummary', filters]);
    }, [filters])
  );

  const onRefresh = () => {
    refetch();
  };

  const handleFilterPress = () => {
    NavigationService.navigate('FilterModal');
  };

  const handleViewTripList = () => {
    NavigationService.navigate('TripList');
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#003366',
    },
  };

  if (isLoading) {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        <LoadingSkeleton count={3} />
      </ScrollView>
    );
  }

  if (isError) {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        <ErrorBanner message={error?.message || 'An error occurred'} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={handleFilterPress}>
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kpiContainer}>
        <KPICard
          title="Total Trips"
          value={kpiData?.totalTrips || 0}
          change={kpiData?.totalTripsChange || 0}
        />
        <KPICard
          title="Avg. Response Time"
          value={kpiData?.avgResponseTime || 0}
          change={kpiData?.avgResponseTimeChange || 0}
        />
        <KPICard
          title="On-Time Rate"
          value={kpiData?.onTimeRate || 0}
          change={kpiData?.onTimeRateChange || 0}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Trip Volume Trend</Text>
        <LineChart
          data={chartData}
          width={320}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleViewTripList}>
          <Text style={styles.buttonText}>View All Trips</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterText: {
    color: '#003366',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  buttonContainer: {
  },
  buttonText: {
    color: '#003366',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
```
```typescript
// features/dashboard/screens/TripListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
import { TripItem } from 'components/TripItem';
import { useTripList } from 'hooks/useTripList';
import { LoadingSkeleton } from 'components/LoadingSkeleton';
import { ErrorBanner } from 'components/ErrorBanner';
import { useDashboardStore } from 'stores/DashboardStore';
import { queryClient } from 'services/QueryClient';
import { useFocusEffect } from '@react-navigation/native';

const TripListScreen: React.FC = () => {
  const { filters } = useDashboardStore();
  const {
    data: trips,
    isLoading,
    isError,
    error,
    refetch,
  } = useTripList(filters);

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries(['tripList', filters]);
    }, [filters])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderTrip = ({ item }: { item: any }) => (
    <TripItem trip={item} />
  );

  const renderSkeletons = () => {
    const skeletons = [];
    for (let i = 0; i < 5; i++) {
      skeletons.push(<LoadingSkeleton key={i} />);
    }
    return skeletons;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderSkeletons()}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <ErrorBanner message={error?.message || 'An error occurred'} />
      </View>
    );
  }

  return (
    <FlatList
      data={trips}
      renderItem={renderTrip}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default TripListScreen;
```
```typescript
// components/KPICard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface KPICardProps {
  title: string;
  value: number;
  change: number;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, change }) => {
  const isPositive = change >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.changeContainer}>
        <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
          {isPositive ? '+' : ''}{change}%
        </Text>
        <Text style={styles.changeLabel}>from last month</Text>
      </View>
    </View>
  );
};

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    width: '30%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  changeContainer: {
    flexDirection: 'row',
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  positive: {
    color: '#4caf50',
  },
  negative: {
    color: '#f44336',
  },
  changeLabel: {
    fontSize: 10,
    color: '#999999',
    marginLeft: 5,
  },
});
```
```typescript
// components/TripItem.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TripItemProps {
  trip: {
    id: string;
    patientName: string;
    date: string;
    status: string;
    duration: string;
  };
}

export const TripItem: React.FC<TripItemProps> = ({ trip }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.patientName}>{trip.patientName}</Text>
        <Text style={styles.status}>{trip.status}</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.date}>{trip.date}</Text>
        <Text style={styles.duration}>{trip.duration}</Text>
      </View>
    </View>
  );
};

  container: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {


---
[OUTPUT TRUNCATED: Repetition detected (11 repeated blocks removed)]
---

---

# PART 2: Trips, Settings & App Root (Screens 6-10)

{
  "sections": {
    "6": "## 6. TRIP LIST SCREEN (features/trips/screens/TripListScreen.tsx)\n\n```typescript\nimport React, { useCallback, useEffect, useMemo } from 'react';\nimport { FlatList, View, Text, StyleSheet, Pressable } from 'react-native';\nimport { useInfiniteQuery } from '@tanstack/react-query';\nimport { useNavigation } from '@react-navigation/native';\nimport { useAuthStore } from '@/stores/AuthStore';\nimport { useTripFilters } from '@/features/trips/hooks/useTripFilters';\nimport { TripRow } from '@/features/trips/components/TripRow';\nimport { EmptyState } from '@/components/EmptyState';\nimport { ErrorBanner } from '@/components/ErrorBanner';\nimport { LoadingSkeleton } from '@/components/LoadingSkeleton';\nimport { Trip } from '@/features/trips/types';\nimport { getTrips } from '@/features/trips/api/tripApi';\n\nconst TripListScreen = () => {\n  const navigation = useNavigation();\n  const { filters, clearFilters } = useTripFilters();\n  const { isAuthenticated, biometricAuthRequired } = useAuthStore();\n\n  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isLoading, isError, error } = useInfiniteQuery({\n    queryKey: ['trips', filters],\n    queryFn: ({ pageParam = 1 }) => getTrips(pageParam, filters),\n    getNextPageParam: (lastPage) => {\n      if (lastPage.current_page < lastPage.total_pages) {\n        return lastPage.current_page + 1;\n      }\n      return undefined;\n    },\n    staleTime: 0,\n    enabled: isAuthenticated,\n  });\n\n  const flatListData = useMemo(() => {\n    return data?.pages.flatMap(page => page.data) || [];\n  }, [data]);\n\n  const handleTripPress = useCallback(async (trip: Trip) => {\n    if (biometricAuthRequired) {\n      const authSuccess = await useAuthStore.getState().authenticateBiometric();\n      if (!authSuccess) return;\n    }\n    navigation.navigate('TripDetail', { tripId: trip.id });\n  }, [biometricAuthRequired, navigation]);\n\n  const renderTripRow = useCallback(({ item }: { item: Trip }) => (\n    <TripRow trip={item} onPress={() => handleTripPress(item)} />\n  ), [handleTripPress]);\n\n  const handleEndReached = useCallback(() => {\n    if (hasNextPage && !isFetchingNextPage) {\n      fetchNextPage();\n    }\n  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);\n\n  const renderFooter = useCallback(() => {\n    if (isFetchingNextPage) {\n      return <LoadingSkeleton count={3} />;\n    }\n    return null;\n  }, [isFetchingNextPage]);\n\n  const handleRefresh = useCallback(() => {\n    refetch();\n  }, [refetch]);\n\n  const renderContent = useCallback(() => {\n    if (isLoading) {\n      return <LoadingSkeleton count={5} />;\n    }\n\n    if (isError) {\n      return (\n        <ErrorBanner\n          message={error.message}\n          onRetry={handleRefresh}\n        />\n      );\n    }\n\n    if (flatListData.length === 0) {\n      return (\n        <EmptyState\n          title=\"No trips found\"\n          description=\"Try adjusting your filters\"\n          onReset={clearFilters}\n        />\n      );\n    }\n\n    return (\n      <FlatList\n        data={flatListData}\n        renderItem={renderTripRow}\n        keyExtractor={(item) => item.id.toString()}\n        onEndReached={handleEndReached}\n        onEndReachedThreshold={0.5}\n        refreshing={isLoading}\n        onRefresh={handleRefresh}\n        ListFooterComponent={renderFooter}\n      />\n    );\n  }, [isLoading, isError, error, flatListData, clearFilters, renderTripRow, handleEndReached, renderFooter, handleRefresh]);\n\n  return (\n    <View style={styles.container}>\n      <View style={styles.header}>\n        <Text style={styles.title}>Trip List</Text>\n        <View style={styles.filterRow}>\n          {filters.region && (\n            <Text style={styles.filterChip}>Region: {filters.region}</Text>\n          )}\n          {filters.type && (\n            <Text style={styles.filterChip}>Type: {filters.type}</Text>\n          )}\n        </View>\n      </View>\n      {renderContent()}\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#fff',\n  },\n  header: {\n    padding: 16,\n    borderBottomWidth: 1,\n    borderBottomColor: '#e0e0e0',\n  },\n  title: {\n    fontSize: 24,\n    fontWeight: 'bold',\n    marginBottom: 8,\n  },\n  filterRow: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n  },\n  filterChip: {\n    backgroundColor: '#e0e0e0',\n    paddingVertical: 4,\n    paddingHorizontal: 8,\n    borderRadius: 4,\n    marginRight: 8,\n    marginBottom: 4,\n  },\n});\n\nexport default TripListScreen;\n```",
    "7": "## 7. TRIP DETAIL SCREEN (features/trips/screens/TripDetailScreen.tsx)\n\n```typescript\nimport React, { useEffect } from 'react';\nimport { ScrollView, View, Text, StyleSheet } from 'react-native';\nimport { useScreenCapturePrevention } from 'expo-screen-capture';\nimport { useQuery } from '@tanstack/react-query';\nimport { useNavigation } from '@react-navigation/native';\nimport { TripDetail } from '@/features/trips/types';\nimport { getTripDetail } from '@/features/trips/api/tripApi';\nimport { PHIMaskedField } from '@/components/PHIMaskedField';\nimport { LoadingSkeleton } from '@/components/LoadingSkeleton';\nimport { ErrorBanner } from '@/components/ErrorBanner';\nimport { Header } from '@/components/Header';\n\nconst TripDetailScreen = ({ route }: any) => {\n  const { tripId } = route.params;\n  const navigation = useNavigation();\n  useScreenCapturePrevention();\n\n  const { data, isLoading, isError, error, refetch } = useQuery({\n    queryKey: ['tripDetail', tripId],\n    queryFn: () => getTripDetail(trtripId),\n    staleTime: 0,\n  });\n\n  useEffect(() => {\n    if (isError) {\n      console.error('Failed to fetch trip detail:', error);\n    }\n  }, [isError, error]);\n\n  const renderContent = () => {\n    if (isLoading) {\n      return <LoadingSkeleton count={8} />;\n    }\n\n    if (isError) {\n      return (\n        <ErrorBanner\n          message={error.message}\n          onRetry={refetch}\n        />\n      );\n    }\n\n    const { trip } = data;\n\n    return (\n      <ScrollView style={styles.container}>\n        <Header\n          title=\"Trip Detail\"\n          onBackPress={() => navigation.goBack()}\n        />\n        <View style={styles.content}>\n          <Text style={styles.fieldLabel}>Date</Text>\n          <Text style={styles.fieldValue}>{trip.date}</Text>\n\n          <Text style={styles.fieldLabel}>Provider</Text>\n          <Text style={styles.fieldValue}>{trip.provider}</Text>\n\n          <Text style={styles.fieldLabel}>Distance</Text>\n          <Text style={styles.fieldValue}>{trip.distance} miles</Text>\n\n          <Text style={styles.fieldLabel}>Trip Type</Text>\n          <Text style={styles.fieldValue}>{trip.type}</Text>\n\n          <Text style={styles.fieldLabel}>Region</Text>\n          <Text style={styles.fieldValue}>{trip.region}</Text>\n\n          <Text style={styles.fieldLabel}>Patient ID</Text>\n          <PHIMaskedField fieldName=\"patient_id\" value={trip.patient_id} />\n\n          <Text style={styles.fieldLabel}>Trip Cost</Text>\n          <PHIMaskedField fieldName=\"trip_cost\" value={trip.trip_cost} />\n        </View>\n      </ScrollView>\n    );\n  };\n\n  return renderContent();\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#fff',\n  },\n  content: {\n    padding: 16,\n  },\n  fieldLabel: {\n    fontSize: 16,\n    fontWeight: 'bold',\n    marginTop: 16,\n    marginBottom: 4,\n  },\n  fieldValue: {\n    fontSize: 16,\n    marginBottom: 16,\n  },\n});\n\nexport default TripDetailScreen;\n```",
    "8": "## 8. SETTINGS SCREEN (features/settings/screens/SettingsScreen.tsx)\n\n```typescript\nimport React, { useCallback } from 'react';\nimport { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';\nimport { useNavigation } from '@react-navigation/native';\nimport { useAuthStore } from '@/stores/AuthStore';\nimport { CacheService } from '@/services/CacheService';\nimport { AuthService } from '@/services/AuthService';\nimport { Constants } from 'expo-constants';\nimport * as Linking from 'expo-linking';\n\nconst SettingsScreen = () => {\n  const navigation = useNavigation();\n  const { user, setBiometricAuthRequired } = useAuthStore();\n\n  const handleBiometricToggle = useCallback(async () => {\n    const newStatus = !useAuthStore.getState().biometricAuthRequired;\n    setBiometricAuthRequired(newStatus);\n    try {\n      await CacheService.set('biometricAuthRequired', newStatus);\n    } catch (err) {\n      console.error('Failed to save biometric preference:', err);\n    }\n  }, []);\n\n  const handleLogout = useCallback(() => {\n    Alert.alert(\n      'Confirm Logout',\n      'Are you sure you want to log out?',\n      [\n        { text: 'Cancel', style: 'cancel' },\n        {\n          text: 'Logout',\n          style: 'destructive',\n          onPress: () => {\n            AuthService.logout();\n            navigation.reset({\n              index: 0,\n              routes: [{ name: 'Login' }],\n            });\n          },\n        },\n      ]\n    );\n  }, [navigation]);\n\n  const handlePrivacyPolicyPress = useCallback(async () => {\n    const url = 'https://yourcompany.com/privacy-policy';\n    if (await Linking.canOpenURL(url)) {\n      await Linking.openURL(url);\n    }\n  }, []);\n\n  const handleTermsPress = useCallback(async () => {\n    const url = 'https://yourcompany.com/terms';\n    if (await Linking.canOpenURL(url)) {\n      await Linking.openURL(url);\n    }\n  }, []);\n\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Settings</Text>\n\n      <View style={styles.section}>\n        <Text style={styles.sectionTitle}>Account</Text>\n        <View style={styles.row}>\n          <Text style={styles.rowLabel}>User</Text>\n          <Text style={styles.rowValue}>{user?.name || 'N/A'}</Text>\n        </View>\n        <View style={styles.row}>\n          <Text style={styles.rowLabel}>Email</Text>\n          <Text style={styles.rowValue}>{user?.email || 'N/A'}</Text>\n        </View>\n      </View>\n\n      <View style={styles.section}>\n        <Text style={styles.sectionTitle}>Security</Text>\n        <TouchableOpacity\n          style={styles.row}\n          onPress={handleBiometricToggle}\n          accessibilityLabel=\"Toggle biometric authentication\"\n        >\n          <Text style={styles.rowLabel}>Biometric Authentication</Text>\n          <Text style={styles.rowValue}>\n            {useAuthStore.getState().biometricAuthRequired ? 'Enabled' : 'Disabled'}\n          </Text>\n        </TouchableOpacity>\n      </View>\n\n      <View style={styles.section}>\n        <Text style={styles.sectionTitle}>Legal</Text>\n        <TouchableOpacity\n          style={styles.row}\n          onPress={handlePrivacyPolicyPress}\n          accessibilityLabel=\"Privacy policy\"\n        >\n          <Text style={styles.rowLabel}>Privacy Policy</Text>\n        </TouchableOpacity>\n        <TouchableOpacity\n          style={styles.row}\n          onPress={handleTermsPress}\n          accessibilityLabel=\"Terms of service\"\n        >\n          <Text style={styles.rowLabel}>Terms of Service</Text>\n        </TouchableOpacity>\n      </View>\n\n      <TouchableOpacity\n        style={styles.logoutButton}\n        onPress={handleLogout}\n        accessibilityLabel=\"Logout\"\n      >\n        <Text style={styles.logoutButtonText}>Logout</Text>\n      </TouchableOpacity>\n\n      <Text style={styles.version}>Version {Constants.manifest?.version}</Text>\n    </View>\n  );\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#fff',\n    padding: 16,\n  },\n  title: {\n    fontSize: 24,\n    fontWeight: 'bold',\n    marginBottom: 24,\n  },\n  section: {\n    marginBottom: 24,\n  },\n  sectionTitle: {\n    fontSize: 18,\n    fontWeight: 'bold',\n    marginBottom: 12,\n  },\n  row: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    paddingVertical: 12,\n    borderBottomWidth: 1,\n    borderBottomColor: '#e0e0e0',\n  },\n  rowLabel: {\n    fontSize: 16,\n    fontWeight: '500',\n  },\n  rowValue: {\n    fontSize: 16,\n    color: '#666',\n  },\n  logoutButton: {\n    backgroundColor: '#ff4d4d',\n    paddingVertical: 12,\n    borderRadius: 8,\n    alignItems: 'center',\n    marginTop: 24,\n  },\n  logoutButtonText: {\n    color: '#fff',\n    fontSize: 16,\n    fontWeight: 'bold',\n  },\n  version: {\n    textAlign: 'center',\n    marginTop: 24,\n    color: '#999',\n  },\n});\n\nexport default SettingsScreen;\n```",
    "9": "## 9. TRIP DETAIL SCREEN (features/trips/screens/TripDetailScreen.tsx)\n\n```typescript\nimport React, { useEffect } from 'react';\nimport { ScrollView, View, Text, StyleSheet } from 'react-native';\nimport { useScreenCapturePrevention } from 'expo-screen-capture';\nimport { useQuery } from '@tanstack/react-query';\nimport { useNavigation } from '@react-navigation/native';\nimport { TripDetail } from '@/features/trips/types';\nimport { getTripDetail } from '@/features/trips/api/tripApi';\nimport { PHIMaskedField } from '@/components/PHIMaskedField';\nimport { LoadingSkeleton } from '@/components/LoadingSkeleton';\nimport { ErrorBanner } from '@/components/ErrorBanner';\nimport { Header } from '@/components/Header';\n\nconst TripDetailScreen = ({ route }: any) => {\n  const { tripId } = route.params;\n  const navigation = useNavigation();\n  useScreenCapturePrevention();\n\n  const { data, isLoading, isError, error, refetch } = useQuery({\n    queryKey: ['tripDetail', tripId],\n    queryFn: () => getTripDetail(tripId),\n    staleTime: 0,\n  });\n\n  useEffect(() => {\n    if (isError) {\n      console.error('Failed to fetch trip detail:', error);\n    }\n  }, [isError, error]);\n\n  const renderContent = () => {\n    if (isLoading) {\n      return <LoadingSkeleton count={8} />;\n    }\n\n    if (isError) {\n      return (\n        <ErrorBanner\n          message={error.message}\n          onRetry={refetch}\n        />\n      );\n    }\n\n    const { trip } = data;\n\n    return (\n      <ScrollView style={styles.container}>\n        <Header\n          title=\"Trip Detail\"\n          onBackPress={() => navigation.goBack()}\n        />\n        <View style={styles.content}>\n          <Text style={styles.fieldLabel}>Date</Text>\n          <Text style={styles.fieldValue}>{trip.date}</Text>\n\n          <Text style={styles.fieldLabel}>Provider</Text>\n          <Text style={styles.fieldValue}>{trip.provider}</Text>\n\n          <Text style={styles.fieldLabel}>Distance</Text>\n          <Text style={styles.fieldValue}>{trip.distance} miles</Text>\n\n          <Text style={styles.fieldLabel}>Trip Type</Text>\n          <Text style={styles.fieldValue}>{trip.type}</Text>\n\n          <Text style={styles.fieldLabel}>Region</Text>\n          <Text style={styles.fieldValue}>{trip.region}</Text>\n\n          <Text style={styles.fieldLabel}>Patient ID</Text>\n          <PHIMaskedField fieldName=\"patient_id\" value={trip.patient_id} />\n\n          <Text style={styles.fieldLabel}>Trip Cost</Text>\n          <PHIMaskedField fieldName=\"trip_cost\" value={trip.trip_cost} />\n        </View>\n      </ScrollView>\n    );\n  };\n\n  return renderContent();\n};\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#fff',\n  },\n  content: {\n    padding: 16,\n  },\n  fieldLabel: {\n    fontSize: 16,\n    fontWeight: 'bold',\n    marginTop: 16,\n    marginBottom: 4,\n  },\n  fieldValue: {\n    fontSize: 16,\n    marginBottom: 16,\n  },\n});\n\nexport default TripDetailScreen;\n```"
  }
}
```
