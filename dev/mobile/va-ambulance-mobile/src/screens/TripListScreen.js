/**
 * TripListScreen - FlatList with filters, pull-to-refresh
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { TripListItem, VAButton, ErrorBanner, VA_COLORS } from '../components';
import { useTripStore } from '../store';

const TripListScreen = ({ navigation }) => {
  const { trips, loading, error, fetchTrips, clearError } = useTripStore();
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const onRefresh = useCallback(() => {
    fetchTrips();
  }, []);

  const handleTripPress = (trip) => {
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Trips</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('FilterModal')}
            style={styles.filterBtn}
          >
            <Text style={styles.filterBtnText}>Filters</Text>
          </TouchableOpacity>
          <VAButton
            title="+ New"
            onPress={() => navigation.navigate('TripForm')}
            style={styles.newBtn}
          />
        </View>
      </View>

      <ErrorBanner message={error} onDismiss={clearError} />

      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TripListItem trip={item} onPress={handleTripPress} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No trips found</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VA_COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  heading: { fontSize: 24, fontWeight: '800', color: VA_COLORS.primary },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: VA_COLORS.primary, marginRight: 8,
  },
  filterBtnText: { color: VA_COLORS.primary, fontWeight: '600', fontSize: 14 },
  newBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: VA_COLORS.textSecondary },
});

export default TripListScreen;
