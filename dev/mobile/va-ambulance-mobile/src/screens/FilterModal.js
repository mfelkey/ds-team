/**
 * FilterModal - Multi-select filters with chip UI
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { VAButton, VA_COLORS } from '../components';
import { useTripStore } from '../store';

const FILTER_OPTIONS = {
  status: ['completed', 'in_progress', 'scheduled', 'cancelled'],
  type: ['BLS', 'ALS', 'CCT'],
  region: ['Ann Arbor', 'Detroit', 'Flint', 'Toledo'],
};

const FilterModal = ({ navigation }) => {
  const { filters, setFilters, fetchTrips } = useTripStore();
  const [local, setLocal] = useState({ ...filters });

  const toggleFilter = (category, value) => {
    setLocal((prev) => ({
      ...prev,
      [category]: prev[category] === value ? null : value,
    }));
  };

  const applyFilters = () => {
    setFilters(local);
    fetchTrips();
    navigation.goBack();
  };

  const clearFilters = () => {
    const cleared = { status: null, type: null, region: null };
    setLocal(cleared);
    setFilters(cleared);
    fetchTrips();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Filters</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      {Object.entries(FILTER_OPTIONS).map(([category, options]) => (
        <View key={category} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
          <View style={styles.chipRow}>
            {options.map((option) => {
              const active = local[category] === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => toggleFilter(category, option)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {option.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.actions}>
        <VAButton title="Apply Filters" onPress={applyFilters} style={{ flex: 1, marginRight: 8 }} />
        <VAButton title="Clear" variant="secondary" onPress={clearFilters} style={{ flex: 1, marginLeft: 8 }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VA_COLORS.background, padding: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  heading: { fontSize: 22, fontWeight: '800', color: VA_COLORS.primary },
  close: { fontSize: 22, color: VA_COLORS.textSecondary, padding: 4 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: VA_COLORS.textSecondary,
    textTransform: 'uppercase', marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: VA_COLORS.border,
    marginRight: 8, marginBottom: 8, backgroundColor: VA_COLORS.white,
  },
  chipActive: {
    backgroundColor: VA_COLORS.primary, borderColor: VA_COLORS.primary,
  },
  chipText: { fontSize: 14, color: VA_COLORS.textPrimary },
  chipTextActive: { color: VA_COLORS.white, fontWeight: '600' },
  actions: { flexDirection: 'row', marginTop: 'auto', paddingTop: 16 },
});

export default FilterModal;
