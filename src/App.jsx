import { useState } from 'react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import TransitMap from './components/TransitMap';
import RouteSearch from './components/RouteSearch';
import BottomNav from './components/BottomNav';
import { Search, Map as MapIcon, Layers, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('home');
    const [routePath, setRoutePath] = useState([]);

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
        <TransitMap routePath={routePath} />
        
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
                                        <RouteSearch onRouteChange={setRoutePath} />
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Tab Content */}
        {activeTab === 'saved' && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24">
                <h2 className="text-3xl font-bold mb-6 text-zinc-900">Saved Places</h2>
                <div className="space-y-4">
                    {['Home', 'Office', 'Gym', 'Central Station'].map((place) => (
                        <div key={place} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#FCD0A1] text-[#6D1A36] rounded-xl">
                                    <MapIcon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-900">{place}</h4>
                                    <p className="text-xs text-zinc-500">22 min away • M2 Line</p>
                                </div>
                            </div>
                            <button className="text-[#6D1A36] font-bold text-sm px-4 py-2 bg-[#FCD0A1]/40 hover:bg-[#FCD0A1]/60 active:scale-95 rounded-lg transition-all">Go</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Alerts Tab Content */}
        {activeTab === 'alerts' && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24">
                <h2 className="text-3xl font-bold mb-6">Transit Alerts</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-4">
                        <div className="w-2 h-full bg-red-400 rounded-full shrink-0" />
                        <div>
                            <h4 className="font-bold text-red-900">M1 Red Line Delay</h4>
                            <p className="text-sm text-red-700 mt-1">Maintenance works between Central and North Ave. Expect 15 min delays.</p>
                            <span className="text-[10px] text-red-400 font-bold uppercase mt-2 inline-block">2 hours ago</span>
                        </div>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                        <div className="w-2 h-full bg-amber-400 rounded-full shrink-0" />
                        <div>
                            <h4 className="font-bold text-amber-900">Station Crowding</h4>
                            <p className="text-sm text-amber-700 mt-1">Union Square is currently experiencing high passenger volume. Use West Entrance.</p>
                            <span className="text-[10px] text-amber-400 font-bold uppercase mt-2 inline-block">15 mins ago</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl p-6 pt-24 overflow-y-auto pb-24 text-center">
                <div className="w-24 h-24 bg-zinc-200 rounded-full mx-auto mb-4 border-4 border-white shadow-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200" alt="Avatar" />
                </div>
                <h2 className="text-2xl font-bold">Alex Johnson</h2>
                <p className="text-[#6D1A36] font-bold text-sm">Local Hero • Level 12</p>
                
                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">124</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Tips</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">8.2k</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Points</div>
                    </div>
                    <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="text-xl font-bold text-[#6D1A36]">42</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Reports</div>
                    </div>
                </div>

                <div className="mt-8 space-y-2 text-left">
                    <button className="w-full p-4 bg-zinc-50 hover:bg-[#FCD0A1]/10 rounded-2xl flex justify-between items-center font-bold text-zinc-800 transition-colors">
                        Achievement Gallery <Search size={16} className="text-[#6D1A36]" />
                    </button>
                    <button className="w-full p-4 bg-zinc-50 hover:bg-[#FCD0A1]/10 rounded-2xl flex justify-between items-center font-bold text-zinc-800 transition-colors">
                        Transit History <Search size={16} className="text-[#6D1A36]" />
                    </button>
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