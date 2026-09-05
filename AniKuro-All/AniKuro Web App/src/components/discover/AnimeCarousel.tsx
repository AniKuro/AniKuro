import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { UserTrackEntry, TitleLanguage } from '../../types/userList';
import { AnimeCard } from './AnimeCard';
import { useDragToScroll } from '../../hooks/useDragToScroll';

interface AnimeCarouselProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  animeList: AnimeMedia[];
  userEntries: UserTrackEntry[];
  titleLanguage: TitleLanguage;
  onSelect: (anime: AnimeMedia) => void;
  onQuickTrack: (e: React.MouseEvent, anime: AnimeMedia) => void;
  onSeeAll?: () => void;
  isLoading?: boolean;
}

export const AnimeCarousel: React.FC<AnimeCarouselProps> = ({
  title,
  subtitle,
  icon,
  animeList,
  userEntries,
  titleLanguage,
  onSelect,
  onQuickTrack,
  onSeeAll,
  isLoading = false,
}) => {
  const {
    isDragging,
    canScrollLeft,
    canScrollRight,
    scrollLeft,
    scrollRight,
    dragProps,
  } = useDragToScroll([animeList, isLoading]);

  const handleSafeSelect = (anime: AnimeMedia) => {
    if (!isDragging) {
      onSelect(anime);
    }
  };

  const handleSafeQuickTrack = (e: React.MouseEvent, anime: AnimeMedia) => {
    if (!isDragging) {
      onQuickTrack(e, anime);
    }
  };

  return (
    <section className="relative space-y-2 py-2 group/carousel">
      {/* Header */}
      <div className="flex items-center justify-between px-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-sky-500 shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-extrabold text-[var(--text-primary)] tracking-tight leading-none truncate">
              {title}
            </h2>
            {subtitle && <p className="text-[10px] md:text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-[180px] sm:max-w-none">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Left / Right Header Scroll Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={scrollLeft}
              title="Scroll Left"
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-primary)] hover:text-sky-400 hover:border-sky-400/50 active:scale-90 transition-all ${
                canScrollLeft ? 'opacity-100 shadow-sm cursor-pointer' : 'opacity-40 hover:opacity-80'
              }`}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={scrollRight}
              title="Scroll Right"
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-primary)] hover:text-sky-400 hover:border-sky-400/50 active:scale-90 transition-all ${
                canScrollRight ? 'opacity-100 shadow-sm cursor-pointer' : 'opacity-40 hover:opacity-80'
              }`}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="flex items-center gap-0.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors ml-1"
            >
              <span>See All</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Carousel Container with Edge Floating Controls */}
      <div className="relative">
        {/* Floating Left Arrow (desktop/hover) */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-sky-500 hover:text-slate-950 !text-white border border-white/20 hover:border-sky-400 items-center justify-center shadow-2xl backdrop-blur-xl active:scale-90 transition-all cursor-pointer opacity-90 hover:opacity-100"
            title="Scroll Left"
          >
            <ChevronLeft size={20} className="stroke-[2.5]" />
          </button>
        )}

        {/* Floating Right Arrow (desktop/hover) */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-sky-500 hover:text-slate-950 !text-white border border-white/20 hover:border-sky-400 items-center justify-center shadow-2xl backdrop-blur-xl active:scale-90 transition-all cursor-pointer opacity-90 hover:opacity-100"
            title="Scroll Right"
          >
            <ChevronRight size={20} className="stroke-[2.5]" />
          </button>
        )}

        {/* Horizontal Scroll / Drag List */}
        <div
          {...dragProps}
          className="flex gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-2 -mx-2 px-2 select-none cursor-grab active:cursor-grabbing scroll-smooth carousel-contain"
          style={{
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[130px] sm:w-[165px] md:w-[180px] aspect-[2/3] rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
            ))
          ) : (
            (animeList || []).map((anime) => {
              if (!anime) return null;
              const userEntry = (userEntries || []).find((e) => e && e.animeId === anime.id);
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  userEntry={userEntry}
                  titleLanguage={titleLanguage}
                  onSelect={handleSafeSelect}
                  onQuickTrack={handleSafeQuickTrack}
                />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
