import { useState } from 'react';
import { Navigation, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

const RIDE_TYPES = [
  { id: 'uberx', name: 'UberX', price: '$12.50', time: '3 mins away', icon: '🚗' },
  { id: 'comfort', name: 'Comfort', price: '$15.80', time: '5 mins away', icon: '🏎️' },
  { id: 'black', name: 'Black', price: '$25.00', time: '7 mins away', icon: '🚙' },
];

const RidePanel = () => {
  const [selectedRide, setSelectedRide] = useState('uberx');

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md flex flex-col gap-6">
      <h2 className="text-3xl font-bold">Request a ride</h2>
      
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400" />
          <input 
            type="text" 
            placeholder="Enter pickup location" 
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <div className="absolute left-[15px] top-[70%] w-[2px] h-10 bg-gray-300" />
        </div>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-black" />
          <input 
            type="text" 
            placeholder="Enter destination" 
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm font-medium">
        <button className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200">
          <Clock size={16} />
          Leave now
        </button>
        <button className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200">
          <Navigation size={16} />
          Current location
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Suggested rides</h3>
        {RIDE_TYPES.map((ride) => (
          <button
            key={ride.id}
            onClick={() => setSelectedRide(ride.id)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
              selectedRide === ride.id ? "border-black bg-gray-50" : "border-transparent hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{ride.icon}</span>
              <div className="text-left">
                <div className="font-bold flex items-center gap-1">
                  {ride.name}
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
                <div className="text-sm text-gray-500">{ride.time}</div>
              </div>
            </div>
            <div className="font-bold text-lg">{ride.price}</div>
          </button>
        ))}
      </div>

      <button className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition-colors">
        Request {RIDE_TYPES.find(r => r.id === selectedRide)?.name}
      </button>
    </div>
  );
};

export default RidePanel;
