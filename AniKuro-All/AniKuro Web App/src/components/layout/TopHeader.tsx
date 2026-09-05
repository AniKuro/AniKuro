import React from 'react';
import { Palette, PlusCircle, Sparkles, Compass, Bookmark, Calendar, User, ShieldCheck, Bell } from 'lucide-react';
import { AppTheme, AniListUserProfile } from '../../types/userList';
import { AnikuroLogo } from './AnikuroLogo';
import { NavTab } from './BottomNav';
import { triggerHaptic } from '../../utils/haptics';

interface TopHeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  watchingCount: number;
  onOpenThemeModal: () => void;
  onOpenCustomAnimeModal: () => void;
  onOpenAiModal: () => void;
  onOpenNotificationModal?: () => void;
  unreadNotificationCount?: number;
  currentTheme: AppTheme;
  mascot?: 'female' | 'male';
  anilistUser?: AniListUserProfile | null;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onTabChange,
  watchingCount,
  onOpenThemeModal,
  onOpenCustomAnimeModal,
  onOpenAiModal,
  onOpenNotificationModal,
  unreadNotificationCount = 0,
  mascot = 'female',
  anilistUser,
}) => {
  return (
    <header
      className="sticky top-0 z-30 w-full px-3 sm:px-8 lg:px-12 py-2.5 sm:py-3.5 flex items-center justify-between glass-panel border-b border-[var(--border-color)] md:backdrop-blur-2xl transition-colors duration-200 layer-promoted"
      style={{
        paddingTop: 'max(0.625rem, env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px))',
      }}
    >
      {/* Brand Logo & Tagline */}
      <div onClick={() => onTabChange('discover')} className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0">
        <AnikuroLogo size={36} showText={true} mascot={mascot} />
      </div>

      {/* Desktop Expansive Navigation Center Bar */}
      <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl glass-card border border-[var(--border-color)] shadow-sm">
        <button
          onClick={() => onTabChange('discover')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'discover'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-[var(--text-secondary)] hover:text-sky-400 hover:bg-sky-500/5'
          }`}
        >
          <Compass size={15} />
          <span>Discover</span>
        </button>

        <button
          onClick={() => onTabChange('mylist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'mylist'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-[var(--text-secondary)] hover:text-sky-400 hover:bg-sky-500/5'
          }`}
        >
          <Bookmark size={15} />
          <span>My List</span>
          {watchingCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              activeTab === 'mylist' ? 'bg-slate-950 text-sky-400' : 'bg-sky-500/20 text-sky-400'
            }`}>
              {watchingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('airing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'airing'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-[var(--text-secondary)] hover:text-sky-400 hover:bg-sky-500/5'
          }`}
        >
          <Calendar size={15} />
          <span>Airing Schedule</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-[var(--text-secondary)] hover:text-sky-400 hover:bg-sky-500/5'
          }`}
        >
          <User size={15} />
          <span>Profile & Stats</span>
        </button>
      </nav>

      {/* Action Controls & AI Sensei */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* KuroSensei AI Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenAiModal();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-pink-500/15 text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-white border border-sky-400/40 hover:border-sky-400 shadow-sm shadow-sky-500/10 tap-active text-[11px] sm:text-xs font-black group cursor-pointer"
        >
          <Sparkles size={14} className="text-amber-500 fill-amber-500/30 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 dark:from-sky-300 dark:via-purple-200 dark:to-pink-300 bg-clip-text text-transparent font-black whitespace-nowrap">
            <span className="hidden sm:inline">KuroSensei </span>AI
          </span>
        </button>

        {/* Notification Bell Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenNotificationModal?.();
          }}
          title="Episode Notifications"
          className="relative flex items-center justify-center p-1.5 sm:px-2.5 sm:py-2 rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-sky-400 hover:border-sky-400/50 tap-active shadow-sm cursor-pointer shrink-0"
        >
          <Bell size={16} className={unreadNotificationCount > 0 ? 'text-sky-400' : ''} />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md shadow-rose-500/50 ring-2 ring-[var(--bg-primary)]">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Add Custom Anime */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenCustomAnimeModal();
          }}
          title="Add Custom / Unlisted Anime"
          className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-sky-500 hover:border-sky-400/50 tap-active text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap shrink-0"
        >
          <PlusCircle size={15} className="shrink-0" />
          <span className="hidden lg:inline">Add Custom</span>
        </button>

        {/* Theme Settings */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenThemeModal();
          }}
          title="Themes & Appearance"
          className="p-1.5 sm:p-2 rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-sky-500 hover:border-sky-400/50 tap-active shadow-sm cursor-pointer flex items-center justify-center shrink-0"
        >
          <Palette size={16} />
        </button>
      </div>
    </header>
  );
};