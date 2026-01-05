import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuickCaptureButton } from '../../src/components/QuickCaptureButton';
import { useCatchStore } from '../../src/stores/catchStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { getCurrentLocation, getCachedLocation } from '../../src/services/location';
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
    // Optimistic UI - show success immediately
    setLoading(true);
    setSuccess(false);
    
    // Short delay to show "Getting location..." state
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    }, 300);

    // Do all the actual work asynchronously in the background
    (async () => {
      try {
        // Try to get fresh location with 8s timeout, fallback to cached if it takes too long
        let location = await Promise.race([
          getCurrentLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)), // 8s timeout
        ]);

        // If fresh location failed or timed out, use cached location
        if (!location) {
          console.log('[Home] Fresh location timed out, using cached location');
          location = await getCachedLocation();
          
          // If still no location, try fresh one more time (wait for it)
          if (!location) {
            console.log('[Home] No cached location, waiting for fresh location');
            location = await getCurrentLocation();
          } else {
            // We're using cached, but refresh in background for next time
            getCurrentLocation().catch((error) => {
              console.log('[Home] Background location refresh failed:', error);
            });
          }
        }
        
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

        // Fetch weather in background (non-blocking)
        if (networkStatus.status === 'online') {
          fetchWeather(location.latitude, location.longitude)
            .then((weather) => {
              return useCatchStore.getState().markWeatherFetched(newCatch.id, {
                temperature: weather.temperature,
                temperatureUnit: weather.temperatureUnit,
                weatherCondition: weather.weatherCondition,
                pressure: weather.pressure,
                pressureUnit: weather.pressureUnit,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed,
                weatherFetchedAt: weather.fetchedAt,
              });
            })
            .catch((weatherError) => {
              console.error('[Home] Weather fetch failed:', weatherError);
              // Don't fail the capture if weather fetch fails
            });
        }
        
      } catch (error) {
        console.error('[Home] Background capture failed:', error);
        // Show error alert even though UI already showed success
        Alert.alert(
          'Capture Failed',
          error instanceof Error ? error.message : 'Unable to capture catch. Please try again.',
          [{ text: 'OK' }]
        );
      }
    })();
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
