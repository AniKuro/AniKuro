import React, { useState } from 'react';
import { X, Trash2, Heart } from 'lucide-react';
import { AnimeMedia } from '../../types/anime';
import { UserTrackEntry, TrackStatus, TitleLanguage } from '../../types/userList';
import { getDisplayTitle } from '../../utils/formatters';

interface TrackEditorModalProps {
  anime: AnimeMedia;
  existingEntry?: UserTrackEntry;
  titleLanguage: TitleLanguage;
  isOpen: boolean;
  onClose: () => void;
  onSave: (anime: AnimeMedia, data: Partial<UserTrackEntry>) => void;
  onDelete: (animeId: number) => void;
}

export const TrackEditorModal: React.FC<TrackEditorModalProps> = ({
  anime,
  existingEntry,
  titleLanguage,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [status, setStatus] = useState<TrackStatus>(existingEntry?.status || 'CURRENT');
  const [progress, setProgress] = useState<number>(existingEntry?.progress || 0);
  const [score, setScore] = useState<number>(existingEntry?.score || 0);
  const [notes, setNotes] = useState<string>(existingEntry?.notes || '');
  const [favorite, setFavorite] = useState<boolean>(existingEntry?.favorite || false);

  if (!isOpen) return null;

  const displayTitle = getDisplayTitle(anime.title, titleLanguage);
  const isManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL' || anime.format === 'ONE_SHOT';
  const unitName = isManga ? 'Chapters' : 'Episodes';
  const maxUnits = (isManga ? anime.chapters : anime.episodes) || 9999;
  const currentTotal = isManga ? anime.chapters : anime.episodes;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(anime, {
      status,
      progress: Math.min(maxUnits, Math.max(0, progress)),
      score,
      notes,
      favorite,
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl glass-panel border border-[var(--border-color)] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="font-extrabold text-sm text-[var(--text-primary)] truncate max-w-[280px]">
            Track: {displayTitle}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TrackStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-sky-500 shadow-sm"
            >
              <option value="CURRENT">{isManga ? 'Reading' : 'Watching'}</option>
              <option value="PLANNING">{isManga ? 'Plan to Read' : 'Plan to Watch'}</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">On Hold</option>
              <option value="DROPPED">Dropped</option>
              <option value="REPEATING">{isManga ? 'Rereading' : 'Rewatching'}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">
                Progress ({progress} / {currentTotal || '?'})
              </label>
              <input
                type="number"
                min="0"
                max={maxUnits}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-sky-500 shadow-sm"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-sky-500 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Personal Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your thoughts, favorite episode, etc..."
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-sky-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setFavorite(!favorite)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                favorite
                  ? 'bg-pink-500/20 text-pink-500 border-pink-500/40'
                  : 'glass-card text-[var(--text-muted)] border-[var(--border-color)] hover:text-pink-500'
              }`}
            >
              <Heart size={14} className={favorite ? 'fill-pink-500' : ''} />
              <span>{favorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            {existingEntry && (
              <button
                type="button"
                onClick={() => {
                  onDelete(anime.id);
                  onClose();
                }}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            )}
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
              Save Track
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
