import { UserTrackEntry, UserSettings, UserAnimeStats, TrackStatus } from '../types/userList';

const STORAGE_KEYS = {
  ENTRIES: 'anitrack_entries_v1',
  SETTINGS: 'anitrack_settings_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  titleLanguage: 'romaji',
  scoreFormat: 'POINT_10',
  theme: 'dark',
  blurSpoilers: true,
  showAiringBadges: true,
};

export const SAMPLE_ANIME_ENTRIES: UserTrackEntry[] = [
  {
    animeId: 154587,
    status: 'COMPLETED',
    progress: 28,
    score: 10,
    notes: 'Absolute masterpiece. Incredible animation, soundtrack, and emotional depth.',
    repeat: 0,
    favorite: true,
    startedAt: '2024-01-10',
    completedAt: '2024-03-24',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    anime: {
      id: 154587,
      title: {
        romaji: 'Sousou no Frieren',
        english: 'Frieren: Beyond Journey\'s End',
        native: '葬送のフリーレン',
      },
      coverImage: {
        extraLarge: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',
        large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg',
        medium: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx154587-qQTzQnEJJ3oB.jpg',
        color: '#bbf1a1',
      },
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
      description: 'The adventure is over but life goes on for an elf mage just beginning to learn what living is all about.',
      format: 'TV',
      status: 'FINISHED',
      episodes: 28,
      duration: 24,
      season: 'FALL',
      seasonYear: 2023,
      averageScore: 92,
      meanScore: 92,
      popularity: 340000,
      favourites: 28000,
      genres: ['Adventure', 'Drama', 'Fantasy'],
    },
  },
  {
    animeId: 145064,
    status: 'CURRENT',
    progress: 18,
    score: 9,
    notes: 'Peak animation from MAPPA and intense Shibuya incident arc pacing.',
    repeat: 0,
    favorite: true,
    startedAt: '2024-05-15',
    completedAt: null,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    anime: {
      id: 145064,
      title: {
        romaji: 'Jujutsu Kaisen 2nd Season',
        english: 'JUJUTSU KAISEN Season 2',
        native: '呪術廻戦 懐玉・玉折 / 渋谷事変',
      },
      coverImage: {
        extraLarge: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg',
        large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx145064-hSNRJM03pvv1.jpg',
        medium: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx145064-hSNRJM03pvv1.jpg',
        color: '#a178d6',
      },
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-esDtAY2He7sk.jpg',
      description: 'The past comes to light and the Shibuya incident unfolds as curses launch a full-scale offensive.',
      format: 'TV',
      status: 'FINISHED',
      episodes: 23,
      duration: 24,
      season: 'SUMMER',
      seasonYear: 2023,
      averageScore: 88,
      meanScore: 88,
      popularity: 380000,
      favourites: 32000,
      genres: ['Action', 'Fantasy', 'Supernatural'],
    },
  },
  {
    animeId: 16498,
    status: 'COMPLETED',
    progress: 25,
    score: 10,
    notes: 'One of the greatest anime of all time. Brilliant mystery and high stakes.',
    repeat: 1,
    favorite: true,
    startedAt: '2023-01-01',
    completedAt: '2023-01-20',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    anime: {
      id: 16498,
      title: {
        romaji: 'Shingeki no Kyojin',
        english: 'Attack on Titan',
        native: '進撃の巨人',
      },
      coverImage: {
        extraLarge: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
        large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-buvcRTBx4NSm.jpg',
        medium: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx16498-buvcRTBx4NSm.jpg',
        color: '#f1a143',
      },
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
      description: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans.',
      format: 'TV',
      status: 'FINISHED',
      episodes: 25,
      duration: 24,
      season: 'SPRING',
      seasonYear: 2013,
      averageScore: 86,
      meanScore: 86,
      popularity: 720000,
      favourites: 65000,
      genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    },
  },
  {
    animeId: 163146,
    status: 'PLANNING',
    progress: 0,
    score: 0,
    notes: 'Hyped for this one!',
    repeat: 0,
    favorite: false,
    startedAt: null,
    completedAt: null,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    anime: {
      id: 163146,
      title: {
        romaji: 'Blue Lock VS. U-20 JAPAN',
        english: 'BLUE LOCK Season 2',
        native: 'ブルーロック VS. U-20 JAPAN',
      },
      coverImage: {
        extraLarge: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163146-BVZPgyzkqi82.png',
        large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx163146-BVZPgyzkqi82.png',
        medium: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx163146-BVZPgyzkqi82.png',
        color: '#6ba128',
      },
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/163146-HIz04v1Or7He.jpg',
      description: 'The intense soccer survival battle continues as the Blue Lock team faces the Japan U-20 national squad.',
      format: 'TV',
      status: 'FINISHED',
      episodes: 14,
      duration: 24,
      season: 'FALL',
      seasonYear: 2024,
      averageScore: 78,
      meanScore: 78,
      popularity: 180000,
      favourites: 6000,
      genres: ['Action', 'Drama', 'Sports'],
    },
  },
];

