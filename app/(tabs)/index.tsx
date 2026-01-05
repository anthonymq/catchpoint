import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuickCaptureButton } from '../../src/components/QuickCaptureButton';
import { useCatchStore } from '../../src/stores/catchStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { getCurrentLocation } from '../../src/services/location';
import { fetchWeather, setWeatherApiKey } from '../../src/services/weather';
import { useFocusEffect } from 'expo-router';
import { useColors } from '../../src/context/ThemeContext';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);

  const { createCatch, fetchCatches, catches } = useCatchStore();
  const networkStatus = useNetworkStatus();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Initialize API key from environment
  useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY;
    if (apiKey) {
      setWeatherApiKey(apiKey);
    }
  }, []);
  
  // Fetch catches on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchCatches();
    }, [fetchCatches])
  );

  // Update capture count
  useEffect(() => {
    setCaptureCount(catches.length);
  }, [catches]);

  const handleCapture = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Create catch with location
      const newCatch = await createCatch({
        latitude: location.latitude,
        longitude: location.longitude,
        temperature: null,
        temperatureUnit: 'C',
        weatherCondition: null,
        pressure: null,
        pressureUnit: 'hPa',
        humidity: null,
        windSpeed: null,
        weatherFetchedAt: null,
        species: null,
        weight: null,
        weightUnit: 'kg',
        length: null,
        lengthUnit: 'cm',
        lure: null,
        notes: null,
        photoUri: null,
        isDraft: true,
        pendingWeatherFetch: true,
        syncedAt: null,
      });

      // Fetch weather if online
      if (networkStatus.status === 'online') {
        try {
          const weather = await fetchWeather(location.latitude, location.longitude);
          
          await useCatchStore.getState().markWeatherFetched(newCatch.id, {
            temperature: weather.temperature,
            temperatureUnit: weather.temperatureUnit,
            weatherCondition: weather.weatherCondition,
            pressure: weather.pressure,
            pressureUnit: weather.pressureUnit,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed,
            weatherFetchedAt: weather.fetchedAt,
          });
        } catch (weatherError) {
          console.error('[Home] Weather fetch failed:', weatherError);
          // Don't fail the capture if weather fetch fails
        }
      }

      setSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('[Home] Capture failed:', error);
      Alert.alert(
        'Capture Failed',
        error instanceof Error ? error.message : 'Unable to capture catch. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: colors.text }]}>CatchPoint</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Quick Capture</Text>
      </View>

      <View style={styles.captureSection}>
        <QuickCaptureButton
          onPress={handleCapture}
          loading={loading}
          success={success}
          disabled={!networkStatus.isConnected && networkStatus.status !== 'unknown'}
        />
      </View>

      <View style={styles.statsSection}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{captureCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Catches</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statNumber}>
            {networkStatus.status === 'online' ? '🟢' : networkStatus.status === 'offline' ? '🔴' : '🟡'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {networkStatus.status === 'online' ? 'Online' : networkStatus.status === 'offline' ? 'Offline' : 'Checking...'}
          </Text>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
          Tap the button to record your catch with GPS location
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  captureSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
