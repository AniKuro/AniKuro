import React, { useState, useMemo } from 'react';
import { Search, Plus, BookmarkCheck, Lock, ShieldCheck, LogIn, Tv, BookOpen, X } from 'lucide-react';
import { UserTrackEntry, TrackStatus, TitleLanguage } from '../../types/userList';
import { AnimeMedia } from '../../types/anime';
import { MyListCard } from './MyListCard';
import { useDragToScroll } from '../../hooks/useDragToScroll';
import { useBackHandler } from '../../services/backHandler';

const ANIME_STATUS_TABS: { id: TrackStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'CURRENT', label: 'Watching' },
  { id: 'PLANNING', label: 'Plan to Watch' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'PAUSED', label: 'On Hold' },
  { id: 'DROPPED', label: 'Dropped' },
];

const MANGA_STATUS_TABS: { id: TrackStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'CURRENT', label: 'Reading' },
  { id: 'PLANNING', label: 'Plan to Read' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'PAUSED', label: 'On Hold' },
  { id: 'DROPPED', label: 'Dropped' },
];

interface MyListScreenProps {
  entries: UserTrackEntry[];
  titleLanguage: TitleLanguage;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
  onSelectAnime: (anime: AnimeMedia) => void;
  onIncrementProgress: (animeId: number) => void;
  onToggleFavorite: (animeId: number) => void;
  onNavigateToDiscover: () => void;
  onOpenCustomModal: () => void;
}

