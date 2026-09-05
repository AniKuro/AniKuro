import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserTrackEntry, UserSettings, UserAnimeStats, TrackStatus } from '../types/userList';
import { AnimeMedia } from '../types/anime';
import { storageService, DEFAULT_SETTINGS, SAMPLE_ANIME_ENTRIES } from '../services/storage';
import { anilistApi } from '../services/anilistApi';
import { fireCelebrationConfetti } from '../utils/confetti';

export function useAnimeList() {
  const [entries, setEntries] = useState<UserTrackEntry[]>(() => storageService.loadEntries());
  const [settings, setSettings] = useState<UserSettings>(() => storageService.loadSettings());

  useEffect(() => {
    storageService.saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    storageService.saveSettings(settings);
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-oled', 'theme-cyberpunk', 'theme-sakura', 'theme-amethyst', 'theme-emerald', 'theme-light');
    root.classList.add(`theme-${settings.theme}`);
  }, [settings]);

  useEffect(() => {
    if (!settings.anilistUser && entries.length > 0) {
      setEntries([]);
    }
  }, [settings.anilistUser]);

  const stats = useMemo<UserAnimeStats>(() => {
    return storageService.calculateStats(entries);
  }, [entries]);

  const getEntry = useCallback(
    (animeId: number): UserTrackEntry | undefined => {
      return entries.find((e) => e.animeId === animeId);
    },
    [entries]
  );

  const addOrUpdateAnime = useCallback(
    (anime: AnimeMedia, trackData: Partial<UserTrackEntry>, options?: { skipCelebration?: boolean }) => {
      if (!settings.anilistUser) return;
      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.animeId === anime.id);
        const now = Date.now();

        if (existingIndex >= 0) {
          const updated = [...prev];
          const current = updated[existingIndex];
          const newStatus = trackData.status || current.status;
          const newProgress = trackData.progress !== undefined ? trackData.progress : current.progress;

          if (!options?.skipCelebration && newStatus === 'COMPLETED' && current.status !== 'COMPLETED') {
            fireCelebrationConfetti();
          }

          updated[existingIndex] = {
            ...current,
            ...trackData,
            anime: { ...current.anime, ...anime },
            updatedAt: now,
            status: newStatus,
            progress: newProgress,
          };
          return updated;
        } else {
          const isManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL' || anime.format === 'ONE_SHOT';
          const newEntry: UserTrackEntry = {
            animeId: anime.id,
            mediaType: trackData.mediaType || (isManga ? 'MANGA' : 'ANIME'),
            status: trackData.status || 'PLANNING',
            progress: trackData.progress || 0,
            score: trackData.score || 0,
            notes: trackData.notes || '',
            repeat: trackData.repeat || 0,
            favorite: trackData.favorite || false,
            startedAt: trackData.startedAt || (trackData.status === 'CURRENT' ? new Date().toISOString().split('T')[0] : null),
            completedAt: trackData.completedAt || (trackData.status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : null),
            updatedAt: now,
            anime,
          };

          if (!options?.skipCelebration && newEntry.status === 'COMPLETED') {
            fireCelebrationConfetti();
          }

          return [newEntry, ...prev];
        }
      });

      // 2-Way Sync to AniList Database
      if (settings.anilistToken && anime.id > 0) {
        anilistApi
          .saveMediaListEntry(
            {
              mediaId: anime.id,
              status: trackData.status,
              score: trackData.score,
              progress: trackData.progress,
              repeat: trackData.repeat,
              notes: trackData.notes,
            },
            settings.anilistToken
          )
          .then((saved) => {
            if (saved?.id) {
              setEntries((curr) =>
                curr.map((e) => (e.animeId === anime.id ? { ...e, mediaListId: saved.id } : e))
              );
            }
          })
          .catch((err) => {
            console.error('Failed to sync anime update to AniList database:', err);
          });
      }
    },
    [settings.anilistUser, settings.anilistToken]
  );

  const bulkSyncEntries = useCallback((syncedEntries: UserTrackEntry[]) => {
    if (!syncedEntries || syncedEntries.length === 0) return;
    setEntries((prev) => {
      const entryMap = new Map<number, UserTrackEntry>();
      for (const entry of prev) {
        entryMap.set(entry.animeId, entry);
      }
      const now = Date.now();
      for (const entry of syncedEntries) {
        const existing = entryMap.get(entry.animeId);
        if (existing) {
          entryMap.set(entry.animeId, {
            ...existing,
            ...entry,
            anime: { ...existing.anime, ...entry.anime },
            updatedAt: now,
          });
        } else {
          entryMap.set(entry.animeId, {
            ...entry,
            updatedAt: now,
          });
        }
      }
      return Array.from(entryMap.values());
    });
  }, []);

  const removeEntry = useCallback(
    (animeId: number) => {
      if (!settings.anilistUser) return;
      const target = entries.find((e) => e.animeId === animeId);
      setEntries((prev) => prev.filter((e) => e.animeId !== animeId));

      // 2-Way Sync to AniList Database (delete entry)
      if (settings.anilistToken && animeId > 0) {
        const deleteOnAniList = async () => {
          try {
            let listId = target?.mediaListId;
            if (!listId) {
              const fetchedId = await anilistApi.getMediaListEntryId(animeId, settings.anilistToken!);
              if (fetchedId) listId = fetchedId;
            }
            if (listId) {
              await anilistApi.deleteMediaListEntry(listId, settings.anilistToken!);
            }
          } catch (err) {
            console.error('Failed to delete anime from AniList database:', err);
          }
        };
        deleteOnAniList();
      }
    },
    [settings.anilistUser, settings.anilistToken, entries]
  );

  const incrementProgress = useCallback(
    (animeId: number) => {
      if (!settings.anilistUser) return;
      let syncedProgress = 0;
      let syncedStatus: TrackStatus | undefined;

      setEntries((prev) => {
        return prev.map((entry) => {
          if (entry.animeId !== animeId) return entry;

          const maxEpisodes = entry.anime?.episodes || 9999;
          const newProgress = Math.min(maxEpisodes, entry.progress + 1);
          let newStatus = entry.status;
          let completedAt = entry.completedAt;

          if (entry.status === 'PLANNING' && newProgress > 0) {
            newStatus = 'CURRENT';
          }

          if (entry.anime?.episodes && newProgress >= entry.anime.episodes && entry.status !== 'COMPLETED') {
            newStatus = 'COMPLETED';
            completedAt = new Date().toISOString().split('T')[0];
            fireCelebrationConfetti();
          }

          syncedProgress = newProgress;
          syncedStatus = newStatus;

          return {
            ...entry,
            progress: newProgress,
            status: newStatus,
            completedAt,
            updatedAt: Date.now(),
          };
        });
      });

      // 2-Way Sync to AniList Database
      if (settings.anilistToken && animeId > 0 && syncedProgress > 0) {
        anilistApi
          .saveMediaListEntry(
            {
              mediaId: animeId,
              progress: syncedProgress,
              status: syncedStatus,
            },
            settings.anilistToken
          )
          .catch((err) => {
            console.error('Failed to sync progress increment to AniList database:', err);
          });
      }
    },
    [settings.anilistUser, settings.anilistToken]
  );

  const decrementProgress = useCallback(
    (animeId: number) => {
      if (!settings.anilistUser) return;
      let syncedProgress = 0;

      setEntries((prev) => {
        return prev.map((entry) => {
          if (entry.animeId !== animeId) return entry;
          const newProgress = Math.max(0, entry.progress - 1);
          syncedProgress = newProgress;
          return {
            ...entry,
            progress: newProgress,
            updatedAt: Date.now(),
          };
        });
      });

      // 2-Way Sync to AniList Database
      if (settings.anilistToken && animeId > 0) {
        anilistApi
          .saveMediaListEntry(
            {
              mediaId: animeId,
              progress: syncedProgress,
            },
            settings.anilistToken
          )
          .catch((err) => {
            console.error('Failed to sync progress decrement to AniList database:', err);
          });
      }
    },
    [settings.anilistUser, settings.anilistToken]
  );

  const toggleFavorite = useCallback(
    (animeId: number) => {
      if (!settings.anilistUser) return;
      const targetEntry = entries.find((e) => e.animeId === animeId);
      const isManga = targetEntry?.mediaType === 'MANGA' || targetEntry?.anime?.type === 'MANGA';

      setEntries((prev) => {
        return prev.map((entry) => {
          if (entry.animeId !== animeId) return entry;
          return {
            ...entry,
            favorite: !entry.favorite,
            updatedAt: Date.now(),
          };
        });
      });

      // 2-Way Sync to AniList Database
      if (settings.anilistToken && animeId > 0) {
        anilistApi.toggleMediaFavourite(animeId, settings.anilistToken, isManga).catch((err) => {
          console.error('Failed to toggle favorite on AniList database:', err);
        });
      }
    },
    [settings.anilistUser, settings.anilistToken, entries]
  );

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const importData = useCallback((jsonString: string) => {
    const { entries: importedEntries, settings: importedSettings } = storageService.importBackupJson(jsonString);
    setEntries(importedEntries);
    if (importedSettings) {
      setSettings(importedSettings);
    }
  }, []);

  const resetToSampleData = useCallback(() => {
    setEntries([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const clearAllData = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    settings,
    stats,
    getEntry,
    addOrUpdateAnime,
    bulkSyncEntries,
    removeEntry,
    incrementProgress,
    decrementProgress,
    toggleFavorite,
    updateSettings,
    importData,
    resetToSampleData,
    clearAllData,
  };
}
