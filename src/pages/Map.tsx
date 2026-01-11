import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  GeolocateControl,
  Popup,
} from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { MapLayerMouseEvent, GeoJSONSource } from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import { useCatchStore } from "../stores/catchStore";
import { useFilterStore } from "../stores/filterStore";
import { useFilteredCatches } from "../hooks/useFilteredCatches";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { FilterModal } from "../components/FilterModal";
import { useTranslation } from "@/i18n";
import {
  Filter,
  WifiOff,
  AlertTriangle,
  MapPin,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import "mapbox-gl/dist/mapbox-gl.css";
import "../styles/pages/Map.css";

type ViewMode = "markers" | "heatmap";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface PopupInfo {
  latitude: number;
  longitude: number;
  species: string;
  timestamp: string | Date;
  weight?: number;
  photoUri?: string;
}

export default function MapPage() {
  const { t } = useTranslation();
  const { fetchCatches } = useCatchStore();
  const { activeFilterCount } = useFilterStore();
  const filteredCatches = useFilteredCatches();
  const isOnline = useNetworkStatus();
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [mapErrorMessage, setMapErrorMessage] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("markers");
  const [selectedCatchIndex, setSelectedCatchIndex] = useState<number | null>(
    null,
  );
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  useEffect(() => {
    fetchCatches();
  }, [fetchCatches]);

  // Reset error state when coming back online
  useEffect(() => {
    if (isOnline && hasMapError) {
      // Give user a chance to retry - don't auto-reset
      // They can reload the page or use the retry button
    }
  }, [isOnline, hasMapError]);

  // Auto-center to user's current location on mount
  useEffect(() => {
    if (hasCenteredOnUser) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 10,
          duration: 1500,
        });
        setHasCenteredOnUser(true);
      },
      (error) => {
        console.warn("[Map] Could not get user location:", error.message);
        setHasCenteredOnUser(true); // Prevent retry loop
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000, // Use cached position if available (1 min)
      },
    );
  }, [hasCenteredOnUser]);

  // Navigate to a specific catch and show popup
  const navigateToCatch = useCallback(
    (index: number) => {
      if (
        filteredCatches.length === 0 ||
        index < 0 ||
        index >= filteredCatches.length
      ) {
        return;
      }

      const catchItem = filteredCatches[index];
      setSelectedCatchIndex(index);

      // Fly to catch location
      mapRef.current?.flyTo({
        center: [catchItem.longitude, catchItem.latitude],
        zoom: 14,
        duration: 1000,
      });

      // Show popup for this catch
      setPopupInfo({
        longitude: catchItem.longitude,
        latitude: catchItem.latitude,
        species: catchItem.species || t("catch.unknownSpecies"),
        timestamp: catchItem.timestamp,
        weight: catchItem.weight,
        photoUri: catchItem.photoUri,
      });
    },
    [filteredCatches, t],
  );

  // Go to previous catch
  const handlePreviousCatch = useCallback(() => {
    if (filteredCatches.length === 0) return;

    const newIndex =
      selectedCatchIndex === null
        ? filteredCatches.length - 1
        : selectedCatchIndex <= 0
          ? filteredCatches.length - 1
          : selectedCatchIndex - 1;

    navigateToCatch(newIndex);
  }, [filteredCatches.length, selectedCatchIndex, navigateToCatch]);

  // Go to next catch
  const handleNextCatch = useCallback(() => {
    if (filteredCatches.length === 0) return;

    const newIndex =
      selectedCatchIndex === null
        ? 0
        : selectedCatchIndex >= filteredCatches.length - 1
          ? 0
          : selectedCatchIndex + 1;

    navigateToCatch(newIndex);
  }, [filteredCatches.length, selectedCatchIndex, navigateToCatch]);

  const geojson: FeatureCollection = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: filteredCatches.map((c) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [c.longitude, c.latitude],
        },
        properties: {
          id: c.id,
          species: c.species || t("catch.unknownSpecies"),
          weight: c.weight,
          timestamp: c.timestamp,
          photoUri: c.photoUri,
        },
      })),
    };
  }, [filteredCatches, t]);

  const onClick = useCallback((event: MapLayerMouseEvent) => {
    if (!event.features || event.features.length === 0) return;
    const feature = event.features[0];
    const clusterId = feature.properties?.cluster_id;

    const mapboxSource = event.target.getSource("catches") as GeoJSONSource;

    if (clusterId) {
      mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom === null || zoom === undefined) return;

        event.target.easeTo({
          center: (feature.geometry as Point).coordinates as [number, number],
          zoom: zoom,
        });
      });
      return;
    }

    const coordinates = (feature.geometry as Point).coordinates.slice();
    const { species, timestamp, weight, photoUri } =
      feature.properties as unknown as PopupInfo;

    // Ensure we point to the marker location, not the click location
    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    setPopupInfo({
      longitude: coordinates[0],
      latitude: coordinates[1],
      species,
      timestamp,
      weight,
      photoUri,
    });
  }, []);

  // Handle map load errors (e.g., tiles not available offline)
  const handleMapError = useCallback(
    (e: { error: { message?: string; status?: number } }) => {
      console.warn("[Map] Error loading map resources:", e.error);

      // Check if this is a network-related error when offline
      if (!isOnline) {
        // Only show error for critical failures, not individual tile failures
        // Mapbox will use cached tiles when available
        if (
          e.error?.message?.includes("Failed to fetch") ||
          e.error?.message?.includes("NetworkError")
        ) {
          setHasMapError(true);
          setMapErrorMessage(t("map.offline"));
        }
      }
    },
    [isOnline, t],
  );

  const handleRetry = useCallback(() => {
    setHasMapError(false);
    setMapErrorMessage("");
    // Force a re-render by updating state
    window.location.reload();
  }, []);

  const activeFilters = activeFilterCount();

  if (!MAPBOX_TOKEN) {
    return (
      <div className="map-unavailable">
        <h2>Map Unavailable</h2>
        <p>
          Mapbox access token is missing. Please add{" "}
          <code>VITE_MAPBOX_ACCESS_TOKEN</code> to your <code>.env</code> file.
        </p>
      </div>
    );
  }

  // Show error state when map can't load at all offline
  if (hasMapError && !isOnline) {
    return (
      <div className="map-unavailable">
        <AlertTriangle size={48} className="map-error-icon" />
        <h2>{t("map.offline")}</h2>
        <p>{mapErrorMessage}</p>
        <p className="map-hint">
          Browse the map while online to cache tiles for offline use.
        </p>
        <button
          className="btn-retry"
          onClick={handleRetry}
          disabled={!isOnline}
        >
          {isOnline ? "Retry Loading" : "Go online to load map"}
        </button>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="map-offline-banner" role="status" aria-live="polite">
          <WifiOff size={16} />
          <span>{t("pwa.offline")}</span>
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 40,
          longitude: -100,
          zoom: 3,
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={
          viewMode === "markers" ? ["clusters", "unclustered-point"] : []
        }
        onClick={viewMode === "markers" ? onClick : undefined}
        attributionControl={false}
        onError={handleMapError}
      >
        <GeolocateControl position="top-right" />
        <NavigationControl position="top-right" />

        {/* Heatmap Source - no clustering needed */}
        {viewMode === "heatmap" && (
          <Source id="catches-heatmap" type="geojson" data={geojson}>
            <Layer
              id="catches-heat"
              type="heatmap"
              paint={{
                // Each point has equal weight (1)
                "heatmap-weight": 1,
                // Increase intensity at higher zoom levels
                "heatmap-intensity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  1,
                  12,
                  3,
                ],
                // Color gradient from transparent blue to red
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(33, 102, 172, 0)",
                  0.2,
                  "rgb(103, 169, 207)",
                  0.4,
                  "rgb(209, 229, 240)",
                  0.6,
                  "rgb(253, 219, 199)",
                  0.8,
                  "rgb(239, 138, 98)",
                  1,
                  "rgb(178, 24, 43)",
                ],
                // Adjust radius based on zoom level
                "heatmap-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  5,
                  6,
                  20,
                  12,
                  40,
                ],
                "heatmap-opacity": 0.8,
              }}
            />
          </Source>
        )}

        {/* Marker Source - with clustering */}
        {viewMode === "markers" && (
          <Source
            id="catches"
            type="geojson"
            data={geojson}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer
              id="clusters"
              type="circle"
              filter={["has", "point_count"]}
              paint={{
                "circle-color": [
                  "step",
                  ["get", "point_count"],
                  "#3b82f6", // Blue for small clusters
                  10,
                  "#10b981", // Emerald for medium
                  50,
                  "#f59e0b", // Amber for large
                ],
                "circle-radius": [
                  "step",
                  ["get", "point_count"],
                  22,
                  100,
                  32,
                  750,
                  42,
                ],
                "circle-stroke-width": 3,
                "circle-stroke-color": "#ffffff",
                "circle-opacity": 0.9,
              }}
            />

            <Layer
              id="cluster-count"
              type="symbol"
              filter={["has", "point_count"]}
              layout={{
                "text-field": "{point_count_abbreviated}",
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": 12,
              }}
            />

            <Layer
              id="unclustered-point"
              type="circle"
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-color": "#3b82f6",
                "circle-radius": 10,
                "circle-stroke-width": 3,
                "circle-stroke-color": "#ffffff",
                "circle-opacity": 0.95,
              }}
            />
          </Source>
        )}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            maxWidth="280px"
          >
            <div className="map-popup-content">
              <h3 className="map-popup-title">{popupInfo.species}</h3>
              <p className="map-popup-detail">
                {format(new Date(popupInfo.timestamp), "MMM d, yyyy h:mm a")}
              </p>
              {popupInfo.weight && (
                <p className="map-popup-detail">
                  {t("catch.weight")}: {popupInfo.weight} lbs
                </p>
              )}
              {popupInfo.photoUri && (
                <div className="map-popup-photo">
                  <img src={popupInfo.photoUri} alt={popupInfo.species} />
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Filter Button */}
      <div className="map-controls-overlay">
        <button
          className="btn-map-control"
          onClick={() => setIsFilterOpen(true)}
          title="Filter Catches"
        >
          <Filter size={20} />
          {activeFilters > 0 && (
            <span className="map-badge-count">{activeFilters}</span>
          )}
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="map-view-toggle">
        <button
          className={`btn-view-mode ${viewMode === "markers" ? "active" : ""}`}
          onClick={() => setViewMode("markers")}
          title="Marker View"
          aria-pressed={viewMode === "markers"}
        >
          <MapPin size={18} />
          <span>{t("map.showMarkers")}</span>
        </button>
        <button
          className={`btn-view-mode ${viewMode === "heatmap" ? "active" : ""}`}
          onClick={() => setViewMode("heatmap")}
          title="Heatmap View"
          aria-pressed={viewMode === "heatmap"}
        >
          <Flame size={18} />
          <span>{t("map.showHeatmap")}</span>
        </button>
      </div>

      {/* Catch Navigation Controls */}
      {filteredCatches.length > 0 && (
        <div className="map-catch-navigation">
          <button
            className="btn-catch-nav"
            onClick={handlePreviousCatch}
            title={t("map.previousCatch")}
            aria-label={t("map.previousCatch")}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="catch-nav-indicator">
            <span className="catch-nav-current">
              {selectedCatchIndex !== null ? selectedCatchIndex + 1 : "—"}
            </span>
            <span className="catch-nav-separator">/</span>
            <span className="catch-nav-total">{filteredCatches.length}</span>
          </div>
          <button
            className="btn-catch-nav"
            onClick={handleNextCatch}
            title={t("map.nextCatch")}
            aria-label={t("map.nextCatch")}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}
