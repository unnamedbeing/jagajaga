import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Clock, MessageSquare, Train, Bus, Info, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

const VERIFIED_ABUJA_TRANSIT = {
  "Berger Bus Stop": [
    ["Wuse Market", 10, "₦300 - ₦800", "Commercial Bus / Shared Taxi", "Intra-city Link"],
    ["Jabi Park", 10, "₦200 - ₦500", "Keke Napep / Taxi", "Intra-city Hub Link"],
    ["Area 1", 15, "₦75 - ₦900", "AUMTCO Bus / Shared Taxi", "AUMTCO Route / Express"],
    ["Gwarinpa (1st Avenue / Charlie Boy)", 20, "₦600 - ₦900", "Shared Taxi", "Zuba Corridor"],
    ["Kubwa (Phase 4 / Gate 1)", 25, "₦400 - ₦1,200", "Commercial Bus / Taxi", "Kubwa Expressway"],
    ["Nyanya", 30, "₦150 - ₦200", "AUMTCO Bus", "Commuter Route"],
    ["Karu Bridge", 25, "₦800 - ₦1,000", "Commercial Bus / Shared Taxi", "Karu Express Corridor"],
    ["Utako Motor Park", 8, "₦200 - ₦400", "Keke / Taxi", "Interstate Terminal Access"],
    ["Magic Land Axis", 12, "₦200 - ₦400", "Commercial Bus", "Airport Road Direction"],
  ],
  "Wuse Market": [
    ["Berger Bus Stop", 10, "₦300 - ₦800", "Commercial Bus / Taxi", "Intra-city Link"],
    ["Zone 4 Underbridge", 5, "₦150 - ₦250", "Shared Taxi / Keke", "Inner Wuse Link"],
    ["Area 1", 15, "₦150 - ₦300", "Shared Taxi / Bus", "Central Axis"],
    ["Federal Secretariat", 10, "₦200 - ₦300", "Shared Taxi", "Civil Service Direct"],
    ["Banex", 8, "₦200 - ₦300", "Shared Taxi / Keke", "Wuse 2 Axis"],
    ["Maitama (Nicon Junction)", 12, "₦300 - ₦500", "Shared Taxi", "Maitama Link"],
    ["Mpape Junction", 20, "₦150 - ₦200", "AUMTCO Bus", "AUMTCO Route"],
    ["Karu Bridge", 25, "₦800 - ₦1,000", "Commercial Bus / Shared Taxi", "Karu Express Corridor"],
  ],
  "Zone 4 Underbridge": [
    ["Wuse Market", 5, "₦150 - ₦250", "Keke / Taxi", "Wuse Link"],
    ["Federal Secretariat", 8, "₦200 - ₦300", "Shared Taxi", "Central Axis"],
    ["Area 1", 12, "₦200 - ₦300", "Commercial Bus", "Central Axis"],
  ],
  "Federal Secretariat": [
    ["Wuse Market", 10, "₦200 - ₦300", "Shared Taxi", "City Center Link"],
    ["A.Y.A (Asokoro)", 8, "₦200 - ₦300", "Shared Taxi", "Asokoro Direct"],
    ["Area 1", 10, "₦200 - ₦300", "Shared Taxi / Bus", "Garki Link"],
  ],
  "Area 1": [
    ["Berger Bus Stop", 15, "₦75 - ₦900", "AUMTCO Bus / Taxi", "Via Mosque"],
    ["Area 3 Junction", 5, "₦100 - ₦200", "Keke / Walk", "Inner Garki"],
    ["Apo Roundabout", 10, "₦200 - ₦300", "Shared Taxi / Keke", "Southern Axis"],
    ["Galadimawa Roundabout", 12, "₦200 - ₦400", "Shared Taxi / Bus", "Lokogoma Axis"],
    ["Lugbe (F.H.A.)", 20, "₦300 - ₦600", "Commercial Bus / Taxi", "Airport Expressway"],
    ["A.Y.A (Asokoro)", 12, "₦200 - ₦400", "Shared Taxi / Bus", "Inner Ring Road"],
    ["Nyanya", 25, "₦150 - ₦200", "AUMTCO Bus", "AUMTCO Mass Transit"],
  ],
  "Area 3 Junction": [
    ["Area 1", 5, "₦100 - ₦200", "Keke / Walk", "Garki Hub"],
    ["Apo Roundabout", 8, "₦150 - ₦250", "Keke / Taxi", "Apo Axis"],
  ],
  "Apo Roundabout": [
    ["Area 1", 10, "₦200 - ₦300", "Shared Taxi / Keke", "Garki Link"],
    ["Galadimawa Roundabout", 10, "₦200 - ₦300", "Shared Taxi", "Southern Ring Road"],
  ],
  "Galadimawa Roundabout": [
    ["Area 1", 12, "₦200 - ₦400", "Shared Taxi / Bus", "Garki Link"],
    ["Lokogoma Junction", 5, "₦150 - ₦250", "Keke / Taxi", "Lokogoma Branch"],
    ["Lugbe (F.H.A.)", 15, "₦300 - ₦500", "Shared Taxi", "Airport Road Link"],
  ],
  "Lokogoma Junction": [
    ["Galadimawa Roundabout", 5, "₦150 - ₦250", "Keke / Taxi", "Galadimawa Link"],
  ],
  "Magic Land Axis": [
    ["Lugbe (F.H.A.)", 12, "₦200 - ₦400", "Commercial Bus / Taxi", "Airport Road Line"],
  ],
  "Lugbe (F.H.A.)": [
    ["Lugbe Police Signboard", 5, "₦100 - ₦200", "Keke / Taxi", "Local Axis"],
    ["Airport Junction", 10, "₦200 - ₦300", "Commercial Bus", "Airport Road Line"],
    ["Area 1", 20, "₦300 - ₦600", "Commercial Bus / Taxi", "Garki Express"],
  ],
  "Lugbe Police Signboard": [
    ["Lugbe (F.H.A.)", 5, "₦100 - ₦200", "Keke / Taxi", "Local Axis"],
    ["Airport Junction", 8, "₦150 - ₦250", "Commercial Bus", "Airport Line"],
  ],
  "Airport Junction": [
    ["Lugbe (F.H.A.)", 10, "₦200 - ₦300", "Commercial Bus", "Town Outbound"],
    ["Nnamdi Azikiwe Airport", 15, "₦2,500 - ₦4,000", "Shuttle / Express Taxi", "Airport Direct"],
    ["Giri Junction", 15, "₦300 - ₦500", "Commercial Bus", "Gwagwalada Line"],
  ],
  "Banex": [
    ["Wuse Market", 8, "₦200 - ₦300", "Shared Taxi / Keke", "Wuse 2 Axis"],
    ["Mabushi Roundabout", 5, "₦150 - ₦250", "Commercial Bus / Keke", "Expressway Link"],
    ["Maitama (Nicon Junction)", 5, "₦150 - ₦250", "Shared Taxi", "Maitama Axis"],
  ],
  "Mabushi Roundabout": [
    ["Banex", 5, "₦150 - ₦250", "Commercial Bus / Keke", "Wuse Axis"],
    ["Jahi Junction", 5, "₦150 - ₦250", "Commercial Bus", "Kubwa Express"],
  ],
  "Jahi Junction": [
    ["Mabushi Roundabout", 5, "₦150 - ₦250", "Commercial Bus", "Inbound Town"],
    ["Katampe", 5, "₦150 - ₦250", "Commercial Bus", "Kubwa Express"],
  ],
  "Katampe": [
    ["Jahi Junction", 5, "₦150 - ₦250", "Commercial Bus", "Inbound Town"],
    ["Gwarinpa (1st Avenue / Charlie Boy)", 8, "₦200 - ₦300", "Commercial Bus / Taxi", "Suburban Line"],
  ],
  "Gwarinpa (1st Avenue / Charlie Boy)": [
    ["Berger Bus Stop", 20, "₦600 - ₦900", "Shared Taxi", "City Center Direct"],
    ["Dutse Junction", 10, "₦200 - ₦300", "Commercial Bus", "Kubwa Express"],
  ],
  "Dutse Junction": [
    ["Gwarinpa (1st Avenue / Charlie Boy)", 10, "₦200 - ₦300", "Commercial Bus", "Town Direct"],
    ["Public Service Institute", 5, "₦150 - ₦200", "Commercial Bus", "Kubwa Line"],
  ],
  "Public Service Institute": [
    ["Kubwa (Phase 4 / Gate 1)", 8, "₦200 - ₦300", "Commercial Bus / Keke", "Kubwa Line"],
  ],
  "Kubwa (Phase 4 / Gate 1)": [
    ["Berger Bus Stop", 25, "₦400 - ₦1,200", "Commercial Bus / Taxi", "Town Express"],
    ["Dei-Dei", 12, "₦200 - ₦300", "Commercial Bus", "Outer Line"],
  ],
  "Dei-Dei": [
    ["Kubwa (Phase 4 / Gate 1)", 12, "₦200 - ₦300", "Commercial Bus", "Suburban Line"],
    ["Zuba", 12, "₦200 - ₦400", "Commercial Bus", "Outer Highway"],
  ],
  "Zuba": [
    ["Dei-Dei", 12, "₦200 - ₦400", "Commercial Bus", "Suburban Line"],
  ],
  "A.Y.A (Asokoro)": [
    ["Area 1", 12, "₦200 - ₦400", "Shared Taxi / Bus", "Inner Ring Link"],
    ["Federal Secretariat", 8, "₦200 - ₦300", "Shared Taxi", "CBD Direct"],
    ["Kugbo Junction", 10, "₦200 - ₦300", "Commercial Bus / Taxi", "Nyanya Axis"],
    ["Karu Bridge", 12, "₦500 - ₦700", "Commercial Bus / Shared Taxi", "Karu Expressway"],
  ],
  "Kugbo Junction": [
    ["A.Y.A (Asokoro)", 10, "₦200 - ₦300", "Commercial Bus / Taxi", "Asokoro Link"],
    ["Nyanya", 10, "₦200 - ₦300", "Commercial Bus / Taxi", "Nyanya Line"],
  ],
  "Karu Bridge": [
    ["A.Y.A (Asokoro)", 12, "₦500 - ₦700", "Commercial Bus / Shared Taxi", "Inbound Asokoro"],
    ["Wuse Market", 25, "₦800 - ₦1,000", "Commercial Bus / Shared Taxi", "Inbound Wuse Direct"],
    ["Berger Bus Stop", 25, "₦800 - ₦1,000", "Commercial Bus / Shared Taxi", "Inbound Berger Direct"],
    ["Nyanya", 8, "₦150 - ₦250", "Commercial Bus / Keke", "Outbound Nyanya Line"],
  ],
  "Nyanya": [
    ["Kugbo Junction", 10, "₦200 - ₦300", "Commercial Bus", "Asokoro Line"],
    ["Karu Bridge", 8, "₦150 - ₦250", "Commercial Bus / Keke", "Inbound Karu Axis"],
    ["Mararaba (Boundary)", 8, "₦150 - ₦250", "Keke / Commercial Bus", "State Border Link"],
    ["Berger Bus Stop", 30, "₦150 - ₦200", "AUMTCO Bus", "AUMTCO Mass Transit"],
    ["Area 1", 25, "₦150 - ₦200", "AUMTCO Bus", "AUMTCO Mass Transit"],
  ],
  "Mararaba (Boundary)": [
    ["Nyanya", 8, "₦150 - ₦250", "Keke / Commercial Bus", "Nyanya Link"],
  ],
  "Giri Junction": [
    ["Airport Junction", 15, "₦300 - ₦500", "Commercial Bus", "Airport Expressway Link"],
    ["Gwagwalada", 15, "₦300 - ₦500", "Commercial Bus", "Gwagwalada Main"],
  ],
  "Gwagwalada": [
    ["Giri Junction", 15, "₦300 - ₦500", "Commercial Bus", "Outer Link"],
    ["Area 1", 40, "₦300 - ₦400", "AUMTCO Bus", "AUMTCO Express"],
  ],
  "Mpape Junction": [
    ["Wuse Market", 20, "₦150 - ₦200", "AUMTCO Bus", "Suburban Line"],
  ],
  "Bwari": [
    ["Wuse Market", 45, "₦200 - ₦250", "AUMTCO Bus", "Outer District Line"],
  ],
  "Kuje": [
    ["Lugbe (F.H.A.)", 20, "₦300 - ₦500", "Commercial Bus", "Kuje Expressway"],
  ],
  "Utako Motor Park": [
    ["Berger Bus Stop", 8, "₦200 - ₦400", "Keke / Taxi", "Terminal Access"],
  ],
  "Jabi Park": [
    ["Berger Bus Stop", 10, "₦200 - ₦500", "Keke / Taxi", "Terminal Access"],
  ],
};

