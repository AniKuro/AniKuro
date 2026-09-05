export type MediaType = 'ANIME' | 'MANGA';
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT';
export type MediaStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export interface AnimeTitle {
  romaji: string;
  english?: string | null;
  native?: string | null;
}

export interface AnimeCoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string | null;
}

export interface NextAiringEpisode {
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
}

export interface AnimeCharacterNode {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image: {
    medium?: string;
    large?: string;
  };
}

export interface CharacterEdge {
  role: 'MAIN' | 'SUPPORTING' | 'BACKGROUND';
  node: AnimeCharacterNode;
  voiceActors?: {
    id: number;
    name: {
      full: string;
      native?: string | null;
    };
    languageV2: string;
    image: {
      medium?: string;
    };
  }[];
}

export interface RelationEdge {
  relationType: string;
  node: {
    id: number;
    title: AnimeTitle;
    format: MediaFormat;
    status: MediaStatus;
    coverImage: AnimeCoverImage;
  };
}

export interface AnimeMedia {
  id: number;
  idMal?: number | null;
  type?: MediaType;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage?: string | null;
  description?: string | null;
  format: MediaFormat;
  status: MediaStatus;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  duration?: number | null;
  season?: MediaSeason | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  favourites?: number | null;
  genres: string[];
  tags?: { id: number; name: string; rank: number; isMediaSpoiler: boolean }[];
  studios?: {
    nodes: { id: number; name: string; isAnimationStudio: boolean }[];
  };
  trailer?: {
    id: string;
    site: string;
    thumbnail?: string;
  } | null;
  nextAiringEpisode?: NextAiringEpisode | null;
  characters?: {
    edges: CharacterEdge[];
  };
  relations?: {
    edges: RelationEdge[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: {
        id: number;
        title: AnimeTitle;
        coverImage: AnimeCoverImage;
        format: MediaFormat;
        averageScore?: number;
      };
    }[];
  };
}

export interface AiringScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  timeUntilAiring: number;
  media: AnimeMedia;
}
