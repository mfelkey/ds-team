/**
 * TripFormScreen - Create/Edit trip with validation
 * FIX: NavigationService.goBack() was commented out in original output
 * FIX: Service calls use corrected signatures (no token param)
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { VAButton, ErrorBanner, VA_COLORS } from '../components';
import { useTripStore } from '../store';
import NavigationService from '../services/NavigationService';

const TripFormScreen = ({ route }) => {
  const tripId = route.params?.tripId;
  const isEditing = !!tripId;
  const { selectedTrip, fetchTripById, createTrip, updateTrip } = useTripStore();

  const [form, setForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    type: 'BLS',
    date: '',
    miles: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchTripById(tripId);
    }
  }, [tripId]);

  useEffect(() => {
    if (isEditing && selectedTrip) {
      setForm({
        pickupLocation: selectedTrip.pickupLocation || '',
        dropoffLocation: selectedTrip.dropoffLocation || '',
        type: selectedTrip.type || 'BLS',
        date: selectedTrip.date || '',
        miles: selectedTrip.miles?.toString() || '',
        notes: selectedTrip.notes || '',
      });
    }
  }, [selectedTrip]);

  const validate = () => {
    if (!form.pickupLocation.trim()) return 'Pickup location is required.';
    if (!form.dropoffLocation.trim()) return 'Dropoff location is required.';
    if (!form.date.trim()) return 'Date is required.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        miles: form.miles ? parseFloat(form.miles) : null,
      };

      if (isEditing) {
        await updateTrip(tripId, payload);
      } else {
        await createTrip(payload);
      }

      // FIX: This was commented out in original agent output
      NavigationService.goBack();
    } catch (err) {
      setError(err.message || 'Failed to save trip.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>
            {isEditing ? 'Edit Trip' : 'New Trip'}
          </Text>

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <View style={styles.card}>
            <FormField
              label="Pickup Location *"
              value={form.pickupLocation}
              onChangeText={(v) => updateField('pickupLocation', v)}
              placeholder="e.g., Ann Arbor VAMC"
            />
            <FormField
              label="Dropoff Location *"
              value={form.dropoffLocation}
              onChangeText={(v) => updateField('dropoffLocation', v)}
              placeholder="e.g., U-M Hospital"
            />
            <FormField
              label="Trip Type"
              value={form.type}
              onChangeText={(v) => updateField('type', v)}
              placeholder="BLS, ALS, or CCT"
            />
            <FormField
              label="Date *"
              value={form.date}
              onChangeText={(v) => updateField('date', v)}
              placeholder="YYYY-MM-DD"
            />
            <FormField
              label="Miles"
              value={form.miles}
              onChangeText={(v) => updateField('miles', v)}
              placeholder="Round trip miles"
              keyboardType="numeric"
            />
            <FormField
              label="Notes"
              value={form.notes}
              onChangeText={(v) => updateField('notes', v)}
              placeholder="Optional notes"
              multiline
            />

            <VAButton
              title={isEditing ? 'Update Trip' : 'Create Trip'}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: 20 }}
            />

            <VAButton
              title="Cancel"
              variant="secondary"
              onPress={() => NavigationService.goBack()}
              style={{ marginTop: 10 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FormField = ({ label, ...inputProps }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...inputProps} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VA_COLORS.background },
  scroll: { padding: 16 },
  heading: {
    fontSize: 24, fontWeight: '800', color: VA_COLORS.primary, marginBottom: 16,
  },
  card: {
    backgroundColor: VA_COLORS.white, borderRadius: 12, padding: 20,
  },
  fieldContainer: { marginBottom: 14 },
  label: {
    fontSize: 14, fontWeight: '600', color: VA_COLORS.textPrimary, marginBottom: 6,
  },
  input: {
    borderWidth: 1, borderColor: VA_COLORS.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
  },
});

export default TripFormScreen;