const LOCATION_METADATA = {
  "Berger Bus Stop": { coords: [9.0765, 7.4772], type: "Major Interchange" },
  "Wuse Market": { coords: [9.0655, 7.4756], type: "Major Interchange" },
  "Zone 4 Underbridge": { coords: [9.0637, 7.4749], type: "Commercial Bus Stop" },
  "Area 1": { coords: [9.0328, 7.4901], type: "Major Interchange" },
  "Area 3 Junction": { coords: [9.0385, 7.4880], type: "District Bus Stop" },
  "Federal Secretariat": { coords: [9.0533, 7.5022], type: "Civil Service Hub" },
  "Central Business District (CBD)": { coords: [9.0583, 7.4894], type: "Business Hub" },
  "Banex": { coords: [9.0811, 7.4833], type: "Major Interchange" },
  "Maitama (Nicon Junction)": { coords: [9.0889, 7.5000], type: "Major Interchange" },
  "A.Y.A (Asokoro)": { coords: [9.0553, 7.5256], type: "Major Interchange" },
  "Mabushi Roundabout": { coords: [9.0802, 7.4641], type: "Corridor Stop" },
  "Magic Land Axis": { coords: [9.0278, 7.4350], type: "Outbound Highway Stop" },
  "Apo Roundabout": { coords: [9.0068, 7.5050], type: "Southern Interchange" },
  "Galadimawa Roundabout": { coords: [8.9950, 7.4430], type: "Southern Transit Hub" },
  "Lokogoma Junction": { coords: [8.9780, 7.4420], type: "Suburban Hub" },
  "Lugbe (F.H.A.)": { coords: [8.9667, 7.3833], type: "Corridor Hub" },
  "Lugbe Police Signboard": { coords: [8.9600, 7.3750], type: "Highway Bus Stop" },
  "Airport Junction": { coords: [9.0200, 7.3800], type: "Corridor Stop" },
  "Nnamdi Azikiwe Airport": { coords: [9.0067, 7.2631], type: "Airport Terminal" },
  "Jahi Junction": { coords: [9.0833, 7.4417], type: "Highway Bus Stop" },
  "Katampe": { coords: [9.1000, 7.4500], type: "Corridor Stop" },
  "Gwarinpa (1st Avenue / Charlie Boy)": { coords: [9.1033, 7.4167], type: "Residential Transit Hub" },
  "Dutse Junction": { coords: [9.1417, 7.3861], type: "Suburban Junction" },
  "Public Service Institute": { coords: [9.1480, 7.3620], type: "Corridor Stop" },
  "Kubwa (Phase 4 / Gate 1)": { coords: [9.1578, 7.3392], type: "Suburban Hub" },
  "Dei-Dei": { coords: [9.1667, 7.3000], type: "Corridor Stop" },
  "Zuba": { coords: [9.1667, 7.1500], type: "Major Outer Interchange" },
  "Mpape Junction": { coords: [9.1333, 7.5333], type: "Suburban Hub" },
  "Kugbo Junction": { coords: [9.0233, 7.5450], type: "Corridor Stop" },
  "Karu Bridge": { coords: [9.0083, 7.5583], type: "Corridor Interchange" },
  "Nyanya": { coords: [8.9833, 7.5667], type: "Major Outer Interchange" },
  "Mararaba (Boundary)": { coords: [8.9750, 7.5833], type: "Border Interchange" },
  "Bwari": { coords: [9.2833, 7.3833], type: "Outer Suburban Hub" },
  "Giri Junction": { coords: [8.9500, 7.2333], type: "Southern Outer Junction" },
  "Gwagwalada": { coords: [8.9500, 7.0833], type: "Outer City Hub" },
  "Kuje": { coords: [8.8783, 7.2342], type: "Outer Suburban Hub" },
  "Utako Motor Park": { coords: [9.0743, 7.4475], type: "Interstate Terminal" },
  "Jabi Park": { coords: [9.0712, 7.4285], type: "Interstate / Local Terminal" },
};

