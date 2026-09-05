import React, { useState } from 'react';
import { User, Settings, RefreshCw, ShieldCheck, ExternalLink, LogIn, LogOut } from 'lucide-react';
import { UserTrackEntry, UserAnimeStats, UserSettings, AniListUserProfile } from '../../types/userList';
import { StatsView } from './StatsView';
import { LOGO_FEMALE_BASE64, LOGO_MALE_BASE64 } from '../../assets/logoBase64';
import { useBackHandler } from '../../services/backHandler';

interface ProfileScreenProps {
  entries: UserTrackEntry[];
  stats: UserAnimeStats;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onImportData: (json: string) => void;
  onResetSample: () => void;
  onClearAll: () => void;
  onAniListLogin: (user: AniListUserProfile, token: string | null, newEntries: UserTrackEntry[]) => void;
  onAniListLogout: () => void;
  onOpenSettingsModal: () => void;
  onOpenLoginModal: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  entries,
  stats,
  settings,
  onUpdateSettings,
  onImportData,
  onResetSample,
  onClearAll,
  onAniListLogin,
  onAniListLogout,
  onOpenSettingsModal,
  onOpenLoginModal,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Back button handling: Dismiss logout confirmation
  useBackHandler(showLogoutConfirm, () => setShowLogoutConfirm(false), 15);

  const anilistUser = settings.anilistUser;
  const isAuthorized = !!anilistUser;

  const defaultMascotSrc = settings.avatarMascot === 'male' ? LOGO_MALE_BASE64 : LOGO_FEMALE_BASE64;
  const avatarSrc = isAuthorized && anilistUser.avatar ? anilistUser.avatar : defaultMascotSrc;
  const displayName = isAuthorized ? anilistUser.name : (settings.avatarMascot === 'male' ? 'Ren (蓮)' : 'Aoi (葵)');

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-8 lg:px-12 py-3 sm:py-6 space-y-4 sm:space-y-6 flex-1">
      {/* Profile Header Hero Card */}
      <div className="p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl glass-panel border border-[var(--border-color)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-6 relative overflow-hidden">
        {/* Background ambient banner glow */}
        {anilistUser?.bannerImage && (
          <div
            className="absolute inset-0 opacity-20 filter blur-md bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${anilistUser.bannerImage})` }}
          />
        )}

        <div className="flex items-center gap-3 sm:gap-5 relative z-10 w-full sm:w-auto">
          {/* Avatar */}
          <div className="relative w-14 h-14 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-sky-400/60 shadow-xl bg-slate-950 shrink-0">
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
              <h2 className="text-base sm:text-2xl font-black text-[var(--text-primary)] truncate">{displayName}</h2>
              {isAuthorized ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[9px] sm:text-[11px] font-black flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                  <span>AniList Authorized</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[9px] sm:text-[11px] font-black">
                  Local Otaku Profile
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 sm:mt-1">
              Tracking <strong className="text-[var(--text-primary)] font-bold">{entries.length}</strong> anime in library
            </p>

            {isAuthorized && (
              <a
                href={`https://anilist.co/user/${anilistUser.name}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-500 hover:underline flex items-center gap-1 mt-0.5 sm:mt-1 font-bold truncate"
              >
                <span>anilist.co/user/{anilistUser.name}</span>
                <ExternalLink size={12} className="shrink-0" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Auth & Settings Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto relative z-10">
          <button
            onClick={onOpenLoginModal}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all cursor-pointer ${
              isAuthorized
                ? 'glass-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/10'
                : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 shadow-sky-500/25'
            }`}
          >
            {isAuthorized ? <RefreshCw size={14} /> : <LogIn size={14} />}
            <span>{isAuthorized ? 'AniList Sync' : 'Login with AniList'}</span>
          </button>

          {/* Direct Log Out Button */}
          {isAuthorized && (
            <button
              onClick={() => {
                if (showLogoutConfirm) {
                  onAniListLogout();
                  setShowLogoutConfirm(false);
                } else {
                  setShowLogoutConfirm(true);
                }
              }}
              title="Log out from AniList"
              className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs transition-all cursor-pointer shadow-sm ${
                showLogoutConfirm
                  ? 'bg-rose-600 text-white animate-pulse border border-rose-500'
                  : 'glass-card border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 active:scale-95'
              }`}
            >
              <LogOut size={14} />
              <span>{showLogoutConfirm ? 'Confirm Log Out?' : 'Log Out'}</span>
            </button>
          )}

          <button
            onClick={onOpenSettingsModal}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl glass-panel border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Stats Analytics Dashboard */}
      <StatsView stats={stats} />
    </div>
  );
};