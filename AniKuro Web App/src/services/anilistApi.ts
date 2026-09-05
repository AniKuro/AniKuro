import { AnimeMedia, AiringScheduleItem } from '../types/anime';
import { AniListUserProfile, UserTrackEntry } from '../types/userList';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_CORE_FRAGMENT = `
  id
  idMal
  type
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description
  format
  status
  episodes
  chapters
  volumes
  duration
  season
  seasonYear
  averageScore
  meanScore
  popularity
  favourites
  genres
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`;

export interface AniListSearchFilters {
  type?: 'ANIME' | 'MANGA';
  search?: string;
  genre?: string;
  format?: string;
  status?: string;
  season?: string;
  seasonYear?: string | number;
  sort?: string;
  page?: number;
  perPage?: number;
}

export const anilistApi = {
  async fetchGraphQL<T>(query: string, variables: Record<string, any> = {}, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`AniList API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message || 'GraphQL Query Error');
    }
    return data.data;
  },

  async getViewer(token: string): Promise<AniListUserProfile> {
    const query = `
      query {
        Viewer {
          id
          name
          avatar {
            large
            medium
          }
          bannerImage
          about
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Viewer: any }>(query, {}, token);
    const viewer = res.Viewer;
    if (!viewer) throw new Error('Unable to authenticate with provided AniList token.');
    return {
      id: viewer.id,
      name: viewer.name,
      avatar: viewer.avatar?.large || viewer.avatar?.medium,
      bannerImage: viewer.bannerImage,
      about: viewer.about,
    };
  },

  async getProfileByName(username: string): Promise<AniListUserProfile> {
    const query = `
      query ($name: String) {
        User(name: $name) {
          id
          name
          avatar {
            large
            medium
          }
          bannerImage
          about
        }
      }
    `;
    const res = await this.fetchGraphQL<{ User: any }>(query, { name: username });
    const u = res.User;
    if (!u) throw new Error(`User "${username}" not found on AniList.`);
    return {
      id: u.id,
      name: u.name,
      avatar: u.avatar?.large || u.avatar?.medium,
      bannerImage: u.bannerImage,
      about: u.about,
    };
  },

  async fetchUserMediaList(params: { userId?: number; userName?: string }, token?: string): Promise<UserTrackEntry[]> {
    const query = `
      query ($userId: Int, $userName: String) {
        anime: MediaListCollection(userId: $userId, userName: $userName, type: ANIME) {
          lists {
            name
            status
            entries {
              id
              status
              score(format: POINT_10)
              progress
              repeat
              notes
              startedAt {
                year
                month
                day
              }
              completedAt {
                year
                month
                day
              }
              media {
                ${MEDIA_CORE_FRAGMENT}
              }
            }
          }
        }
        manga: MediaListCollection(userId: $userId, userName: $userName, type: MANGA) {
          lists {
            name
            status
            entries {
              id
              status
              score(format: POINT_10)
              progress
              progressVolumes
              repeat
              notes
              startedAt {
                year
                month
                day
              }
              completedAt {
                year
                month
                day
              }
              media {
                ${MEDIA_CORE_FRAGMENT}
              }
            }
          }
        }
      }
    `;

    const allEntries: UserTrackEntry[] = [];

    const parseCollection = (collection: any, mediaType: 'ANIME' | 'MANGA') => {
      if (collection?.lists) {
        for (const list of collection.lists) {
          if (list.entries) {
            for (const entry of list.entries) {
              const startYear = entry.startedAt?.year;
              const startMonth = entry.startedAt?.month ? String(entry.startedAt.month).padStart(2, '0') : '01';
              const startDay = entry.startedAt?.day ? String(entry.startedAt.day).padStart(2, '0') : '01';
              const startedAtStr = startYear ? `${startYear}-${startMonth}-${startDay}` : null;

              const endYear = entry.completedAt?.year;
              const endMonth = entry.completedAt?.month ? String(entry.completedAt.month).padStart(2, '0') : '01';
              const endDay = entry.completedAt?.day ? String(entry.completedAt.day).padStart(2, '0') : '01';
              const completedAtStr = endYear ? `${endYear}-${endMonth}-${endDay}` : null;

              const mediaWithDefaults = {
                ...entry.media,
                type: entry.media.type || mediaType,
              };

              allEntries.push({
                animeId: entry.media.id,
                mediaListId: entry.id,
                mediaType,
                status: entry.status || 'PLANNING',
                progress: entry.progress || 0,
                progressVolumes: entry.progressVolumes || 0,
                score: entry.score || 0,
                notes: entry.notes || '',
                repeat: entry.repeat || 0,
                favorite: false,
                startedAt: startedAtStr,
                completedAt: completedAtStr,
                updatedAt: Date.now(),
                anime: mediaWithDefaults,
              });
            }
          }
        }
      }
    };

    try {
      const res = await this.fetchGraphQL<{
        anime?: { lists: any[] };
        manga?: { lists: any[] };
      }>(query, params, token);

      if (res.anime) parseCollection(res.anime, 'ANIME');
      if (res.manga) parseCollection(res.manga, 'MANGA');
    } catch {
      // If combined query fails, fallback to anime only
      try {
        const fallbackQuery = `
          query ($userId: Int, $userName: String) {
            MediaListCollection(userId: $userId, userName: $userName, type: ANIME) {
              lists {
                name
                status
                entries {
                  id
                  status
                  score(format: POINT_10)
                  progress
                  repeat
                  notes
                  startedAt { year month day }
                  completedAt { year month day }
                  media {
                    ${MEDIA_CORE_FRAGMENT}
                  }
                }
              }
            }
          }
        `;
        const fallbackRes = await this.fetchGraphQL<{ MediaListCollection: { lists: any[] } }>(fallbackQuery, params, token);
        if (fallbackRes.MediaListCollection) parseCollection(fallbackRes.MediaListCollection, 'ANIME');
      } catch (err) {
        console.error('Failed to fetch user media list:', err);
      }
    }

    return allEntries;
  },

  async getTrending(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: any }> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            ${MEDIA_CORE_FRAGMENT}
          }
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: any } }>(query, { page, perPage });
    return res.Page;
  },

  async getPopularThisSeason(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: any }> {
    const d = new Date();
    const month = d.getMonth() + 1;
    let season = 'WINTER';
    if (month >= 3 && month <= 5) season = 'SPRING';
    else if (month >= 6 && month <= 8) season = 'SUMMER';
    else if (month >= 9 && month <= 11) season = 'FALL';
    const seasonYear = d.getFullYear();

    const query = `
      query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
            ${MEDIA_CORE_FRAGMENT}
          }
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: any } }>(query, {
      page,
      perPage,
      season,
      seasonYear,
    });
    return res.Page;
  },

  async getTopRated(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: any }> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
            ${MEDIA_CORE_FRAGMENT}
          }
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: any } }>(query, { page, perPage });
    return res.Page;
  },

  async getUpcomingNextSeason(page = 1, perPage = 12): Promise<{ media: AnimeMedia[]; pageInfo: any }> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
            ${MEDIA_CORE_FRAGMENT}
          }
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: any } }>(query, { page, perPage });
    return res.Page;
  },

  async search(filters: AniListSearchFilters): Promise<{ media: AnimeMedia[]; pageInfo: any }> {
    const query = `
      query (
        $page: Int,
        $perPage: Int,
        $type: MediaType,
        $search: String,
        $genre: String,
        $format: MediaFormat,
        $status: MediaStatus,
        $season: MediaSeason,
        $seasonYear: Int,
        $sort: [MediaSort]
      ) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            hasNextPage
            currentPage
          }
          media(
            type: $type,
            search: $search,
            genre: $genre,
            format: $format,
            status: $status,
            season: $season,
            seasonYear: $seasonYear,
            sort: $sort,
            isAdult: false
          ) {
            ${MEDIA_CORE_FRAGMENT}
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      page: filters.page || 1,
      perPage: filters.perPage || 24,
      type: filters.type || 'ANIME',
    };

    if (filters.search?.trim()) variables.search = filters.search.trim();
    if (filters.genre) variables.genre = filters.genre;
    if (filters.format) variables.format = filters.format;
    if (filters.status) variables.status = filters.status;
    if (filters.season) variables.season = filters.season;
    if (filters.seasonYear) variables.seasonYear = Number(filters.seasonYear);
    if (filters.sort) variables.sort = [filters.sort];

    const res = await this.fetchGraphQL<{ Page: { media: AnimeMedia[]; pageInfo: any } }>(query, variables);
    return res.Page;
  },

  async getAnimeDetails(id: number): Promise<AnimeMedia> {
    const query = `
      query ($id: Int) {
        Media(id: $id) {
          ${MEDIA_CORE_FRAGMENT}
          studios(isMain: true) {
            nodes {
              id
              name
              isAnimationStudio
            }
          }
          trailer {
            id
            site
            thumbnail
          }
          characters(sort: ROLE, perPage: 12) {
            edges {
              role
              node {
                id
                name {
                  full
                  native
                }
                image {
                  medium
                  large
                }
              }
              voiceActors(language: JAPANESE, sort: RELEVANCE) {
                id
                name {
                  full
                  native
                }
                languageV2
                image {
                  medium
                }
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                title {
                  romaji
                  english
                }
                format
                status
                coverImage {
                  large
                  medium
                }
              }
            }
          }
          recommendations(sort: RATING_DESC, perPage: 6) {
            nodes {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                }
                format
                averageScore
                coverImage {
                  large
                  medium
                }
              }
            }
          }
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Media: AnimeMedia }>(query, { id });
    return res.Media;
  },

  async getAiringSchedule(
    airingAtGreater: number,
    airingAtLesser: number,
    sort: 'TIME' | 'TIME_DESC' = 'TIME'
  ): Promise<AiringScheduleItem[]> {
    const query = `
      query ($airingAtGreater: Int, $airingAtLesser: Int) {
        Page(page: 1, perPage: 50) {
          airingSchedules(
            airingAt_greater: $airingAtGreater,
            airingAt_lesser: $airingAtLesser,
            sort: ${sort}
          ) {
            id
            airingAt
            episode
            timeUntilAiring
            media {
              ${MEDIA_CORE_FRAGMENT}
            }
          }
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Page: { airingSchedules: AiringScheduleItem[] } }>(query, {
      airingAtGreater,
      airingAtLesser,
    });
    return res.Page.airingSchedules;
  },

  async getAiringScheduleForMedia(
    mediaIds: number[],
    airingAtGreater: number,
    airingAtLesser: number
  ): Promise<AiringScheduleItem[]> {
    if (!mediaIds || mediaIds.length === 0) return [];
    const query = `
      query ($mediaIds: [Int], $airingAtGreater: Int, $airingAtLesser: Int) {
        Page(page: 1, perPage: 50) {
          airingSchedules(
            mediaId_in: $mediaIds,
            airingAt_greater: $airingAtGreater,
            airingAt_lesser: $airingAtLesser,
            sort: TIME_DESC
          ) {
            id
            airingAt
            episode
            timeUntilAiring
            media {
              ${MEDIA_CORE_FRAGMENT}
            }
          }
        }
      }
    `;
    const res = await this.fetchGraphQL<{ Page: { airingSchedules: AiringScheduleItem[] } }>(query, {
      mediaIds: mediaIds.slice(0, 50),
      airingAtGreater,
      airingAtLesser,
    });
    return res.Page.airingSchedules || [];
  },

  async saveMediaListEntry(
    params: {
      mediaId: number;
      status?: string;
      score?: number;
      progress?: number;
      repeat?: number;
      notes?: string;
    },
    token: string
  ): Promise<{ id: number; mediaId: number; status: string; progress: number; score: number } | null> {
    try {
      const mutation = `
        mutation (
          $mediaId: Int,
          $status: MediaListStatus,
          $score: Float,
          $progress: Int,
          $repeat: Int,
          $notes: String
        ) {
          SaveMediaListEntry (
            mediaId: $mediaId,
            status: $status,
            score: $score,
            progress: $progress,
            repeat: $repeat,
            notes: $notes
          ) {
            id
            mediaId
            status
            score
            progress
            repeat
            notes
            updatedAt
          }
        }
      `;

      const variables: Record<string, any> = {
        mediaId: params.mediaId,
      };
      if (params.status) variables.status = params.status;
      if (params.score !== undefined) variables.score = params.score;
      if (params.progress !== undefined) variables.progress = params.progress;
      if (params.repeat !== undefined) variables.repeat = params.repeat;
      if (params.notes !== undefined) variables.notes = params.notes;

      const res = await this.fetchGraphQL<{ SaveMediaListEntry: any }>(mutation, variables, token);
      return res.SaveMediaListEntry;
    } catch (err) {
      console.error('Failed to sync entry to AniList:', err);
      throw err;
    }
  },

  async deleteMediaListEntry(mediaListEntryId: number, token: string): Promise<boolean> {
    try {
      const mutation = `
        mutation ($id: Int) {
          DeleteMediaListEntry (id: $id) {
            deleted
          }
        }
      `;
      const res = await this.fetchGraphQL<{ DeleteMediaListEntry: { deleted: boolean } }>(mutation, { id: mediaListEntryId }, token);
      return res.DeleteMediaListEntry?.deleted ?? true;
    } catch (err) {
      console.error('Failed to delete entry from AniList:', err);
      throw err;
    }
  },

  async getMediaListEntryId(mediaId: number, token: string): Promise<number | null> {
    try {
      const query = `
        query ($mediaId: Int) {
          MediaList (mediaId: $mediaId) {
            id
          }
        }
      `;
      const res = await this.fetchGraphQL<{ MediaList: { id: number } }>(query, { mediaId }, token);
      return res.MediaList?.id ?? null;
    } catch {
      return null;
    }
  },

  async toggleMediaFavourite(mediaId: number, token: string, isManga?: boolean): Promise<boolean> {
    try {
      const mutation = isManga
        ? `
          mutation ($mangaId: Int) {
            ToggleFavourite (mangaId: $mangaId) {
              manga {
                nodes {
                  id
                }
              }
            }
          }
        `
        : `
          mutation ($animeId: Int) {
            ToggleFavourite (animeId: $animeId) {
              anime {
                nodes {
                  id
                }
              }
            }
          }
        `;
      const res = await this.fetchGraphQL<{ ToggleFavourite: any }>(
        mutation,
        isManga ? { mangaId: mediaId } : { animeId: mediaId },
        token
      );
      return Boolean(res.ToggleFavourite);
    } catch (err) {
      console.error('Failed to toggle favorite on AniList:', err);
      throw err;
    }
  },
};