const TRANSIT_LOCATIONS = Object.keys(VERIFIED_ABUJA_TRANSIT).sort();

const buildRouteCoordinates = (result) => {
  if (!result || result.error || !Array.isArray(result.path)) {
    return [];
  }

  const coordinates = [];

  for (const step of result.path) {
    const fromCoords = LOCATION_METADATA[step.from]?.coords;
    const toCoords = LOCATION_METADATA[step.to]?.coords;

    if (fromCoords) {
      coordinates.push([fromCoords[1], fromCoords[0]]);
    }

    if (toCoords) {
      coordinates.push([toCoords[1], toCoords[0]]);
    }
  }

  return coordinates;
};

const formatRouteResult = (start, destination) => {
  if (!start || !destination || start === destination) {
    return { error: 'Choose two different locations to build a route.' };
  }

  if (!VERIFIED_ABUJA_TRANSIT[start] || !VERIFIED_ABUJA_TRANSIT[destination]) {
    return { error: 'This location is not part of the verified Abuja transit map yet.' };
  }

  const queue = [{ node: start, totalTime: 0, path: [] }];
  const visited = new Set();

  while (queue.length) {
    queue.sort((a, b) => a.totalTime - b.totalTime);
    const current = queue.shift();

    if (!current || visited.has(current.node)) {
      continue;
    }

    visited.add(current.node);

    if (current.node === destination) {
      return {
        totalTime: current.totalTime,
        path: current.path,
      };
    }

    const nextStops = VERIFIED_ABUJA_TRANSIT[current.node] ?? [];

    for (const [neighbor, timeCost, fareRange, mode, note] of nextStops) {
      if (visited.has(neighbor)) {
        continue;
      }

      queue.push({
        node: neighbor,
        totalTime: current.totalTime + timeCost,
        path: [
          ...current.path,
          {
            from: current.node,
            to: neighbor,
            minutes: timeCost,
            fare: fareRange,
            mode,
            note,
          },
        ],
      });
    }
  }

  return { error: 'No connected route is mapped between those locations.' };
};

