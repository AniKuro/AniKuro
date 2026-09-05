import { AnimeMedia } from '../types/anime';
import { UserTrackEntry, UserAnimeStats } from '../types/userList';

export const DEFAULT_OPENROUTER_API_KEY = ''; // Add your OpenRouter API key here

export type AiSuggestionMood =
  | 'taste'
  | 'hidden_gems'
  | 'hype'
  | 'emotional'
  | 'mystery'
  | 'cozy'
  | 'romance'
  | 'dark';

export interface AiRecommendationResult {
  id?: number;
  title: string;
  matchScore: number;
  reason: string;
  vibe: string;
  targetGenre: string;
  animeMedia?: AnimeMedia | null;
}

export interface UserTasteProfile {
  archetype: string;
  topGenres: string[];
  favoriteAnimeTitles: string[];
  watchedCount: number;
  meanScore: number;
  mediaType: 'ANIME' | 'MANGA';
}

const MEDIA_GRAPHQL_FIELDS = `
  id
  type
  title {
    romaji
    english
    native
  }
  format
  status
  episodes
  chapters
  volumes
  duration
  genres
  averageScore
  popularity
  favourites
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description
  season
  seasonYear
  startDate {
    year
    month
    day
  }
  endDate {
    year
    month
    day
  }
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
`;

const ALL_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

