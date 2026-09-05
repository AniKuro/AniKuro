import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, Sparkles, Flame, Heart, Eye, Coffee, Compass, Zap, Star, RefreshCw, ChevronRight, Check, Plus, Tv, BookOpen, Skull } from 'lucide-react';
import { UserTrackEntry, UserAnimeStats, TitleLanguage } from '../../types/userList';
import { AnimeMedia } from '../../types/anime';
import { askKuroSensei, AiSuggestionMood, AiRecommendationResult, generateTasteProfile } from '../../services/kuroSenseiAi';
import { useToast } from '../layout/Toast';
import { getDisplayTitle, formatMediaFormat } from '../../utils/formatters';
import { KUROSENSEI_AI_BASE64 } from '../../assets/logoBase64';
import { triggerHaptic } from '../../utils/haptics';
import { useBottomSheetSnap } from '../../hooks/useBottomSheetSnap';
import { SheetCapsule } from '../layout/SheetCapsule';

interface KuroSenseiModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: UserTrackEntry[];
  stats: UserAnimeStats;
  titleLanguage: TitleLanguage;
  onSelectAnime: (anime: AnimeMedia) => void;
  onQuickTrack: (anime: AnimeMedia) => void;
}

const MOODS: { id: AiSuggestionMood; label: string; icon: React.ReactNode }[] = [
  { id: 'taste', label: 'My Taste Matrix', icon: <Compass size={13} /> },
  { id: 'hidden_gems', label: 'Hidden Gems', icon: <Sparkles size={13} /> },
  { id: 'hype', label: 'Hype & Action', icon: <Flame size={13} /> },
  { id: 'emotional', label: 'Tearjerker & Drama', icon: <Heart size={13} /> },
  { id: 'mystery', label: 'Mind Games & Mystery', icon: <Eye size={13} /> },
  { id: 'cozy', label: 'Cozy & Wholesome', icon: <Coffee size={13} /> },
  { id: 'romance', label: 'Sweet Romance', icon: <Heart size={13} /> },
  { id: 'dark', label: 'Dark & Gritty', icon: <Skull size={13} /> },
];

