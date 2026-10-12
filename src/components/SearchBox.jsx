import { useEffect, useState } from 'react';
import { LocateFixed, MapPin, Search, X } from 'lucide-react';

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function SearchBox({
  mapCenter = [7.3986, 9.0765],
  selectedPlace,
  nearestStops = [],
  loading = false,
  error = '',
  onSelect,
  onUseLocation,
  onSuggestStop,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [stopName, setStopName] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState('');

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || !mapboxToken) {
      setSuggestions([]);
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const proximity = `${mapCenter[0]},${mapCenter[1]}`;
        const response = await fetch(
          `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(trimmedQuery)}&country=ng&proximity=${proximity}&limit=5&access_token=${mapboxToken}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Place search failed with status ${response.status}`);
        }
        const data = await response.json();
        setSuggestions(Array.isArray(data.features) ? data.features : []);
      } catch (searchError) {
        if (searchError.name !== 'AbortError') {
          console.error('Mapbox place search failed:', searchError);
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, mapCenter]);

  const handleSelect = (feature) => {
    const [longitude, latitude] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
    setQuery(feature.properties?.name || feature.text || feature.place_name || '');
    setSuggestions([]);
    onSelect?.({
      id: feature.id,
      name: feature.properties?.name || feature.text || feature.place_name,
      placeName: feature.properties?.full_address || feature.place_name,
      longitude,
      latitude,
    });
  };

  const handleSuggestionSubmit = async (event) => {
    event.preventDefault();
    setSuggestionMessage('');
    try {
      await onSuggestStop?.({
        name: stopName,
        city: 'Abuja',
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      });
      setStopName('');
      setShowSuggestionForm(false);
      setSuggestionMessage('Thanks. Your stop suggestion was added for review.');
    } catch (suggestionError) {
      setSuggestionMessage(suggestionError.message);
    }
  };

  const noStops = selectedPlace && !loading && !error && nearestStops.length === 0;

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/95 p-2 shadow-xl backdrop-blur-md">
        <Search size={18} className="ml-2 shrink-0 text-zinc-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a place near a bus stop"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-medium text-zinc-900 outline-none"
          aria-label="Search for a place"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setSuggestions([]); }} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Clear search">
            <X size={16} />
          </button>
        )}
        <button type="button" onClick={onUseLocation} className="rounded-xl bg-[#6D1A36] p-2 text-[#FCD0A1]" title="Use my location" aria-label="Use my location">
          <LocateFixed size={17} />
        </button>
      </div>

      {(isSearching || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xl">
          {isSearching && <div className="px-4 py-3 text-xs text-zinc-500">Searching places...</div>}
          {suggestions.map((feature) => (
            <button key={feature.id} type="button" onClick={() => handleSelect(feature)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#FFF7F0]">
              <MapPin size={16} className="mt-0.5 shrink-0 text-[#6D1A36]" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-900">{feature.properties?.name || feature.text}</span>
                <span className="block truncate text-xs text-zinc-500">{feature.properties?.full_address || feature.place_name}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedPlace && (
        <div className="mt-2 rounded-2xl border border-white/30 bg-white/95 px-4 py-3 text-xs shadow-lg backdrop-blur-md">
          {loading && <p className="font-semibold text-zinc-600">Finding nearby bus stops...</p>}
          {error && <p className="font-semibold text-red-600">{error}</p>}
          {nearestStops.length > 0 && !loading && (
            <div>
              <p className="font-bold text-zinc-900">Nearest stops</p>
              <ol className="mt-1 space-y-1 text-zinc-600">
                {nearestStops.map((stop, index) => (
                  <li key={stop.id} className={index === 0 ? 'font-bold text-[#6D1A36]' : ''}>
                    {stop.name} · {Math.round(stop.distanceMeters)} m
                  </li>
                ))}
              </ol>
            </div>
          )}
          {noStops && (
            <div>
              <p className="font-semibold text-zinc-700">No stops nearby. Know one? Add it.</p>
              {!showSuggestionForm ? (
                <button type="button" onClick={() => setShowSuggestionForm(true)} className="mt-2 rounded-lg bg-[#6D1A36] px-3 py-2 font-bold text-[#FCD0A1]">Suggest a stop</button>
              ) : (
                <form onSubmit={handleSuggestionSubmit} className="mt-2 flex gap-2">
                  <input required value={stopName} onChange={(event) => setStopName(event.target.value)} placeholder="Stop name" className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 py-2" />
                  <button type="submit" className="rounded-lg bg-[#6D1A36] px-3 py-2 font-bold text-[#FCD0A1]">Add</button>
                </form>
              )}
              {suggestionMessage && <p className="mt-2 text-zinc-500">{suggestionMessage}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