export const MyListScreen: React.FC<MyListScreenProps> = ({
  entries,
  titleLanguage,
  isLoggedIn = false,
  onOpenLoginModal,
  onSelectAnime,
  onIncrementProgress,
  onToggleFavorite,
  onNavigateToDiscover,
  onOpenCustomModal,
}) => {
  const { dragProps: statusDragProps, isDragging: isDraggingStatus } = useDragToScroll();
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [selectedStatus, setSelectedStatus] = useState<TrackStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Back button handling: Clear search filter if active
  useBackHandler(Boolean(searchQuery), () => setSearchQuery(''), 15);

  const isMangaEntry = (entry: UserTrackEntry) => {
    return (
      entry.mediaType === 'MANGA' ||
      entry.anime?.type === 'MANGA' ||
      entry.anime?.format === 'MANGA' ||
      entry.anime?.format === 'NOVEL' ||
      entry.anime?.format === 'ONE_SHOT'
    );
  };

  const animeEntries = useMemo(() => entries.filter((e) => !isMangaEntry(e)), [entries]);
  const mangaEntries = useMemo(() => entries.filter((e) => isMangaEntry(e)), [entries]);

  const currentTypeEntries = mediaType === 'MANGA' ? mangaEntries : animeEntries;
  const statusTabs = mediaType === 'MANGA' ? MANGA_STATUS_TABS : ANIME_STATUS_TABS;

  const filteredEntries = useMemo(() => {
    return currentTypeEntries.filter((entry) => {
      const matchesStatus = selectedStatus === 'ALL' || entry.status === selectedStatus;
      const title = entry.anime?.title?.romaji || entry.anime?.title?.english || '';
      const matchesSearch = !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [currentTypeEntries, selectedStatus, searchQuery]);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-8 lg:px-12 py-3 sm:py-6 space-y-4 sm:space-y-6 flex-1">
      {/* Login Gate Notice for Unauthenticated Users */}
      {!isLoggedIn && onOpenLoginModal && (
        <div className="login-gate-banner p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border border-sky-400/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 animate-fade-in">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-400/50 flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-base font-black text-white">
                  Login Required to Track {mediaType === 'MANGA' ? 'Manga' : 'Anime'}
                </h4>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-sky-500/20 text-sky-500 dark:text-sky-300 text-[9px] sm:text-[10px] font-bold border border-sky-500/30">
                  AniList Auth
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                Authorize your AniList account to track {mediaType === 'MANGA' ? 'manga chapters' : 'anime episodes'} and sync your library across devices.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLoginModal}
            className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            <LogIn size={14} />
            <span>Login with AniList</span>
          </button>
        </div>
      )}

      {/* Anime vs Manga Switcher & Library Meta */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center p-1 rounded-2xl glass-card border border-[var(--border-color)] shadow-sm bg-[var(--bg-secondary)]/50">
          <button
            onClick={() => {
              setMediaType('ANIME');
              setSelectedStatus('ALL');
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              mediaType === 'ANIME'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-sky-500/5'
            }`}
          >
            <Tv size={15} />
            <span>Anime</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              mediaType === 'ANIME' ? 'bg-slate-950/50 text-sky-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
            }`}>
              {animeEntries.length}
            </span>
          </button>

          <button
            onClick={() => {
              setMediaType('MANGA');
              setSelectedStatus('ALL');
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              mediaType === 'MANGA'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-sky-500/5'
            }`}
          >
            <BookOpen size={15} />
            <span>Manga</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              mediaType === 'MANGA' ? 'bg-slate-950/50 text-sky-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
            }`}>
              {mangaEntries.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] sm:text-xs text-[var(--text-muted)] font-semibold hidden sm:flex items-center gap-1.5">
          <span>Tracking:</span>
          <strong className="text-[var(--text-primary)] font-extrabold">
            {currentTypeEntries.length} {mediaType === 'MANGA' ? 'manga titles' : 'anime titles'}
          </strong>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={mediaType === 'MANGA' ? "Search your manga library..." : "Search your anime library..."}
            className="w-full pl-9 sm:pl-11 pr-8 sm:pr-10 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 shadow-sm transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          onClick={onOpenCustomModal}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs border border-transparent shadow-md shadow-sky-500/20 active:scale-95 transition-all shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Plus size={15} className="stroke-[3] shrink-0" />
          <span className="hidden sm:inline">Add Custom</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div
        {...statusDragProps}
        className="flex gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 select-none cursor-grab active:cursor-grabbing scroll-smooth"
      >
        {statusTabs.map((tab) => {
          const isSelected = selectedStatus === tab.id;
          const count = tab.id === 'ALL' ? currentTypeEntries.length : currentTypeEntries.filter((e) => e.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isDraggingStatus) setSelectedStatus(tab.id);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                  : 'glass-card text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-sky-400/50 hover:bg-sky-500/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${isSelected ? 'bg-slate-950 text-sky-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Grid View (Wide Desktop Canvas) */}
      {filteredEntries.length === 0 ? (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl glass-card border border-[var(--border-color)] flex items-center justify-center text-sky-500 shadow-xl">
            {!isLoggedIn ? <Lock size={36} /> : <BookmarkCheck size={38} />}
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
              {!isLoggedIn
                ? 'Login Required to View Library'
                : searchQuery
                ? `No ${mediaType === 'MANGA' ? 'Manga' : 'Anime'} Found`
                : selectedStatus !== 'ALL'
                ? `No ${mediaType === 'MANGA' ? 'Manga' : 'Anime'} in ${statusTabs.find((t) => t.id === selectedStatus)?.label || 'Category'}`
                : `Your ${mediaType === 'MANGA' ? 'Manga' : 'Anime'} Library is Empty`}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              {!isLoggedIn
                ? `Connect your AniList account to sync your ${mediaType === 'MANGA' ? 'manga reading list' : 'anime watchlist'}, log progress, and manage your collection.`
                : searchQuery
                ? `No ${mediaType === 'MANGA' ? 'manga' : 'anime'} in your library matched your search term.`
                : selectedStatus !== 'ALL'
                ? `You haven't tracked any ${mediaType === 'MANGA' ? 'manga' : 'anime'} with this status yet.`
                : `You have not added any ${mediaType === 'MANGA' ? 'manga to your reading list' : 'anime to your watchlist'} yet.`}
            </p>
          </div>
          {!isLoggedIn && onOpenLoginModal ? (
            <button
              onClick={onOpenLoginModal}
              className="mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogIn size={15} />
              <span>Login with AniList</span>
            </button>
          ) : (
            <button
              onClick={onNavigateToDiscover}
              className="mt-2 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {mediaType === 'MANGA' ? 'Explore Manga to Read' : 'Explore Anime to Track'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredEntries.map((entry) => (
            <MyListCard
              key={entry.animeId}
              entry={entry}
              titleLanguage={titleLanguage}
              onSelect={() => onSelectAnime(entry.anime)}
              onIncrement={onIncrementProgress}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};