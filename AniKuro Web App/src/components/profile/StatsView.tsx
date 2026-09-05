import React from 'react';
import { Clock, CheckCircle2, Star, Flame, Award, BarChart3, Bookmark } from 'lucide-react';
import { UserAnimeStats } from '../../types/userList';

interface StatsViewProps {
  stats: UserAnimeStats;
}

export const StatsView: React.FC<StatsViewProps> = ({ stats }) => {
  const genreCounts = stats?.genreCounts || {};
  const statusCounts = stats?.statusCounts || {
    CURRENT: 0,
    PLANNING: 0,
    COMPLETED: 0,
    PAUSED: 0,
    DROPPED: 0,
    REPEATING: 0,
  };

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxGenreCount = topGenres[0]?.[1] || 1;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl glass-card border border-[var(--border-color)] space-y-0.5 sm:space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-sky-500">
            <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Time Watched</span>
            <Clock size={14} />
          </div>
          <p className="text-base sm:text-xl font-black text-[var(--text-primary)]">{stats.daysWatched} <span className="text-xs font-normal text-[var(--text-muted)]">Days</span></p>
          <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">{stats.hoursWatched} total hours</p>
        </div>

        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl glass-card border border-[var(--border-color)] space-y-0.5 sm:space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Completed</span>
            <CheckCircle2 size={14} />
          </div>
          <p className="text-base sm:text-xl font-black text-[var(--text-primary)]">{stats.completedCount}</p>
          <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">out of {stats.totalCount} tracked</p>
        </div>

        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl glass-card border border-[var(--border-color)] space-y-0.5 sm:space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Mean Score</span>
            <Star size={14} className="fill-amber-400" />
          </div>
          <p className="text-base sm:text-xl font-black text-[var(--text-primary)]">{stats.meanScore ? `${stats.meanScore}` : 'N/A'}</p>
          <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">average rating / 10</p>
        </div>

        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl glass-card border border-[var(--border-color)] space-y-0.5 sm:space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Episodes</span>
            <Flame size={14} />
          </div>
          <p className="text-base sm:text-xl font-black text-[var(--text-primary)]">{stats.episodesWatched}</p>
          <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">episodes watched</p>
        </div>
      </div>

      {/* Top Genres Progress Chart */}
      <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl glass-card border border-[var(--border-color)] space-y-2.5 sm:space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
          <BarChart3 size={15} className="text-sky-500" />
          <span>Top Anime Genres</span>
        </div>

        {topGenres.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">Track anime to view your genre breakdown!</p>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {topGenres.map(([genre, count]) => {
              const percent = Math.round((count / maxGenreCount) * 100);
              return (
                <div key={genre} className="space-y-0.5 sm:space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{genre}</span>
                    <span className="text-sky-500 font-extrabold">{count} titles</span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Breakdown Grid */}
      <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl glass-card border border-[var(--border-color)] space-y-2.5 sm:space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
          <Award size={15} className="text-amber-500" />
          <span>Status Distribution</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 text-center">
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl bg-sky-500/10 border border-sky-500/30">
            <p className="text-xs font-black text-sky-600 dark:text-sky-400">{statusCounts.CURRENT || 0}</p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5">Watching</p>
          </div>
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs font-black text-purple-600 dark:text-purple-400">{statusCounts.PLANNING || 0}</p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5">Plan</p>
          </div>
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{statusCounts.COMPLETED || 0}</p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5">Done</p>
          </div>
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs font-black text-amber-600 dark:text-amber-400">{statusCounts.PAUSED || 0}</p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5">On Hold</p>
          </div>
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <p className="text-xs font-black text-rose-600 dark:text-rose-400">{statusCounts.DROPPED || 0}</p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5">Dropped</p>
          </div>
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{statusCounts.REPEATING || 0}</p>
            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-0.5">Rewatch</p>
          </div>
        </div>
      </div>
    </div>
  );
};
