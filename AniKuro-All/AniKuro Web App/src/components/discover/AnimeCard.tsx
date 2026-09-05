import React from 'react';
import { Plus, Check, Star } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { UserTrackEntry, TitleLanguage } from '../../types/userList';
import { getDisplayTitle, formatMediaFormat } from '../../utils/formatters';
import { getAnimeCoverImage, handleImageError } from '../../utils/imageHelpers';
import { triggerHaptic } from '../../utils/haptics';

interface AnimeCardProps {
  anime: AnimeMedia;
  userEntry?: UserTrackEntry;
  titleLanguage: TitleLanguage;
  onSelect: (anime: AnimeMedia) => void;
  onQuickTrack: (e: React.MouseEvent, anime: AnimeMedia) => void;
  isGrid?: boolean;
}

const AnimeCardComponent: React.FC<AnimeCardProps> = ({
  anime,
  userEntry,
  titleLanguage,
  onSelect,
  onQuickTrack,
  isGrid = false,
}) => {
  const displayTitle = getDisplayTitle(anime.title, titleLanguage);
  const isTracked = !!userEntry;
  const imageSrc = getAnimeCoverImage(anime.coverImage);
  const isManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL' || anime.format === 'ONE_SHOT';

  const handleCardClick = () => {
    triggerHaptic('light');
    onSelect(anime);
  };

  const handleQuickTrackClick = (e: React.MouseEvent) => {
    triggerHaptic('medium');
    onQuickTrack(e, anime);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col rounded-2xl overflow-hidden glass-card hover:border-sky-500/50 tap-active cursor-pointer select-none card-content-auto ${
        isGrid ? 'w-full' : 'shrink-0 w-[130px] sm:w-[165px] md:w-[180px] carousel-snap-item'
      }`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 flex items-center justify-center">
        <img
          src={imageSrc}
          alt={displayTitle}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          onError={(e) => handleImageError(e, false)}
        />

        {/* Top Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Format Badge */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 rounded-md bg-slate-950/85 border border-white/15 text-[8px] sm:text-[9px] font-bold !text-white shadow">
          {formatMediaFormat(anime.format)}
        </div>

        {/* Score Badge */}
        {anime.averageScore && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-950/85 border border-amber-400/40 text-[9px] sm:text-[10px] font-bold !text-amber-300 shadow">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span>{anime.averageScore}%</span>
          </div>
        )}

        {/* Quick Add Button */}
        <button
          onClick={handleQuickTrackClick}
          title={isTracked ? 'Tracked in your list' : 'Add to your list'}
          className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 p-1.5 rounded-xl border shadow-lg transition-transform active:scale-90 ${
            isTracked
              ? 'bg-emerald-500/90 border-emerald-400 !text-white'
              : 'bg-slate-950/85 border-white/20 !text-white hover:bg-sky-500 hover:border-sky-400'
          }`}
        >
          {isTracked ? <Check size={13} className="stroke-[3]" /> : <Plus size={13} className="stroke-[3]" />}
        </button>
      </div>

      {/* Anime Title & Meta */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
        <h3 className="font-bold text-[11px] sm:text-xs text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors">
          {displayTitle}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[9px] sm:text-[10px] text-[var(--text-muted)]">
          <span className="truncate max-w-[65px] sm:max-w-none">{anime.genres?.[0] || (isManga ? 'Manga' : 'Anime')}</span>
          <span>{isManga ? (anime.chapters ? `${anime.chapters} ch` : 'TBA') : (anime.episodes ? `${anime.episodes} eps` : 'TBA')}</span>
        </div>
      </div>
    </div>
  );
};

export const AnimeCard = React.memo(AnimeCardComponent);
