import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Clock, MessageSquare, Train, Bus, Info, ChevronDown, ChevronUp, ArrowRight, ArrowDownUp, Bike, CarFront, X, LocateFixed, Flag } from 'lucide-react';
import ActionProgress from './ActionProgress';
import { cn } from '../utils/cn';
import { AnimatePresence, motion } from 'framer-motion';


const getFeatureName = (feature) => (
  feature?.properties?.name
  || feature?.properties?.name_preferred
  || feature?.name
  || feature?.text
  || feature?.properties?.full_address
  || 'Unnamed place'
);

const getFeatureAddress = (feature) => (
  feature?.properties?.full_address
  || feature?.properties?.place_formatted
  || feature?.address
  || feature?.place_name
  || ''
);

const getFeatureCoordinates = (feature) => {
  if (Array.isArray(feature?.geometry?.coordinates)) return feature.geometry.coordinates;
  if (Number.isFinite(Number(feature?.longitude)) && Number.isFinite(Number(feature?.latitude))) {
    return [Number(feature.longitude), Number(feature.latitude)];
  }
  return null;
};

const RouteSearch = ({ onRouteChange, onDestinationQueryChange, onUseLocation, onClearLocation, currentLocation, onSaveTrip, onReport, onRecordSearch, onSubmitRoute, onSubmitFeedback, onSelectDestination, walkingRouteInfo, transitRoute, nearestStops = [], nearestStopsLoading = false, nearestStopsError = '', managedLocations = [], isSignedIn, savedTrip }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [searchStage, setSearchStage] = useState('destination');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [originSuggestionsOpen, setOriginSuggestionsOpen] = useState(false);
  const [destinationSuggestionsOpen, setDestinationSuggestionsOpen] = useState(false);
  const [routeResult, setRouteResult] = useState({ building: true, path: [], totalTime: null });
  const [routeName, setRouteName] = useState('');
  const [isNamingRoute, setIsNamingRoute] = useState(false);
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionStops, setSubmissionStops] = useState('');
  const [submissionFare, setSubmissionFare] = useState('');
  const [submissionLandmarks, setSubmissionLandmarks] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackTags, setFeedbackTags] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingRoute, setIsSubmittingRoute] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);

  useEffect(() => {
    if (currentLocation) {
      setOrigin('Your location');
      setOriginSuggestionsOpen(false);
    } else if (origin === 'Your location') {
      setOrigin('');
    }
  }, [currentLocation]);

  useEffect(() => {
    if (!savedTrip) return;

    setOrigin(savedTrip.origin);
    setDestination(savedTrip.destination);
    setSearchStage('origin');
    setRouteResult({ building: true, path: [], totalTime: null });
    setShowRoutes(true);
    setIsMinimized(false);
    setSaveMessage('Saved route loaded.');
  }, [savedTrip]);

  useEffect(() => {
    if (destination.trim()) return;

    setShowRoutes(false);
    setIsMinimized(false);
    setSearchStage('destination');
    setPlaceSuggestions([]);
    setSelectedDestination(null);
    setSelectedOrigin(null);
    setRouteResult({ building: true, path: [], totalTime: null });
    setSaveMessage('');
  }, [destination]);

  useEffect(() => {
    onRouteChange?.([]);
  }, [onRouteChange]);

  useEffect(() => {
    if (!showRoutes) return;
    if (nearestStopsLoading) {
      setRouteResult({ building: true, path: [], totalTime: null });
      return;
    }
    if (nearestStopsError) {
      setRouteResult({ error: nearestStopsError, path: [], totalTime: null });
      return;
    }
    if (transitRoute?.loading) {
      setRouteResult({ building: true, path: [], totalTime: null });
      return;
    }
    if (transitRoute?.error) {
      setRouteResult({ error: transitRoute.error, path: [], totalTime: null });
      return;
    }
    if (transitRoute?.stops?.length > 1 && transitRoute?.segments?.length) {
      const stops = transitRoute.stops;
      const stopNames = new Map(stops.map((stop) => [Number(stop.id), stop.name]));
      setRouteResult({
        building: false,
        totalTime: transitRoute.totalTimeMinutes,
        path: transitRoute.segments.map((segment) => ({
          mode: segment.mode,
          from: stopNames.get(Number(segment.from_id)) || 'Starting stop',
          to: stopNames.get(Number(segment.to_id)) || 'Next stop',
          minutes: segment.travel_time_minutes,
          fare: segment.fare_range,
          instructions: [],
          note: segment.note || 'Follow this route to the next stop.',
        })),
      });
      return;
    }
    if (!walkingRouteInfo) return;
    if (walkingRouteInfo.loading) {
      setRouteResult({ building: true, path: [], totalTime: null });
      return;
    }
    if (walkingRouteInfo.error) {
      setRouteResult({ error: walkingRouteInfo.error, path: [], totalTime: null });
      return;
    }
    if (walkingRouteInfo.directStop) {
      setRouteResult({
        building: false,
        totalTime: 0,
        path: [{
          mode: 'Major stop',
          from: origin || 'Your location',
          to: walkingRouteInfo.directStop.name,
          minutes: 0,
          fare: 'Destination stop',
          note: `${walkingRouteInfo.directStop.name} is a major transit stop.`,
          instructions: [],
        }],
      });
      return;
    }
    const route = walkingRouteInfo.route;
    if (!route) return;
    const nearestStop = nearestStops[0];
    const durationMinutes = Math.round((route.duration || 0) / 60);
    const distanceMeters = Math.round(route.distance || nearestStop?.walkingDistanceMeters || nearestStop?.distanceMeters || 0);
    setRouteResult({
      building: false,
      totalTime: durationMinutes,
      path: [{
        mode: 'Walking',
        from: origin || 'Your location',
        to: nearestStop?.name || 'Nearest bus stop',
        minutes: durationMinutes,
        fare: `${distanceMeters} m`,
        instructions: route.legs?.flatMap((leg) => leg.steps || []).map((step) => step.maneuver?.instruction).filter(Boolean) || [],
      }],
    });
  }, [walkingRouteInfo, transitRoute, showRoutes, origin, nearestStops]);

  const activeQuery = searchStage === 'destination' ? destination : origin;
  const databaseSuggestions = useMemo(() => {
    const query = activeQuery.trim().toLowerCase();
    if (!query) return [];
    return managedLocations
      .filter((location) => `${location.name} ${location.address || ''}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [activeQuery, managedLocations]);
  const collapsedOrigin = currentLocation ? 'Your location' : origin.trim();
  const collapsedDestination = destination.trim() || 'Choose a destination';

  const routeSummary = useMemo(() => {
    if (routeResult?.error) {
      return routeResult.error;
    }

    return routeResult?.path?.length
      ? `${routeResult.path.length} leg route • ${routeResult.totalTime} mins`
      : 'No route selected';
  }, [routeResult]);

  useEffect(() => {
    const query = activeQuery.trim();
    if (!query) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      return undefined;
    }
    setPlaceSuggestions(databaseSuggestions);
    setIsSearchingPlaces(false);
    return undefined;
  }, [activeQuery, databaseSuggestions]);

  const handleFindRoutes = async () => {
    if (searchStage === 'destination') {
      if (!destination.trim()) return;
      try {
        const features = selectedDestination ? [selectedDestination] : databaseSuggestions;
        const feature = features[0];
        if (!getFeatureCoordinates(feature)) throw new Error('Choose a destination from the available locations.');
        setSelectedDestination(feature);
        setDestination(getFeatureName(feature));
        setPlaceSuggestions([]);
        setSearchStage('origin');
        setRouteResult({ building: true, path: [], totalTime: null });
      } catch (error) {
        setRouteResult({ error: error.message });
      }
      return;
    }

    const validOrigin = origin.trim();
    if (!validOrigin && !currentLocation) return;
    try {
      const features = currentLocation
        ? []
      : selectedOrigin ? [selectedOrigin] : databaseSuggestions;
      const originFeature = features[0];
      if (!currentLocation && !getFeatureCoordinates(originFeature)) {
      throw new Error('Choose a starting place from the available locations.');
      }
      setSelectedOrigin(originFeature || null);
      const destinationFeature = selectedDestination;
      const destinationCoordinates = getFeatureCoordinates(destinationFeature);
      if (!destinationCoordinates) throw new Error('Choose a destination from the available locations.');
      const [longitude, latitude] = destinationCoordinates;
      onSelectDestination?.({
        id: destinationFeature.id,
        name: getFeatureName(destinationFeature),
        placeName: getFeatureAddress(destinationFeature) || destination,
        longitude,
        latitude,
        originStopId: originFeature?.stop_id || null,
        destinationStopId: destinationFeature.stop_id || null,
      });
      setShowRoutes(true);
      setIsMinimized(false);
      setRouteResult({ building: true, path: [], totalTime: null });
      onRouteChange?.([]);
      onRecordSearch?.({ origin: validOrigin || 'Your location', destination });
    } catch (error) {
      setRouteResult({ error: error.message || 'Could not find that destination.' });
      setShowRoutes(false);
    }
  };

  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
    setSearchStage('destination');
    setOriginSuggestionsOpen(false);
    setDestinationSuggestionsOpen(false);
  };

  const handleAddDirections = async () => {
    if (!isSignedIn) {
      setSaveMessage('Sign in to save routes.');
      return;
    }

    const trimmedName = routeName.trim();
    if (!trimmedName) {
      setIsNamingRoute(true);
      setSaveMessage('Give this saved route a name.');
      return;
    }

    setIsSavingRoute(true);
    setSaveMessage('');
    try {
      await onSaveTrip?.({
        routeName: trimmedName,
        origin,
        destination,
        routeData: { path: routeResult.path || [], currentLocation },
      });
      setSaveMessage('Route saved to Transit History.');
      setRouteName('');
      setIsNamingRoute(false);
    } catch (error) {
      setSaveMessage(error.message || 'Could not save route.');
    } finally {
      setIsSavingRoute(false);
    }
  };

  const handleSubmitRoute = async () => {
    if (!isSignedIn) {
      setSaveMessage('Sign in to submit a route.');
      return;
    }
    setIsSubmittingRoute(true);
    try {
      await onSubmitRoute?.({ origin, destination, stops: submissionStops.split(',').map((stop) => stop.trim()).filter(Boolean), fare: submissionFare, landmarks: submissionLandmarks });
      setShowSubmissionForm(false);
      setSubmissionStops('');
      setSubmissionFare('');
      setSubmissionLandmarks('');
      setSaveMessage('Route submitted for review.');
    } catch (error) {
      setSaveMessage(error.message || 'Could not submit route.');
    } finally {
      setIsSubmittingRoute(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!isSignedIn) {
      setFeedbackMessage('Sign in to rate this route.');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await onSubmitFeedback?.({ routeName: `${origin} to ${destination}`, rating: feedbackRating, comment: feedbackComment, tags: feedbackTags });
      setFeedbackComment('');
      setFeedbackTags([]);
      setFeedbackMessage('Thanks. Your feedback is awaiting moderation.');
    } catch (error) {
      setFeedbackMessage(error.message || 'Could not submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handlePointerDown = (event) => {
    dragStartY.current = event.clientY;
    dragCurrentY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (event.buttons === 0) {
      return;
    }

    dragCurrentY.current = event.clientY;
  };

  const handlePointerUp = () => {
    const delta = dragCurrentY.current - dragStartY.current;

    if (delta > 80) {
      setIsMinimized(true);
    } else if (delta < -80) {
      setIsMinimized(false);
      setShowRoutes(Boolean(destination.trim()));
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        'bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full flex flex-col overflow-hidden transition-[height] duration-300 ease-out',
        isMinimized ? 'h-28' : showRoutes ? 'h-[min(70vh,680px)]' : 'h-auto',
      )}
      transition={{ layout: { type: 'spring', stiffness: 280, damping: 30 } }}
    >
      <div
        className="p-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <button
          type="button"
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
              return;
            }
            setIsMinimized(true);
          }}
          className="group flex h-5 w-20 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D1A36]"
          aria-label={isMinimized ? 'Expand route search' : 'Minimize route search'}
        >
          <span className="h-1.5 w-12 rounded-full bg-zinc-200 transition-colors group-hover:bg-[#6D1A36]" />
          {isMinimized ? <ChevronUp size={14} className="ml-1 text-zinc-400" /> : <ChevronDown size={14} className="ml-1 text-zinc-400" />}
        </button>
      </div>

      <div className="px-6 py-4 flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
        {(!showRoutes || !destination.trim()) && !isMinimized && (
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900">Where are you going?</h2>
            <p className="text-zinc-500 text-sm">Find the nearest bus stop and get walking directions.</p>
          </div>
        )}

        <AnimatePresence initial={false} mode="sync">
        {isMinimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-3 pb-2"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Transit</div>
              <div className="font-bold text-zinc-900 text-sm">
                {collapsedOrigin ? `${collapsedOrigin} → ` : ''}{collapsedDestination}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="relative space-y-3">
              {searchStage === 'origin' && (
              <div className="relative">
                <div className="pointer-events-none absolute left-10 top-1.5 z-10 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">From</div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                </div>
                <input
                  type="text"
                  value={origin}
                  onFocus={() => setOriginSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setOriginSuggestionsOpen(false), 120)}
                  onChange={(event) => {
                    if (currentLocation) onClearLocation?.();
                    setOrigin(event.target.value);
                    setSelectedOrigin(null);
                    setOriginSuggestionsOpen(true);
                    if (showRoutes) {
                      setShowRoutes(false);
                      onSelectDestination?.(null);
                      onRouteChange?.([]);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleFindRoutes();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Starting point"
                  className={cn(
                    'w-full pl-10 pr-11 pt-5 pb-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6D1A36] transition-all text-sm font-medium',
                    currentLocation && 'bg-blue-50/60 text-blue-900',
                  )}
                />
                {origin && !currentLocation && <button type="button" onClick={() => {
                  setOrigin('');
                  setSelectedOrigin(null);
                  if (showRoutes) {
                    setShowRoutes(false);
                    onSelectDestination?.(null);
                    onRouteChange?.([]);
                  }
                }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700" aria-label="Clear starting point"><X size={15} /></button>}
                {originSuggestionsOpen && !currentLocation && origin.trim() && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-zinc-100 bg-white shadow-xl overflow-hidden">
                    {isSearchingPlaces && <div className="px-4 py-3 text-xs text-zinc-500">Searching places...</div>}
                    {placeSuggestions.map((feature) => (
                      <button
                        key={`${feature.location_type || 'location'}-${feature.id}`}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setOrigin(getFeatureName(feature));
                          setSelectedOrigin(feature);
                          setOriginSuggestionsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-[#FCD0A1]/20 transition-colors"
                      >
                        <span className="block font-semibold">{getFeatureName(feature)}</span>
                        <span className="block truncate text-xs text-zinc-500">{getFeatureAddress(feature)}</span>
                      </button>
                    ))}
                    {!isSearchingPlaces && placeSuggestions.length === 0 && (
                      <div className="px-4 py-3 text-sm text-zinc-500">No matching locations in JagaJaga yet.</div>
                    )}
                  </div>
                )}
                <div className="absolute left-[21px] top-[70%] w-[1px] h-10 bg-zinc-100" />
              </div>
              )}
              {searchStage === 'origin' && <button
                type="button"
                onClick={currentLocation ? onClearLocation : onUseLocation}
                className="flex items-center gap-2 text-xs font-bold text-[#6D1A36] hover:text-zinc-900"
              >
                {currentLocation ? <X size={14} /> : <LocateFixed size={14} />}
                {currentLocation ? 'Stop using my location' : 'Use my current location'}
              </button>}

              {searchStage === 'destination' ? (
              <div className="relative">
                <div className="pointer-events-none absolute left-10 top-1.5 z-10 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">To</div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <MapPin size={18} className="text-[#6D1A36]" />
                </div>
                <input
                  type="text"
                  value={destination}
                  onFocus={() => setDestinationSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setDestinationSuggestionsOpen(false), 120)}
                  onChange={(event) => {
                    const nextDestination = event.target.value;
                    setDestination(nextDestination);
                    if (!nextDestination.trim()) {
                      onSelectDestination?.(null);
                      onDestinationQueryChange?.('');
                    }
                    setDestinationSuggestionsOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleFindRoutes();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Where are you heading?"
                  className="w-full pl-10 pr-11 pt-5 pb-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6D1A36] transition-all text-sm font-medium"
                />
                {destination && <button type="button" onClick={() => {
                  setDestination('');
                  onSelectDestination?.(null);
                  onDestinationQueryChange?.('');
                }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700" aria-label="Clear destination"><X size={15} /></button>}
                {destinationSuggestionsOpen && destination.trim() && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-zinc-100 bg-white shadow-xl overflow-hidden">
                    {isSearchingPlaces && <div className="px-4 py-3 text-xs text-zinc-500">Searching places...</div>}
                    {placeSuggestions.map((feature) => (
                      <button
                        key={`${feature.location_type || 'location'}-${feature.id}`}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setDestination(getFeatureName(feature));
                          setSelectedDestination(feature);
                          setDestinationSuggestionsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-[#FCD0A1]/20 transition-colors"
                      >
                        <span className="block font-semibold">{getFeatureName(feature)}</span>
                        <span className="block truncate text-xs text-zinc-500">{getFeatureAddress(feature)}</span>
                      </button>
                    ))}
                    {!isSearchingPlaces && placeSuggestions.length === 0 && (
                      <div className="px-4 py-3 text-sm text-zinc-500">No matching locations in JagaJaga yet.</div>
                    )}
                  </div>
                )}
              </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowRoutes(false);
                    setSearchStage('destination');
                    setSelectedDestination(null);
                    setDestinationSuggestionsOpen(true);
                    onSelectDestination?.(null);
                    onRouteChange?.([]);
                  }}
                  aria-label={`Edit destination: ${destination}`}
                  title="Edit destination"
                  className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-left hover:border-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D1A36]"
                >
                  <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">To</div>
                  <div className="mt-1 truncate text-sm font-semibold text-zinc-800">{destination}</div>
                </button>
              )}
              {searchStage === 'origin' && <button
                type="button"
                onClick={handleSwapLocations}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 text-[#6D1A36] shadow-sm transition-transform hover:rotate-180 hover:border-[#6D1A36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D1A36]"
                aria-label="Swap starting point and destination"
              >
                <ArrowDownUp size={15} />
              </button>}
            </div>

            <AnimatePresence initial={false} mode="wait">
            {!showRoutes ? (
              <motion.button
                key="find"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                onClick={handleFindRoutes}
                disabled={searchStage === 'destination' ? !destination.trim() : (!origin.trim() && !currentLocation)}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg shadow-zinc-200 active:scale-[0.98] mb-4 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {searchStage === 'destination' ? 'Next' : 'Find Best Routes'}
              </motion.button>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 22 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-zinc-800">Verified route</h3>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">{routeSummary}</div>
                  </div>
                  <button
                    onClick={() => setShowRoutes(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                    aria-label="Hide routes"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>

                <div className="mb-4 space-y-2">
                  {isNamingRoute && (
                    <input
                      type="text"
                      value={routeName}
                      onChange={(event) => setRouteName(event.target.value)}
                      placeholder="Name this route"
                      maxLength={80}
                      autoFocus
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6D1A36]"
                    />
                  )}
                  <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddDirections}
                    disabled={isSavingRoute}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6D1A36] px-3 py-2 text-xs font-bold text-[#FCD0A1] disabled:cursor-not-allowed disabled:opacity-50"
                    title={isNamingRoute ? 'Save this named route' : 'Save this route and destination'}
                  >
                    {isSavingRoute ? <ActionProgress label="Saving..." compact /> : <><ArrowRight size={14} /> {isNamingRoute ? 'Confirm save' : 'Save'}</>}
                  </button>
                  </div>
                  {saveMessage && <p className="text-xs font-semibold text-zinc-500">{saveMessage}</p>}
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 pb-4 scrollbar-hide">
                  {routeResult?.building ? (
                    <div className="rounded-2xl border border-[#FCD0A1] bg-[#FFF7F0] p-4 text-sm text-zinc-700">
                      <div className="font-bold text-zinc-900">Finding your nearest bus stop</div>
                      <p className="mt-2 leading-relaxed">We are checking nearby stops and choosing the one with the shortest walking time.</p>
                      <div className="mt-3 text-xs font-semibold text-[#6D1A36]">Walking directions will appear here when ready.</div>
                    </div>
                  ) : routeResult?.error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                      {routeResult.error}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[#FCD0A1] bg-[#FFF7F0] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6D1A36]">Route</div>
                            <div className="font-bold text-zinc-900 mt-1">{origin} <ArrowRight className="inline-block mx-1" size={14} /> {destination}</div>
                          </div>
                          <div className="bg-[#6D1A36] text-[#FCD0A1] px-2 py-1 rounded-lg text-xs font-bold">
                            ~{routeResult.totalTime} min
                          </div>
                        </div>
                      </div>
                      {routeResult.path.map((step, index) => {
                        const modeLower = step.mode.toLowerCase();
                        let ModeIcon = Train;
                        if (modeLower.includes('bus')) ModeIcon = Bus;
                        else if (modeLower.includes('bike') || modeLower.includes('okada')) ModeIcon = Bike;
                        else if (modeLower.includes('keke') || modeLower.includes('taxi')) ModeIcon = CarFront;

                        return (
                          <div
                            key={`${step.from}-${step.to}-${index}`}
                            className="group border border-zinc-100 rounded-2xl p-4 hover:border-[#6D1A36]/20 hover:bg-[#6D1A36]/5 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex gap-3">
                                <div className="p-2.5 rounded-xl text-white shadow-sm bg-[#6D1A36]">
                                  <ModeIcon size={20} />
                                </div>
                                <div>
                                  <div className="font-bold text-zinc-900 leading-tight">{step.from} → {step.to}</div>
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {step.minutes} min</span>
                                    <span>•</span>
                                    <span>{step.fare}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-[9px] font-bold uppercase text-zinc-500">Leg {index + 1}</div>
                            </div>

                            <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100 flex gap-3">
                              <div className="mt-0.5"><MessageSquare size={14} className="text-[#6D1A36]" /></div>
                              <div className="text-xs text-zinc-600 leading-relaxed">
                                <span className="font-semibold text-zinc-800">{step.mode}</span>
                                <span className="mx-1 text-zinc-400">•</span>
                                {step.note}
                                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                                  Stop: {step.to}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onReport?.({ reportType: 'route_issue', locationName: step.to, message: `Reported route leg: ${step.from} to ${step.to}` })}
                              disabled={!isSignedIn}
                              className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title={isSignedIn ? 'Report an issue with this route leg' : 'Sign in to report an issue'}
                            >
                              <Flag size={12} /> Report
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <Info size={14} className="shrink-0" />
                    <span>Routes and walking times are provided by Mapbox and may change with conditions.</span>
                  </div>
                  <button type="button" onClick={() => setShowSubmissionForm((open) => !open)} className="flex w-full items-center justify-center rounded-xl border border-[#FCD0A1] px-3 py-2.5 text-xs font-bold text-[#6D1A36] hover:bg-[#FFF7F0]">Submit a new route</button>
                  {showSubmissionForm && (
                    <div className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <input value={submissionStops} onChange={(event) => setSubmissionStops(event.target.value)} placeholder="Stops, separated by commas" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                      <input value={submissionFare} onChange={(event) => setSubmissionFare(event.target.value)} placeholder="Fare (optional)" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                      <input value={submissionLandmarks} onChange={(event) => setSubmissionLandmarks(event.target.value)} placeholder="Landmarks or notes (optional)" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                      <button type="button" onClick={handleSubmitRoute} disabled={isSubmittingRoute} className="w-full rounded-lg bg-[#6D1A36] px-3 py-2 text-xs font-bold text-[#FCD0A1] disabled:cursor-wait disabled:opacity-70">
                        {isSubmittingRoute ? <ActionProgress label="Submitting..." compact /> : 'Submit route'}
                      </button>
                    </div>
                  )}
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <h4 className="text-sm font-bold text-zinc-900">Rate this route</h4>
                    <div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => setFeedbackRating(rating)} className={`text-lg ${rating <= feedbackRating ? 'text-amber-500' : 'text-zinc-300'}`} aria-label={`${rating} stars`}>★</button>)}</div>
                    <div className="mt-2 flex flex-wrap gap-2">{['fast', 'crowded', 'unsafe at night'].map((tag) => <button key={tag} type="button" onClick={() => setFeedbackTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} className={`rounded-full border px-2 py-1 text-[10px] font-bold ${feedbackTags.includes(tag) ? 'border-[#6D1A36] bg-[#FFF7F0] text-[#6D1A36]' : 'border-zinc-200 text-zinc-500'}`}>{tag}</button>)}</div>
                    <textarea value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="Leave a comment" className="mt-2 min-h-16 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
                    <button type="button" onClick={handleSubmitFeedback} disabled={isSubmittingFeedback} className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 disabled:cursor-wait disabled:opacity-70">
                      {isSubmittingFeedback ? <ActionProgress label="Submitting..." compact /> : 'Submit feedback'}
                    </button>
                    {feedbackMessage && <p className="mt-2 text-xs font-semibold text-zinc-500">{feedbackMessage}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onReport?.({ reportType: 'route_issue', locationName: `${origin} to ${destination}`, message: `Reported route: ${origin} to ${destination}` })}
                    disabled={!isSignedIn}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={isSignedIn ? 'Report this route' : 'Sign in to report this route'}
                  >
                    <Flag size={14} /> Report route
                  </button>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RouteSearch;