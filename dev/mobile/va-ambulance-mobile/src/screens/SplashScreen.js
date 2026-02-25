/**
 * SplashScreen - Token validation and auto-navigation
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import { VA_COLORS } from '../components';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const restoreAuth = useAppStore((s) => s.restoreAuth);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const checkAuth = async () => {
      // Brief pause for splash visibility
      await new Promise((r) => setTimeout(r, 1500));
      const valid = await restoreAuth();
      navigation.reset({
        index: 0,
        routes: [{ name: valid ? 'Main' : 'Login' }],
      });
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.logo}>🚑</Text>
        <Text style={styles.title}>VA Ambulance</Text>
        <Text style={styles.subtitle}>Trip Analysis</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VA_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { alignItems: 'center' },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: VA_COLORS.white },
  subtitle: { fontSize: 16, color: '#8ab4e8', marginTop: 4 },
});

export default SplashScreen;
