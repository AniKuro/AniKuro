import { AnimeMedia } from './anime';

export type TrackStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';

export interface UserTrackEntry {
  animeId: number;
  status: TrackStatus;
  progress: number;
  score: number; // 0 to 10
  notes?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  repeat?: number;
  favorite?: boolean;
  updatedAt: number;
  anime: AnimeMedia;
  mediaListId?: number;
  mediaType?: 'ANIME' | 'MANGA';
  progressVolumes?: number;
}

export type TitleLanguage = 'romaji' | 'english' | 'native';
export type AppTheme = 'dark' | 'oled' | 'cyberpunk' | 'sakura' | 'amethyst' | 'emerald' | 'light';

export interface AniListUserProfile {
  id: number;
  name: string;
  avatar?: string;
  bannerImage?: string | null;
  about?: string;
}

export interface UserSettings {
  titleLanguage: TitleLanguage;
  scoreFormat: 'POINT_10' | 'POINT_100' | 'POINT_5_STARS';
  theme: AppTheme;
  blurSpoilers: boolean;
  showAiringBadges: boolean;
  avatarMascot?: 'female' | 'male';
  anilistUser?: AniListUserProfile | null;
  anilistToken?: string | null;
}

export interface UserAnimeStats {
  totalCount: number;
  completedCount: number;
  currentCount: number;
  planningCount: number;
  droppedCount: number;
  pausedCount: number;
  episodesWatched: number;
  daysWatched: number;
  hoursWatched: number;
  meanScore: number;
  genreCounts: Record<string, number>;
  statusCounts: Record<TrackStatus, number>;
  scoreDistribution: Record<number, number>;
}
