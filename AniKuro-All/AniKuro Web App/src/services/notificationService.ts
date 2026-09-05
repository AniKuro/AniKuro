import { UserTrackEntry, TitleLanguage } from '../types/userList';
import { anilistApi } from './anilistApi';
import { getDisplayTitle } from '../utils/formatters';

export interface AiringNotification {
  id: string; // e.g. "airing-154587-12"
  animeId: number;
  animeTitle: string;
  episode: number;
  coverImage?: string;
  airingAt: number; // unix timestamp in seconds
  read: boolean;
  isTracked: boolean;
  userStatus?: string;
  createdAt: number;
}

declare global {
  interface Window {
    AndroidNotificationBridge?: {
      hasPermission: () => boolean;
      requestPermission: () => void;
      showNotification: (title: string, body: string, id: number) => void;
    };
  }
}

const STORAGE_KEY_NOTIFS = 'anikuro_notifications_v1';
const STORAGE_KEY_NOTIFIED_IDS = 'anikuro_notified_episodes_v1';

class NotificationService {
  /**
   * Check if notification permission is granted
   */
  hasPermission(): boolean {
    if (typeof window !== 'undefined' && window.AndroidNotificationBridge) {
      try {
        return window.AndroidNotificationBridge.hasPermission();
      } catch {
        // fallback
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  /**
   * Request notification permission on web & Android native
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Android Native Bridge
      if (typeof window !== 'undefined' && window.AndroidNotificationBridge) {
        window.AndroidNotificationBridge.requestPermission();
      }

      // Browser Notification API
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const res = await Notification.requestPermission();
          return res === 'granted';
        }
        return Notification.permission === 'granted';
      }
    } catch (e) {
      console.warn('Could not request notification permission:', e);
    }
    return this.hasPermission();
  }

  /**
   * Post a system notification to Android Notification Shade or Web Notification Center
   */
  sendSystemNotification(title: string, body: string, id: number, animeId?: number) {
    // 1. Android Native Notification Bridge
    if (typeof window !== 'undefined' && window.AndroidNotificationBridge) {
      try {
        window.AndroidNotificationBridge.showNotification(title, body, id);
        return;
      } catch (e) {
        console.warn('Native notification failed, falling back:', e);
      }
    }

    // 2. Web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `anikuro-ep-${id}`,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Web notification failed:', e);
      }
    }
  }

  /**
   * Get all stored in-app notifications
   */
  getNotifications(): AiringNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (!raw) return [];
      const list: AiringNotification[] = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  /**
   * Save notifications to storage
   */
  private saveNotifications(notifs: AiringNotification[]) {
    try {
      // Keep up to 50 most recent notifications
      const trimmed = notifs.slice(0, 50);
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }

  /**
   * Get notified episode IDs to prevent spamming duplicate notifications
   */
  private getNotifiedIds(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFIED_IDS);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  private saveNotifiedId(id: string) {
    try {
      const set = this.getNotifiedIds();
      set.add(id);
      const arr = Array.from(set).slice(-200); // keep last 200
      localStorage.setItem(STORAGE_KEY_NOTIFIED_IDS, JSON.stringify(arr));
    } catch (e) {
      console.error('Failed to save notified id:', e);
    }
  }

  /**
   * Check AniList for recently aired anime episodes (past 48h)
   * Dispatches system notifications for tracked or hot series.
   */
  async checkAiredEpisodes(
    userEntries: UserTrackEntry[] = [],
    titleLanguage: TitleLanguage = 'romaji'
  ): Promise<AiringNotification[]> {
    try {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const twoDaysAgo = nowSeconds - 86400 * 2; // last 48 hours
      const sevenDaysAgo = nowSeconds - 86400 * 7; // last 7 days for user's watchlist

      // 1. Gather anime IDs from user's watchlist (Watching, Planning, etc.)
      const trackedAnimeIds = userEntries
        .filter((e) => e.mediaType !== 'MANGA')
        .map((e) => e.animeId);

      // 2. Fetch schedules in parallel: User's tracked shows (last 7 days) + Global trending airing (last 48h)
      const [trackedSchedule, globalSchedule] = await Promise.all([
        trackedAnimeIds.length > 0
          ? anilistApi.getAiringScheduleForMedia(trackedAnimeIds, sevenDaysAgo, nowSeconds)
          : Promise.resolve([]),
        anilistApi.getAiringSchedule(twoDaysAgo, nowSeconds, 'TIME_DESC'),
      ]);

      // 3. Deduplicate schedule items by ID
      const scheduleMap = new Map<number, (typeof globalSchedule)[0]>();
      for (const item of trackedSchedule) {
        if (item && item.media) scheduleMap.set(item.id, item);
      }
      for (const item of globalSchedule) {
        if (item && item.media && !scheduleMap.has(item.id)) {
          scheduleMap.set(item.id, item);
        }
      }

      const scheduleItems = Array.from(scheduleMap.values());
      if (scheduleItems.length === 0) {
        return this.getNotifications();
      }

      const existingNotifs = this.getNotifications();
      const notifiedIds = this.getNotifiedIds();
      const newlyCreatedNotifs: AiringNotification[] = [];

      // Sort descending by airing time (freshest aired episodes first)
      const sorted = scheduleItems.sort((a, b) => b.airingAt - a.airingAt);

      for (const item of sorted) {
        if (!item.media) continue;

        const notifId = `airing-${item.media.id}-${item.episode}`;
        if (notifiedIds.has(notifId)) continue;

        const userEntry = userEntries.find((e) => e.animeId === item.media.id);
        const isTracked = !!userEntry;
        const displayTitle = getDisplayTitle(item.media.title, titleLanguage);

        const newNotif: AiringNotification = {
          id: notifId,
          animeId: item.media.id,
          animeTitle: displayTitle,
          episode: item.episode,
          coverImage: item.media.coverImage?.large || item.media.coverImage?.medium,
          airingAt: item.airingAt,
          read: false,
          isTracked,
          userStatus: userEntry?.status,
          createdAt: Date.now(),
        };

        newlyCreatedNotifs.push(newNotif);
        this.saveNotifiedId(notifId);

        // Dispatch OS System Notification
        // Notify immediately if tracked in watchlist, or for top fresh releases
        if (isTracked || sorted.indexOf(item) < 3) {
          const title = isTracked
            ? `New Episode of ${displayTitle}! 🎬`
            : `Newly Aired: ${displayTitle}`;
          const body = `Episode ${item.episode} has just aired and is now available to watch!`;
          this.sendSystemNotification(title, body, item.media.id, item.media.id);
        }
      }

      if (newlyCreatedNotifs.length > 0) {
        const merged = [...newlyCreatedNotifs, ...existingNotifs];
        this.saveNotifications(merged);
        return merged;
      }

      return existingNotifs;
    } catch (err) {
      console.warn('Failed to check aired episodes:', err);
      return this.getNotifications();
    }
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): AiringNotification[] {
    const list = this.getNotifications().map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.saveNotifications(list);
    return list;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): AiringNotification[] {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(list);
    return list;
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
  }
}

export const notificationService = new NotificationService();
