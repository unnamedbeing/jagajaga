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

function MapboxTransitMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
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

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      trackUserLocation: true,
      showUserHeading: true,
    }), 'top-right');

    new mapboxgl.Marker({ color: '#6D1A36' })
      .setLngLat(locations.destination)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Destination'))
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-lg">
      <div ref={mapContainer} className="absolute inset-0 h-full" />
      {mapError && (
        <div className="absolute inset-x-4 top-20 bg-red-50 text-red-900 border border-red-200 rounded-xl px-4 py-3 shadow-lg text-xs font-semibold z-10">
          {mapError}
        </div>
      )}
      <div className="absolute top-6 left-6 pointer-events-none">
        <div className="bg-white/95 px-3 py-1 rounded-full shadow-lg border border-zinc-100 text-[10px] font-bold mb-1">
          MAPBOX MAP
        </div>
        <div className="flex items-center gap-2 bg-white/95 px-3 py-2 rounded-xl shadow-lg text-xs font-semibold text-zinc-700">
          <MapPin size={14} className="text-[#6D1A36]" />
          TransitBuddy
        </div>
      </div>
      <button
        type="button"
        aria-label="Center map on current location"
        onClick={() => map.current?.flyTo({ center: locations.current, zoom: 14 })}
        className="absolute bottom-6 right-6 bg-white p-3 rounded-2xl shadow-xl text-zinc-600 hover:text-[#6D1A36] transition-colors"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
}

export default function TransitMap() {
  if (!mapboxToken) {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        <MockTransitMap />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-2 shadow-lg text-xs font-semibold z-10">
          Add VITE_MAPBOX_ACCESS_TOKEN to the project root .env.local to enable the live map.
        </div>
      </div>
    );
  }

  return <MapboxTransitMap />;
}
