import { useCallback, useState } from 'react';

export default function useNearestStops() {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const findNearestStops = useCallback(async ({ latitude, longitude, radius = 500 }) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/nearest-stops?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}&radius=${radius}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not find nearby bus stops.');
      setStops(Array.isArray(data.stops) ? data.stops : []);
      return data.stops || [];
    } catch (requestError) {
      setStops([]);
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const suggestStop = useCallback(async ({ name, city = 'Abuja', latitude, longitude }) => {
    const response = await fetch('/api/stops', {
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
