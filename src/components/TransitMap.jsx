import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import MockTransitMap from './MockTransitMap';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const locations = {
  current: [-73.9857, 40.7484],
  destination: [-73.9772, 40.7527],
};

function MapboxTransitMap({ routePath = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const startMarker = useRef(null);
  const endMarker = useRef(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) {
      return undefined;
    }

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: locations.current,
      zoom: 13.5,
    });

    map.current.on('error', (event) => {
      console.error('Mapbox failed to render:', event.error);
      setMapError('Mapbox could not render the live map. Check the browser console for details.');
    });

    new mapboxgl.Marker({ color: '#6D1A36' })
      .setLngLat(locations.destination)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Destination'))
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const drawRoute = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      return;
    }

    if (!routePath || routePath.length < 2) {
      if (map.current.getLayer('route-layer')) {
        map.current.removeLayer('route-layer');
      }

      if (map.current.getSource('route-source')) {
        map.current.removeSource('route-source');
      }

      startMarker.current?.remove();
      endMarker.current?.remove();
      startMarker.current = null;
      endMarker.current = null;

      return;
    }

    const geoJson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routePath,
        },
      }],
    };

    if (!map.current.getSource('route-source')) {
      map.current.addSource('route-source', {
        type: 'geojson',
        data: geoJson,
      });
    }

    if (map.current.getSource('route-source')) {
      map.current.getSource('route-source').setData(geoJson);
    }

    if (!map.current.getLayer('route-layer')) {
      map.current.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#6D1A36',
          'line-width': 5,
          'line-opacity': 0.95,
        },
      });
    }

    const bounds = new mapboxgl.LngLatBounds();
    routePath.forEach((point) => bounds.extend(point));
    map.current.fitBounds(bounds, {
      padding: { top: 60, bottom: 80, left: 60, right: 60 },
      maxZoom: 12,
      duration: 700,
    });

    startMarker.current = startMarker.current || new mapboxgl.Marker({ color: '#0f172a' });
    endMarker.current = endMarker.current || new mapboxgl.Marker({ color: '#6D1A36' });
    startMarker.current.setLngLat(routePath[0]).addTo(map.current);
    endMarker.current.setLngLat(routePath[routePath.length - 1]).addTo(map.current);
  };

  useEffect(() => {
    if (!map.current) {
      return;
    }

    if (!map.current.isStyleLoaded()) {
      map.current.once('load', drawRoute);
      return;
    }

    drawRoute();
  }, [routePath]);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-lg">
      <div ref={mapContainer} className="absolute inset-0 h-full" />
      {mapError && (
        <div className="absolute inset-x-4 top-20 bg-red-50 text-red-900 border border-red-200 rounded-xl px-4 py-3 shadow-lg text-xs font-semibold z-10">
          {mapError}
        </div>
      )}
    </div>
  );
}

export default function TransitMap({ routePath = [] }) {
  if (!mapboxToken) {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        <MockTransitMap routePath={routePath} />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-2 shadow-lg text-xs font-semibold z-10">
          Add VITE_MAPBOX_ACCESS_TOKEN to the project root .env.local to enable the live map.
        </div>
      </div>
    );
  }

  return <MapboxTransitMap routePath={routePath} />;
}
