import { Home, Bookmark, Bell, User } from 'lucide-react';
import { cn } from '../utils/cn';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'saved', icon: Bookmark, label: 'Saved' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-8 pt-3 px-6 z-50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="flex flex-col items-center gap-1 group"
        >
          <tab.icon 
            size={24} 
            className={cn(
              "transition-colors",
              activeTab === tab.id ? "text-blue-600 fill-blue-50" : "text-zinc-400 group-hover:text-zinc-600"
            )} 
          />
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider transition-colors",
            activeTab === tab.id ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
          )}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
