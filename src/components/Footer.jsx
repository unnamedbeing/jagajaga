import { Globe, Info, MessageSquare, Heart, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white text-zinc-900 px-6 md:px-16 py-20 mt-20 border-t border-zinc-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl tracking-tighter shadow-lg shadow-blue-200">
                T
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">TransitBuddy</h1>
        </div>
        <p className="mb-10 hover:text-blue-600 transition-colors cursor-pointer font-medium">Visit Community Help Center</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-20 text-zinc-600">
          <div>
            <h3 className="font-bold mb-6 text-zinc-900">Community</h3>
            <ul className="space-y-4 text-sm">
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Local Guides</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Reward Program</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Commuter Stories</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Forum</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Safety Hub</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-6 text-zinc-900">Transit Data</h3>
            <ul className="space-y-4 text-sm">
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Live Map</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Network Map</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">GTFS Integration</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Operator Portal</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-6 text-zinc-900">Company</h3>
            <ul className="space-y-4 text-sm">
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Our Mission</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Impact Report</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Newsroom</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-6 text-zinc-900">Support</h3>
            <ul className="space-y-4 text-sm">
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Help Center</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Contact Us</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Accessibility</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-t border-zinc-100 pt-10">
          <div className="flex gap-8 text-zinc-400">
            <Info size={20} className="cursor-pointer hover:text-blue-600 transition-colors" />
            <MessageSquare size={20} className="cursor-pointer hover:text-blue-600 transition-colors" />
            <Heart size={20} className="cursor-pointer hover:text-blue-600 transition-colors" />
            <Shield size={20} className="cursor-pointer hover:text-blue-600 transition-colors" />
          </div>
          
          <div className="flex flex-wrap gap-6 items-center text-zinc-600">
            <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
              <Globe size={16} />
              <span className="text-sm">English</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
              <MapPin size={16} />
              <span className="text-sm">New York, NY</span>
            </div>
          </div>
        </div>
        
        <div className="mt-20 flex flex-col md:flex-row justify-between text-[11px] text-zinc-400 gap-4">
          <p>© 2026 TransitBuddy Inc. Built for humans, by humans.</p>
          <div className="flex gap-4">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Legal</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const MapPin = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default Footer;
