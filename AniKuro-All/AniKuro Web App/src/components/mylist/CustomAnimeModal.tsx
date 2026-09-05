import React, { useState } from 'react';
import { X, Plus, Tv, BookOpen } from 'lucide-react';
import { TrackStatus } from '../../types/userList';
import { AnimeMedia } from '../../types/anime';
import { useBottomSheetSnap } from '../../hooks/useBottomSheetSnap';
import { SheetCapsule } from '../layout/SheetCapsule';

interface CustomAnimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomAnime: (anime: AnimeMedia, trackData: any) => void;
}

export const CustomAnimeModal: React.FC<CustomAnimeModalProps> = ({
  isOpen,
  onClose,
  onAddCustomAnime,
}) => {
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [title, setTitle] = useState('');
  const [totalEpisodes, setTotalEpisodes] = useState<number>(12);
  const [status, setStatus] = useState<TrackStatus>('PLANNING');
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [coverUrl, setCoverUrl] = useState('');
  const {
    isExpanded,
    sheetRef,
    capsulePillRef,
    capsuleProps,
    sheetStyle,
  } = useBottomSheetSnap({ isOpen, onClose });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const customId = -Math.floor(Date.now() % 10000000);
    const customAnime: AnimeMedia = {
      id: customId,
      type: mediaType,
      title: {
        romaji: title.trim(),
        english: title.trim(),
        native: title.trim(),
      },
      coverImage: {
        extraLarge: coverUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        large: coverUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        medium: coverUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      },
      format: mediaType === 'MANGA' ? 'MANGA' : 'TV',
      status: 'FINISHED',
      episodes: mediaType === 'ANIME' ? (Number(totalEpisodes) || 12) : null,
      chapters: mediaType === 'MANGA' ? (Number(totalEpisodes) || 50) : null,
      genres: [mediaType === 'MANGA' ? 'Custom Manga' : 'Custom Anime'],
    };

    onAddCustomAnime(customAnime, {
      status,
      mediaType,
      progress: Number(progress) || 0,
      score: Number(score) || 0,
    });

    onClose();
    setTitle('');
    setCoverUrl('');
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
        className={`w-full max-w-md rounded-t-[28px] sm:rounded-3xl glass-panel border-t border-x sm:border border-[var(--border-color)] shadow-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 ${isExpanded ? 'h-[96vh] sm:h-[90vh]' : 'h-[68vh] sm:h-[78vh]'} overflow-y-auto modal-scroll-container animate-slide-up sheet-spring`}
        style={{
          ...sheetStyle,
          paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem))',
        }}
      >
        {/* Mobile Drag Handle */}
        <SheetCapsule
          isExpanded={isExpanded}
          capsuleProps={capsuleProps}
          capsulePillRef={capsulePillRef}
        />

        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-500 dark:text-sky-400 flex items-center justify-center">
              <Plus size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-[var(--text-primary)]">
              Add Custom {mediaType === 'MANGA' ? 'Manga' : 'Anime'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Media Type Selector */}
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Entry Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass-card border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setMediaType('ANIME')}
                className={`py-1.5 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mediaType === 'ANIME'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Tv size={14} />
                <span>Anime</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('MANGA')}
                className={`py-1.5 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mediaType === 'MANGA'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <BookOpen size={14} />
                <span>Manga</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">
              {mediaType === 'MANGA' ? 'Manga Title *' : 'Anime Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mediaType === 'MANGA' ? "e.g. Berserk, Chainsaw Man" : "e.g. Fate/stay night: Heaven's Feel"}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TrackStatus)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-sky-500 shadow-sm"
              >
                <option value="PLANNING">{mediaType === 'MANGA' ? 'Plan to Read' : 'Plan to Watch'}</option>
                <option value="CURRENT">{mediaType === 'MANGA' ? 'Reading' : 'Watching'}</option>
                <option value="COMPLETED">Completed</option>
                <option value="PAUSED">On Hold</option>
                <option value="DROPPED">Dropped</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                {mediaType === 'MANGA' ? 'Total Chapters' : 'Total Episodes'}
              </label>
              <input
                type="number"
                min="1"
                value={totalEpisodes}
                onChange={(e) => setTotalEpisodes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                {mediaType === 'MANGA' ? 'Chapters Read' : 'Episodes Watched'}
              </label>
              <input
                type="number"
                min="0"
                max={totalEpisodes}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Score (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Poster Image URL (Optional)</label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 font-extrabold text-slate-950 shadow-md shadow-sky-500/20"
            >
              Add Anime
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
