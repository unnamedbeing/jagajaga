import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MockTransitMap from './MockTransitMap';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleMapsLoader;

function loadGoogleMaps() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!googleMapsLoader) {
    googleMapsLoader = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps));
        existingScript.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsKey)}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = 'true';
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error('Google Maps script failed to load'));
      document.head.appendChild(script);
    });
  }

  return googleMapsLoader;
}

const locations = {
  current: [-73.9857, 40.7484],
  destination: [-73.9772, 40.7527],
};

function MapboxTransitMap({ routePath = [], destinationQuery = '', currentLocation = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const startMarker = useRef(null);
  const endMarker = useRef(null);
  const locationMarker = useRef(null);
  const [mapError, setMapError] = useState('');
  const [roadRoute, setRoadRoute] = useState([]);
  const [lastMile, setLastMile] = useState(null);

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

    const displayedRoute = roadRoute.length >= 2 ? roadRoute : routePath;
    const geoJson = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: displayedRoute,
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
    let cancelled = false;

    if (!mapboxToken || !routePath || routePath.length < 2) {
      setRoadRoute([]);
      return undefined;
    }

    const coordinateString = routePath
      .map(([longitude, latitude]) => `${longitude},${latitude}`)
      .join(';');

    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinateString}?geometries=geojson&overview=full&access_token=${mapboxToken}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Directions request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const coordinates = data.routes?.[0]?.geometry?.coordinates;
        if (!cancelled) {
          setRoadRoute(Array.isArray(coordinates) ? coordinates : []);
        }
      })
      .catch((error) => {
        console.error('Mapbox directions failed:', error);
        if (!cancelled) {
          setRoadRoute([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routePath]);

  useEffect(() => {
    let cancelled = false;

    if (!mapboxToken || !destinationQuery.trim()) {
      setLastMile(null);
      return undefined;
    }

    const fetchJson = (url) => fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Mapbox request failed with status ${response.status}`);
      }
      return response.json();
    });

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destinationQuery)}.json?country=ng&proximity=7.3986,9.0765&limit=1&access_token=${mapboxToken}`;

    fetchJson(geocodeUrl)
      .then((buildingData) => {
        const building = buildingData.features?.[0];
        if (!building?.center) {
          throw new Error('Building could not be located');
        }

        const [longitude, latitude] = building.center;
        const stopUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/bus%20stop.json?country=ng&proximity=${longitude},${latitude}&types=poi&limit=1&access_token=${mapboxToken}`;
        return fetchJson(stopUrl).then((stopData) => ({ building, stop: stopData.features?.[0] }));
      })
      .then(({ building, stop }) => {
        if (!stop?.center) {
          return { building, stop: null, walking: null, cycling: null };
        }

        const [buildingLongitude, buildingLatitude] = building.center;
        const [stopLongitude, stopLatitude] = stop.center;
        const directions = ['walking', 'cycling'].map((profile) => {
          const routeUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${stopLongitude},${stopLatitude};${buildingLongitude},${buildingLatitude}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
          return fetchJson(routeUrl).then((data) => ({
            profile,
            route: data.routes?.[0] || null,
          }));
        });

        return Promise.all(directions).then((results) => ({
          building,
          stop,
          walking: results.find((result) => result.profile === 'walking')?.route,
          cycling: results.find((result) => result.profile === 'cycling')?.route,
        }));
      })
      .then((result) => {
        if (!cancelled) {
          setLastMile(result);
        }
      })
      .catch((error) => {
        console.error('Mapbox building lookup failed:', error);
        if (!cancelled) {
          setLastMile(null);
          setMapError('That building could not be located. Try a fuller address.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destinationQuery]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) {
      return;
    }

    ['last-mile-walking', 'last-mile-cycling'].forEach((layerId) => {
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(layerId)) map.current.removeSource(layerId);
    });

    if (!lastMile?.building?.center) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds(lastMile.building.center, lastMile.building.center);
    const addRoute = (id, route, color, dasharray) => {
      if (!route?.geometry) return;
      map.current.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry: route.geometry } });
      map.current.addLayer({ id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': 5, 'line-opacity': 0.9, ...(dasharray ? { 'line-dasharray': dasharray } : {}) } });
      route.geometry.coordinates.forEach((point) => bounds.extend(point));
    };

    addRoute('last-mile-walking', lastMile.walking, '#6D1A36', [1, 1]);
    addRoute('last-mile-cycling', lastMile.cycling, '#0f766e');

    new mapboxgl.Marker({ color: '#0f172a' }).setLngLat(lastMile.building.center).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lastMile.building.place_name || destinationQuery)).addTo(map.current);
    if (lastMile.stop?.center) {
      new mapboxgl.Marker({ color: '#6D1A36' }).setLngLat(lastMile.stop.center).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lastMile.stop.place_name || 'Nearest bus stop')).addTo(map.current);
      bounds.extend(lastMile.stop.center);
    }
    map.current.fitBounds(bounds, { padding: { top: 80, bottom: 360, left: 60, right: 60 }, maxZoom: 16, duration: 700 });
  }, [lastMile, destinationQuery]);

  useEffect(() => {
    if (!map.current) {
      return;
    }

    if (!map.current.isStyleLoaded()) {
      map.current.once('load', drawRoute);
      return;
    }

    drawRoute();
  }, [routePath, roadRoute]);

  useEffect(() => {
    if (!map.current || !currentLocation) {
      return;
    }

    locationMarker.current?.remove();
    locationMarker.current = new mapboxgl.Marker({ color: '#2563eb' })
      .setLngLat([currentLocation.longitude, currentLocation.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your location'))
      .addTo(map.current);
  }, [currentLocation]);

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

function GoogleTransitMap({ routePath = [], onError, currentLocation = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const directionsRenderer = useRef(null);
  const errorObserver = useRef(null);
  const locationMarker = useRef(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapContainer.current) {
          return;
        }

        map.current = new maps.Map(mapContainer.current, {
          center: { lat: 9.0765, lng: 7.3986 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        directionsRenderer.current = new maps.DirectionsRenderer({
          map: map.current,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#6D1A36',
            strokeOpacity: 0.95,
            strokeWeight: 5,
          },
        });

        errorObserver.current = new MutationObserver(() => {
          if (mapContainer.current?.querySelector('.gm-err-container, .gm-err-message')) {
            setMapError('Google Maps could not authorize this key. Switching to Mapbox.');
            onError?.();
          }
        });
        errorObserver.current.observe(mapContainer.current, { childList: true, subtree: true });
      })
      .catch((error) => {
        console.error('Google Maps failed to load:', error);
        if (!cancelled) {
          setMapError('Google Maps could not load. Switching to Mapbox.');
          onError?.();
        }
      });

    return () => {
      cancelled = true;
      errorObserver.current?.disconnect();
      errorObserver.current = null;
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
      map.current = null;
      directionsRenderer.current = null;
    };
  }, [onError]);

  useEffect(() => {
    if (!map.current || !directionsRenderer.current || routePath.length < 2 || !window.google?.maps) {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route({
      origin: { lat: routePath[0][1], lng: routePath[0][0] },
      destination: {
        lat: routePath[routePath.length - 1][1],
        lng: routePath[routePath.length - 1][0],
      },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.current?.setDirections(result);
        return;
      }

      console.error('Google directions failed:', status);
      setMapError('Google directions could not find a route. Switching to Mapbox.');
      onError?.();
    });
  }, [routePath, onError]);

  useEffect(() => {
    if (!map.current || !currentLocation || !window.google?.maps) {
      return;
    }

    locationMarker.current?.setMap(null);
    locationMarker.current = new window.google.maps.Marker({
      map: map.current,
      position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
      title: 'Your location',
    });
  }, [currentLocation]);

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-lg">
      <div ref={mapContainer} className="absolute inset-0 h-full" />
      {mapError && (
        <div className="absolute inset-x-4 top-20 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-3 shadow-lg text-xs font-semibold z-10">
          {mapError}
        </div>
      )}
    </div>
  );
}

export default function TransitMap({ routePath = [], destinationQuery = '', currentLocation = null }) {
  const [provider, setProvider] = useState(googleMapsKey ? 'google' : 'mapbox');

  if (provider === 'google' && !destinationQuery.trim()) {
    return <GoogleTransitMap routePath={routePath} currentLocation={currentLocation} onError={() => setProvider('mapbox')} />;
  }

  if (!mapboxToken) {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        <MockTransitMap routePath={routePath} />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-2 shadow-lg text-xs font-semibold z-10">
          Add a Google Maps or Mapbox API key to the project root .env.local to enable the live map.
        </div>
      </div>
    );
  }

  return <MapboxTransitMap routePath={routePath} destinationQuery={destinationQuery} currentLocation={currentLocation} />;
}
