import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { renderToStaticMarkup } from 'react-dom/server';
import { Bike, Bus, CarFront, Plane } from 'lucide-react';
import MockTransitMap from './MockTransitMap';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
const hasPublicMapboxToken = mapboxToken?.startsWith('pk.');

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
  current: [7.3986, 9.0765],
  destination: [7.4951, 9.0556],
};

const accentColor = '#6D1A36';
const locationColor = '#2563EB';

const createMarkerElement = (className) => {
  const element = document.createElement('div');
  element.className = className;
  return element;
};

function createDatabaseStopMarker(stop) {
  const stopType = (stop.stop_type || '').toLowerCase();
  const details = stopType.includes('airport')
    ? { Icon: Plane, category: 'airport' }
    : /keke|okada/.test(stopType)
      ? { Icon: Bike, category: 'bike' }
      : /estate|village|local|district bus/.test(stopType)
        ? { Icon: CarFront, category: 'local' }
        : { Icon: Bus, category: 'major' };
  const element = document.createElement('div');
  element.className = `jj-database-stop-marker jj-database-stop-marker--${details.category}`;
  element.setAttribute('aria-label', `${stop.name}, ${stop.stop_type || 'Bus stop'}`);
  element.innerHTML = renderToStaticMarkup(<details.Icon aria-hidden="true" size={15} strokeWidth={2.4} />);
  return element;
}

