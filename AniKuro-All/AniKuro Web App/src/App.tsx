import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAnimeList } from './hooks/useAnimeList';
import { NavTab, BottomNav } from './components/layout/BottomNav';
import { TopHeader } from './components/layout/TopHeader';
import { MobileFrame } from './components/layout/MobileFrame';
import { ToastProvider, useToast } from './components/layout/Toast';
import { DiscoverScreen } from './components/discover/DiscoverScreen';
import { MyListScreen } from './components/mylist/MyListScreen';
import { AiringCalendar } from './components/schedule/AiringCalendar';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { AnimeDetailModal } from './components/detail/AnimeDetailModal';
import { KuroSenseiModal } from './components/ai/KuroSenseiModal';
import { SettingsModal } from './components/profile/SettingsModal';
import { CustomAnimeModal } from './components/mylist/CustomAnimeModal';
import { AniListLoginModal } from './components/profile/AniListLoginModal';
import { NotificationModal } from './components/layout/NotificationModal';
import { notificationService, AiringNotification } from './services/notificationService';
import { AnimeMedia } from './types/anime';
import { anilistApi } from './services/anilistApi';
import { AniListUserProfile, UserTrackEntry } from './types/userList';
import { backButtonManager, useBackHandler } from './services/backHandler';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [selectedAnime, setSelectedAnime] = useState<AnimeMedia | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AiringNotification[]>(() => notificationService.getNotifications());

  const {
    entries,
    settings,
    stats,
    addOrUpdateAnime,
    bulkSyncEntries,
    removeEntry,
    incrementProgress,
    toggleFavorite,
    updateSettings,
    importData,
    resetToSampleData,
    clearAllData,
  } = useAnimeList();

  const { showToast } = useToast();
  const isUserLoggedIn = Boolean(settings.anilistUser);

  // Authentication gate helper
  const requireLogin = (callback: () => void, message = 'Please log in with your AniList account to add or update anime!') => {
    if (!settings.anilistUser) {
      showToast(message, 'info');
      setIsLoginModalOpen(true);
      return;
    }
    callback();
  };

  // Listen for OAuth token via Android deep link or URL hash on launch
  useEffect(() => {
    const processOAuthString = async (rawUrlOrToken: string) => {
      let raw = rawUrlOrToken.trim();
      if (raw.includes('access_token=')) {
        const match = raw.match(/access_token=([^&/#\s]+)/);
        if (match && match[1]) {
          raw = match[1];
        }
      }
      try {
        raw = decodeURIComponent(raw);
      } catch {}
      raw = raw.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();

      if (!raw) return;

      try {
        showToast('Validating AniList authorization...', 'info');
        const userProfile = await anilistApi.getViewer(raw);
        const userEntries = await anilistApi.fetchUserMediaList({ userId: userProfile.id }, raw);
        
        updateSettings({ anilistUser: userProfile, anilistToken: raw });
        bulkSyncEntries(userEntries);
        showToast(`Welcome ${userProfile.name}! Synced ${userEntries.length} anime from AniList.`, 'success');
        setIsLoginModalOpen(false);
        setActiveTab('profile');
        setVisitedTabs((prev) => new Set([...prev, 'profile']));
      } catch (err: any) {
        showToast(err.message || 'AniList authorization failed', 'error');
      }
    };

    // 1. Expose to Android native bridge for deep links & in-app OAuth
    (window as any).__anikuroHandleOAuthRedirect = (urlOrToken: string) => {
      processOAuthString(urlOrToken);
    };

    // 2. Check hash on web startup
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      window.history.replaceState(null, '', window.location.pathname);
      processOAuthString(hash);
    }

    return () => {
      delete (window as any).__anikuroHandleOAuthRedirect;
    };
  }, [bulkSyncEntries, updateSettings, showToast]);

  const lastEpisodeCheckTimeRef = useRef(0);
  const lastEntryCountRef = useRef(-1);

  // Request notification permissions & check for newly aired episodes (throttled)
  useEffect(() => {
    // 1. Prompt for notification permission when opened
    notificationService.requestPermission();

    // 2. Check for newly aired episodes
    const checkEpisodes = async (force = false) => {
      const now = Date.now();
      // Throttle: don't query more than once every 3 minutes unless explicitly forced or entry count changed
      if (!force && now - lastEpisodeCheckTimeRef.current < 3 * 60 * 1000) {
        return;
      }
      lastEpisodeCheckTimeRef.current = now;
      try {
        const updated = await notificationService.checkAiredEpisodes(entries, settings.titleLanguage);
        setNotifications(updated);
      } catch (err) {
        console.warn('Episode check failed:', err);
      }
    };

    if (lastEntryCountRef.current !== entries.length) {
      lastEntryCountRef.current = entries.length;
      checkEpisodes(true);
    } else {
      checkEpisodes(false);
    }

    // 3. Periodic background check every 4 minutes while running
    const interval = setInterval(() => checkEpisodes(true), 4 * 60 * 1000);

    // 4. Re-check whenever app becomes visible or focused
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkEpisodes(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [entries.length, settings.titleLanguage]);

  const handleQuickTrack = (anime: AnimeMedia) => {
    requireLogin(() => {
      const existing = entries.find((e) => e.animeId === anime.id);
      const isManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL' || anime.format === 'ONE_SHOT';
      if (existing) {
        const statusLabel = isManga
          ? (existing.status === 'CURRENT' ? 'reading' : existing.status.toLowerCase())
          : (existing.status === 'CURRENT' ? 'watching' : existing.status.toLowerCase());
        showToast(`Already tracked in ${statusLabel}`, 'info');
        setSelectedAnime(anime);
      } else {
        addOrUpdateAnime(anime, {
          status: 'CURRENT',
          progress: 1,
          mediaType: isManga ? 'MANGA' : 'ANIME',
        });
        showToast(`Added "${anime.title.romaji || (isManga ? 'Manga' : 'Anime')}" to ${isManga ? 'Reading' : 'Watching'}!`, 'success');
      }
    });
  };

  const handleIncrementProgress = (animeId: number) => {
    requireLogin(() => {
      incrementProgress(animeId);
    }, 'Please log in with AniList to update episode progress!');
  };

  const handleToggleFavorite = (animeId: number) => {
    requireLogin(() => {
      toggleFavorite(animeId);
    }, 'Please log in with AniList to favorite anime!');
  };

  const handleOpenCustomAnimeModal = () => {
    requireLogin(() => {
      setIsCustomModalOpen(true);
    }, 'Please log in with AniList to add custom anime!');
  };

  const handleSelectRelatedAnime = async (animeId: number) => {
    try {
      const anime = await anilistApi.getAnimeDetails(animeId);
      setSelectedAnime(anime);
    } catch {
      showToast('Could not load related anime', 'error');
    }
  };

  const handleAniListLogin = (user: AniListUserProfile, token: string | null, newEntries: UserTrackEntry[]) => {
    updateSettings({ anilistUser: user, anilistToken: token });
    bulkSyncEntries(newEntries);
  };

  const handleAniListLogout = () => {
    updateSettings({ anilistUser: null, anilistToken: null });
    clearAllData();
    showToast('Logged out of AniList. Watchlist cleared.', 'info');
  };

  const [visitedTabs, setVisitedTabs] = useState<Set<NavTab>>(() => new Set<NavTab>(['discover']));

  const handleTabChange = useCallback((tab: NavTab) => {
    if (tab === activeTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [activeTab]);

  // Configure double-tap exit toast for base tabs
  useEffect(() => {
    backButtonManager.setExitToastCallback(() => {
      showToast('Press back again to exit', 'info');
    });
  }, [showToast]);

  // Handle closing modals when back button is pressed
  useBackHandler(Boolean(selectedAnime), () => setSelectedAnime(null), 10);
  useBackHandler(isAiModalOpen, () => setIsAiModalOpen(false), 10);
  useBackHandler(isThemeModalOpen, () => setIsThemeModalOpen(false), 10);
  useBackHandler(isCustomModalOpen, () => setIsCustomModalOpen(false), 10);
  useBackHandler(isLoginModalOpen, () => setIsLoginModalOpen(false), 10);
  useBackHandler(isNotificationModalOpen, () => setIsNotificationModalOpen(false), 10);

  const watchingCount = entries.filter((e) => e.status === 'CURRENT').length;
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <MobileFrame>
      {/* Top Header */}
      <TopHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        watchingCount={watchingCount}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenCustomAnimeModal={handleOpenCustomAnimeModal}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
        currentTheme={settings.theme}
        mascot={settings.avatarMascot}
        anilistUser={settings.anilistUser}
      />

      {/* Main Screen Content - Keep-Alive Tab State */}
      <main className="flex-1 flex flex-col min-h-0 pb-24 sm:pb-28 md:pb-8">
        <div className={`flex-1 flex-col ${activeTab === 'discover' ? 'flex animate-tab-enter' : 'hidden'}`}>
          <DiscoverScreen
            userEntries={entries}
            titleLanguage={settings.titleLanguage}
            onSelectAnime={setSelectedAnime}
            onQuickTrack={handleQuickTrack}
            onOpenAiSensei={() => setIsAiModalOpen(true)}
          />
        </div>

        {visitedTabs.has('mylist') && (
          <div className={`flex-1 flex-col ${activeTab === 'mylist' ? 'flex animate-tab-enter' : 'hidden'}`}>
            <MyListScreen
              entries={entries}
              titleLanguage={settings.titleLanguage}
              isLoggedIn={isUserLoggedIn}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onSelectAnime={setSelectedAnime}
              onIncrementProgress={handleIncrementProgress}
              onToggleFavorite={handleToggleFavorite}
              onNavigateToDiscover={() => handleTabChange('discover')}
              onOpenCustomModal={handleOpenCustomAnimeModal}
            />
          </div>
        )}

        {visitedTabs.has('airing') && (
          <div className={`flex-1 flex-col ${activeTab === 'airing' ? 'flex animate-tab-enter' : 'hidden'}`}>
            <AiringCalendar
              userEntries={entries}
              titleLanguage={settings.titleLanguage}
              onSelectAnime={setSelectedAnime}
              onQuickTrack={handleQuickTrack}
            />
          </div>
        )}

        {visitedTabs.has('profile') && (
          <div className={`flex-1 flex-col ${activeTab === 'profile' ? 'flex animate-tab-enter' : 'hidden'}`}>
            <ProfileScreen
              entries={entries}
              stats={stats}
              settings={settings}
              onUpdateSettings={updateSettings}
              onImportData={importData}
              onResetSample={resetToSampleData}
              onClearAll={clearAllData}
              onAniListLogin={handleAniListLogin}
              onAniListLogout={handleAniListLogout}
              onOpenSettingsModal={() => setIsThemeModalOpen(true)}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        watchingCount={watchingCount}
      />

      {/* Modals */}
      {selectedAnime && (
        <AnimeDetailModal
          anime={selectedAnime}
          userEntry={entries.find((e) => e.animeId === selectedAnime.id)}
          titleLanguage={settings.titleLanguage}
          isLoggedIn={isUserLoggedIn}
          onRequireLogin={() => {
            showToast('Please log in with your AniList account to track and add anime!', 'info');
            setIsLoginModalOpen(true);
          }}
          onClose={() => setSelectedAnime(null)}
          onSaveTrack={(anime, data) => {
            requireLogin(() => {
              addOrUpdateAnime(anime, data);
              showToast('Tracking saved!', 'success');
            });
          }}
          onDeleteTrack={(animeId) => {
            requireLogin(() => {
              removeEntry(animeId);
              showToast('Removed anime from list', 'info');
            });
          }}
          onSelectRelatedAnime={handleSelectRelatedAnime}
        />
      )}

      <KuroSenseiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        entries={entries}
        stats={stats}
        titleLanguage={settings.titleLanguage}
        onSelectAnime={(anime) => {
          setIsAiModalOpen(false);
          setSelectedAnime(anime);
        }}
        onQuickTrack={handleQuickTrack}
      />

      <SettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        settings={settings}
        entries={entries}
        onUpdateSettings={updateSettings}
        onImportData={importData}
        onResetSample={resetToSampleData}
        onClearAll={clearAllData}
        onLogout={handleAniListLogout}
      />

      <CustomAnimeModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAddCustomAnime={(anime, trackData) => {
          requireLogin(() => {
            addOrUpdateAnime(anime, trackData);
            showToast(`Added custom anime "${anime.title.romaji}"!`, 'success');
          });
        }}
      />

      <AniListLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={settings.anilistUser}
        onLoginSuccess={handleAniListLogin}
        onLogout={handleAniListLogout}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onNotificationsChange={setNotifications}
        onSelectAnime={setSelectedAnime}
      />
    </MobileFrame>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
};

export default App;