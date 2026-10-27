import { useEffect, useState } from 'react';
import { Show, SignInButton, useAuth, useClerk, useUser } from '@clerk/react';
import TransitMap from './components/TransitMap';
import useNearestStops from './hooks/useNearestStops';
import RouteSearch from './components/RouteSearch';
import BottomNav from './components/BottomNav';
import { Search, Map as MapIcon, Satellite, Settings, LocateFixed, ArrowRight, ArrowLeft, Sun, Moon, Globe, Check, X, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from './utils/api';
import { API_URL } from './utils/api';
import ActionProgress from './components/ActionProgress';

const getTabFromLocation = () => {
        const tab = window.location.pathname.split('/').filter(Boolean).at(-1);
        return ['saved', 'alerts', 'admin'].includes(tab) ? tab : 'home';
};

function App() {
    const { getToken, isSignedIn } = useAuth();
    const { signOut } = useClerk();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState(getTabFromLocation);
    const [routePath, setRoutePath] = useState([]);
    const [destinationQuery, setDestinationQuery] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [walkingRouteInfo, setWalkingRouteInfo] = useState(null);
    const [transitRoute, setTransitRoute] = useState(null);
    const [mapCenter, setMapCenter] = useState([7.3986, 9.0765]);
    const { stops: nearestStops, loading: nearestStopsLoading, error: nearestStopsError, findNearestStops, suggestStop } = useNearestStops();
    const [managedLocations, setManagedLocations] = useState([]);
    const [dashboard, setDashboard] = useState({ profile: null, points: 0, savedPlaces: [], trips: [], reports: [] });
    const [dataError, setDataError] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [savedTripToUse, setSavedTripToUse] = useState(null);
    const [editingTripId, setEditingTripId] = useState(null);
    const [editingTripMode, setEditingTripMode] = useState(null);
    const [editingTripName, setEditingTripName] = useState('');
    const [editingTripOrigin, setEditingTripOrigin] = useState('');
    const [editingTripDestination, setEditingTripDestination] = useState('');
    const [openTripMenuId, setOpenTripMenuId] = useState(null);
    const [editTripError, setEditTripError] = useState('');
    const [pendingDeleteTrip, setPendingDeleteTrip] = useState(null);
    const [isDeletingTrip, setIsDeletingTrip] = useState(false);
    const [adminReports, setAdminReports] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminOverview, setAdminOverview] = useState(null);
    const [adminManagement, setAdminManagement] = useState({ submissions: [], feedback: [], users: [], locations: [], announcements: [] });
    const [announcements, setAnnouncements] = useState([]);
    const [adminDialog, setAdminDialog] = useState(null);
    const [adminDialogValues, setAdminDialogValues] = useState({});
    const [adminDialogError, setAdminDialogError] = useState('');
    const [isSavingAdminDialog, setIsSavingAdminDialog] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('jagajaga-theme') || 'light');
    const [mapStyle, setMapStyle] = useState(() => localStorage.getItem('jagajaga-map-style') === 'satellite' ? 'satellite' : 'streets');
    const [language, setLanguage] = useState(() => localStorage.getItem('jagajaga-language') || 'en');

    useEffect(() => {
        fetch(`${API_URL}/api/locations`)
            .then((response) => {
                if (!response.ok) throw new Error('Could not load available locations.');
                return response.json();
            })
            .then(({ locations = [] }) => setManagedLocations(locations))
            .catch(() => setDataError('Could not load JagaJaga locations. Check that the API server is running.'));
    }, []);

    useEffect(() => {
        const syncTabFromLocation = () => setActiveTab(getTabFromLocation());
        window.addEventListener('popstate', syncTabFromLocation);
        return () => window.removeEventListener('popstate', syncTabFromLocation);
    }, []);

    const navigateTab = (tab) => {
        const pathname = tab === 'home' ? '/' : `/${tab}`;
        if (window.location.pathname !== pathname) {
            window.history.pushState({}, '', pathname);
        }
        setActiveTab(tab);
    };

    useEffect(() => {
        localStorage.setItem('jagajaga-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('jagajaga-map-style', mapStyle);
    }, [mapStyle]);

    useEffect(() => {
        localStorage.setItem('jagajaga-language', language);
    }, [language]);

    useEffect(() => {
        if (!settingsOpen) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setSettingsOpen(false);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [settingsOpen]);

    useEffect(() => {
        if (!adminDialog) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === 'Escape' && !isSavingAdminDialog) setAdminDialog(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [adminDialog, isSavingAdminDialog]);

    const copy = language === 'ha'
        ? { settings: 'Saituna', profile: 'Bayanan mai amfani', appearance: 'Kallo', language: 'Harshe', light: 'Haske', dark: 'Duhu', trips: 'Tafiyoyi', points: 'Maki', reports: 'Rahotanni', close: 'Rufe', signOut: 'Fita' }
        : { settings: 'Settings', profile: 'Profile', appearance: 'Appearance', language: 'Language', light: 'Light', dark: 'Dark', trips: 'Trips', points: 'Points', reports: 'Reports', close: 'Close', signOut: 'Sign out' };

    useEffect(() => {
        if (isSignedIn === false) {
            setDashboard({ profile: null, points: 0, savedPlaces: [], trips: [], reports: [] });
            setAdminReports([]);
            setIsAdmin(false);
            setAdminOverview(null);
            setAdminManagement({ submissions: [], feedback: [], users: [], locations: [], announcements: [] });
            setAnnouncements([]);
            return;
        }

        if (!isSignedIn) return;

        apiRequest('/api/dashboard', getToken)
            .then(setDashboard)
            .catch((error) => setDataError(error.message));

        apiRequest('/api/admin/reports', getToken)
            .then(({ reports }) => {
                setAdminReports(reports);
                setIsAdmin(true);
            })
            .catch(() => {
                setAdminReports([]);
                setIsAdmin(false);
            });

        apiRequest('/api/admin/overview', getToken)
            .then(setAdminOverview)
            .catch(() => setAdminOverview(null));

        apiRequest('/api/admin/management', getToken)
            .then(setAdminManagement)
            .catch(() => setAdminManagement({ submissions: [], feedback: [], users: [], locations: [], announcements: [] }));

        apiRequest('/api/announcements', getToken)
            .then(({ announcements: published }) => setAnnouncements(published))
            .catch(() => setAnnouncements([]));
    }, [getToken, isSignedIn]);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setDataError('Location access is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => setCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude }),
            () => setDataError('Location access was denied. Enable it in your browser settings to use your position.'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
    };

    const handleUseLocation = () => {
        if (!navigator.geolocation) {
            setDataError('Location access is not supported by this browser. Type a starting place instead.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setIsLocating(false);
                if (isSignedIn) localStorage.setItem('jagajaga-use-current-location', 'true');
                const location = { latitude: coords.latitude, longitude: coords.longitude };
                setCurrentLocation(location);
                setSelectedPlace({
                    name: 'Your location',
                    placeName: 'Your current location',
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });
                findNearestStops(location).catch(() => {});
            },
            () => {
                setIsLocating(false);
                setDataError('Location access was denied. Type a starting place instead.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000, },
        );
    };

    useEffect(() => {
        if (isSignedIn && localStorage.getItem('jagajaga-use-current-location') === 'true') {
            handleUseLocation();
        }
    }, [isSignedIn]);

    const handleClearLocation = () => {
        setCurrentLocation(null);
        setSelectedPlace(null);
        localStorage.removeItem('jagajaga-use-current-location');
    };

    const handlePlaceSelect = (place) => {
        if (!place) {
            setSelectedPlace(null);
            setWalkingRouteInfo(null);
            setTransitRoute(null);
            return;
        }
        setSelectedPlace(place);
        setTransitRoute(null);
        findNearestStops({ latitude: place.latitude, longitude: place.longitude }).catch(() => {});
        if (!place.originStopId || !place.destinationStopId) return;

        setTransitRoute({ loading: true });
        fetch(`${API_URL}/api/transit-route?originStopId=${encodeURIComponent(place.originStopId)}&destinationStopId=${encodeURIComponent(place.destinationStopId)}`)
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || 'No transit route available');
                return data;
            })
            .then((route) => setTransitRoute(route))
            .catch((error) => setTransitRoute({ error: error.message || 'No transit route available' }));
    };

    const saveTrip = async (trip) => {
        if (!isSignedIn) return;
        const savedTrip = await apiRequest('/api/trips', getToken, { method: 'POST', body: JSON.stringify(trip) });
        const savedPlace = await apiRequest('/api/saved-places', getToken, {
            method: 'POST',
            body: JSON.stringify({ label: trip.routeName, address: trip.destination }),
        });
        setDashboard((current) => ({
            ...current,
            trips: [savedTrip, ...current.trips],
            savedPlaces: [savedPlace, ...current.savedPlaces],
            points: current.points + 10,
        }));
    };

    const saveReport = async (report) => {
        if (!isSignedIn) return;
        const savedReport = await apiRequest('/api/reports', getToken, { method: 'POST', body: JSON.stringify(report) });
        setDashboard((current) => ({ ...current, reports: [savedReport, ...current.reports], points: current.points + 5 }));
    };

    const recordSearch = async ({ origin, destination }) => {
        if (!isSignedIn) return;
        await apiRequest('/api/searches', getToken, {
            method: 'POST',
            body: JSON.stringify({ origin, destination }),
        });
    };

    const submitRoute = async (submission) => {
        if (!isSignedIn) return;
        await apiRequest('/api/route-submissions', getToken, { method: 'POST', body: JSON.stringify(submission) });
    };

    const submitFeedback = async (feedback) => {
        if (!isSignedIn) return;
        await apiRequest('/api/route-feedback', getToken, { method: 'POST', body: JSON.stringify(feedback) });
    };

    const moderateSubmission = async (id, status) => {
        const updated = await apiRequest(`/api/admin/route-submissions/${id}`, getToken, { method: 'PATCH', body: JSON.stringify({ status }) });
        setAdminManagement((current) => ({ ...current, submissions: current.submissions.map((item) => item.id === updated.id ? updated : item) }));
    };

    const editSubmission = async (submission) => {
        openAdminDialog('edit-submission', {
            submission,
            values: { origin: submission.origin, destination: submission.destination },
        });
    };

    const moderateFeedback = async (id, status) => {
        const updated = await apiRequest(`/api/admin/feedback/${id}`, getToken, { method: 'PATCH', body: JSON.stringify({ status }) });
        setAdminManagement((current) => ({ ...current, feedback: current.feedback.map((item) => item.id === updated.id ? updated : item) }));
    };

    const openAdminDialog = (type, { submission = null, values = {} } = {}) => {
        setAdminDialog({ type, submission });
        setAdminDialogValues(values);
        setAdminDialogError('');
    };

    const createAnnouncement = () => openAdminDialog('announcement');

    const createLocation = () => openAdminDialog('location');

    const submitAdminDialog = async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(Object.entries(adminDialogValues).map(([key, value]) => [key, value.trim()]));
        if (Object.values(values).some((value) => !value)) {
            setAdminDialogError('Please complete all fields.');
            return;
        }

        setIsSavingAdminDialog(true);
        setAdminDialogError('');
        try {
            if (adminDialog.type === 'edit-submission') {
                const { submission } = adminDialog;
                const updated = await apiRequest(`/api/admin/route-submissions/${submission.id}`, getToken, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: submission.status, origin: values.origin, destination: values.destination, stops: submission.stops, fare: submission.fare, landmarks: submission.landmarks }),
                });
                setAdminManagement((current) => ({ ...current, submissions: current.submissions.map((item) => item.id === updated.id ? updated : item) }));
            } else if (adminDialog.type === 'announcement') {
                const announcement = await apiRequest('/api/admin/announcements', getToken, {
                    method: 'POST',
                    body: JSON.stringify({ title: values.title, message: values.message, published: true }),
                });
                setAdminManagement((current) => ({ ...current, announcements: [announcement, ...current.announcements] }));
            } else if (adminDialog.type === 'location') {
                const location = await apiRequest('/api/admin/locations', getToken, {
                    method: 'POST',
                    body: JSON.stringify({ name: values.name, locationType: 'stop' }),
                });
                setAdminManagement((current) => ({ ...current, locations: [...current.locations, location] }));
            }
            setAdminDialog(null);
        } catch (error) {
            setAdminDialogError(error.message || 'Could not save changes.');
        } finally {
            setIsSavingAdminDialog(false);
        }
    };

    const useSavedTrip = (trip) => {
        const savedPath = Array.isArray(trip.route_data?.path) ? trip.route_data.path : [];
        setSavedTripToUse(trip);
        setRoutePath(savedPath);
        setDestinationQuery(savedPath.length ? '' : trip.destination);
        navigateTab('home');
    };

    const updateSavedTrip = async (tripId, changes) => {
                const updatedTrip = await apiRequest(`/api/trips/${tripId}`, getToken, {
                    method: 'PATCH',
                    body: JSON.stringify(changes),
                });
                setDashboard((current) => ({
                    ...current,
                    trips: current.trips.map((trip) => trip.id === updatedTrip.id ? updatedTrip : trip),
                }));
                setEditingTripId(null);
                setEditingTripMode(null);
                setEditingTripName('');
                setEditingTripOrigin('');
                setEditingTripDestination('');
                setEditTripError('');
    };

    const saveEditedTrip = async (tripId) => {
                try {
                    if (editingTripMode === 'rename') {
                            if (!editingTripName.trim()) {
                                setEditTripError('Enter a name before confirming.');
                                return;
                            }
                            await updateSavedTrip(tripId, { routeName: editingTripName });
                            return;
                    }

                    if (editingTripMode === 'locations') {
                            if (!editingTripOrigin.trim() || !editingTripDestination.trim()) {
                                setEditTripError('Enter both a start and end location.');
                                return;
                            }
                            await updateSavedTrip(tripId, { origin: editingTripOrigin, destination: editingTripDestination });
                    }
                } catch (error) {
                    setEditTripError(error.message || 'Could not save changes.');
                }
    };

    const deleteSavedTrip = async (tripId) => {
        setIsDeletingTrip(true);
        setEditTripError('');
        try {
            await apiRequest(`/api/trips/${tripId}`, getToken, { method: 'DELETE' });
            setDashboard((current) => ({ ...current, trips: current.trips.filter((trip) => trip.id !== tripId) }));
            setPendingDeleteTrip(null);
            setOpenTripMenuId(null);
        } catch (error) {
            setEditTripError(error.message || 'Could not delete saved place.');
        } finally {
            setIsDeletingTrip(false);
        }
    };

  return (
    <div className={`app-shell ${theme === 'dark' ? 'app-dark' : ''} h-screen w-full bg-slate-50 overflow-hidden flex flex-col font-sans selection:bg-[#FCD0A1] selection:text-[#6D1A36] relative`}>
      
      {/* App Top Bar */}
    {!settingsOpen && <header className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full pointer-events-auto">
            <div className="theme-panel flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 px-3 rounded-2xl shadow-lg border border-white/20">
                <div className="w-8 h-8 bg-[#6D1A36] rounded-xl flex items-center justify-center text-[#FCD0A1] font-bold text-lg shadow-[#FCD0A1]/50 shadow-md">T</div>
                <span className="font-extrabold text-zinc-900 tracking-tight">JagaJaga</span>
            </div>
            <div className="flex gap-2">
                <Show when="signed-out">
                    <SignInButton mode="modal">
                        <button className="px-3 py-2.5 bg-[#6D1A36] text-[#FCD0A1] rounded-2xl shadow-lg font-bold text-sm active:scale-95 transition-all">Sign in</button>
                    </SignInButton>
                </Show>
                <button
                    type="button"
                    onClick={() => setMapStyle((style) => style === 'satellite' ? 'streets' : 'satellite')}
                    aria-label={mapStyle === 'satellite' ? 'Switch to street map' : 'Switch to satellite imagery'}
                    aria-pressed={mapStyle === 'satellite'}
                    title={mapStyle === 'satellite' ? 'Switch to street map' : 'Switch to satellite imagery'}
                    className="theme-panel p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-zinc-600 hover:text-[#6D1A36] active:scale-95 transition-all"
                >
                    {mapStyle === 'satellite' ? <MapIcon size={20} /> : <Satellite size={20} />}
                </button>
                <button onClick={() => setSettingsOpen(true)} aria-label={copy.settings} className="theme-panel p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-zinc-600 hover:text-[#6D1A36] active:scale-95 transition-all">
                    <Settings size={20} />
                </button>
                <button onClick={requestLocation} aria-label="Locate me" className="theme-panel p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-zinc-600 hover:text-[#6D1A36] active:scale-95 transition-all">
                    <LocateFixed size={20} />
                </button>
            </div>
        </div>
    </header>}

      {/* Main Map Background (Always Present) */}
    <main className="absolute inset-0 z-0">
                <TransitMap
                    routePath={routePath}
                    destinationQuery={destinationQuery}
                    currentLocation={currentLocation}
                    selectedPlace={selectedPlace}
                    nearestStops={nearestStops}
                    busStops={managedLocations}
                    mapStyle={mapStyle}
                    onWalkingRouteChange={setWalkingRouteInfo}
                />

                {dataError && (
                    <div className="absolute left-4 right-4 top-20 z-30 mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 shadow-lg">
                        {dataError}
                    </div>
                )}
        
        {/* Home Screen Layer */}
        <AnimatePresence>
          {activeTab === 'home' && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-10 flex flex-col justify-end p-4 pb-18 pointer-events-none"
            >
                <div className="w-full max-w-lg mx-auto pointer-events-auto">
                    {/* Passing our custom theme colors can be supported down inside subcomponents if needed */}
                                        <RouteSearch
                                            onRouteChange={setRoutePath}
                                            onDestinationQueryChange={setDestinationQuery}
                                            onUseLocation={requestLocation}
                                              onClearLocation={handleClearLocation}
                                            currentLocation={currentLocation}
                                            onSaveTrip={saveTrip}
                                            onReport={saveReport}
                                            onRecordSearch={recordSearch}
                                            onSubmitRoute={submitRoute}
                                            onSubmitFeedback={submitFeedback}
                                                                    onSelectDestination={handlePlaceSelect}
                                                                    walkingRouteInfo={walkingRouteInfo}
                                                                    transitRoute={transitRoute}
                                                                    nearestStops={nearestStops}
                                                                    nearestStopsLoading={nearestStopsLoading}
                                                                    nearestStopsError={nearestStopsError}
                                                                    managedLocations={managedLocations}
                                                                    isSignedIn={isSignedIn}
                                            savedTrip={savedTripToUse}
                                        />
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Tab Content */}
        {activeTab === 'saved' && (
            <div className="theme-panel absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24">
                <h2 className="text-3xl font-bold mb-6 text-zinc-900">Saved Places</h2>
                <div className="space-y-3">
                    {dashboard.trips.length === 0 && <p className="text-sm text-zinc-500">No saved places yet. Save a destination from a route.</p>}
                    {dashboard.trips.map((trip) => (
                        <div key={trip.id} className="relative flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                            <div className="min-w-0">
                                {editingTripId === trip.id && editingTripMode === 'rename' ? (
                                    <input autoFocus value={editingTripName} onChange={(event) => setEditingTripName(event.target.value)} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm font-bold" />
                                ) : editingTripId === trip.id && editingTripMode === 'locations' ? (
                                    <div className="space-y-2">
                                        <input autoFocus value={editingTripOrigin} onChange={(event) => setEditingTripOrigin(event.target.value)} placeholder="Start location" className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm" />
                                        <input value={editingTripDestination} onChange={(event) => setEditingTripDestination(event.target.value)} placeholder="End location" className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm" />
                                    </div>
                                ) : (
                                    <h4 className="truncate font-bold text-zinc-900">{trip.route_name || 'Saved place'}</h4>
                                )}
                                {editingTripId !== trip.id || editingTripMode !== 'locations' ? <p className="truncate text-xs text-zinc-500">{trip.origin} → {trip.destination}</p> : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {editingTripId === trip.id ? (
                                    <>
                                        <button type="button" onClick={() => saveEditedTrip(trip.id)} aria-label="Save changes" title="Save changes" className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"><Check size={16} /></button>
                                        <button type="button" onClick={() => { setEditingTripId(null); setEditingTripMode(null); }} aria-label="Cancel edit" title="Cancel edit" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><X size={16} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" onClick={() => useSavedTrip(trip)} className="rounded-xl bg-[#6D1A36] px-3 py-2 text-xs font-bold text-[#FCD0A1]">Use</button>
                                        <button type="button" onClick={() => setOpenTripMenuId(openTripMenuId === trip.id ? null : trip.id)} aria-label="Saved place options" title="Options" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><MoreVertical size={18} /></button>
                                    </>
                                )}
                            </div>
                            {editingTripId === trip.id && editTripError && <p className="absolute bottom-2 left-4 right-4 text-xs font-semibold text-red-600">{editTripError}</p>}
                            {openTripMenuId === trip.id && editingTripId !== trip.id && (
                                <div className="absolute right-4 top-14 z-20 w-52 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl">
                                    <button type="button" onClick={() => { setEditingTripId(trip.id); setEditingTripMode('rename'); setEditingTripName(trip.route_name || ''); setOpenTripMenuId(null); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-100">Rename</button>
                                    <button type="button" onClick={() => { setEditingTripId(trip.id); setEditingTripMode('locations'); setEditingTripOrigin(trip.origin); setEditingTripDestination(trip.destination); setOpenTripMenuId(null); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-100">Change start/end location</button>
                                    <button type="button" onClick={() => { setPendingDeleteTrip(trip); setOpenTripMenuId(null); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {editTripError && <p className="mt-3 text-xs font-semibold text-red-600">{editTripError}</p>}
                {pendingDeleteTrip && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6" role="dialog" aria-modal="true" aria-labelledby="delete-place-title">
                        <div className="theme-panel w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
                            <h3 id="delete-place-title" className="text-lg font-bold text-zinc-900">Delete saved place?</h3>
                            <p className="mt-2 text-sm text-zinc-600">“{pendingDeleteTrip.route_name || pendingDeleteTrip.destination}” will be removed from Saved Places and Transit History.</p>
                            <div className="mt-5 flex justify-end gap-2">
                                <button type="button" onClick={() => setPendingDeleteTrip(null)} disabled={isDeletingTrip} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700">Cancel</button>
                                <button type="button" onClick={() => deleteSavedTrip(pendingDeleteTrip.id)} disabled={isDeletingTrip} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{isDeletingTrip ? 'Deleting...' : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Alerts Tab Content */}
        {activeTab === 'alerts' && (
            <div className="theme-panel absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24">
                <h2 className="text-3xl font-bold mb-6">Transit Alerts</h2>
                {announcements.length > 0 && <div className="mb-5 space-y-3"><h3 className="text-lg font-bold text-zinc-900">Announcements</h3>{announcements.map((announcement) => <div key={announcement.id} className="rounded-2xl border border-[#FCD0A1] bg-[#FFF7F0] p-4"><h4 className="font-bold text-[#6D1A36]">{announcement.title}</h4><p className="mt-1 text-sm text-zinc-700">{announcement.message}</p></div>)}</div>}
                {dashboard.reports.length === 0 ? (
                    <p className="text-sm text-zinc-500">No reports yet. Route issues you submit will appear here.</p>
                ) : (
                    <div className="space-y-4">
                        {dashboard.reports.map((report) => (
                            <div key={report.id} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                                <div className="w-2 h-full bg-amber-400 rounded-full shrink-0" />
                                <div>
                                    <h4 className="font-bold text-amber-900">{report.report_type}</h4>
                                    <p className="text-sm text-amber-700 mt-1">{report.message || 'Report submitted.'}</p>
                                    <span className="text-[10px] text-amber-500 font-bold uppercase mt-2 inline-block">{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'admin' && isAdmin && (
            <div className="theme-panel absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24">
                <h2 className="text-3xl font-bold mb-6 text-zinc-900">Admin overview</h2>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        ['Active users', adminOverview?.summary?.active_users ?? 0],
                        ['New signups', adminOverview?.summary?.new_signups ?? 0],
                        ["Today's searches", adminOverview?.summary?.daily_searches ?? 0],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                            <div className="text-xl font-bold text-[#6D1A36]">{value}</div>
                            <div className="mt-1 text-[10px] font-bold uppercase text-zinc-500">{label}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                        <h3 className="font-bold text-zinc-900">Most-searched routes</h3>
                        <div className="mt-3 space-y-2 text-sm text-zinc-600">{adminOverview?.popularRoutes?.length ? adminOverview.popularRoutes.map((route) => <div key={`${route.origin}-${route.destination}`} className="flex justify-between gap-3"><span>{route.origin} → {route.destination}</span><strong>{route.searches}</strong></div>) : <p className="text-xs text-zinc-500">No search data yet.</p>}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                        <h3 className="font-bold text-zinc-900">Demand areas</h3>
                        <div className="mt-3 space-y-2 text-sm text-zinc-600">{adminOverview?.topOrigins?.map((area) => <div key={`origin-${area.area}`} className="flex justify-between gap-3"><span>From {area.area}</span><strong>{area.searches}</strong></div>)}{adminOverview?.topDestinations?.map((area) => <div key={`destination-${area.area}`} className="flex justify-between gap-3"><span>To {area.area}</span><strong>{area.searches}</strong></div>)}</div>
                    </div>
                </div>
                <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <h3 className="font-bold text-zinc-900">Volume over time</h3>
                    <div className="mt-3 space-y-2 text-xs text-zinc-600">{adminOverview?.dailySearches?.map((day) => <div key={`search-${day.day}`} className="flex items-center gap-3"><span className="w-24">{day.day}</span><div className="h-2 flex-1 rounded-full bg-[#FCD0A1]" style={{ opacity: Math.max(0.25, Math.min(1, day.searches / 10)) }} /><strong>{day.searches} searches</strong></div>)}{adminOverview?.feedbackVolume?.map((day) => <div key={`feedback-${day.day}`} className="flex items-center gap-3"><span className="w-24">{day.day}</span><div className="h-2 flex-1 rounded-full bg-red-300" style={{ opacity: Math.max(0.25, Math.min(1, day.reports / 10)) }} /><strong>{day.reports} reports</strong></div>)}</div>
                </div>
                <div className="mt-8 space-y-4">
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                        <div className="flex items-center justify-between"><h3 className="font-bold text-zinc-900">Route submissions</h3><span className="text-xs text-zinc-500">{adminManagement.submissions.length}</span></div>
                        <div className="mt-3 space-y-2">{adminManagement.submissions.map((submission) => <div key={submission.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm"><div className="font-bold">{submission.origin} → {submission.destination}</div><div className="mt-1 text-xs text-zinc-500">{submission.email || 'Unknown user'} • {submission.status}</div><div className="mt-2 flex gap-2"><button type="button" onClick={() => editSubmission(submission)} className="rounded-lg border px-2 py-1 text-xs font-bold">Edit</button><button type="button" onClick={() => moderateSubmission(submission.id, 'approved')} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Approve</button><button type="button" onClick={() => moderateSubmission(submission.id, 'rejected')} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white">Reject</button></div></div>)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                        <h3 className="font-bold text-zinc-900">Ratings and comments</h3>
                        <div className="mt-3 space-y-2">{adminManagement.feedback.map((item) => <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm"><div className="font-bold">{item.route_name} • {item.rating}/5</div><p className="text-xs text-zinc-600">{item.comment || 'No comment'} {item.tags?.length ? `• ${item.tags.join(', ')}` : ''}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => moderateFeedback(item.id, 'approved')} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Approve</button><button type="button" onClick={() => moderateFeedback(item.id, 'rejected')} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white">Reject</button></div></div>)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-zinc-900">Users and locations</h3><button type="button" onClick={createLocation} className="rounded-lg bg-[#6D1A36] px-2 py-1 text-xs font-bold text-[#FCD0A1]">Add location</button></div><p className="mt-2 text-xs text-zinc-500">{adminManagement.users.length} users • {adminManagement.locations.length} managed locations</p><div className="mt-2 space-y-1 text-xs text-zinc-600">{adminManagement.locations.slice(0, 8).map((location) => <div key={location.id}>{location.name} • {location.location_type}</div>)}</div></div>
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-zinc-900">Announcements</h3><button type="button" onClick={createAnnouncement} className="rounded-lg bg-[#6D1A36] px-2 py-1 text-xs font-bold text-[#FCD0A1]">Send announcement</button></div><div className="mt-2 space-y-1 text-xs text-zinc-600">{adminManagement.announcements.slice(0, 5).map((announcement) => <div key={announcement.id}><strong>{announcement.title}</strong> • {announcement.published ? 'Published' : 'Draft'}</div>)}</div></div>
                </div>
                <h3 className="mt-8 mb-4 text-xl font-bold text-zinc-900">Recent reports</h3>
                {adminReports.length === 0 ? <p className="text-sm text-zinc-500">No route reports yet.</p> : (
                    <div className="space-y-3">
                        {adminReports.map((report) => (
                            <div key={report.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-zinc-900">{report.report_type}</h3>
                                        <p className="mt-1 text-sm text-zinc-700">{report.message || 'No description provided.'}</p>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-zinc-400">{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="mt-3 text-xs text-zinc-500">{report.display_name || report.email || 'Unknown user'} • {report.location_name || 'Unknown location'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

                {settingsOpen && (
                        <div
                            className="theme-panel absolute inset-0 z-50 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto"
                            onMouseDown={(event) => {
                                if (event.target === event.currentTarget) setSettingsOpen(false);
                            }}
                        >
                                <div className="mx-auto max-w-lg">
                                    <h2 className="text-3xl font-bold">{copy.settings}</h2>
                                    <button onClick={() => setSettingsOpen(false)} aria-label={copy.close} title={copy.close} className="theme-action absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100"><ArrowLeft size={21} /></button>
                <div className="w-24 h-24 bg-zinc-200 rounded-full mx-auto mb-4 border-4 border-white shadow-xl overflow-hidden">
                                        {user?.imageUrl && <img src={user.imageUrl} alt={copy.profile} />}
                </div>
                <h2 className="text-2xl font-bold">{dashboard.profile?.display_name || user?.fullName || 'Your profile'}</h2>
                <p className="text-[#6D1A36] font-bold text-sm">{isSignedIn ? 'JagaJaga rider' : 'Sign in to save your activity'}</p>
                
                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">{dashboard.trips.length}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">{copy.trips}</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">{dashboard.points}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">{copy.points}</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">{dashboard.reports.length}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">{copy.reports}</div>
                    </div>
                </div>

                <div className="mt-8 space-y-2 text-left">
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="flex items-center justify-between font-bold text-zinc-800">
                            Transit History ({dashboard.trips.length}) <Search size={16} className="text-[#6D1A36]" />
                        </div>
                        <div className="mt-3 space-y-2">
                            {dashboard.trips.length === 0 ? <p className="text-xs text-zinc-500">No trips saved yet.</p> : dashboard.trips.map((trip) => (
                                <div key={trip.id} className="border-t border-zinc-200 pt-2 text-xs text-zinc-600">
                                    <div className="font-semibold text-zinc-800">{trip.route_name || 'Saved route'}</div>
                                    <div>{trip.origin} <ArrowRight className="mx-1 inline-block" size={12} /> {trip.destination}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="theme-panel p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left space-y-4">
                        <div className="flex items-center gap-2 font-bold text-zinc-800"><Sun size={16} /> {copy.appearance}</div>
                        <div className="flex gap-2">
                          <button onClick={() => setTheme('light')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${theme === 'light' ? 'border-[#6D1A36] bg-[#FFF7F0] text-[#6D1A36]' : 'border-zinc-200'}`}><Sun size={15} /> {copy.light}</button>
                          <button onClick={() => setTheme('dark')} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${theme === 'dark' ? 'border-[#FCD0A1] bg-zinc-800 text-[#FCD0A1]' : 'border-zinc-200'}`}><Moon size={15} /> {copy.dark}</button>
                        </div>
                        <label className="flex items-center justify-between gap-3 text-sm font-bold text-zinc-800"><span className="flex items-center gap-2"><Globe size={16} /> {copy.language}</span><select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"><option value="en">English</option><option value="ha">Hausa</option></select></label>
                    </div>
                    <button onClick={() => signOut()} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100/50 transition-colors">
                        {copy.signOut}
                    </button>
                </div>
                </div>
            </div>
        )}
      </main>

      {/* Persistent App Bottom Nav */}
    {!settingsOpen && <BottomNav activeTab={activeTab} setActiveTab={navigateTab} isAdmin={isAdmin} />}

    <AnimatePresence>
        {adminDialog && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !isSavingAdminDialog) setAdminDialog(null);
                }}
            >
                <motion.section
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-dialog-title"
                    className="theme-panel w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
                >
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 id="admin-dialog-title" className="text-xl font-bold text-zinc-900">
                                {adminDialog.type === 'announcement' ? 'Send announcement' : adminDialog.type === 'location' ? 'Add location' : 'Edit route submission'}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">{adminDialog.type === 'announcement' ? 'Publish a message to riders.' : adminDialog.type === 'location' ? 'Add a stop to managed locations.' : 'Update the route start and end locations.'}</p>
                        </div>
                        <button type="button" onClick={() => setAdminDialog(null)} disabled={isSavingAdminDialog} aria-label="Close" className="theme-action flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"><X size={18} /></button>
                    </div>
                    <form onSubmit={submitAdminDialog} className="space-y-4">
                        {(adminDialog.type === 'edit-submission'
                            ? [{ name: 'origin', label: 'Start location', type: 'text' }, { name: 'destination', label: 'End location', type: 'text' }]
                            : adminDialog.type === 'announcement'
                                ? [{ name: 'title', label: 'Title', type: 'text' }, { name: 'message', label: 'Message', type: 'textarea' }]
                                : [{ name: 'name', label: 'Location name', type: 'text' }]
                        ).map((field, index) => (
                            <label key={field.name} className="block space-y-1.5 text-sm font-semibold text-zinc-700">
                                <span>{field.label}</span>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        required
                                        autoFocus={index === 0}
                                        rows={4}
                                        value={adminDialogValues[field.name] || ''}
                                        onChange={(event) => setAdminDialogValues((current) => ({ ...current, [field.name]: event.target.value }))}
                                        className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900 outline-none focus:border-[#6D1A36] focus:ring-2 focus:ring-[#6D1A36]/15"
                                    />
                                ) : (
                                    <input
                                        required
                                        autoFocus={index === 0}
                                        type="text"
                                        value={adminDialogValues[field.name] || ''}
                                        onChange={(event) => setAdminDialogValues((current) => ({ ...current, [field.name]: event.target.value }))}
                                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900 outline-none focus:border-[#6D1A36] focus:ring-2 focus:ring-[#6D1A36]/15"
                                    />
                                )}
                            </label>
                        ))}
                        {adminDialogError && <p role="alert" className="text-sm font-medium text-red-600">{adminDialogError}</p>}
                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" disabled={isSavingAdminDialog} onClick={() => setAdminDialog(null)} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">Cancel</button>
                            <button type="submit" disabled={isSavingAdminDialog} className="rounded-lg bg-[#6D1A36] px-4 py-2 text-sm font-bold text-[#FCD0A1] hover:bg-[#58152c] disabled:opacity-60">
                                {isSavingAdminDialog ? <ActionProgress label="Saving..." compact /> : adminDialog.type === 'announcement' ? 'Publish' : adminDialog.type === 'location' ? 'Add location' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </motion.section>
            </motion.div>
        )}
    </AnimatePresence>

    </div>
  );
}

export default App;