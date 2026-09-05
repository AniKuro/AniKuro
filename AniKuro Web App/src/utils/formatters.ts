import { AnimeTitle, MediaFormat, MediaStatus } from '../types/anime';
import { TitleLanguage, TrackStatus } from '../types/userList';

export function getDisplayTitle(title?: AnimeTitle | null, lang: TitleLanguage = 'romaji'): string {
  if (!title) return 'Untitled Anime';
  if (lang === 'english' && title.english) return title.english;
  if (lang === 'native' && title.native) return title.native;
  return title.romaji || title.english || title.native || 'Untitled Anime';
}

export function cleanDescription(desc?: string | null): string {
  if (!desc) return 'No synopsis available for this anime yet.';
  return desc
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i>/gi, '')
    .replace(/<\/i>/gi, '')
    .replace(/<b>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export function formatMediaFormat(format?: MediaFormat): string {
  switch (format) {
    case 'TV': return 'TV Show';
    case 'TV_SHORT': return 'TV Short';
    case 'MOVIE': return 'Movie';
    case 'SPECIAL': return 'Special';
    case 'OVA': return 'OVA';
    case 'ONA': return 'ONA (Web)';
    case 'MUSIC': return 'Music Video';
    case 'MANGA': return 'Manga';
    case 'NOVEL': return 'Light Novel';
    case 'ONE_SHOT': return 'One-Shot';
    default: return format || 'Anime';
  }
}

export function getMediaStatusBadge(status?: MediaStatus, isManga?: boolean): { label: string; color: string } {
  switch (status) {
    case 'RELEASING': return {
      label: isManga ? 'Publishing' : 'Airing Now',
      color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    };
    case 'FINISHED': return { label: 'Completed', color: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' };
    case 'NOT_YET_RELEASED': return { label: 'Upcoming', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' };
    case 'CANCELLED': return { label: 'Cancelled', color: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' };
    default: return { label: 'Unknown', color: 'bg-slate-800 text-slate-400' };
  }
}

export function formatAiringCountdown(secondsUntil: number): string {
  if (secondsUntil <= 0) return 'Airing Now';
  const days = Math.floor(secondsUntil / 86400);
  const hours = Math.floor((secondsUntil % 86400) / 3600);
  const mins = Math.floor((secondsUntil % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getStatusLabel(status: TrackStatus): string {
  switch (status) {
    case 'CURRENT': return 'Watching';
    case 'PLANNING': return 'Plan to Watch';
    case 'COMPLETED': return 'Completed';
    case 'DROPPED': return 'Dropped';
    case 'PAUSED': return 'On Hold';
    case 'REPEATING': return 'Rewatching';
    default: return status;
  }
}

export function getStatusBadgeClass(status: TrackStatus): string {
  switch (status) {
    case 'CURRENT': return 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
    case 'PLANNING': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'DROPPED': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
    case 'PAUSED': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    case 'REPEATING': return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
  }
}

export function formatScore(score: number): string {
  if (!score || score <= 0) return '-';
  return `${score}/10`;
}
