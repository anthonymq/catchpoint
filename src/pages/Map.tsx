import { useEffect, useState, useMemo, useCallback } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  GeolocateControl,
  Popup,
} from "react-map-gl/mapbox";
import type { MapLayerMouseEvent, GeoJSONSource } from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import { useCatchStore } from "../stores/catchStore";
import { useFilterStore } from "../stores/filterStore";
import { useFilteredCatches } from "../hooks/useFilteredCatches";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { FilterModal } from "../components/FilterModal";
import { Filter, WifiOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import "mapbox-gl/dist/mapbox-gl.css";
import "../styles/pages/Map.css";

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
  const { fetchCatches } = useCatchStore();
  const { activeFilterCount } = useFilterStore();
  const filteredCatches = useFilteredCatches();
  const isOnline = useNetworkStatus();
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [mapErrorMessage, setMapErrorMessage] = useState<string>("");

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
          species: c.species || "Unknown",
          weight: c.weight,
          timestamp: c.timestamp,
          photoUri: c.photoUri,
        },
      })),
    };
  }, [filteredCatches]);

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
          setMapErrorMessage(
            "Map tiles unavailable. Previously viewed areas may still be accessible.",
          );
        }
      }
    },
    [isOnline],
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
        <h2>Map Unavailable Offline</h2>
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
          <span>Offline - Showing cached map tiles</span>
        </div>
      )}

      <Map
        initialViewState={{
          latitude: 40,
          longitude: -100,
          zoom: 3,
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={["clusters", "unclustered-point"]}
        onClick={onClick}
        attributionControl={false}
        onError={handleMapError}
      >
        <GeolocateControl position="top-right" />
        <NavigationControl position="top-right" />

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
                "#51bbd6",
                10,
                "#f1f075",
                50,
                "#f28cb1",
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40,
              ],
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
              "circle-color": "#11b4da",
              "circle-radius": 8,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#fff",
            }}
          />
        </Source>

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            maxWidth="300px"
          >
            <div className="p-1">
              <h3 className="font-bold text-sm mb-1">{popupInfo.species}</h3>
              <p className="text-xs text-muted mb-1">
                {format(new Date(popupInfo.timestamp), "MMM d, yyyy h:mm a")}
              </p>
              {popupInfo.weight && (
                <p className="text-xs">Weight: {popupInfo.weight} lbs</p>
              )}
              {popupInfo.photoUri && (
                <div className="mt-2 rounded overflow-hidden aspect-video relative">
                  <img
                    src={popupInfo.photoUri}
                    alt={popupInfo.species}
                    className="object-cover w-full h-full"
                  />
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

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}
