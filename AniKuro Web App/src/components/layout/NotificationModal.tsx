import React, { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCheck, Trash2, X, Play, Clock, Sparkles, ShieldCheck, ChevronRight, Bookmark } from 'lucide-react';
import { AiringNotification, notificationService } from '../../services/notificationService';
import { anilistApi } from '../../services/anilistApi';
import { AnimeMedia } from '../../types/anime';
import { useToast } from './Toast';
import { useBackHandler } from '../../services/backHandler';
import { triggerHaptic } from '../../utils/haptics';
import { useBottomSheetSnap } from '../../hooks/useBottomSheetSnap';
import { SheetCapsule } from './SheetCapsule';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AiringNotification[];
  onNotificationsChange: (updated: AiringNotification[]) => void;
  onSelectAnime: (anime: AnimeMedia) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationsChange,
  onSelectAnime,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');
  const [isPermissionGranted, setIsPermissionGranted] = useState(() => notificationService.hasPermission());
  const [initialUnreadIds, setInitialUnreadIds] = useState<Set<string>>(() => new Set());
  const { showToast } = useToast();

  // Close modal when back button is pressed
  useBackHandler(isOpen, onClose, 10);
  const {
    isExpanded,
    sheetRef,
    capsulePillRef,
    capsuleProps,
    sheetStyle,
  } = useBottomSheetSnap({ isOpen, onClose });

  // When user opens the notification modal, automatically mark old ones as read
  useEffect(() => {
    if (isOpen) {
      const unread = new Set(notifications.filter((n) => !n.read).map((n) => n.id));
      setInitialUnreadIds(unread);

      if (unread.size > 0) {
        const updated = notificationService.markAllAsRead();
        onNotificationsChange(updated);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = initialUnreadIds.size;

  const handleMarkAllRead = () => {
    const updated = notificationService.markAllAsRead();
    onNotificationsChange(updated);
    setInitialUnreadIds(new Set());
    showToast('All notifications marked as read', 'success');
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    onNotificationsChange([]);
    setInitialUnreadIds(new Set());
    showToast('Notifications cleared', 'info');
  };

  const handleNotificationClick = async (notif: AiringNotification) => {
    // Mark as read
    const updated = notificationService.markAsRead(notif.id);
    onNotificationsChange(updated);
    setInitialUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(notif.id);
      return next;
    });
    onNotificationsChange(updated);

    // Fetch anime details and open detail modal
    try {
      const anime = await anilistApi.getAnimeDetails(notif.animeId);
      if (anime) {
        onClose();
        onSelectAnime(anime);
      }
    } catch {
      showToast('Could not load anime details', 'error');
    }
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setIsPermissionGranted(granted);
    if (granted) {
      showToast('Notifications enabled! You will be alerted when new episodes air.', 'success');
    } else {
      showToast('Notifications permission not granted', 'info');
    }
  };

  const formatRelativeTime = (airingAtSeconds: number): string => {
    const diff = Math.floor(Date.now() / 1000) - airingAtSeconds;
    if (diff < 3600) {
      const mins = Math.max(1, Math.floor(diff / 60));
      return `${mins}m ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    }
  };

  const filteredNotifications = activeTab === 'watchlist'
    ? notifications.filter((n) => n.isTracked)
    : notifications;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={sheetStyle}
        className={`w-full max-w-lg rounded-t-[28px] sm:rounded-3xl glass-panel border-t border-x sm:border border-[var(--border-color)] shadow-2xl overflow-hidden ${isExpanded ? 'h-[96vh] sm:h-[90vh]' : 'h-[68vh] sm:h-[80vh]'} flex flex-col animate-slide-up sheet-spring`}
      >
        {/* Mobile Drag Handle */}
        <SheetCapsule
          isExpanded={isExpanded}
          capsuleProps={capsuleProps}
          capsulePillRef={capsulePillRef}
        />

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BellRing size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)]">Aired Episodes</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black shadow-sm">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Live alerts for your favorite releases</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                >
                  <CheckCheck size={16} />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    handleClearAll();
                  }}
                  title="Clear all"
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 tap-active cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] tap-active cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Permission Banner (if not granted) */}
        {!isPermissionGranted && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border-b border-sky-500/20 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-sky-200">
              <Bell size={14} className="text-sky-400 shrink-0" />
              <span>Enable system notifications for live episode alerts</span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                handleRequestPermission();
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-bold shrink-0 tap-active shadow-sm"
            >
              Enable
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('all');
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all tap-active cursor-pointer ${
              activeTab === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Airing ({notifications.length})
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('watchlist');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all tap-active cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Bookmark size={12} />
            <span>My Watchlist ({notifications.filter((n) => n.isTracked).length})</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroll-container p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl glass-card border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shadow-md">
                <Bell size={24} />
              </div>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {activeTab === 'watchlist' ? 'No new episodes for your watchlist' : 'No new episodes right now'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                As soon as an anime episode airs on TV or streaming, you will receive a notification here and in your notification center!
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isNewlyRead = initialUnreadIds.has(notif.id);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-2xl glass-card border transition-all cursor-pointer flex items-center gap-3 group relative ${
                    isNewlyRead
                      ? 'border-sky-500/50 bg-sky-500/10 shadow-sm'
                      : notif.read
                      ? 'border-[var(--border-color)] opacity-75 hover:opacity-100 hover:border-sky-500/40'
                      : 'border-sky-500/40 bg-sky-500/5 hover:border-sky-400 hover:bg-sky-500/10 shadow-sm'
                  }`}
                >
                  {/* Anime Cover */}
                  <div className="w-11 h-15 sm:w-12 sm:h-16 rounded-xl overflow-hidden bg-slate-900 border border-[var(--border-color)] shrink-0 relative group-hover:scale-105 transition-transform">
                    <img
                      src={notif.coverImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80'}
                      alt={notif.animeTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                      <Play size={10} className="text-white fill-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.2 rounded-md bg-sky-500 text-slate-950 font-black text-[10px]">
                        EP {notif.episode}
                      </span>
                      {isNewlyRead && (
                        <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 font-extrabold text-[9px] animate-pulse">
                          New
                        </span>
                      )}
                      {notif.isTracked && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[9px]">
                          {notif.userStatus || 'Tracked'}
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 ml-auto">
                        <Clock size={10} />
                        {formatRelativeTime(notif.airingAt)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-sky-400 transition-colors">
                      {notif.animeTitle}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      Episode {notif.episode} is officially out and available!
                    </p>
                  </div>

                  {/* Unread indicator / arrow */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isNewlyRead && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-sm shadow-sky-400/50" />
                    )}
                    <ChevronRight size={15} className="text-[var(--text-muted)] group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
