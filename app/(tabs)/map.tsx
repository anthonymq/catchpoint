import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCatchStore } from '../../src/stores/catchStore';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { useColors, useIsDark } from '../../src/context/ThemeContext';
import * as Location from 'expo-location';
import type { Catch } from '../../src/db/schema';

const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/outdoors-v12';

// Conditionally import Mapbox
let MapboxComponents: {
  MapView: React.ComponentType<any>;
  Camera: React.ComponentType<any>;
  ShapeSource: React.ComponentType<any>;
  CircleLayer: React.ComponentType<any>;
  SymbolLayer: React.ComponentType<any>;
} | null = null;

let MapboxMapView: React.ComponentType<any> | null = null;

try {
  const Mapbox = require('@rnmapbox/maps');
  Mapbox.setAccessToken(
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiY2F0Y2hwb2ludCJjbGZ5cjZ3IsImEiOiaGgwMDJ4M2Rxbmx4b3Z4b3Z4In0.example'
  );
  MapboxComponents = {
    MapView: Mapbox.MapView,
    Camera: Mapbox.Camera,
    ShapeSource: Mapbox.ShapeSource,
    CircleLayer: Mapbox.CircleLayer,
    SymbolLayer: Mapbox.SymbolLayer,
  };
  MapboxMapView = Mapbox.MapView;
} catch (e) {
  console.warn('Mapbox native module not available');
}

interface CatchFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    species: string | null;
    createdAt: number;
    temperature: number | null;
    weatherCondition: string | null;
  };
}

