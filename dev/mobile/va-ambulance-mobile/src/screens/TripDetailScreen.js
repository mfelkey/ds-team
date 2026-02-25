/**
 * TripDetailScreen - Trip details with edit/delete
 */
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { VAButton, ErrorBanner, VA_COLORS } from '../components';
import { useTripStore } from '../store';
import NavigationService from '../services/NavigationService';

const TripDetailScreen = ({ route, navigation }) => {
  const { tripId } = route.params;
  const { selectedTrip, loading, error, fetchTripById, deleteTrip, clearError } =
    useTripStore();

  useEffect(() => {
    fetchTripById(tripId);
  }, [tripId]);

  const handleDelete = () => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTrip(tripId);
          NavigationService.goBack();
        },
      },
    ]);
  };

  if (loading && !selectedTrip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={VA_COLORS.primary} />
      </View>
    );
  }

  const trip = selectedTrip;
  if (!trip) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ErrorBanner message={error} onDismiss={clearError} />

        <View style={styles.card}>
          <Text style={styles.tripId}>Trip #{trip.id}</Text>

          <DetailRow label="Status" value={(trip.status || '').replace('_', ' ')} />
          <DetailRow label="Type" value={trip.type || 'BLS'} />
          <DetailRow label="Date" value={trip.date} />
          <DetailRow label="Pickup" value={trip.pickupLocation} />
          <DetailRow label="Dropoff" value={trip.dropoffLocation} />
          <DetailRow label="Miles" value={trip.miles?.toString()} />
          <DetailRow label="Response Time" value={trip.responseTime ? `${trip.responseTime} min` : '—'} />
          <DetailRow label="Cost" value={trip.cost ? `$${trip.cost.toFixed(2)}` : '—'} />
          {trip.notes && <DetailRow label="Notes" value={trip.notes} />}
        </View>

        <View style={styles.actions}>
          <VAButton
            title="Edit Trip"
            onPress={() => navigation.navigate('TripForm', { tripId: trip.id })}
            style={{ flex: 1, marginRight: 8 }}
          />
          <VAButton
            title="Delete"
            variant="danger"
            onPress={handleDelete}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VA_COLORS.background },
  scroll: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: VA_COLORS.white, borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  tripId: {
    fontSize: 20, fontWeight: '800', color: VA_COLORS.primary, marginBottom: 16,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: 14, color: VA_COLORS.textSecondary, fontWeight: '600' },
  value: { fontSize: 14, color: VA_COLORS.textPrimary, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 16 },
  actions: { flexDirection: 'row', marginTop: 20 },
});

export default TripDetailScreen;
