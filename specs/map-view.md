# Map View Specification

## Overview
Interactive map showing catch locations with clustering, filtering, and 
location-based insights.

## User Story
**As a** fisher  
**I want to** see my catches on a map  
**So that** I can find my best fishing spots and navigate back to them

## Screen Layout

### Map (Full Screen)
- Mapbox GL JS map covering entire viewport
- Catch markers clustered when zoomed out
- User location indicator (optional)

### Controls Overlay
```
┌─────────────────────────────────────┐
│ [🔍] [📍] [🎚️]              [+][-] │
│                                     │
│                                     │
│        [Map Content]                │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Bottom Sheet (collapsed)        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Legend:
🔍 - Search/filter
📍 - Center on user location
🎚️ - Layer controls
+/- - Zoom controls
```

### Bottom Sheet/Sidebar (Expandable)
- Collapsed: shows summary of visible catches
- Expanded: list of catches in current viewport
- Clickable to navigate to catch detail

## Requirements

### Map Provider

**Mapbox GL JS** (web version):
- Access token required: `VITE_MAPBOX_ACCESS_TOKEN`
- CDN or npm: `mapbox-gl` or `react-map-gl`
- Works in all modern browsers

### Markers & Clustering

| Zoom Level | Display |
|------------|---------|
| Low (< 10) | Clusters with count |
| Medium (10-14) | Small clusters or individual |
| High (> 14) | Individual markers with icon |

Cluster styling:
- Circle with count number
- Size proportional to count
- Color gradient (cool → warm) by density

Individual markers:
- Fish icon or species-specific icon
- Click to select and show info

### Marker Interaction

**Click marker**:
1. Highlight selected marker
2. Show info popup or sidebar detail
3. Option to navigate to full detail

**Click cluster**:
1. Zoom in to expand cluster
2. Or show list of catches in cluster

### User Location

- Show current location indicator (blue dot)
- "Center on me" button
- Request location permission if needed
- Handle permission denied gracefully
- Show last known location when offline

### Filtering

Quick filters accessible from map:
- Species filter
- Date range
- Catches with photos only

Filters affect which markers display.

### Offline Support

- Use Mapbox tile caching (limited in free tier)
- All catch data from local IndexedDB
- Indicate when viewing cached/offline mode

## Technical Requirements

### Setup

Environment variable for Mapbox:
```bash
VITE_MAPBOX_ACCESS_TOKEN=pk.xxx
```

### Map Component Structure (React)

```tsx
import Map, { Marker, Source, Layer, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

<Map
  mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
  initialViewState={{
    longitude: -122.4,
    latitude: 37.8,
    zoom: 10,
  }}
  style={{ width: '100%', height: '100vh' }}
  mapStyle="mapbox://styles/mapbox/outdoors-v12"
>
  <GeolocateControl position="top-right" />
  <Source id="catches" type="geojson" data={geoJSON} cluster clusterMaxZoom={14}>
    <Layer id="clusters" type="circle" filter={['has', 'point_count']} />
    <Layer id="cluster-count" type="symbol" filter={['has', 'point_count']} />
    <Layer id="markers" type="symbol" filter={['!', ['has', 'point_count']]} />
  </Source>
</Map>
```

### GeoJSON Data

Convert catches to GeoJSON FeatureCollection:
```typescript
const geoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: catches.map(c => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [c.longitude, c.latitude],
    },
    properties: {
      id: c.id,
      species: c.species,
      weight: c.weight,
      timestamp: c.timestamp,
    },
  })),
};
```

## Acceptance Criteria

- [ ] Map renders with Mapbox tiles
- [ ] Catches display as markers
- [ ] Clustering works at low zoom levels
- [ ] Click marker shows catch info
- [ ] Click cluster zooms in
- [ ] User location shows (with permission)
- [ ] Filter affects visible markers
- [ ] Map degrades gracefully offline
- [ ] Smooth pan/zoom (60fps)
- [ ] Responsive on mobile and desktop

## Platform Notes

- **Desktop**: Full functionality with mouse interactions
- **Mobile**: Touch-optimized with pinch-to-zoom
- **Tablets**: Responsive layout adapts

## Accessibility

- Keyboard navigation for map controls
- Screen reader announcements for marker selection
- High contrast mode support
- Reduced motion respects `prefers-reduced-motion`

## Related Specs
- `catch-log.md` - Alternative list view
- `quick-capture.md` - Location data source
