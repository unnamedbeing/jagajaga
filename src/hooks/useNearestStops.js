import { useCallback, useState } from 'react';
import { API_URL } from '../utils/api';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

async function rankByWalkingTime(origin, stops) {
  if (!mapboxToken || !mapboxToken.startsWith('pk.') || stops.length === 0) {
    return stops;
  }

  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    ...stops.map((stop) => `${stop.longitude},${stop.latitude}`),
  ].join(';');
  const params = new URLSearchParams({
    sources: '0',
    annotations: 'duration,distance',
    access_token: mapboxToken,
  });
  const response = await fetch(`https://api.mapbox.com/directions-matrix/v1/mapbox/walking/${coordinates}?${params}`);
  if (response.status === 429) {
    throw new Error('Mapbox rate limit reached. Please wait a moment and try again.');
  }
  if (!response.ok) {
    throw new Error(`Walking-time lookup failed with status ${response.status}.`);
  }

  const data = await response.json();
  const durations = data.durations?.[0] || [];
  const distances = data.distances?.[0] || [];
  return stops
    .map((stop, index) => ({
      ...stop,
      walkingDurationSeconds: durations[index + 1],
      walkingDistanceMeters: distances[index + 1],
    }))
    .filter((stop) => Number.isFinite(stop.walkingDurationSeconds))
    .sort((a, b) => (
      Number(b.is_major) - Number(a.is_major)
      || a.walkingDurationSeconds - b.walkingDurationSeconds
    ));
}

export default function useNearestStops() {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const findNearestStops = useCallback(async ({ latitude, longitude, radius = 500 }) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/nearest-stops?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}&radius=${radius}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not find nearby bus stops.');
      const rankedStops = await rankByWalkingTime(
        { longitude, latitude },
        Array.isArray(data.stops) ? data.stops : [],
      );
      setStops(rankedStops);
      return rankedStops;
    } catch (requestError) {
      setStops([]);
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const suggestStop = useCallback(async ({ name, city = 'Abuja', latitude, longitude }) => {
    const response = await fetch(`${API_URL}/api/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, city, latitude, longitude }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not suggest this stop.');
    return data.stop;
  }, []);

  return { stops, loading, error, findNearestStops, suggestStop };
}
