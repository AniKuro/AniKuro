import React from 'react';
import { Plus, Check, Heart, Star } from 'lucide-react';
import { UserTrackEntry, TitleLanguage } from '../../types/userList';
import { getDisplayTitle, formatMediaFormat } from '../../utils/formatters';
import { getAnimeCoverImage, handleImageError } from '../../utils/imageHelpers';
import { triggerHaptic } from '../../utils/haptics';

interface MyListCardProps {
  entry: UserTrackEntry;
  titleLanguage: TitleLanguage;
  onSelect: (entry: UserTrackEntry) => void;
  onIncrement: (animeId: number) => void;
  onToggleFavorite: (animeId: number) => void;
}

const MyListCardComponent: React.FC<MyListCardProps> = ({
  entry,
  titleLanguage,
  onSelect,
  onIncrement,
  onToggleFavorite,
}) => {
  const anime = entry.anime;
  const displayTitle = getDisplayTitle(anime?.title, titleLanguage);
  const isManga = entry.mediaType === 'MANGA' ||
                  anime?.type === 'MANGA' ||
                  anime?.format === 'MANGA' ||
                  anime?.format === 'NOVEL' ||
                  anime?.format === 'ONE_SHOT';
  const maxUnits = isManga ? (anime?.chapters || null) : (anime?.episodes || null);
  const percent = maxUnits ? Math.min(100, Math.round((entry.progress / maxUnits) * 100)) : 0;
  const isCompleted = entry.status === 'COMPLETED' || (maxUnits !== null && entry.progress >= maxUnits);
  const coverImageSrc = getAnimeCoverImage(anime?.coverImage);
  const unitLabel = isManga ? 'Ch' : 'Ep';

  const handleCardClick = () => {
    triggerHaptic('light');
    onSelect(entry);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex gap-3.5 p-3 rounded-2xl glass-card hover:border-sky-500/50 cursor-pointer tap-active select-none border border-[var(--border-color)] shadow-sm list-item-content-auto"
    >
      {/* Poster Image */}
      <div className="relative shrink-0 w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 flex items-center justify-center">
        <img
          src={coverImageSrc}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => handleImageError(e, false)}
        />
        {/* Status pill overlay */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-slate-950/90 !text-sky-300 shadow">
          {formatMediaFormat(anime?.format)}
        </div>
      </div>

      {/* Info & Progress */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] line-clamp-1 leading-snug group-hover:text-sky-500 transition-colors">
              {displayTitle}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('selection');
                onToggleFavorite(entry.animeId);
              }}
              title="Favorite"
              className={`p-1 rounded-lg transition-all active:scale-75 ${
                entry.favorite ? 'text-pink-500' : 'text-[var(--text-muted)] hover:text-pink-500'
              }`}
            >
              <Heart size={14} className={entry.favorite ? 'fill-pink-500' : ''} />
            </button>
          </div>

          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {anime?.genres?.[0] || 'Anime'} {anime?.seasonYear ? `• ${anime.seasonYear}` : ''}
          </p>

          {entry.score > 0 && (
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-500">
              <Star size={12} className="fill-amber-400" />
              <span>{entry.score}/10</span>
            </div>
          )}
        </div>

        {/* Progress Bar & Quick Increment */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-[var(--text-secondary)]">
              {unitLabel} <strong className="text-[var(--text-primary)] font-extrabold">{entry.progress}</strong>
              <span className="text-[var(--text-muted)] font-normal"> / {maxUnits || '?'}</span>
            </span>

            {/* +1 Quick Increment Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                onIncrement(entry.animeId);
              }}
              disabled={isCompleted}
              title={isManga ? '+1 Chapter' : '+1 Episode'}
              className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all active:scale-90 ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 cursor-default'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20'
              }`}
            >
              {isCompleted ? (
                <>
                  <Check size={12} className="stroke-[3]" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Plus size={12} className="stroke-[3]" />
                  <span>+1 {unitLabel}</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-indigo-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyListCard = React.memo(MyListCardComponent);
