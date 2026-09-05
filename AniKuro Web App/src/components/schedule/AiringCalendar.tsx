import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Plus, Check, Star, Bookmark } from 'lucide-react';
import { AiringScheduleItem, AnimeMedia } from '../../types/anime';
import { UserTrackEntry, TitleLanguage } from '../../types/userList';
import { anilistApi } from '../../services/anilistApi';
import { getDisplayTitle, formatAiringCountdown, formatMediaFormat } from '../../utils/formatters';
import { getAnimeCoverImage, handleImageError } from '../../utils/imageHelpers';
import { useDragToScroll } from '../../hooks/useDragToScroll';

interface AiringCalendarProps {
  userEntries: UserTrackEntry[];
  titleLanguage: TitleLanguage;
  onSelectAnime: (anime: AnimeMedia) => void;
  onQuickTrack: (anime: AnimeMedia) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AiringCalendar: React.FC<AiringCalendarProps> = ({
  userEntries,
  titleLanguage,
  onSelectAnime,
  onQuickTrack,
}) => {
  const { dragProps: dayDragProps, isDragging: isDraggingDays } = useDragToScroll();
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [scheduleItems, setScheduleItems] = useState<AiringScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyWatching, setShowOnlyWatching] = useState(false);

  const { startTimestamp, endTimestamp, currentDayName, formattedDate } = useMemo(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + selectedDayOffset);
    targetDate.setHours(0, 0, 0, 0);

    const start = Math.floor(targetDate.getTime() / 1000);
    const end = start + 86400;

    const dayName = DAYS[targetDate.getDay()];
    const dateStr = targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return {
      startTimestamp: start,
      endTimestamp: end,
      currentDayName: selectedDayOffset === 0 ? 'Today' : dayName,
      formattedDate: `${dayName}, ${dateStr}`,
    };
  }, [selectedDayOffset]);

  useEffect(() => {
    let isMounted = true;
    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        const items = await anilistApi.getAiringSchedule(startTimestamp, endTimestamp);
        if (isMounted) setScheduleItems(items);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadSchedule();
    return () => {
      isMounted = false;
    };
  }, [startTimestamp, endTimestamp]);

  const filteredItems = useMemo(() => {
    if (!showOnlyWatching) return scheduleItems;
    return scheduleItems.filter((item) =>
      userEntries.some((e) => e.animeId === item.media.id && e.status === 'CURRENT')
    );
  }, [scheduleItems, showOnlyWatching, userEntries]);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-8 lg:px-12 py-3 sm:py-6 space-y-4 sm:space-y-6 flex-1">
      {/* Header & Day Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 glass-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-[var(--border-color)] shadow-sm">
        {/* Day Pills Carousel */}
        <div
          {...dayDragProps}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 select-none cursor-grab active:cursor-grabbing scroll-smooth"
        >
          {[-1, 0, 1, 2, 3, 4, 5, 6].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const label = offset === 0 ? 'Today' : DAYS[d.getDay()];
            const isSelected = selectedDayOffset === offset;

            return (
              <button
                key={offset}
                onClick={() => {
                  if (!isDraggingDays) setSelectedDayOffset(offset);
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 scale-[1.02]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-sky-500/10'
                }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <span className="text-xs font-bold text-[var(--text-primary)]">{formattedDate}</span>
          <button
            onClick={() => setShowOnlyWatching(!showOnlyWatching)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
              showOnlyWatching
                ? 'bg-sky-500/20 text-sky-500 border-sky-500/40'
                : 'glass-card text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Bookmark size={13} />
            <span>My Watching</span>
          </button>
        </div>
      </div>

      {/* Schedule Items Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-[var(--text-muted)]">Loading airing broadcast matrix...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <Clock size={36} className="mx-auto text-[var(--text-muted)]" />
          <h3 className="text-base font-black text-[var(--text-primary)]">No Airing Anime Scheduled</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {showOnlyWatching
              ? 'None of your currently watching anime are releasing new episodes on this day.'
              : 'No scheduled broadcasts found for this date.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const anime = item.media;
            const displayTitle = getDisplayTitle(anime.title, titleLanguage);
            const userEntry = userEntries.find((e) => e.animeId === anime.id);
            const isTracked = !!userEntry;
            const coverSrc = getAnimeCoverImage(anime.coverImage);

            const airDate = new Date(item.airingAt * 1000);
            const airTimeStr = airDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnime(anime)}
                className="group relative flex gap-3.5 p-3.5 rounded-2xl glass-card hover:border-sky-500/50 cursor-pointer active:scale-[0.99] transition-all border border-[var(--border-color)] shadow-sm"
              >
                {/* Cover Poster */}
                <div className="relative shrink-0 w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 flex items-center justify-center">
                  <img
                    src={coverSrc}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => handleImageError(e, false)}
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-black/80 !text-sky-300 backdrop-blur-md">
                    Ep {item.episode}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="flex items-center gap-1 text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-500/25">
                        <Clock size={11} />
                        {airTimeStr} ({formatAiringCountdown(item.timeUntilAiring)})
                      </span>
                      {anime.averageScore && (
                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                          <Star size={10} className="fill-amber-400" />
                          {anime.averageScore}%
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-sky-500 transition-colors">
                      {displayTitle}
                    </h4>

                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {formatMediaFormat(anime.format)} {anime.genres?.[0] ? `• ${anime.genres[0]}` : ''}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                      {userEntry ? `Watched: ${userEntry.progress} eps` : 'Not in library'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickTrack(anime);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-90 ${
                        isTracked
                          ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20'
                      }`}
                    >
                      {isTracked ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} className="stroke-[3]" />}
                      <span>{isTracked ? 'Tracked' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};