import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { UserTrackEntry, TitleLanguage } from '../../types/userList';
import { getDisplayTitle, cleanDescription, formatMediaFormat } from '../../utils/formatters';
import { getAnimeBannerImage, handleImageError } from '../../utils/imageHelpers';

interface HeroSpotlightProps {
  animeList: AnimeMedia[];
  userEntries: UserTrackEntry[];
  titleLanguage: TitleLanguage;
  onSelect: (anime: AnimeMedia) => void;
  onTrack: (anime: AnimeMedia) => void;
  onPlayTrailer?: (trailerId: string) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  animeList,
  userEntries,
  titleLanguage,
  onSelect,
  onTrack,
  onPlayTrailer,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  const isMouseDownRef = useRef(false);

  const goToPrev = () => {
    if (!animeList || animeList.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + animeList.length) % animeList.length);
  };

  const goToNext = () => {
    if (!animeList || animeList.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % animeList.length);
  };

  useEffect(() => {
    if (!animeList || animeList.length === 0) return;
    const timer = setInterval(() => {
      if (!document.hidden) {
        goToNext();
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [animeList]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (diff > 45) {
        goToNext();
      } else if (diff < -45) {
        goToPrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Mouse swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isMouseDownRef.current && mouseStartXRef.current !== null) {
      const diff = mouseStartXRef.current - e.clientX;
      if (diff > 50) {
        goToNext();
      } else if (diff < -50) {
        goToPrev();
      }
    }
    isMouseDownRef.current = false;
    mouseStartXRef.current = null;
  };

  if (!animeList || animeList.length === 0) return null;

  const current = animeList[currentIndex] || animeList[0];
  if (!current) return null;
  const displayTitle = getDisplayTitle(current.title, titleLanguage);
  const isTracked = (userEntries || []).some((e) => e && e.animeId === current.id);
  const bannerSrc = getAnimeBannerImage(current.bannerImage, current.coverImage);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden glass-panel border border-[var(--border-color)] shadow-2xl my-2 select-none group/hero"
    >
      <div className="relative w-full min-h-[220px] sm:min-h-[300px] md:min-h-[360px] lg:min-h-[440px] aspect-[16/10] sm:aspect-[21/9] md:aspect-[24/9] lg:aspect-[32/9] overflow-hidden bg-slate-950">
        <img
          src={bannerSrc}
          alt={displayTitle}
          draggable={false}
          className="w-full h-full object-cover object-center filter brightness-60 group-hover/hero:scale-105 transition-transform duration-700 pointer-events-none select-none"
          onError={(e) => handleImageError(e, true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/35 to-transparent pointer-events-none" />
      </div>

      {/* Navigation Arrows for Hero Spotlight (Desktop / Tablet) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToPrev();
        }}
        title="Previous Spotlight"
        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-sky-500 hover:text-slate-950 border border-white/20 hover:border-sky-400 !text-white items-center justify-center shadow-2xl backdrop-blur-md opacity-0 group-hover/hero:opacity-100 active:scale-90 transition-all cursor-pointer"
      >
        <ChevronLeft size={22} className="stroke-[2.5]" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        title="Next Spotlight"
        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-sky-500 hover:text-slate-950 border border-white/20 hover:border-sky-400 !text-white items-center justify-center shadow-2xl backdrop-blur-md opacity-0 group-hover/hero:opacity-100 active:scale-90 transition-all cursor-pointer"
      >
        <ChevronRight size={22} className="stroke-[2.5]" />
      </button>

      <div className="absolute inset-0 p-3.5 sm:p-7 lg:p-12 flex flex-col justify-end pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 mb-1 sm:mb-2 pointer-events-auto">
          <span className="px-2 py-0.5 rounded-md bg-sky-500/25 border border-sky-400/50 text-[10px] sm:text-xs font-black !text-sky-300">
            🔥 Spotlight
          </span>
          <span className="px-2 py-0.5 rounded-md bg-black/70 border border-white/20 text-[10px] sm:text-xs font-bold !text-slate-200 backdrop-blur-md">
            {formatMediaFormat(current.format)}
          </span>
          {current.averageScore && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold !text-amber-300 bg-amber-500/25 px-2 py-0.5 rounded-md border border-amber-400/40 backdrop-blur-md">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {current.averageScore}% Score
            </span>
          )}
        </div>

        <h1
          onClick={() => onSelect(current)}
          className="text-base sm:text-xl md:text-2xl lg:text-4xl font-black !text-white leading-snug sm:leading-tight line-clamp-2 cursor-pointer hover:!text-sky-400 transition-colors drop-shadow-md pointer-events-auto w-fit"
        >
          {displayTitle}
        </h1>

        <p className="text-xs sm:text-sm !text-slate-200 line-clamp-2 max-w-3xl mt-1 sm:mt-2 leading-relaxed hidden sm:block drop-shadow pointer-events-auto">
          {cleanDescription(current.description)}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2.5 sm:mt-4 pointer-events-auto">
          <button
            onClick={() => onSelect(current)}
            className="px-3.5 sm:px-6 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/30 active:scale-95 transition-all cursor-pointer"
          >
            Explore Anime
          </button>

          {current.trailer?.id && onPlayTrailer && (
            <button
              onClick={() => onPlayTrailer(current.trailer!.id)}
              className="px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 !text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md backdrop-blur-md cursor-pointer"
            >
              <Play size={14} className="fill-white" />
              <span>Watch Trailer</span>
            </button>
          )}

          <button
            onClick={() => onTrack(current)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all backdrop-blur-md cursor-pointer ${
              isTracked
                ? 'bg-emerald-500/30 !text-emerald-300 border-emerald-400/60'
                : 'bg-white/10 hover:bg-white/20 border-white/30 !text-white hover:border-white/50'
            }`}
          >
            {isTracked ? <Check size={14} className="stroke-[3]" /> : <Plus size={14} className="stroke-[3]" />}
            <span>{isTracked ? 'In Library' : 'Add to List'}</span>
          </button>
        </div>
      </div>

      {/* Dots Slide Indicator */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 z-30 pointer-events-auto">
        {animeList.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            title={`Slide ${i + 1}`}
            className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
              currentIndex === i ? 'w-5 sm:w-7 bg-sky-400' : 'w-1.5 sm:w-2 bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};