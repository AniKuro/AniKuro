import React from 'react';
import { Compass, Bookmark, Calendar, User } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export type NavTab = 'discover' | 'mylist' | 'airing' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  watchingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  watchingCount = 0,
}) => {
  interface TabItem {
    id: NavTab;
    label: string;
    icon: typeof Compass;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'mylist', label: 'My List', icon: Bookmark, badge: watchingCount > 0 ? watchingCount : undefined },
    { id: 'airing', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleTabPress = (tabId: NavTab) => {
    triggerHaptic('selection');
    if (activeTab === tabId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-3 pt-1.5 sm:pt-2 glass-panel border-t border-[var(--border-color)] transition-colors duration-200 shadow-2xl layer-promoted"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px))',
      }}
    >
      <nav className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 sm:gap-1 py-1 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-all cursor-pointer tap-active select-none ${
                isActive
                  ? 'text-sky-500 font-black bg-sky-500/10 border border-sky-500/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5] scale-105 transition-transform' : 'stroke-2'} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="absolute top-0 right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-sky-500 text-slate-950 shadow-sm">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
