import { useEffect, useState } from 'react';
import { Show, SignInButton, UserButton, useAuth, useUser } from '@clerk/react';
import TransitMap from './components/TransitMap';
import RouteSearch from './components/RouteSearch';
import BottomNav from './components/BottomNav';
import { Search, Map as MapIcon, Layers, Settings, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from './utils/api';

function App() {
    const { getToken, isSignedIn } = useAuth();
    const { user } = useUser();
  const [activeTab, setActiveTab] = useState('home');
    const [routePath, setRoutePath] = useState([]);
    const [destinationQuery, setDestinationQuery] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [dashboard, setDashboard] = useState({ profile: null, points: 0, savedPlaces: [], trips: [], reports: [] });
    const [dataError, setDataError] = useState('');

    useEffect(() => {
        if (!isSignedIn) {
            setDashboard({ profile: null, points: 0, savedPlaces: [], trips: [], reports: [] });
            return;
        }

        apiRequest('/api/dashboard', getToken)
            .then(setDashboard)
            .catch((error) => setDataError(error.message));
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

    const saveTrip = async (trip) => {
        if (!isSignedIn) return;
        const savedTrip = await apiRequest('/api/trips', getToken, { method: 'POST', body: JSON.stringify(trip) });
        setDashboard((current) => ({ ...current, trips: [savedTrip, ...current.trips], points: current.points + 10 }));
    };

    const saveReport = async (report) => {
        if (!isSignedIn) return;
        const savedReport = await apiRequest('/api/reports', getToken, { method: 'POST', body: JSON.stringify(report) });
        setDashboard((current) => ({ ...current, reports: [savedReport, ...current.reports], points: current.points + 5 }));
    };

    const savePlace = async (place) => {
        if (!isSignedIn) return;
        const savedPlace = await apiRequest('/api/saved-places', getToken, { method: 'POST', body: JSON.stringify(place) });
        setDashboard((current) => ({ ...current, savedPlaces: [savedPlace, ...current.savedPlaces] }));
    };

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden flex flex-col font-sans selection:bg-[#FCD0A1] selection:text-[#6D1A36] relative">
      
      {/* App Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="flex items-center justify-between max-w-lg mx-auto w-full pointer-events-auto">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 px-3 rounded-2xl shadow-lg border border-white/20">
                <div className="w-8 h-8 bg-[#6D1A36] rounded-xl flex items-center justify-center text-[#FCD0A1] font-bold text-lg shadow-[#FCD0A1]/50 shadow-md">T</div>
                <span className="font-extrabold text-zinc-900 tracking-tight">JagaJaga</span>
            </div>
            <div className="flex gap-2">
                <Show when="signed-out">
                    <SignInButton mode="modal">
                        <button className="px-3 py-2.5 bg-[#6D1A36] text-[#FCD0A1] rounded-2xl shadow-lg font-bold text-sm active:scale-95 transition-all">Sign in</button>
                    </SignInButton>
                </Show>
                <Show when="signed-in">
                    <div className="p-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
                        <UserButton />
                    </div>
                </Show>
                <button className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-zinc-600 hover:text-[#6D1A36] active:scale-95 transition-all">
                    <Layers size={20} />
                </button>
                <button className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-zinc-600 hover:text-[#6D1A36] active:scale-95 transition-all">
                    <Settings size={20} />
                </button>
            </div>
        </div>
      </header>

      {/* Main Map Background (Always Present) */}
    <main className="absolute inset-0 z-0">
                <TransitMap routePath={routePath} destinationQuery={destinationQuery} currentLocation={currentLocation} />

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
                                              onClearLocation={() => setCurrentLocation(null)}
                                            currentLocation={currentLocation}
                                            onSaveTrip={saveTrip}
                                            onSavePlace={savePlace}
                                            onReport={saveReport}
                                            isSignedIn={isSignedIn}
                                        />
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Tab Content */}
        {activeTab === 'saved' && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24">
                <h2 className="text-3xl font-bold mb-6 text-zinc-900">Saved Places</h2>
                <div className="space-y-4">
                    {dashboard.savedPlaces.length === 0 && <p className="text-sm text-zinc-500">No saved places yet. Save a destination from a route.</p>}
                    {dashboard.savedPlaces.map((place) => (
                        <div key={place} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#FCD0A1] text-[#6D1A36] rounded-xl">
                                    <MapIcon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-900">{place.label}</h4>
                                    <p className="text-xs text-zinc-500">{place.address}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Alerts Tab Content */}
        {activeTab === 'alerts' && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24">
                <h2 className="text-3xl font-bold mb-6">Transit Alerts</h2>
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

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24 text-center">
                <div className="w-24 h-24 bg-zinc-200 rounded-full mx-auto mb-4 border-4 border-white shadow-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" alt="Avatar" />
                </div>
                <h2 className="text-2xl font-bold">{dashboard.profile?.display_name || user?.fullName || 'Your profile'}</h2>
                <p className="text-[#6D1A36] font-bold text-sm">{isSignedIn ? 'JagaJaga rider' : 'Sign in to save your activity'}</p>
                
                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">{dashboard.trips.length}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Trips</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">{dashboard.points}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Points</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">{dashboard.reports.length}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Reports</div>
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
                                    {trip.origin} <ArrowRight className="mx-1 inline-block" size={12} /> {trip.destination}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100/50 transition-colors">
                        Log Out
                    </button>
                </div>
            </div>
        )}
      </main>

      {/* Persistent App Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}

export default App;