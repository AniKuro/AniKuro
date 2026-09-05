import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, RefreshCw, User, AlertCircle, LogOut } from 'lucide-react';
import { anilistApi } from '../../services/anilistApi';
import { AniListUserProfile, UserTrackEntry } from '../../types/userList';
import { useToast } from '../layout/Toast';
import { useBottomSheetSnap } from '../../hooks/useBottomSheetSnap';
import { SheetCapsule } from '../layout/SheetCapsule';

interface AniListLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AniListUserProfile | null;
  onLoginSuccess: (user: AniListUserProfile, token: string | null, entries: UserTrackEntry[]) => void;
  onLogout: () => void;
}

// Official AniKuro AniList Client ID
const ANILIST_CLIENT_ID = '50236';

export const AniListLoginModal: React.FC<AniListLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Clear any legacy client IDs from previous testing
  useEffect(() => {
    try {
      localStorage.removeItem('anikuro_anilist_client_id');
    } catch {}
  }, []);

  const {
    isExpanded,
    sheetRef,
    capsulePillRef,
    capsuleProps,
    sheetStyle,
  } = useBottomSheetSnap({ isOpen, onClose });

  if (!isOpen) return null;

  const handleOpenAniList = () => {
    setIsLoading(true);
    setStatusMessage('Redirecting to AniList.co...');
    setError(null);
    const oauthUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_CLIENT_ID}&response_type=token`;
    
    // Open in browser so user signs into AniList and is redirected back to anikuro://auth
    const win = window.open(oauthUrl, '_blank');
    if (!win) {
      window.location.href = oauthUrl;
    }

    setTimeout(() => {
      setIsLoading(false);
      setStatusMessage('Waiting for you to log in on AniList. Once authorized, you will return here automatically!');
    }, 1500);
  };

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
        className={`w-full max-w-lg rounded-t-[28px] sm:rounded-3xl glass-panel border-t border-x sm:border border-sky-500/40 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 ${isExpanded ? 'h-[96vh] sm:h-[90vh]' : 'h-[58vh] sm:h-[66vh]'} overflow-y-auto modal-scroll-container animate-slide-up sheet-spring`}
        style={{
          ...sheetStyle,
          paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem))',
        }}
      >
        {/* Mobile Drag Handle */}
        <SheetCapsule
          isExpanded={isExpanded}
          capsuleProps={capsuleProps}
          capsulePillRef={capsulePillRef}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-500 dark:text-sky-400 flex items-center justify-center border border-sky-500/40">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[var(--text-primary)]">
                {currentUser ? 'AniList Account & Data Sync' : 'AniList Account'}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)]">
                {currentUser ? 'Connected account and cloud library synchronization' : 'Official 2-way sync with your AniList account'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* If already logged in */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 flex items-center gap-3.5 shadow-sm">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-xl object-cover border border-emerald-400" />
              ) : (
                <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center text-emerald-500">
                  <User size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">{currentUser.name}</h4>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold">
                    Connected
                  </span>
                </div>
                <a
                  href={`https://anilist.co/user/${currentUser.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-500 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                >
                  <span>View AniList Profile</span>
                  <ExternalLink size={10} />
                </a>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                  AniList ID: <span className="font-mono text-emerald-400 font-bold">{currentUser.id}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const entries = await anilistApi.fetchUserMediaList({ userId: currentUser.id });
                    onLoginSuccess(currentUser, null, entries);
                    showToast(`Updated library with ${entries.length} anime from AniList!`, 'success');
                    onClose();
                  } catch (err: any) {
                    showToast(err.message || 'Failed to refresh AniList data', 'error');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Fetching Data...' : '⚡ Re-Sync All Anime'}</span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  showToast('Disconnected AniList account', 'info');
                  onClose();
                }}
                className="py-2.5 px-4 rounded-2xl glass-card border border-rose-500/40 text-rose-500 font-bold text-xs hover:bg-rose-500/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        ) : (
          /* Single Seamless AniList Login Flow */
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sky-500 font-bold text-sm">
                <ShieldCheck size={18} />
                <span>Official AniList Sync</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Log in with your <strong>AniList</strong> account to sync watched anime, reading manga, episode progress, ratings, and custom lists in real-time.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-400 font-bold">✓</span> Real-time 2-way sync
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-400 font-bold">✓</span> Anime & Manga library
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-400 font-bold">✓</span> KuroSensei AI recommendations
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-400 font-bold">✓</span> Fast automatic login
                </div>
              </div>
            </div>

            {/* Single Login Action */}
            <button
              onClick={handleOpenAniList}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60 text-slate-950 font-black text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <ExternalLink size={18} className="stroke-[2.5]" />
              )}
              <span>{isLoading ? 'Redirecting to AniList...' : 'Login with AniList'}</span>
            </button>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center gap-2 text-sky-600 dark:text-sky-300 text-xs font-semibold">
                <RefreshCw size={14} className="animate-spin shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
