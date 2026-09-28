import { useState } from 'react';
import { MapPin, Clock, Star, MessageSquare, Train, Bus, Info, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

const MOCK_ROUTES = [
  {
    id: 1,
    type: 'train',
    line: 'Red Line (M1)',
    time: '24 min',
    cost: '$2.50',
    rating: 4.8,
    feedbackCount: 124,
    status: 'On time',
    localTip: 'Use the rear carriage for a shorter walk to the transfer at Central Station.',
    color: 'bg-red-500',
    tags: ['Fastest', 'Local Choice']
  },
  {
    id: 2,
    type: 'bus',
    line: 'Bus 142',
    time: '38 min',
    cost: '$1.75',
    rating: 4.2,
    feedbackCount: 89,
    status: '3 min delay',
    localTip: 'Wait at the Oak St stop instead of Main St to guarantee a seat during rush hour.',
    color: 'bg-blue-500',
    tags: ['Scenic', 'Cheap']
  },
  {
    id: 3,
    type: 'mix',
    line: 'M2 → Bus 10',
    time: '31 min',
    cost: '$3.25',
    rating: 3.9,
    feedbackCount: 56,
    status: 'Crowded',
    localTip: 'The transfer at Union Sq is confusing; follow the yellow floor markings.',
    color: 'bg-green-600',
    tags: ['Direct']
  }
];

const RouteSearch = () => {
  const [destination, setDestination] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);

  return (
    <div className={cn(
        "bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full flex flex-col transition-all duration-500 ease-in-out",
        showRoutes ? "h-[70vh]" : "h-auto"
    )}>
      <div className="p-1.5 flex justify-center">
        <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
      </div>
      
      <div className="px-6 py-4 flex flex-col gap-5 overflow-hidden">
        {!showRoutes && (
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-zinc-900">Where to next?</h2>
                <p className="text-zinc-500 text-sm">Real human insights for your city journey.</p>
            </div>
        )}
        
        <div className="space-y-3">
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-400" />
                </div>
                <input 
                    type="text" 
                    placeholder="Your current location" 
                    defaultValue="West End, 4th Ave"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                />
                <div className="absolute left-[21px] top-[70%] w-[1px] h-10 bg-zinc-100" />
            </div>
            
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <MapPin size={18} className="text-blue-600" />
                </div>
                <input 
                    type="text" 
                    placeholder="Where are you heading?" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                />
            </div>
        </div>

        {!showRoutes ? (
            <button 
                onClick={() => setShowRoutes(true)}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg shadow-zinc-200 active:scale-[0.98] mb-4"
            >
                Find Best Routes
            </button>
        ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-zinc-800">Best community routes</h3>
                    <button 
                        onClick={() => setShowRoutes(false)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                    >
                        <ChevronDown size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20 scrollbar-hide">
                    {MOCK_ROUTES.map((route) => (
                    <div 
                        key={route.id}
                        className="group border border-zinc-100 rounded-2xl p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-3">
                            <div className={cn("p-2.5 rounded-xl text-white shadow-sm", route.color)}>
                            {route.type === 'train' ? <Train size={20} /> : <Bus size={20} />}
                            </div>
                            <div>
                            <div className="font-bold text-zinc-900 leading-tight">{route.line}</div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-tighter">
                                <span className="flex items-center gap-1"><Clock size={10} /> {route.time}</span>
                                <span>•</span>
                                <span>{route.cost}</span>
                            </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                            <Star size={12} fill="currentColor" />
                            {route.rating}
                            </div>
                            <div className="text-[9px] text-zinc-400 font-bold mt-1 uppercase">{route.feedbackCount} tips</div>
                        </div>
                        </div>

                        <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100 flex gap-3">
                            <div className="mt-0.5"><MessageSquare size={14} className="text-blue-500" /></div>
                            <div className="text-xs text-zinc-600 leading-relaxed italic">
                                "{route.localTip}"
                            </div>
                        </div>
                    </div>
                    ))}
                    
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <Info size={14} className="shrink-0" />
                        <span>Route scores are based on the last 30 minutes of community feedback.</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RouteSearch;
