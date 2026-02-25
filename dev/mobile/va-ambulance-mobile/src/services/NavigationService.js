/**
 * Navigation Service - Centralized navigation reference
 * NEW: Was referenced but not implemented in original output
 *
 * Usage: NavigationService.navigate('TripDetail', { tripId: '123' })
 */
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

const NavigationService = {
  navigate(name, params) {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    }
  },

  goBack() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },

  reset(name) {
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name }],
      });
    }
  },
};

export default NavigationService;