export function generateTasteProfile(
  entries: UserTrackEntry[] = [],
  stats?: UserAnimeStats,
  mediaType: 'ANIME' | 'MANGA' = 'ANIME'
): UserTasteProfile {
  const safeEntries = Array.isArray(entries) ? entries : [];

  // Filter entries matching the requested media type
  const typeEntries = safeEntries.filter((e) => {
    if (!e || !e.anime) return false;
    const entryType = e.mediaType || e.anime.type || 'ANIME';
    return entryType === mediaType;
  });

  // Calculate top genres for this media type
  const genreCounts: Record<string, number> = {};
  typeEntries.forEach((e) => {
    if (e.anime?.genres && Array.isArray(e.anime.genres)) {
      e.anime.genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([g]) => g);

  // High rated / completed / current favorites
  const completedOrFavs = typeEntries.filter(
    (e) => e && (e.favorite || (e.score && e.score >= 7) || e.status === 'COMPLETED' || e.status === 'CURRENT')
  );

  const favoriteAnimeTitles = completedOrFavs
    .slice(0, 6)
    .map((e) => e.anime?.title?.english || e.anime?.title?.romaji || e.anime?.title?.native || '')
    .filter(Boolean);

  // Dynamic archetype calculation
  let archetype = mediaType === 'MANGA' ? 'Manga Explorer' : 'Anime Explorer';
  if (topGenres.includes('Action') && topGenres.includes('Fantasy')) {
    archetype = mediaType === 'MANGA' ? 'Shōnen Page-Turner' : 'Shōnen Strategist';
  } else if (topGenres.includes('Mystery') || topGenres.includes('Psychological')) {
    archetype = mediaType === 'MANGA' ? 'Seinen Mystery Sleuth' : 'Mind-Game Detective';
  } else if (topGenres.includes('Slice of Life') || topGenres.includes('Comedy')) {
    archetype = mediaType === 'MANGA' ? 'Wholesome Panel Connoisseur' : 'Chill Life Connoisseur';
  } else if (topGenres.includes('Romance') || topGenres.includes('Drama')) {
    archetype = mediaType === 'MANGA' ? 'Romantic Drama Enthusiast' : 'Emotional Heartstrings';
  } else if (topGenres.includes('Sci-Fi') || topGenres.includes('Mecha')) {
    archetype = mediaType === 'MANGA' ? 'Futuristic Cyber-Critic' : 'Futuristic Cyber-Otaku';
  } else if (topGenres.includes('Horror') || topGenres.includes('Thriller')) {
    archetype = 'Dark Psychological Voyager';
  }

  const defaultGenres = mediaType === 'MANGA' ? ['Action', 'Fantasy', 'Adventure'] : ['Action', 'Adventure', 'Fantasy'];
  const defaultTitles = mediaType === 'MANGA' ? ['Berserk', 'One Piece', 'Vagabond'] : ['Sousou no Frieren', 'Attack on Titan', 'Jujutsu Kaisen'];

  return {
    archetype,
    topGenres: topGenres.length > 0 ? topGenres : defaultGenres,
    favoriteAnimeTitles: favoriteAnimeTitles.length > 0 ? favoriteAnimeTitles : defaultTitles,
    watchedCount: typeEntries.filter((e) => e && (e.status === 'COMPLETED' || e.progress > 0)).length,
    meanScore: stats?.meanScore || 8.4,
    mediaType,
  };
}

async function fetchAniListGraphQL<T = any>(query: string, variables: Record<string, any> = {}): Promise<T | null> {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      console.warn(`AniList GraphQL responded with ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data?.data || null;
  } catch (err) {
    console.error('AniList GraphQL request failed:', err);
    return null;
  }
}

/**
 * Checks if a candidate media has already been watched, read, or added to the user's tracking list.
 */
function isMediaAlreadyInUserList(
  media: AnimeMedia | null | undefined,
  userMediaIds: Set<number>,
  userTitles: Set<string>
): boolean {
  if (!media) return false;
  if (userMediaIds.has(Number(media.id))) return true;

  const eng = media.title?.english?.toLowerCase().trim();
  const rom = media.title?.romaji?.toLowerCase().trim();
  const nat = media.title?.native?.toLowerCase().trim();

  if (eng && userTitles.has(eng)) return true;
  if (rom && userTitles.has(rom)) return true;
  if (nat && userTitles.has(nat)) return true;

  return false;
}

/**
 * Extracts seed title and genres from a natural language search prompt.
 */
function parseUserPrompt(prompt: string): {
  detectedGenres: string[];
  seedSearchQuery: string;
  cleanedKeywords: string;
} {
  const lower = prompt.toLowerCase();
  const detectedGenres: string[] = [];

  ALL_GENRES.forEach((g) => {
    if (lower.includes(g.toLowerCase())) {
      detectedGenres.push(g);
    }
  });

  // Check for seed phrases like "like X", "similar to X", "after X"
  let seedSearchQuery = '';
  const matchLike = lower.match(/(?:like|similar to|after|vibes like)\s+([a-zA-Z0-9\s:’'-]{3,30})/);
  if (matchLike && matchLike[1]) {
    seedSearchQuery = matchLike[1].trim();
  }

  // Clean prompt of noise words for AniList search
  const cleanedKeywords = lower
    .replace(/\b(recommend|recommendation|recommendations|suggest|give me|find|something|like|similar|good|anime|manga|show|with|about|a|the|of|for|in)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { detectedGenres, seedSearchQuery, cleanedKeywords };
}

export async function askKuroSensei(
  mode: AiSuggestionMood | 'custom',
  userPrompt: string,
  entries: UserTrackEntry[] = [],
  stats?: UserAnimeStats,
  mediaType: 'ANIME' | 'MANGA' = 'ANIME',
  rerollSeed: number = 0
): Promise<AiRecommendationResult[]> {
  const profile = generateTasteProfile(entries, stats, mediaType);

  // 1. Build strict user exclusion sets
  const userMediaIds = new Set<number>();
  const userTitles = new Set<string>();

  (entries || []).forEach((e) => {
    if (!e) return;
    if (e.animeId) userMediaIds.add(Number(e.animeId));
    if (e.anime?.id) userMediaIds.add(Number(e.anime.id));

    const tEng = e.anime?.title?.english?.toLowerCase().trim();
    const tRom = e.anime?.title?.romaji?.toLowerCase().trim();
    const tNat = e.anime?.title?.native?.toLowerCase().trim();

    if (tEng) userTitles.add(tEng);
    if (tRom) userTitles.add(tRom);
    if (tNat) userTitles.add(tNat);
  });

  // 2. Identify user's completed or favorite seed media IDs for collaborative filtering
  const userTypeEntries = (entries || []).filter((e) => {
    if (!e || !e.anime) return false;
    const eType = e.mediaType || e.anime.type || 'ANIME';
    return eType === mediaType;
  });

  const highRatedSeeds = userTypeEntries.filter(
    (e) => e && (e.favorite || (e.score && e.score >= 8) || e.status === 'COMPLETED' || e.status === 'CURRENT')
  );

  const candidatePool: AnimeMedia[] = [];

  // 3. Mode-specific query execution
  if (mode === 'custom' && userPrompt.trim()) {
    const { detectedGenres, seedSearchQuery, cleanedKeywords } = parseUserPrompt(userPrompt);

    // If a specific seed title was mentioned (e.g. "similar to Berserk"), look up recommendations for that seed
    if (seedSearchQuery) {
      const seedFindQuery = `
        query ($search: String, $type: MediaType) {
          Page(page: 1, perPage: 1) {
            media(search: $search, type: $type, isAdult: false) {
              id
              recommendations(sort: RATING_DESC, perPage: 12) {
                nodes {
                  mediaRecommendation {
                    ${MEDIA_GRAPHQL_FIELDS}
                  }
                }
              }
            }
          }
        }
      `;
      const seedRes = await fetchAniListGraphQL(seedFindQuery, { search: seedSearchQuery, type: mediaType });
      const recNodes = seedRes?.Page?.media?.[0]?.recommendations?.nodes || [];
      recNodes.forEach((node: any) => {
        if (node.mediaRecommendation) candidatePool.push(node.mediaRecommendation);
      });
    }

    // Also search AniList by cleaned keywords
    if (cleanedKeywords) {
      const searchPageQuery = `
        query ($search: String, $type: MediaType, $page: Int) {
          Page(page: $page, perPage: 20) {
            media(search: $search, type: $type, sort: [SEARCH_MATCH, POPULARITY_DESC], isAdult: false) {
              ${MEDIA_GRAPHQL_FIELDS}
            }
          }
        }
      `;
      const searchRes = await fetchAniListGraphQL(searchPageQuery, {
        search: cleanedKeywords,
        type: mediaType,
        page: (rerollSeed % 2) + 1,
      });
      const items = searchRes?.Page?.media || [];
      candidatePool.push(...items);
    }

    // If genres were detected, supplement with top-rated titles in those genres
    if (detectedGenres.length > 0) {
      const genrePageQuery = `
        query ($genre_in: [String], $type: MediaType, $page: Int) {
          Page(page: $page, perPage: 20) {
            media(genre_in: $genre_in, type: $type, sort: [SCORE_DESC, TRENDING_DESC], isAdult: false) {
              ${MEDIA_GRAPHQL_FIELDS}
            }
          }
        }
      `;
      const genreRes = await fetchAniListGraphQL(genrePageQuery, {
        genre_in: detectedGenres,
        type: mediaType,
        page: (rerollSeed % 3) + 1,
      });
      const items = genreRes?.Page?.media || [];
      candidatePool.push(...items);
    }
  } else {
    // Standard Vibe / Mood Presets
    switch (mode) {
      case 'taste': {
        // First priority: Real recommendations from the user's highest rated completed/current titles
        if (highRatedSeeds.length > 0) {
          const sampleSeed = highRatedSeeds[rerollSeed % highRatedSeeds.length];
          if (sampleSeed.animeId) {
            const seedQuery = `
              query ($id: Int) {
                Media(id: $id) {
                  recommendations(sort: RATING_DESC, perPage: 12) {
                    nodes {
                      mediaRecommendation {
                        ${MEDIA_GRAPHQL_FIELDS}
                      }
                    }
                  }
                }
              }
            `;
            const seedRes = await fetchAniListGraphQL(seedQuery, { id: sampleSeed.animeId });
            const recNodes = seedRes?.Media?.recommendations?.nodes || [];
            recNodes.forEach((n: any) => {
              if (n.mediaRecommendation) candidatePool.push(n.mediaRecommendation);
            });
          }
        }

        // Second priority: High scoring titles in user's top genres
        const tasteQuery = `
          query ($type: MediaType, $genre_in: [String], $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, genre_in: $genre_in, sort: [SCORE_DESC, POPULARITY_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const tasteRes = await fetchAniListGraphQL(tasteQuery, {
          type: mediaType,
          genre_in: profile.topGenres.slice(0, 3),
          page: (rerollSeed % 4) + 1,
        });
        const items = tasteRes?.Page?.media || [];
        candidatePool.push(...items);
        break;
      }

      case 'hidden_gems': {
        // High score, but page offset into pages 2-5 to unearth true overlooked gems
        const gemQuery = `
          query ($type: MediaType, $page: Int) {
            Page(page: $page, perPage: 30) {
              media(type: $type, sort: [SCORE_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const gemRes = await fetchAniListGraphQL(gemQuery, {
          type: mediaType,
          page: (rerollSeed % 4) + 2,
        });
        const items = (gemRes?.Page?.media || []).filter((m: any) => (m.popularity || 0) < 180000);
        candidatePool.push(...items);
        break;
      }

      case 'hype': {
        const hypeQuery = `
          query ($type: MediaType, $genre_in: [String], $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, genre_in: $genre_in, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const hypeRes = await fetchAniListGraphQL(hypeQuery, {
          type: mediaType,
          genre_in: ['Action', 'Adventure', 'Supernatural'],
          page: (rerollSeed % 3) + 1,
        });
        candidatePool.push(...(hypeRes?.Page?.media || []));
        break;
      }

      case 'emotional': {
        const emoQuery = `
          query ($type: MediaType, $genre_in: [String], $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, genre_in: $genre_in, sort: [SCORE_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const emoRes = await fetchAniListGraphQL(emoQuery, {
          type: mediaType,
          genre_in: ['Drama', 'Slice of Life', 'Romance'],
          page: (rerollSeed % 3) + 1,
        });
        candidatePool.push(...(emoRes?.Page?.media || []));
        break;
      }

      case 'mystery': {
        const mysteryQuery = `
          query ($type: MediaType, $genre_in: [String], $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, genre_in: $genre_in, sort: [SCORE_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const mysteryRes = await fetchAniListGraphQL(mysteryQuery, {
          type: mediaType,
          genre_in: ['Mystery', 'Psychological', 'Thriller', 'Sci-Fi'],
          page: (rerollSeed % 3) + 1,
        });
        candidatePool.push(...(mysteryRes?.Page?.media || []));
        break;
      }

      case 'cozy': {
        const cozyQuery = `
          query ($type: MediaType, $genre_in: [String], $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, genre_in: $genre_in, sort: [SCORE_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const cozyRes = await fetchAniListGraphQL(cozyQuery, {
          type: mediaType,
          genre_in: ['Slice of Life', 'Comedy', 'Fantasy'],
          page: (rerollSeed % 3) + 1,
        });
        candidatePool.push(...(cozyRes?.Page?.media || []));
        break;
      }

      case 'romance': {
        const romanceQuery = `
          query ($type: MediaType, $genre_in: [String], $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, genre_in: $genre_in, sort: [SCORE_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const romanceRes = await fetchAniListGraphQL(romanceQuery, {
          type: mediaType,
          genre_in: ['Romance'],
          page: (rerollSeed % 3) + 1,
        });
        candidatePool.push(...(romanceRes?.Page?.media || []));
        break;
      }

      case 'dark': {
        const darkQuery = `
          query ($type: MediaType, $genre_in: [String], $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, genre_in: $genre_in, sort: [SCORE_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const darkRes = await fetchAniListGraphQL(darkQuery, {
          type: mediaType,
          genre_in: ['Horror', 'Psychological', 'Fantasy', 'Action'],
          page: (rerollSeed % 3) + 1,
        });
        candidatePool.push(...(darkRes?.Page?.media || []));
        break;
      }

      default: {
        const defQuery = `
          query ($type: MediaType, $page: Int) {
            Page(page: $page, perPage: 25) {
              media(type: $type, sort: [SCORE_DESC, TRENDING_DESC], isAdult: false) {
                ${MEDIA_GRAPHQL_FIELDS}
              }
            }
          }
        `;
        const defRes = await fetchAniListGraphQL(defQuery, {
          type: mediaType,
          page: (rerollSeed % 3) + 1,
        });
        candidatePool.push(...(defRes?.Page?.media || []));
      }
    }
  }

  // 4. Strict Filtering: Exclude any media in user's library and deduplicate by ID
  const seenIds = new Set<number>();
  const validCandidates: AnimeMedia[] = [];

  candidatePool.forEach((m) => {
    if (!m || !m.id || seenIds.has(m.id)) return;
    if (m.type !== mediaType) return; // Strict media type enforcement
    if (isMediaAlreadyInUserList(m, userMediaIds, userTitles)) return; // Strictly not watched/read

    seenIds.add(m.id);
    validCandidates.push(m);
  });

  // If candidate pool ran dry after filtering, fetch fallback top-rated page
  if (validCandidates.length < 3) {
    const backupQuery = `
      query ($type: MediaType, $page: Int) {
        Page(page: $page, perPage: 30) {
          media(type: $type, sort: [SCORE_DESC], isAdult: false) {
            ${MEDIA_GRAPHQL_FIELDS}
          }
        }
      }
    `;
    const backupRes = await fetchAniListGraphQL(backupQuery, {
      type: mediaType,
      page: (rerollSeed % 6) + 4,
    });
    (backupRes?.Page?.media || []).forEach((m: any) => {
      if (!m || !m.id || seenIds.has(m.id)) return;
      if (m.type !== mediaType) return;
      if (isMediaAlreadyInUserList(m, userMediaIds, userTitles)) return;
      seenIds.add(m.id);
      validCandidates.push(m);
    });
  }

  // 5. Select top 3-4 candidates with diversity offset
  const selectedSlice = validCandidates.slice(0, 4);

  // 6. Generate KuroSensei AI personalized reasoning and scores
  const results: AiRecommendationResult[] = selectedSlice.map((media, idx) => {
    const titleStr = media.title?.english || media.title?.romaji || 'Unknown Title';
    const primaryGenre = media.genres?.[0] || (mediaType === 'MANGA' ? 'Manga' : 'Anime');
    const genreStr = media.genres?.slice(0, 2).join(' & ') || primaryGenre;
    const scoreVal = media.averageScore || 85;
    const matchScore = Math.min(99, Math.max(88, scoreVal + ((rerollSeed + idx) % 5)));

    let reason = '';
    let vibe = '';

    if (mode === 'custom' && userPrompt.trim()) {
      reason = `Matched to your prompt "${userPrompt}". With a stellar ${scoreVal}% community score, this gripping ${mediaType === 'MANGA' ? 'manga' : 'anime'} brings unforgettable ${genreStr.toLowerCase()} storytelling that has not been logged in your list yet.`;
      vibe = `${primaryGenre} • ${media.averageScore ? media.averageScore + '% Acclaimed' : 'Community Gem'}`;
    } else if (mode === 'taste') {
      const favSeedTitle = profile.favoriteAnimeTitles[idx % profile.favoriteAnimeTitles.length];
      reason = favSeedTitle
        ? `Crafted for your ${profile.archetype} taste matrix. Because you loved ${favSeedTitle}, this acclaimed ${genreStr} delivers equally mesmerizing world-building and character dynamics.`
        : `Matches your affinity for ${genreStr} with an impressive ${scoreVal}% rating. A must-experience addition to your ${mediaType === 'MANGA' ? 'reading' : 'watching'} queue.`;
      vibe = `Taste Matrix Match • ${primaryGenre}`;
    } else if (mode === 'hidden_gems') {
      reason = `A true hidden gem flying beneath the radar with a glowing ${scoreVal}% score. It offers brilliant ${genreStr.toLowerCase()} storytelling without the mainstream saturation.`;
      vibe = `Overlooked Masterpiece • ${scoreVal}% Score`;
    } else if (mode === 'hype') {
      reason = `Electrifying battles, high-stakes adrenaline, and top-tier ${genreStr.toLowerCase()} intensity that will keep you on the edge of your seat.`;
      vibe = `High Octane • Adrenaline Peak`;
    } else if (mode === 'emotional') {
      reason = `A deeply resonant ${genreStr.toLowerCase()} masterpiece tackling heartfelt connections, profound empathy, and unforgettable emotional payoffs.`;
      vibe = `Heartfelt Narrative • Tearjerker`;
    } else if (mode === 'mystery') {
      reason = `Mind-bending psychological puzzles, unexpected plot twists, and razor-sharp suspense designed for analytical minds.`;
      vibe = `Mind Games • High Tension`;
    } else if (mode === 'cozy') {
      reason = `Warm, wholesome, and wonderfully relaxing. The ideal comfort ${mediaType === 'MANGA' ? 'read' : 'watch'} to unwind and de-stress.`;
      vibe = `Pure Comfort • Wholesome`;
    } else if (mode === 'romance') {
      reason = `Charming romantic chemistry, memorable character interactions, and heartwarming emotional moments that hit all the right notes.`;
      vibe = `Sweet Romance • High Chemistry`;
    } else if (mode === 'dark') {
      reason = `A grim, uncompromising dark atmosphere featuring visceral stakes, morally complex characters, and unforgiving consequences.`;
      vibe = `Dark & Gritty • Visceral`;
    } else {
      reason = `Curated by KuroSensei for its remarkable ${scoreVal}% acclaim and captivating ${genreStr.toLowerCase()} execution.`;
      vibe = `KuroSensei Pick • ${primaryGenre}`;
    }

    return {
      id: media.id,
      title: titleStr,
      matchScore,
      reason,
      vibe,
      targetGenre: primaryGenre,
      animeMedia: media,
    };
  });

  return results;
}
