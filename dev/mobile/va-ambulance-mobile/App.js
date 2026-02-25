/**
 * App.js - Root navigation with auth flow
 * Uses NavigationService ref for programmatic navigation from services
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { navigationRef } from './src/services/NavigationService';
import { VA_COLORS } from './src/components';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TripListScreen from './src/screens/TripListScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import TripFormScreen from './src/screens/TripFormScreen';
import FilterModal from './src/screens/FilterModal';

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: VA_COLORS.primary },
  headerTintColor: VA_COLORS.white,
  headerTitleStyle: { fontWeight: '700' },
  headerBackTitleVisible: false,
};

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={screenOptions}>
        {/* Auth Flow */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Main App */}
        <Stack.Screen
          name="Main"
          component={DashboardScreen}
          options={{ title: 'VA Ambulance' }}
        />
        <Stack.Screen
          name="TripList"
          component={TripListScreen}
          options={{ title: 'Trips' }}
        />
        <Stack.Screen
          name="TripDetail"
          component={TripDetailScreen}
          options={{ title: 'Trip Details' }}
        />
        <Stack.Screen
          name="TripForm"
          component={TripFormScreen}
          options={({ route }) => ({
            title: route.params?.tripId ? 'Edit Trip' : 'New Trip',
          })}
        />
        <Stack.Screen
          name="FilterModal"
          component={FilterModal}
          options={{
            presentation: 'modal',
            title: 'Filters',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
