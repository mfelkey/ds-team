/**
 * Shared Components
 * VA Design Language: #003366 (primary), #ffffff, #f5f5f5 (background)
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

// ── VA Design Constants ─────────────────────────────────────
export const VA_COLORS = {
  primary: '#003366',
  primaryLight: '#1a4d80',
  white: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1b1b1b',
  textSecondary: '#6b7280',
  border: '#d1d5db',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#f59e0b',
};

// ── VAButton ────────────────────────────────────────────────
export const VAButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  loading = false,
  disabled = false,
  style,
}) => {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        isPrimary && styles.buttonPrimary,
        !isPrimary && !isDanger && styles.buttonSecondary,
        isDanger && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary || isDanger ? VA_COLORS.white : VA_COLORS.primary}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isPrimary && styles.buttonTextPrimary,
            !isPrimary && !isDanger && styles.buttonTextSecondary,
            isDanger && styles.buttonTextDanger,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ── TripListItem ────────────────────────────────────────────
export const TripListItem = ({ trip, onPress }) => {
  const statusColors = {
    completed: VA_COLORS.success,
    in_progress: VA_COLORS.warning,
    scheduled: VA_COLORS.primary,
    cancelled: VA_COLORS.error,
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(trip)}
      style={styles.tripCard}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <Text style={styles.tripId}>Trip #{trip.id}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[trip.status] || VA_COLORS.textSecondary },
          ]}
        >
          <Text style={styles.statusText}>
            {(trip.status || '').replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.tripRoute}>
        <Text style={styles.tripLocation}>{trip.pickupLocation}</Text>
        <Text style={styles.tripArrow}> → </Text>
        <Text style={styles.tripLocation}>{trip.dropoffLocation}</Text>
      </View>

      <View style={styles.tripMeta}>
        <Text style={styles.tripType}>{trip.type || 'BLS'}</Text>
        <Text style={styles.tripDate}>{trip.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── DashboardCard ───────────────────────────────────────────
export const DashboardCard = ({ icon, label, value, sublabel }) => (
  <View style={styles.dashCard}>
    <Text style={styles.dashIcon}>{icon}</Text>
    <Text style={styles.dashValue}>{value}</Text>
    <Text style={styles.dashLabel}>{label}</Text>
    {sublabel && <Text style={styles.dashSublabel}>{sublabel}</Text>}
  </View>
);

// ── ErrorBanner ─────────────────────────────────────────────
export const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.errorDismiss}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Button
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: { backgroundColor: VA_COLORS.primary },
  buttonSecondary: {
    backgroundColor: VA_COLORS.white,
    borderWidth: 1.5,
    borderColor: VA_COLORS.primary,
  },
  buttonDanger: { backgroundColor: VA_COLORS.error },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextPrimary: { color: VA_COLORS.white },
  buttonTextSecondary: { color: VA_COLORS.primary },
  buttonTextDanger: { color: VA_COLORS.white },

  // Trip Card
  tripCard: {
    backgroundColor: VA_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripId: { fontSize: 16, fontWeight: '700', color: VA_COLORS.primary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: VA_COLORS.white, fontSize: 11, fontWeight: '700' },
  tripRoute: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tripLocation: { fontSize: 14, color: VA_COLORS.textPrimary, flex: 1 },
  tripArrow: { fontSize: 14, color: VA_COLORS.textSecondary, marginHorizontal: 4 },
  tripMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  tripType: { fontSize: 13, color: VA_COLORS.textSecondary, fontWeight: '600' },
  tripDate: { fontSize: 13, color: VA_COLORS.textSecondary },

  // Dashboard Card
  dashCard: {
    backgroundColor: VA_COLORS.white,
    borderRadius: 10,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  dashIcon: { fontSize: 28, marginBottom: 6 },
  dashValue: { fontSize: 22, fontWeight: '800', color: VA_COLORS.primary },
  dashLabel: { fontSize: 12, color: VA_COLORS.textSecondary, marginTop: 2 },
  dashSublabel: { fontSize: 11, color: VA_COLORS.textSecondary, marginTop: 2 },

  // Error Banner
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: VA_COLORS.error,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: VA_COLORS.error, fontSize: 14, flex: 1 },
  errorDismiss: { color: VA_COLORS.error, fontSize: 18, paddingLeft: 12 },
});