export const KuroSenseiModal: React.FC<KuroSenseiModalProps> = ({
  isOpen,
  onClose,
  entries,
  stats,
  titleLanguage,
  onSelectAnime,
  onQuickTrack,
}) => {
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [selectedMood, setSelectedMood] = useState<AiSuggestionMood>('taste');
  const [customPrompt, setCustomPrompt] = useState('');
  const [recommendations, setRecommendations] = useState<AiRecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rerollSeed, setRerollSeed] = useState(0);
  const { showToast } = useToast();
  const {
    isExpanded,
    sheetRef,
    capsulePillRef,
    capsuleProps,
    sheetStyle,
  } = useBottomSheetSnap({ isOpen, onClose });

  const profile = useMemo(() => generateTasteProfile(entries || [], stats, mediaType), [entries, stats, mediaType]);

  const handleFetchRecommendations = async (
    mood: AiSuggestionMood = selectedMood,
    prompt = customPrompt,
    type: 'ANIME' | 'MANGA' = mediaType,
    seed = rerollSeed
  ) => {
    setIsLoading(true);
    try {
      const results = await askKuroSensei(
        prompt.trim() ? 'custom' : mood,
        prompt.trim(),
        entries,
        stats,
        type,
        seed
      );
      setRecommendations(results);
    } catch (err) {
      console.error(err);
      showToast('KuroSensei encountered an error fetching recommendations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recommendations.length === 0) {
      handleFetchRecommendations('taste', '', 'ANIME', 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMediaTypeChange = (newType: 'ANIME' | 'MANGA') => {
    if (newType === mediaType) return;
    triggerHaptic('selection');
    setMediaType(newType);
    setRerollSeed(0);
    handleFetchRecommendations(selectedMood, customPrompt, newType, 0);
  };

  const handleMoodSelect = (mood: AiSuggestionMood) => {
    triggerHaptic('selection');
    setSelectedMood(mood);
    setCustomPrompt('');
    setRerollSeed(0);
    handleFetchRecommendations(mood, '', mediaType, 0);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    triggerHaptic('medium');
    setRerollSeed(0);
    handleFetchRecommendations(selectedMood, customPrompt.trim(), mediaType, 0);
  };

  const handleReroll = () => {
    triggerHaptic('medium');
    const nextSeed = rerollSeed + 1;
    setRerollSeed(nextSeed);
    handleFetchRecommendations(selectedMood, customPrompt, mediaType, nextSeed);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={sheetStyle}
        className={`w-full max-w-2xl ${isExpanded ? 'h-[96vh] sm:h-[90vh]' : 'h-[68vh] sm:h-[80vh]'} flex flex-col rounded-t-[28px] sm:rounded-3xl glass-panel border-t border-x sm:border border-sky-500/40 shadow-2xl overflow-hidden relative animate-slide-up sheet-spring`}
      >
        {/* Mobile Sheet Drag Handle */}
        <SheetCapsule
          isExpanded={isExpanded}
          capsuleProps={capsuleProps}
          capsulePillRef={capsulePillRef}
        />

        {/* Header */}
        <div className="kurosensei-modal-header px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 transition-colors shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-lg shadow-sky-500/30 border-2 border-sky-400/60 shrink-0 bg-slate-950">
              <img src={KUROSENSEI_AI_BASE64} alt="KuroSensei AI" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] dark:text-white truncate">KuroSensei AI</h3>
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 shrink-0">
                  黒先生 • AI Oracle
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] truncate">
                Taste: <strong className="text-sky-400">{profile.archetype}</strong> • {profile.watchedCount} {mediaType === 'MANGA' ? 'manga logged' : 'anime watched'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Anime / Manga Selector Toggle */}
            <div className="flex items-center p-0.5 rounded-xl glass-card border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => handleMediaTypeChange('ANIME')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  mediaType === 'ANIME'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Tv size={12} />
                <span>Anime</span>
              </button>
              <button
                type="button"
                onClick={() => handleMediaTypeChange('MANGA')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  mediaType === 'MANGA'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <BookOpen size={12} />
                <span>Manga</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
              title="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroll-container p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {/* Mood Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                {mediaType === 'MANGA' ? 'Manga Recommendation Vibe' : 'Anime Recommendation Vibe'}
              </label>
              <span className="text-[9px] sm:text-[10px] text-sky-400 font-semibold">
                ✓ Excludes your logged {mediaType === 'MANGA' ? 'manga' : 'anime'}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.id && !customPrompt;
                return (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold border-sky-400 shadow-md shadow-sky-500/25 ring-2 ring-sky-400/30'
                        : 'glass-card text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-sky-400/50 hover:bg-sky-500/5'
                    }`}
                  >
                    <span>{mood.icon}</span>
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ask KuroSensei Prompt Input */}
          <form onSubmit={handleCustomSubmit} className="relative flex items-center">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                mediaType === 'MANGA'
                  ? "Ask KuroSensei for manga (e.g. 'Dark fantasy like Berserk', 'wholesome romcom')..."
                  : "Ask KuroSensei for anime (e.g. 'Epic dark fantasy like Frieren', 'mind games thriller')..."
              }
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 shadow-sm transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !customPrompt.trim()}
              className="absolute right-2 p-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold active:scale-95 transition-all cursor-pointer"
              title="Search recommendations"
            >
              <Send size={14} />
            </button>
          </form>

          {/* Recommendations List */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Sparkles size={14} className="text-amber-500" />
                <span>Curated {mediaType === 'MANGA' ? 'Manga' : 'Anime'} Recommendations</span>
              </div>
              <button
                onClick={handleReroll}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 active:scale-95 transition-all cursor-pointer"
                title="Generate a fresh set of recommendations"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                <span>Reroll</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center animate-bounce shadow-xl">
                  <Sparkles size={24} className="text-slate-950" />
                </div>
                <p className="text-xs font-bold text-[var(--text-muted)]">
                  KuroSensei is analyzing your taste matrix for fresh {mediaType === 'MANGA' ? 'manga' : 'anime'}...
                </p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] text-xs font-semibold">
                No matching {mediaType === 'MANGA' ? 'manga' : 'anime'} found. Try another prompt or click Reroll!
              </div>
            ) : (
              recommendations.map((rec, idx) => {
                const media = rec.animeMedia;
                const displayTitle = media ? getDisplayTitle(media.title, titleLanguage) : rec.title;
                const isTracked = media ? entries.some((e) => e.animeId === media.id) : false;

                return (
                  <div
                    key={`${rec.id || idx}-${idx}`}
                    className="p-3.5 rounded-3xl glass-card border border-[var(--border-color)] hover:border-sky-500/50 transition-all space-y-3 shadow-sm group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => media && onSelectAnime(media)}
                        className="relative shrink-0 w-16 aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 border border-[var(--border-color)] cursor-pointer group-hover:scale-105 transition-transform"
                      >
                        <img
                          src={
                            media?.coverImage?.large ||
                            media?.coverImage?.medium ||
                            'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
                          }
                          alt={displayTitle}
                          className="w-full h-full object-cover"
                          decoding="async"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                            <Zap size={10} className="fill-emerald-400" />
                            {rec.matchScore}% Match
                          </span>
                          {media?.averageScore && (
                            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-400" />
                              {media.averageScore}%
                            </span>
                          )}
                        </div>

                        <h4
                          onClick={() => media && onSelectAnime(media)}
                          className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] line-clamp-1 cursor-pointer hover:text-sky-500 transition-colors"
                        >
                          {displayTitle}
                        </h4>

                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {media ? formatMediaFormat(media.format) : rec.targetGenre}
                          {media?.episodes ? ` • ${media.episodes} eps` : media?.chapters ? ` • ${media.chapters} chs` : ''}
                        </p>

                        <span className="inline-block mt-1 text-[9px] font-semibold text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/25">
                          {rec.vibe}
                        </span>
                      </div>
                    </div>

                    <div className="kurosensei-reasoning-box p-2.5 rounded-2xl bg-slate-900/90 border border-[var(--border-color)] text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-bold text-sky-400 mr-1">Why KuroSensei recommends this:</span>
                      {rec.reason}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      {media && (
                        <button
                          onClick={() => {
                            triggerHaptic('light');
                            onSelectAnime(media);
                          }}
                          className="flex-1 py-2 rounded-xl glass-card hover:bg-sky-500/10 border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1 tap-active shadow-sm cursor-pointer"
                        >
                          <span>View {mediaType === 'MANGA' ? 'Manga' : 'Anime'}</span>
                          <ChevronRight size={13} />
                        </button>
                      )}

                      {media && (
                        <button
                          onClick={() => {
                            triggerHaptic('medium');
                            onQuickTrack(media);
                          }}
                          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 tap-active cursor-pointer ${
                            isTracked
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                              : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20'
                          }`}
                        >
                          {isTracked ? <Check size={14} className="stroke-[3]" /> : <Plus size={14} className="stroke-[3]" />}
                          <span>{isTracked ? 'Tracked' : mediaType === 'MANGA' ? 'Add to Reading' : 'Add to Watching'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
