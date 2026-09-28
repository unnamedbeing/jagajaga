import { Menu, Globe } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white/80 backdrop-blur-md text-zinc-900 border-b border-zinc-100 px-6 md:px-16 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl tracking-tighter shadow-lg shadow-blue-200">
                T
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">TransitBuddy</h1>
        </div>
        <div className="hidden lg:flex items-center gap-6 font-semibold text-sm text-zinc-500">
          <a href="#" className="hover:text-blue-600 transition-colors">Routes</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Local Guides</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Stations</a>
          <a href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            Community <Menu size={14} />
          </a>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4">
          <button className="flex items-center gap-2 hover:bg-zinc-50 px-3 py-2 rounded-full transition-colors text-sm font-medium text-zinc-600">
            <Globe size={18} />
            <span className="text-sm">English</span>
          </button>
          <button className="hover:bg-zinc-50 px-3 py-2 rounded-full transition-colors text-sm font-medium text-zinc-600">Log in</button>
        </div>
        <button className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm shadow-lg shadow-zinc-200">
          Get Started
        </button>
        <button className="lg:hidden text-zinc-600">
          <Menu size={24} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