const RouteSearch = ({ onRouteChange }) => {
  const [origin, setOrigin] = useState('Wuse Market');
  const [destination, setDestination] = useState('Area 1');
  const [showRoutes, setShowRoutes] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [originSuggestionsOpen, setOriginSuggestionsOpen] = useState(false);
  const [destinationSuggestionsOpen, setDestinationSuggestionsOpen] = useState(false);
  const [routeResult, setRouteResult] = useState(() => formatRouteResult('Wuse Market', 'Area 1'));
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);

  useEffect(() => {
    onRouteChange?.(buildRouteCoordinates(routeResult));
  }, [routeResult, onRouteChange]);

  const originSuggestions = useMemo(() => {
    const query = origin.trim().toLowerCase();

    if (!query) {
      return TRANSIT_LOCATIONS.slice(0, 8);
    }

    return TRANSIT_LOCATIONS.filter((location) =>
      location.toLowerCase().includes(query),
    ).slice(0, 8);
  }, [origin]);

  const destinationSuggestions = useMemo(() => {
    const query = destination.trim().toLowerCase();

    if (!query) {
      return TRANSIT_LOCATIONS.slice(0, 8);
    }

    return TRANSIT_LOCATIONS.filter((location) =>
      location.toLowerCase().includes(query),
    ).slice(0, 8);
  }, [destination]);

  const routeSummary = useMemo(() => {
    if (routeResult?.error) {
      return routeResult.error;
    }

    return routeResult?.path?.length
      ? `${routeResult.path.length} leg route • ${routeResult.totalTime} mins`
      : 'No route selected';
  }, [routeResult]);

  const handleFindRoutes = () => {
    const result = formatRouteResult(origin.trim(), destination.trim());
    setRouteResult(result);
    setShowRoutes(true);
    setIsMinimized(false);
    onRouteChange?.(buildRouteCoordinates(result));
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
      setShowRoutes(true);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full flex flex-col transition-all duration-500 ease-in-out overflow-hidden',
        showRoutes ? 'h-[70vh]' : 'h-auto',
      )}
      style={{
        maxHeight: isMinimized ? '140px' : undefined,
        transform: isMinimized ? 'translateY(0)' : 'translateY(0)',
      }}
    >
      <div
        className="p-1.5 flex justify-center cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
      </div>

      <div className="px-6 py-4 flex flex-col gap-5 overflow-hidden">
        {!showRoutes && !isMinimized && (
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900">Where to next?</h2>
            <p className="text-zinc-500 text-sm">Verified Abuja public transit routes and motor parks.</p>
          </div>
        )}

        {isMinimized ? (
          <div className="flex items-center justify-between gap-3 pb-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Transit</div>
              <div className="font-bold text-zinc-900 text-sm">{origin} → {destination}</div>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="px-3 py-1.5 rounded-xl bg-[#6D1A36] text-[#FCD0A1] text-xs font-bold"
            >
              Expand
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                </div>
                <input
                  type="text"
                  value={origin}
                  onFocus={() => setOriginSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setOriginSuggestionsOpen(false), 120)}
                  onChange={(event) => {
                    setOrigin(event.target.value);
                    setOriginSuggestionsOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleFindRoutes();
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Starting point"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6D1A36] transition-all text-sm font-medium"
                />
                {originSuggestionsOpen && originSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-zinc-100 bg-white shadow-xl overflow-hidden">
                    {originSuggestions.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setOrigin(location);
                          setOriginSuggestionsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-[#FCD0A1]/20 transition-colors"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
                <div className="absolute left-[21px] top-[70%] w-[1px] h-10 bg-zinc-100" />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <MapPin size={18} className="text-[#6D1A36]" />
                </div>
                <input
                  type="text"
                  value={destination}
                  onFocus={() => setDestinationSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setDestinationSuggestionsOpen(false), 120)}
                  onChange={(event) => {
                    setDestination(event.target.value);
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
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6D1A36] transition-all text-sm font-medium"
                />
                {destinationSuggestionsOpen && destinationSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-zinc-100 bg-white shadow-xl overflow-hidden">
                    {destinationSuggestions.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setDestination(location);
                          setDestinationSuggestionsOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-[#FCD0A1]/20 transition-colors"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!showRoutes ? (
              <button
                onClick={handleFindRoutes}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg shadow-zinc-200 active:scale-[0.98] mb-4"
              >
                Find Best Routes
              </button>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
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

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20 scrollbar-hide">
                  {routeResult?.error ? (
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

                      {routeResult.path.map((step, index) => (
                        <div
                          key={`${step.from}-${step.to}-${index}`}
                          className="group border border-zinc-100 rounded-2xl p-4 hover:border-[#6D1A36]/20 hover:bg-[#6D1A36]/5 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex gap-3">
                              <div className="p-2.5 rounded-xl text-white shadow-sm bg-[#6D1A36]">
                                {step.mode.toLowerCase().includes('bus') ? <Bus size={20} /> : <Train size={20} />}
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
                                GPS: ({LOCATION_METADATA[step.to]?.coords?.[0]?.toFixed(4) ?? '—'}, {LOCATION_METADATA[step.to]?.coords?.[1]?.toFixed(4) ?? '—'})
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <Info size={14} className="shrink-0" />
                    <span>Fares are indicative and can vary with peak/off-peak traffic.</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RouteSearch;
