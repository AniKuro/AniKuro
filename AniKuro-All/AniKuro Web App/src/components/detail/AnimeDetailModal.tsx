import React, { useState, useEffect } from 'react';
import { X, Star, Clock, Heart, Play, Plus, Check, Lock } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { UserTrackEntry, TitleLanguage } from '../../types/userList';
import { anilistApi } from '../../services/anilistApi';
import {
  getDisplayTitle,
  cleanDescription,
  formatMediaFormat,
  getMediaStatusBadge,
  formatAiringCountdown,
  getStatusLabel,
  getStatusBadgeClass,
} from '../../utils/formatters';
import { getAnimeCoverImage, getAnimeBannerImage, handleImageError } from '../../utils/imageHelpers';
import { CharacterList } from './CharacterList';
import { RelationsList } from './RelationsList';
import { TrackEditorModal } from './TrackEditorModal';
import { TrailerModal } from './TrailerModal';
import { useBackHandler } from '../../services/backHandler';
import { triggerHaptic } from '../../utils/haptics';
import { useBottomSheetSnap } from '../../hooks/useBottomSheetSnap';
import { SheetCapsule } from '../layout/SheetCapsule';

interface AnimeDetailModalProps {
  anime: AnimeMedia | null;
  userEntry?: UserTrackEntry;
  titleLanguage: TitleLanguage;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
  onClose: () => void;
  onSaveTrack: (anime: AnimeMedia, data: Partial<UserTrackEntry>) => void;
  onDeleteTrack?: (animeId: number) => void;
  onSelectRelatedAnime: (animeId: number) => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  anime: initialAnime,
  userEntry,
  titleLanguage,
  isLoggedIn = false,
  onRequireLogin,
  onClose,
  onSaveTrack,
  onDeleteTrack,
  onSelectRelatedAnime,
}) => {
  const [fullAnime, setFullAnime] = useState<AnimeMedia | null>(initialAnime);
  const [isTrackEditorOpen, setIsTrackEditorOpen] = useState(false);
  const [activeTrailerId, setActiveTrailerId] = useState<string | null>(null);

  // Sub-modal back handlers: Trailer (prio 30), Track Editor (prio 25)
  useBackHandler(Boolean(activeTrailerId), () => setActiveTrailerId(null), 30);
  useBackHandler(isTrackEditorOpen, () => setIsTrackEditorOpen(false), 25);

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const {
    isExpanded,
    sheetRef,
    capsulePillRef,
    capsuleProps,
    sheetStyle,
  } = useBottomSheetSnap({
    isOpen: Boolean(fullAnime),
    onClose: handleClose,
  });

  useEffect(() => {
    if (!initialAnime) return;
    setFullAnime(initialAnime);
    let isMounted = true;

    const fetchDetails = async () => {
      try {
        const details = await anilistApi.getAnimeDetails(initialAnime.id);
        if (isMounted) setFullAnime(details);
      } catch (err) {
        console.warn('Using cached anime metadata:', err);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [initialAnime?.id]);

  if (!fullAnime) return null;

  const displayTitle = getDisplayTitle(fullAnime.title, titleLanguage);
  const statusBadge = getMediaStatusBadge(fullAnime.status);
  const isTracked = !!userEntry;
  const mainStudio = fullAnime.studios?.nodes?.[0]?.name;

  const handleTrackButtonClick = () => {
    triggerHaptic('medium');
    if (!isLoggedIn && onRequireLogin) {
      onRequireLogin();
      return;
    }
    setIsTrackEditorOpen(true);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={sheetStyle}
        className={`w-full max-w-3xl ${isExpanded ? 'h-[96vh] sm:h-[90vh]' : 'h-[68vh] sm:h-[82vh]'} flex flex-col rounded-t-[28px] sm:rounded-[32px] glass-panel border-t border-x sm:border border-slate-700/80 shadow-2xl overflow-hidden relative animate-slide-up sheet-spring`}
      >
        {/* Mobile Sheet Drag Handle */}
        <SheetCapsule
          isExpanded={isExpanded}
          capsuleProps={capsuleProps}
          capsulePillRef={capsulePillRef}
        />

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 sm:px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold !text-white shadow-lg pointer-events-auto">
            {formatMediaFormat(fullAnime.format)}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 rounded-full bg-black/70 backdrop-blur-md border border-white/20 !text-white hover:bg-black/90 pointer-events-auto shadow-lg tap-active cursor-pointer"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto modal-scroll-container pb-24">
          {/* Header Backdrop & Cover Section */}
          <div className="relative w-full aspect-[18/9] sm:aspect-[24/9] max-h-44 sm:max-h-64 bg-slate-950 overflow-hidden">
            <img
              src={getAnimeBannerImage(fullAnime.bannerImage, fullAnime.coverImage)}
              alt={displayTitle}
              className="w-full h-full object-cover brightness-75"
              onError={(e) => handleImageError(e, true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {fullAnime.trailer?.id && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTrailerId(fullAnime.trailer!.id);
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-black/75 backdrop-blur-md border border-white/30 !text-white text-xs font-bold tap-active shadow-xl"
              >
                <Play size={14} className="sm:w-4 sm:h-4 fill-white" />
                <span>Play Trailer</span>
              </button>
            )}
          </div>

          {/* Title & Cover Row */}
          <div className="px-3.5 sm:px-8 -mt-8 sm:-mt-14 relative z-10">
            <div className="flex gap-3 sm:gap-6">
              {/* Poster */}
              <div className="shrink-0 w-20 sm:w-32 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-[var(--border-color)] bg-slate-900 flex items-center justify-center">
                <img
                  src={getAnimeCoverImage(fullAnime.coverImage)}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, false)}
                />
              </div>

              {/* Title & Badges */}
              <div className="flex-1 flex flex-col justify-end min-w-0 pt-1 sm:pt-2">
                <h1 className="text-sm sm:text-xl md:text-2xl font-black text-[var(--text-primary)] leading-snug line-clamp-2">
                  {displayTitle}
                </h1>
                {fullAnime.title.native && (
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium truncate mt-0.5">
                    {fullAnime.title.native}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  {mainStudio && (
                    <span className="px-2 py-0.5 rounded-md glass-card text-[var(--text-secondary)] text-[9px] sm:text-[10px] font-semibold border border-[var(--border-color)] truncate max-w-[100px] sm:max-w-[140px]">
                      {mainStudio}
                    </span>
                  )}
                  {fullAnime.seasonYear && (
                    <span className="px-2 py-0.5 rounded-md glass-card text-[var(--text-secondary)] text-[9px] sm:text-[10px] font-semibold border border-[var(--border-color)]">
                      {fullAnime.season} {fullAnime.seasonYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5 p-3 sm:p-3.5 rounded-2xl glass-card border border-[var(--border-color)] text-center text-xs shadow-sm">
              <div>
                <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Score</p>
                <p className="font-extrabold text-amber-500 mt-0.5 flex items-center justify-center gap-1 text-xs sm:text-sm">
                  <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                  <span>{fullAnime.averageScore ? `${fullAnime.averageScore}%` : 'N/A'}</span>
                </p>
              </div>
              <div className="border-x border-[var(--border-color)]">
                <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                  {fullAnime.type === 'MANGA' || fullAnime.format === 'MANGA' || fullAnime.format === 'NOVEL' ? 'Chapters' : 'Episodes'}
                </p>
                <p className="font-extrabold text-sky-500 mt-0.5 text-xs sm:text-sm">
                  {(fullAnime.type === 'MANGA' || fullAnime.format === 'MANGA' || fullAnime.format === 'NOVEL' ? fullAnime.chapters : fullAnime.episodes) || 'TBA'}
                </p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Popularity</p>
                <p className="font-extrabold text-[var(--text-primary)] mt-0.5 text-xs sm:text-sm">
                  #{fullAnime.popularity?.toLocaleString() || '-'}
                </p>
              </div>
            </div>

            {/* Airing countdown banner */}
            {fullAnime.nextAiringEpisode && (
              <div className="airing-countdown-box mt-3 p-3 rounded-2xl bg-gradient-to-r from-sky-950/80 to-indigo-950/80 border border-sky-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock size={16} className="text-sky-500 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-[var(--text-primary)] dark:text-white">Episode {fullAnime.nextAiringEpisode.episode}</span>
                    <span className="text-[var(--text-muted)] dark:text-slate-400 text-[10px] ml-1.5 block sm:inline">
                      airing in {formatAiringCountdown(fullAnime.nextAiringEpisode.timeUntilAiring)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Synopsis */}
            <div className="mt-5 space-y-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Synopsis</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {cleanDescription(fullAnime.description)}
              </p>
            </div>

            {/* Genres */}
            <div className="mt-5 space-y-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Genres</h3>
              <div className="flex flex-wrap gap-1.5">
                {fullAnime.genres?.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-xl text-xs font-semibold glass-card border border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Characters & Voice Cast */}
            <div className="mt-6 space-y-2.5">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Characters & Voice Cast</h3>
              <CharacterList characters={fullAnime.characters} />
            </div>

            {/* Franchise Relations */}
            <div className="mt-6 space-y-2.5">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Related Anime</h3>
              <RelationsList relations={fullAnime.relations} onSelectRelated={onSelectRelatedAnime} />
            </div>
          </div>
        </div>

        {/* Bottom Floating Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 glass-panel border-t border-[var(--border-color)] backdrop-blur-xl flex items-center justify-between gap-2 sm:gap-3 z-30 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {userEntry ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 flex-1 min-w-0">
              <div className={`px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold w-fit ${getStatusBadgeClass(userEntry.status)}`}>
                {getStatusLabel(userEntry.status)}
              </div>
              <span className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-bold truncate">
                {fullAnime.type === 'MANGA' || fullAnime.format === 'MANGA' || fullAnime.format === 'NOVEL' ? 'Ch' : 'Ep'}{' '}
                <strong className="text-sky-500">{userEntry.progress}</strong> /{' '}
                {(fullAnime.type === 'MANGA' || fullAnime.format === 'MANGA' || fullAnime.format === 'NOVEL' ? fullAnime.chapters : fullAnime.episodes) || '?'}
              </span>
            </div>
          ) : (
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-medium truncate flex-1 min-w-0">
              {isLoggedIn ? 'Not in library' : '🔒 Login to track'}
            </p>
          )}

          <button
            onClick={handleTrackButtonClick}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              isLoggedIn
                ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
                : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 shadow-sky-500/25'
            }`}
          >
            {!isLoggedIn ? (
              <>
                <Lock size={14} />
                <span>Login</span>
              </>
            ) : userEntry ? (
              <>
                <Check size={14} className="stroke-[3]" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Plus size={14} className="stroke-[3]" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      <TrackEditorModal
        anime={fullAnime}
        existingEntry={userEntry}
        titleLanguage={titleLanguage}
        isOpen={isTrackEditorOpen}
        onClose={() => setIsTrackEditorOpen(false)}
        onSave={onSaveTrack}
        onDelete={(id) => onDeleteTrack && onDeleteTrack(id)}
      />

      <TrailerModal trailerId={activeTrailerId} onClose={() => setActiveTrailerId(null)} />
    </div>
  );
};