export const storageService = {
  loadEntries(): UserTrackEntry[] {
    try {
      const settings = this.loadSettings();
      // Anikuro library can only be loaded/used when logged in with AniList
      if (!settings.anilistUser) {
        return [];
      }

      const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (!data) {
        return [];
      }
      const parsed: UserTrackEntry[] = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return [];
      }
      const healed = parsed.map((entry) => {
        if (!entry) return null;
        if (entry.anime && typeof entry.anime.coverImage === 'string') {
          const str = entry.anime.coverImage as string;
          entry.anime.coverImage = { extraLarge: str, large: str, medium: str, color: null };
        }
        return entry;
      }).filter(Boolean) as UserTrackEntry[];
      return healed;
    } catch (err) {
      console.error('Failed to load user anime entries:', err);
      return [];
    }
  },

  saveEntries(entries: UserTrackEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (err) {
      console.error('Failed to save user anime entries:', err);
    }
  },

  loadSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (err) {
      console.error('Failed to load user settings:', err);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save user settings:', err);
    }
  },

  calculateStats(entries: UserTrackEntry[] = []): UserAnimeStats {
    let totalEpisodes = 0;
    let scoreSum = 0;
    let scoredCount = 0;

    const genreCounts: Record<string, number> = {};
    const statusCounts: Record<TrackStatus, number> = {
      CURRENT: 0,
      PLANNING: 0,
      COMPLETED: 0,
      DROPPED: 0,
      PAUSED: 0,
      REPEATING: 0,
    };
    const scoreDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
    };

    const safeEntries = Array.isArray(entries) ? entries : [];

    for (const entry of safeEntries) {
      if (!entry) continue;
      const status = entry.status || 'PLANNING';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      totalEpisodes += Number(entry.progress) || 0;

      if (entry.score && entry.score > 0) {
        scoreSum += Number(entry.score);
        scoredCount += 1;
        scoreDistribution[entry.score] = (scoreDistribution[entry.score] || 0) + 1;
      }

      if (entry.anime?.genres && Array.isArray(entry.anime.genres)) {
        for (const genre of entry.anime.genres) {
          if (genre) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        }
      }
    }

    const totalMinutes = totalEpisodes * 24;
    const hoursWatched = Math.round((totalMinutes / 60) * 10) / 10;
    const daysWatched = Math.round((hoursWatched / 24) * 10) / 10;
    const meanScore = scoredCount > 0 ? Math.round((scoreSum / scoredCount) * 10) / 10 : 0;

    return {
      totalCount: safeEntries.length,
      completedCount: statusCounts.COMPLETED,
      currentCount: statusCounts.CURRENT,
      planningCount: statusCounts.PLANNING,
      droppedCount: statusCounts.DROPPED,
      pausedCount: statusCounts.PAUSED,
      episodesWatched: totalEpisodes,
      daysWatched,
      hoursWatched,
      meanScore,
      genreCounts,
      statusCounts,
      scoreDistribution,
    };
  },

  exportBackupJson(entries: UserTrackEntry[], settings: UserSettings): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        entries,
        settings,
      },
      null,
      2
    );
  },

  importBackupJson(jsonString: string): { entries: UserTrackEntry[]; settings?: UserSettings } {
    const data = JSON.parse(jsonString);
    if (data.entries && Array.isArray(data.entries)) {
      this.saveEntries(data.entries);
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return { entries: data.entries, settings: data.settings };
    }
    throw new Error('Invalid Anikuro backup file format.');
  },
};
