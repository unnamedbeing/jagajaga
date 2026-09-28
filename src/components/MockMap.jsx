import { MapPin } from 'lucide-react';

const MockMap = () => {
  return (
    <div className="relative w-full h-full bg-[#e5e7eb] overflow-hidden rounded-lg min-h-[400px]">
      {/* Abstract Map Design */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d1d5db" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Streets */}
        <path d="M 0 200 L 1000 200" stroke="white" strokeWidth="20" />
        <path d="M 0 500 L 1000 500" stroke="white" strokeWidth="25" />
        <path d="M 0 800 L 1000 800" stroke="white" strokeWidth="20" />
        
        <path d="M 200 0 L 200 1000" stroke="white" strokeWidth="20" />
        <path d="M 500 0 L 500 1000" stroke="white" strokeWidth="25" />
        <path d="M 800 0 L 800 1000" stroke="white" strokeWidth="20" />
        
        {/* Diagonal street */}
        <path d="M 0 0 L 1000 1000" stroke="white" strokeWidth="15" />

        {/* Cars (Dots) */}
        <circle cx="210" cy="250" r="5" fill="#000" />
        <circle cx="510" cy="550" r="5" fill="#000" />
        <circle cx="790" cy="750" r="5" fill="#000" />
        <circle cx="490" cy="210" r="5" fill="#000" />
      </svg>
      
      {/* Markers */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <MapPin className="text-black" size={32} />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full" />
        </div>
      </div>

      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2">
         <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white animate-pulse" />
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button className="bg-white p-2 rounded-md shadow-md text-gray-600 hover:text-black">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </button>
        <button className="bg-white p-2 rounded-md shadow-md text-gray-600 hover:text-black">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </button>
      </div>
    </div>
  );
};

export default MockMap;
