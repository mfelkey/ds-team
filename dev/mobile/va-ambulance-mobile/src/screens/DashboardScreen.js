/**
 * DashboardScreen - Trip analytics overview with stat cards
 */
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, SafeAreaView,
} from 'react-native';
import { DashboardCard, ErrorBanner, VA_COLORS } from '../components';
import { useAppStore } from '../store';

const DashboardScreen = ({ navigation }) => {
  const { dashboardStats, dashboardLoading, fetchDashboardStats } = useAppStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const stats = dashboardStats || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={dashboardLoading} onRefresh={fetchDashboardStats} />
        }
      >
        <Text style={styles.heading}>Dashboard</Text>

        <View style={styles.row}>
          <DashboardCard
            icon="🚑"
            label="Total Trips"
            value={stats.totalTrips ?? '—'}
          />
          <DashboardCard
            icon="📏"
            label="Total Miles"
            value={stats.totalMiles ? `${stats.totalMiles.toLocaleString()}` : '—'}
          />
        </View>

        <View style={styles.row}>
          <DashboardCard
            icon="⏱️"
            label="Avg Response"
            value={stats.avgResponseTime ? `${stats.avgResponseTime}m` : '—'}
          />
          <DashboardCard
            icon="💰"
            label="Cost Avoidance"
            value={
              stats.totalCostAvoidance
                ? `$${(stats.totalCostAvoidance / 1000).toFixed(0)}K`
                : '—'
            }
            sublabel="vs contracted"
          />
        </View>

        {/* Quick access to trip list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {(stats.recentTrips || []).slice(0, 5).map((trip) => (
            <View key={trip.id} style={styles.recentItem}>
              <Text style={styles.recentText}>
                Trip #{trip.id} — {trip.pickupLocation} → {trip.dropoffLocation}
              </Text>
              <Text style={styles.recentDate}>{trip.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VA_COLORS.background },
  scroll: { padding: 16 },
  heading: {
    fontSize: 24, fontWeight: '800', color: VA_COLORS.primary, marginBottom: 20,
  },
  row: { flexDirection: 'row', marginBottom: 12 },
  section: {
    backgroundColor: VA_COLORS.white, borderRadius: 10, padding: 16, marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: VA_COLORS.primary, marginBottom: 12,
  },
  recentItem: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: VA_COLORS.border,
  },
  recentText: { fontSize: 14, color: VA_COLORS.textPrimary },
  recentDate: { fontSize: 12, color: VA_COLORS.textSecondary, marginTop: 2 },
});

export default DashboardScreen;