function MapboxMapScreen({
  catches,
  loading,
  colors,
  isDark,
}: {
  catches: Catch[];
  loading: boolean;
  colors: any;
  isDark: boolean;
}) {
  const insets = useSafeAreaInsets();

  if (!MapboxComponents || !MapboxMapView) {
    return (
      <View style={styles.mapPlaceholder}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { MapView, Camera, ShapeSource, CircleLayer, SymbolLayer } = MapboxComponents;

  const cameraRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hasNavigatedToLastCatch, setHasNavigatedToLastCatch] = useState(false);

  // Convert catches to GeoJSON FeatureCollection
  const catchFeatures = useMemo<CatchFeature[]>(() => {
    return catches
      .filter((c: Catch) => c.latitude && c.longitude)
      .map((c: Catch) => ({
        type: 'Feature' as const,
        id: c.id,
        geometry: {
          type: 'Point' as const,
          coordinates: [c.longitude, c.latitude] as [number, number],
        },
        properties: {
          id: c.id,
          species: c.species,
          createdAt: c.createdAt?.getTime() ?? Date.now(),
          temperature: c.temperature,
          weatherCondition: c.weatherCondition,
        },
      }));
  }, [catches]);

  const handleMarkerPress = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature?.properties?.id) {
      router.push(`/catch/${feature.properties.id}`);
    }
  }, []);

  const handleFitToCatches = useCallback(() => {
    if (catchFeatures.length === 0) return;
    const coords = catchFeatures.map((f) => f.geometry.coordinates);
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    cameraRef.current?.setCamera({
      centerCoordinate: [centerLng, centerLat],
      zoomLevel: catchFeatures.length === 1 ? 14 : 9,
      animationDuration: 1000,
    });
  }, [catchFeatures]);

  const handleGoToUserLocation = useCallback(() => {
    if (userLocation) {
      cameraRef.current?.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 14,
        animationDuration: 1500,
      });
    }
  }, [userLocation]);

  // Navigate to last catch location when catches load (only once)
  useEffect(() => {
    if (!hasNavigatedToLastCatch && catchFeatures.length > 0 && cameraRef.current) {
      const lastCatch = catchFeatures[0]; // Already sorted by createdAt DESC
      cameraRef.current.setCamera({
        centerCoordinate: lastCatch.geometry.coordinates,
        zoomLevel: 14,
        animationDuration: 0, // No animation on initial load
      });
      setHasNavigatedToLastCatch(true);
    }
  }, [catchFeatures, hasNavigatedToLastCatch]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.longitude, location.coords.latitude]);
      }
    })();
  }, []);

  return (
    <View style={styles.mapContainer}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE_URL}
        onPress={handleMarkerPress}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera ref={cameraRef} defaultSettings={{ zoomLevel: 4 }} />

        {/* Catches ShapeSource with Clustering */}
        <ShapeSource
          id="catchesSource"
          shape={{
            type: 'FeatureCollection',
            features: catchFeatures,
          }}
          cluster={true}
          clusterRadius={50}
          clusterMaxZoomLevel={14}
          onPress={handleMarkerPress}
        >
          {/* Cluster Circles */}
          <CircleLayer
            id="clusterCircles"
            filter={['has', 'point_count']}
            style={{
              circleColor: ['step', ['get', 'point_count'], colors.primary, 10, colors.warning, 50, colors.error],
              circleRadius: ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
              circleOpacity: 0.85,
              circleStrokeWidth: 2,
              circleStrokeColor: '#FFFFFF',
            }}
          />

          {/* Cluster Count Labels */}
          <SymbolLayer
            id="clusterCounts"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 14,
              textColor: '#FFFFFF',
              textFont: ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            }}
          />

          {/* Individual Catch Markers */}
          <CircleLayer
            id="catchMarkers"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: colors.primary,
              circleRadius: 12,
              circleStrokeWidth: 3,
              circleStrokeColor: '#FFFFFF',
              circleOpacity: 0.9,
            }}
          />
        </ShapeSource>
      </MapView>

      {/* Map Controls */}
      <View style={[styles.mapControls, { bottom: insets.bottom + 70 }]}>
        <TouchableOpacity
          style={[styles.mapButton, { backgroundColor: colors.surface }]}
          onPress={handleGoToUserLocation}
          activeOpacity={0.7}
          disabled={!userLocation}
        >
          <Ionicons
            name="location"
            size={24}
            color={userLocation ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Catch Count Badge */}
      {catchFeatures.length > 0 && (
        <View style={[styles.catchCountBadge, { backgroundColor: colors.surface, top: insets.top + 16 }]}>
          <Ionicons name="fish" size={16} color={colors.primary} />
          <Text style={[styles.catchCountText, { color: colors.text }]}>
            {catchFeatures.length} catches
          </Text>
        </View>
      )}

      {/* Preview Container */}
      {catchFeatures.length > 0 && (
        <View style={[styles.previewContainer, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>
            RECENT CATCHES
          </Text>
          {catchFeatures.slice(0, 3).map((feature, index) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.previewItem, index < 2 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
              onPress={() => router.push(`/catch/${feature.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.previewInfo}>
                <Text style={[styles.previewSpecies, { color: colors.text }]}>
                  {feature.properties.species || 'Unknown Species'}
                </Text>
                <Text style={[styles.previewDate, { color: colors.textSecondary }]}>
                  {new Date(feature.properties.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function ExpoGoPlaceholder({ colors }: { colors: any }) {
  return (
    <View style={styles.placeholderContainer}>
      <Ionicons name="map" size={64} color={colors.textTertiary} />
      <Text style={[styles.placeholderTitle, { color: colors.text }]}>
        Map Not Available
      </Text>
      <Text style={[styles.placeholderSubtitle, { color: colors.textSecondary }]}>
        Maps require a native build.{'\n'}
        Run: npx expo run:ios{'\n'}
        or npx expo run:android
      </Text>
    </View>
  );
}

export default function MapScreen() {
  const { catches, fetchCatches, loading } = useCatchStore();
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      fetchCatches();
    }, [fetchCatches])
  );

  const catchFeatures = useMemo(() => {
    return catches.filter((c: Catch) => c.latitude && c.longitude);
  }, [catches]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>Map</Text>
        <View style={styles.headerActions}>
          {catchFeatures.length > 0 && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Ionicons name="scan" size={20} color={colors.primary} />
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>Fit All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map Content */}
      {Platform.OS === 'web' ? (
        <ExpoGoPlaceholder colors={colors} />
      ) : MapboxComponents ? (
        <MapboxMapScreen catches={catches} loading={loading} colors={colors} isDark={isDark} />
      ) : (
        <ExpoGoPlaceholder colors={colors} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  headerButtonText: { fontSize: 14, fontWeight: '600' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  mapControls: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    gap: 8,
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  catchCountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  catchCountText: { fontSize: 14, fontWeight: '600' },
  previewContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  previewList: { borderRadius: 12, overflow: 'hidden' },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  previewInfo: { flex: 1 },
  previewSpecies: { fontSize: 16, fontWeight: '500' },
  previewDate: { fontSize: 13, marginTop: 2 },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  placeholderTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  placeholderSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
