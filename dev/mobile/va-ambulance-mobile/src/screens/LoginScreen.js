/**
 * LoginScreen - VA credentials login with biometric option
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { VAButton, ErrorBanner, VA_COLORS } from '../components';
import AuthService from '../services/AuthService';
import { useAppStore } from '../store';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const setAuth = useAppStore((s) => s.setAuth);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await AuthService.isBiometricAvailable();
    const enabled = await AuthService.isBiometricEnabled();
    setBiometricAvailable(available && enabled);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token, expiresAt } = await AuthService.login(username, password);
      await setAuth(token, expiresAt);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await AuthService.authenticateWithBiometric();
      if (success) {
        const valid = await AuthService.isTokenValid();
        if (valid) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          setError('Session expired. Please log in with your credentials.');
        }
      }
    } catch (err) {
      setError('Biometric authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🚑</Text>
          <Text style={styles.title}>VA Ambulance</Text>
          <Text style={styles.subtitle}>Trip Analysis System</Text>
        </View>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="VA Network Username"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />

          <VAButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 16 }}
          />

          {biometricAvailable && (
            <VAButton
              title="Use Biometric"
              variant="secondary"
              onPress={handleBiometric}
              style={{ marginTop: 12 }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VA_COLORS.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '800', color: VA_COLORS.primary, marginTop: 8 },
  subtitle: { fontSize: 14, color: VA_COLORS.textSecondary, marginTop: 4 },
  form: { backgroundColor: VA_COLORS.white, borderRadius: 12, padding: 24 },
  label: {
    fontSize: 14, fontWeight: '600', color: VA_COLORS.textPrimary,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    borderWidth: 1, borderColor: VA_COLORS.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    backgroundColor: VA_COLORS.white,
  },
});

export default LoginScreen;
