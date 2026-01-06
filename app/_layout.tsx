import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { runMigrations } from '../src/db/migrate';
import { useCatchStore } from '../src/stores/catchStore';
import { syncPendingWeather } from '../src/services/sync';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { ThemeProvider, useColors } from '../src/context/ThemeContext';

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const networkStatus = useNetworkStatus();
  const fetchCatches = useCatchStore((state) => state.fetchCatches);
  const colors = useColors();
  const systemColorScheme = useColorScheme();

  // Initialize database and run migrations on app start
  useEffect(() => {
    async function initialize() {
      try {
        console.log('[App] Initializing database...');
        await runMigrations();
        console.log('[App] Database ready');

        // Load initial catches
        await fetchCatches();

        setIsReady(true);
      } catch (err) {
        console.error('[App] Initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
      }
    }

    initialize();
  }, [fetchCatches]);

  // Sync pending weather when network becomes available
  useEffect(() => {
    if (isReady && networkStatus.status === 'online') {
      console.log('[App] Network online, syncing pending weather...');
      syncPendingWeather().catch((err) => {
        console.error('[App] Weather sync failed:', err);
      });
    }
  }, [isReady, networkStatus.status]);

  // Show loading screen while initializing
  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={systemColorScheme === 'dark' ? 'light' : 'dark'} />
        {error ? (
          <>
            <Text style={[styles.errorText, { color: colors.error }]}>Failed to start</Text>
            <Text style={[styles.errorDetails, { color: colors.textSecondary }]}>{error}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading CatchPoint...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 14,
    textAlign: 'center',
  },
});
