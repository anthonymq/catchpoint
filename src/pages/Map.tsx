import { useEffect, useState, useMemo } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  GeolocateControl,
  Popup,
} from "react-map-gl/mapbox";
import type { MapLayerMouseEvent, GeoJSONSource } from "mapbox-gl";
import { useCatchStore } from "../stores/catchStore";
import { format } from "date-fns";
import "mapbox-gl/dist/mapbox-gl.css";

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
  const { catches, fetchCatches } = useCatchStore();
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  useEffect(() => {
    fetchCatches();
  }, [fetchCatches]);

  const geojson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: catches.map((c) => ({
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
  }, [catches]);

  const onClick = (event: MapLayerMouseEvent) => {
    if (!event.features || event.features.length === 0) return;
    const feature = event.features[0];
    const clusterId = feature.properties?.cluster_id;

    const mapboxSource = event.target.getSource("catches") as GeoJSONSource;

    if (clusterId) {
      mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom === null || zoom === undefined) return;

        event.target.easeTo({
          center: (feature.geometry as any).coordinates,
          zoom: zoom,
        });
      });
      return;
    }

    const coordinates = (feature.geometry as any).coordinates.slice();
    const { species, timestamp, weight, photoUri } = feature.properties as any;

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
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Map Unavailable</h2>
        <p className="text-muted">
          Mapbox access token is missing. Please add{" "}
          <code>VITE_MAPBOX_ACCESS_TOKEN</code> to your <code>.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
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
      >
        <GeolocateControl position="top-right" />
        <NavigationControl position="top-right" />

        <Source
          id="catches"
          type="geojson"
          data={geojson as any}
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
    </div>
  );
}