function MapboxTransitMap({ routePath = [], destinationQuery = '', currentLocation = null, selectedPlace = null, nearestStops = [], busStops = [], mapStyle = 'streets', onMapCenterChange, onWalkingRouteChange }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const initialMapStyle = useRef(mapStyle);
  const startMarker = useRef(null);
  const endMarker = useRef(null);
  const locationMarker = useRef(null);
  const stopMarkers = useRef([]);
  const databaseStopMarkers = useRef([]);
  const selectedPlaceMarker = useRef(null);
  const lastMileMarkers = useRef([]);
  const [mapError, setMapError] = useState('');
  const [styleRevision, setStyleRevision] = useState(0);
  const [roadRoute, setRoadRoute] = useState([]);
  const [walkingRoute, setWalkingRoute] = useState([]);
  const [lastMile, setLastMile] = useState(null);

  useEffect(() => {
    if (!mapContainer.current || map.current || !hasPublicMapboxToken) {
      return undefined;
    }

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12',
      center: locations.current,
      zoom: 13.5,
    });
    const applyStyleSettings = () => {
      const layers = map.current.getStyle().layers || [];
      layers.forEach((layer) => {
        const id = layer.id.toLowerCase();
        const isSuppressedPoi = /poi|hotel|pharmacy|hospital|clinic/.test(id);
        const isDistrictLabel = /district|neighborhood|locality|place-label/.test(id);

        if (isSuppressedPoi && layer.type === 'symbol') {
          map.current.setLayoutProperty(layer.id, 'visibility', 'none');
        }

        if (isDistrictLabel && layer.type === 'symbol') {
          if (layer.layout?.['text-font']) {
            map.current.setLayoutProperty(layer.id, 'text-font', ['DIN Pro Medium', 'Arial Unicode MS Regular']);
          }
          if (layer.paint?.['text-color']) {
            map.current.setPaintProperty(layer.id, 'text-color', '#64748B');
          }
          if (layer.paint?.['text-halo-color']) {
            map.current.setPaintProperty(layer.id, 'text-halo-color', '#F5F3EF');
          }
        }
      });
    };
    initialMapStyle.current = mapStyle;
    const handleStyleLoad = () => setStyleRevision((revision) => revision + 1);
    map.current.once('load', applyStyleSettings);
    map.current.on('style.load', handleStyleLoad);
    onMapCenterChange?.(locations.current);
    map.current.on('moveend', () => {
      const center = map.current.getCenter();
      onMapCenterChange?.([center.lng, center.lat]);
    });

    map.current.on('error', (event) => {
      console.error('Mapbox failed to render:', event.error);
      setMapError('Mapbox could not render the live map. Check the browser console for details.');
    });

    return () => {
      map.current?.off('style.load', handleStyleLoad);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || mapStyle === initialMapStyle.current) return;
    initialMapStyle.current = mapStyle;
    map.current.setStyle(mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12');
  }, [mapStyle]);

  useEffect(() => {
    if (!map.current || !selectedPlace || !map.current.isStyleLoaded()) return;
    map.current.flyTo({ center: [selectedPlace.longitude, selectedPlace.latitude], zoom: 15, duration: 900 });
    selectedPlaceMarker.current?.remove();
    selectedPlaceMarker.current = new mapboxgl.Marker({ color: accentColor })
      .setLngLat([selectedPlace.longitude, selectedPlace.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(selectedPlace.placeName || selectedPlace.name || 'Selected place'))
      .addTo(map.current);
  }, [selectedPlace]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    stopMarkers.current.forEach((marker) => marker.remove());
    stopMarkers.current = nearestStops.map((stop) => new mapboxgl.Marker({ element: createMarkerElement('jj-stop-marker') })
      .setLngLat([stop.longitude, stop.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(`${stop.name} · ${Math.round(stop.distanceMeters)} m`))
      .addTo(map.current));
  }, [nearestStops]);

  useEffect(() => {
    databaseStopMarkers.current.forEach((marker) => marker.remove());
    databaseStopMarkers.current = busStops
      .filter((stop) => stop.stop_id && Number.isFinite(Number(stop.longitude)) && Number.isFinite(Number(stop.latitude)))
      .map((stop) => new mapboxgl.Marker({ element: createDatabaseStopMarker(stop), anchor: 'bottom' })
        .setLngLat([Number(stop.longitude), Number(stop.latitude)])
        .setPopup(new mapboxgl.Popup({ offset: 22 }).setText(`${stop.name} · ${stop.stop_type || 'Bus stop'}`))
        .addTo(map.current));
  }, [busStops]);

  useEffect(() => {
    let cancelled = false;
    const nearestStop = nearestStops[0];
    if (!hasPublicMapboxToken || !selectedPlace || !nearestStop) {
      setWalkingRoute([]);
      onWalkingRouteChange?.(null);
      return undefined;
    }

    onWalkingRouteChange?.({ loading: true, route: null, error: '' });
    const stopDistance = Math.hypot(
      (selectedPlace.longitude - nearestStop.longitude) * 111320 * Math.cos(selectedPlace.latitude * Math.PI / 180),
      (selectedPlace.latitude - nearestStop.latitude) * 110540,
    );
    if (nearestStop.is_major && stopDistance <= 50) {
      setWalkingRoute([]);
      onWalkingRouteChange?.({
        loading: false,
        route: null,
        directStop: nearestStop,
        error: '',
      });
      return undefined;
    }
    const coordinates = `${selectedPlace.longitude},${selectedPlace.latitude};${nearestStop.longitude},${nearestStop.latitude}`;
    fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken}`)
      .then((response) => {
        if (response.status === 429) throw new Error('Walking directions are temporarily rate limited. Please try again shortly.');
        if (!response.ok) throw new Error(`Walking directions failed with status ${response.status}.`);
        return response.json();
      })
      .then((data) => {
        const route = data.routes?.[0];
        if (!route?.geometry?.coordinates?.length) {
          throw new Error('Mapbox could not find a walking route to this bus stop.');
        }
        if (!cancelled) {
          setWalkingRoute(route.geometry.coordinates);
          onWalkingRouteChange?.({ loading: false, route, error: '' });
        }
      })
      .catch((error) => {
        console.error('Mapbox walking directions failed:', error);
        if (!cancelled) {
          setWalkingRoute([]);
          onWalkingRouteChange?.({ loading: false, route: null, error: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPlace, nearestStops, onWalkingRouteChange]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const sourceId = 'walking-route-source';
    const layerId = 'walking-route-layer';
    if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
    if (walkingRoute.length < 2) return;
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: walkingRoute } },
    });
    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': accentColor, 'line-width': 5, 'line-dasharray': [1, 1] },
    });
  }, [walkingRoute, styleRevision]);

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
          'line-color': accentColor,
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

    startMarker.current = startMarker.current || new mapboxgl.Marker({ element: createMarkerElement('jj-location-marker') });
    endMarker.current = endMarker.current || new mapboxgl.Marker({ element: createMarkerElement('jj-stop-marker') });
    startMarker.current.setLngLat(routePath[0]).addTo(map.current);
    endMarker.current.setLngLat(routePath[routePath.length - 1]).addTo(map.current);
  };

  useEffect(() => {
    let cancelled = false;

    if (!hasPublicMapboxToken || !routePath || routePath.length < 2) {
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

    if (!hasPublicMapboxToken || !destinationQuery.trim()) {
      setLastMile(null);
      return undefined;
    }

    const fetchJson = (url) => fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Mapbox request failed with status ${response.status}`);
      }
      return response.json();
    });

    const geocodeParams = new URLSearchParams({
      q: destinationQuery,
      country: 'ng',
      proximity: '7.3986,9.0765',
      limit: '1',
      access_token: mapboxToken,
    });
    const geocodeUrl = `https://api.mapbox.com/search/geocode/v6/forward?${geocodeParams}`;

    fetchJson(geocodeUrl)
      .then((buildingData) => {
        const feature = buildingData.features?.[0];
        const center = feature?.geometry?.coordinates;
        if (!feature || !Array.isArray(center)) {
          throw new Error('Building could not be located');
        }

        const building = {
          ...feature,
          center,
          place_name: feature.properties?.full_address || feature.properties?.name || destinationQuery,
        };
        const [longitude, latitude] = center;
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

    lastMileMarkers.current.forEach((marker) => marker.remove());
    lastMileMarkers.current = [];

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

    lastMileMarkers.current.push(new mapboxgl.Marker({ element: createMarkerElement('jj-location-marker') }).setLngLat(lastMile.building.center).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lastMile.building.place_name || destinationQuery)).addTo(map.current));
    if (lastMile.stop?.center) {
      lastMileMarkers.current.push(new mapboxgl.Marker({ element: createMarkerElement('jj-stop-marker') }).setLngLat(lastMile.stop.center).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(lastMile.stop.place_name || 'Nearest bus stop')).addTo(map.current));
      bounds.extend(lastMile.stop.center);
    }
    map.current.fitBounds(bounds, { padding: { top: 80, bottom: 360, left: 60, right: 60 }, maxZoom: 16, duration: 700 });
  }, [lastMile, destinationQuery, styleRevision]);

  useEffect(() => {
    if (!map.current) {
      return;
    }

    if (!map.current.isStyleLoaded()) {
      map.current.once('load', drawRoute);
      return;
    }

    drawRoute();
  }, [routePath, roadRoute, styleRevision]);

  useEffect(() => {
    if (!map.current || !currentLocation) {
      return;
    }

    locationMarker.current?.remove();
    locationMarker.current = new mapboxgl.Marker({ element: createMarkerElement('jj-location-marker') })
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

function GoogleTransitMap({ routePath = [], onError, currentLocation = null, mapStyle = 'streets' }) {
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
          mapTypeId: mapStyle === 'satellite' ? 'satellite' : 'roadmap',
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
    map.current?.setMapTypeId(mapStyle === 'satellite' ? 'satellite' : 'roadmap');
  }, [mapStyle]);

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

export default function TransitMap({ routePath = [], destinationQuery = '', currentLocation = null, selectedPlace = null, nearestStops = [], busStops = [], mapStyle = 'streets', onMapCenterChange, onWalkingRouteChange }) {
  if (!hasPublicMapboxToken) {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        <MockTransitMap routePath={routePath} />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl px-4 py-2 shadow-lg text-xs font-semibold z-10">
          Add a Google Maps or Mapbox API key to the project root .env.local to enable the live map.
        </div>
      </div>
    );
  }

  return <MapboxTransitMap routePath={routePath} destinationQuery={destinationQuery} currentLocation={currentLocation} selectedPlace={selectedPlace} nearestStops={nearestStops} busStops={busStops} mapStyle={mapStyle} onMapCenterChange={onMapCenterChange} onWalkingRouteChange={onWalkingRouteChange} />;
}
