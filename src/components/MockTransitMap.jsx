import { MapPin, Navigation } from 'lucide-react';

const MockTransitMap = () => {
  return (
    <div className="relative w-full h-full bg-[#f8fafc] overflow-hidden rounded-lg min-h-[400px]">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000">
        <defs>
          <pattern id="dotGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#e2e8f0" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)" />
        
        {/* River */}
        <path 
          d="M -50 400 Q 250 350 500 450 T 1050 400" 
          stroke="#e0f2fe" 
          strokeWidth="60" 
          fill="none" 
        />

        {/* Metro Lines */}
        <path d="M 0 200 L 1000 200" stroke="#ef4444" strokeWidth="8" fill="none" opacity="0.3" />
        <path d="M 200 0 L 200 1000" stroke="#3b82f6" strokeWidth="8" fill="none" opacity="0.3" />
        
        {/* Main Transit Corridor */}
        <path 
          d="M 100 800 L 400 500 L 600 500 L 900 200" 
          stroke="#3b82f6" 
          strokeWidth="6" 
          fill="none" 
          strokeDasharray="12 8" 
        />
        
        <path 
          d="M 200 100 L 200 400 L 500 500 L 800 500 L 800 900" 
          stroke="#10b981" 
          strokeWidth="6" 
          fill="none" 
          strokeDasharray="12 8" 
        />

        {/* Stops */}
        <circle cx="200" cy="200" r="10" fill="white" stroke="#334155" strokeWidth="3" />
        <circle cx="400" cy="500" r="10" fill="white" stroke="#334155" strokeWidth="3" />
        <circle cx="600" cy="500" r="10" fill="white" stroke="#334155" strokeWidth="3" />
        <circle cx="500" cy="500" r="12" fill="white" stroke="#3b82f6" strokeWidth="4" />
        <circle cx="800" cy="500" r="10" fill="white" stroke="#334155" strokeWidth="3" />

        {/* Pulse effect for a bus/train moving */}
        <circle cx="300" cy="600" r="6" fill="#3b82f6">
          <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      {/* Search Result Markers */}
      <div className="absolute top-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
            <div className="bg-white px-3 py-1 rounded-full shadow-lg border border-zinc-100 text-[10px] font-bold mb-1">
                YOU ARE HERE
            </div>
            <div className="relative">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white animate-pulse shadow-blue-400 shadow-lg" />
            </div>
        </div>
      </div>

      <div className="absolute top-[20%] right-[10%] -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
             <div className="bg-zinc-900 text-white px-3 py-1 rounded-full shadow-lg text-[10px] font-bold mb-1">
                DESTINATION
            </div>
            <MapPin className="text-zinc-900 fill-zinc-900" size={32} />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-white/20 flex gap-4">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-zinc-600">M2 LINE</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-zinc-600">M1 LINE</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-zinc-600">BUS 142</span>
            </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <button className="bg-white p-3 rounded-2xl shadow-xl text-zinc-600 hover:text-blue-600 transition-colors">
          <Navigation size={20} />
        </button>
      </div>
    </div>
  );
};

export default MockTransitMap;
