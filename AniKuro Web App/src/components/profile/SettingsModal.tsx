import React, { useState } from 'react';
import { X, Download, Upload, Trash2, RefreshCcw, Check, Sparkles, User, Palette, LogOut, ShieldCheck } from 'lucide-react';
import { UserSettings, UserTrackEntry, AppTheme, TitleLanguage } from '../../types/userList';
import { storageService } from '../../services/storage';
import { useToast } from '../layout/Toast';
import { LOGO_FEMALE_BASE64, LOGO_MALE_BASE64 } from '../../assets/logoBase64';
import { useBottomSheetSnap } from '../../hooks/useBottomSheetSnap';
import { SheetCapsule } from '../layout/SheetCapsule';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  entries: UserTrackEntry[];
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onImportData: (json: string) => void;
  onResetSample: () => void;
  onClearAll: () => void;
  onLogout?: () => void;
}

const THEMES: { id: AppTheme; label: string; color: string }[] = [
  { id: 'dark', label: 'Dark Slate', color: 'bg-sky-500' },
  { id: 'light', label: 'Daylight White', color: 'bg-amber-100 border border-slate-400' },
  { id: 'oled', label: 'OLED Black', color: 'bg-zinc-800' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: 'bg-cyan-400' },
  { id: 'sakura', label: 'Cherry Sakura', color: 'bg-pink-400' },
  { id: 'amethyst', label: 'Amethyst Purple', color: 'bg-purple-500' },
  { id: 'emerald', label: 'Emerald Forest', color: 'bg-emerald-500' },
];

const LANGUAGES: { id: TitleLanguage; label: string; example: string }[] = [
  { id: 'romaji', label: 'Romaji (Default)', example: 'Sousou no Frieren' },
  { id: 'english', label: 'English', example: 'Frieren: Beyond Journey\'s End' },
  { id: 'native', label: 'Japanese Kanji/Kana', example: '葬送のフリーレン' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  entries,
  onUpdateSettings,
  onImportData,
  onResetSample,
  onClearAll,
  onLogout,
}) => {
  const { showToast } = useToast();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const {
    isExpanded,
    sheetRef,
    capsulePillRef,
    capsuleProps,
    sheetStyle,
  } = useBottomSheetSnap({ isOpen, onClose });

  if (!isOpen) return null;

  const handleExport = () => {
    const json = storageService.exportBackupJson(entries, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anikuro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported backup file successfully!', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportData(text);
        showToast('Imported backup successfully!', 'success');
      } catch (err: any) {
        showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
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
        className={`w-full max-w-lg rounded-t-[28px] sm:rounded-3xl glass-panel border-t border-x sm:border border-[var(--border-color)] shadow-2xl p-4 sm:p-5 space-y-4 sm:space-y-5 ${isExpanded ? 'h-[96vh] sm:h-[90vh]' : 'h-[68vh] sm:h-[78vh]'} overflow-y-auto modal-scroll-container animate-slide-up sheet-spring`}
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

        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-sky-500" />
            <h3 className="font-extrabold text-sm text-[var(--text-primary)]">Settings & Customization</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        {/* AniList Account Card & Log Out */}
        {settings.anilistUser && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {settings.anilistUser.avatar ? (
                <img
                  src={settings.anilistUser.avatar}
                  alt={settings.anilistUser.name}
                  className="w-9 h-9 rounded-xl object-cover border border-emerald-400 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck size={18} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-black text-[var(--text-primary)] truncate">{settings.anilistUser.name}</p>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AniList Connected</span>
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                  showToast('Logged out of AniList', 'info');
                }}
                className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 text-[11px] font-black flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            )}
          </div>
        )}

        {/* Mascot Avatar Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-secondary)] block">App Mascot Emblem</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onUpdateSettings({ avatarMascot: 'female' })}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                settings.avatarMascot !== 'male'
                  ? 'bg-sky-500/20 border-sky-400'
                  : 'glass-card border-[var(--border-color)]'
              }`}
            >
              <img src={LOGO_FEMALE_BASE64} alt="Aoi" className="w-10 h-10 rounded-xl object-cover border border-sky-400/40" />
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">Aoi (葵)</p>
                <p className="text-[10px] text-[var(--text-muted)]">Celestial Heroine</p>
              </div>
            </button>

            <button
              onClick={() => onUpdateSettings({ avatarMascot: 'male' })}
              className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                settings.avatarMascot === 'male'
                  ? 'bg-sky-500/20 border-sky-400'
                  : 'glass-card border-[var(--border-color)]'
              }`}
            >
              <img src={LOGO_MALE_BASE64} alt="Ren" className="w-10 h-10 rounded-xl object-cover border border-sky-400/40" />
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text-primary)]">Ren (蓮)</p>
                <p className="text-[10px] text-[var(--text-muted)]">Cyber Samurai</p>
              </div>
            </button>
          </div>
        </div>

        {/* Theme Palette Options */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-secondary)] block">Color Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateSettings({ theme: t.id })}
                className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                  settings.theme === t.id
                    ? 'bg-sky-500/20 border-sky-500 text-[var(--text-primary)] font-extrabold'
                    : 'glass-card border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Language */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-secondary)] block">Title Language</label>
          <div className="space-y-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => onUpdateSettings({ titleLanguage: l.id })}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  settings.titleLanguage === l.id
                    ? 'bg-sky-500/20 border-sky-500 text-[var(--text-primary)]'
                    : 'glass-card border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div>
                  <p>{l.label}</p>
                  <p className="text-[10px] font-normal text-[var(--text-muted)]">{l.example}</p>
                </div>
                {settings.titleLanguage === l.id && <Check size={16} className="text-sky-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="space-y-2 border-t border-[var(--border-color)] pt-4">
          <label className="text-xs font-bold text-[var(--text-secondary)] block">Data Backup & Restore</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold hover:bg-sky-500/10"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center justify-center gap-1.5 py-2 rounded-xl glass-card border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold hover:bg-sky-500/10 cursor-pointer">
              <Upload size={14} />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-2 border-t border-[var(--border-color)] pt-3">
          <button
            onClick={() => {
              if (showConfirmClear) {
                onClearAll();
                setShowConfirmClear(false);
                showToast('All list data cleared', 'info');
              } else {
                setShowConfirmClear(true);
              }
            }}
            className={`w-full py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
              showConfirmClear
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'glass-card border-[var(--border-color)] text-rose-500 hover:bg-rose-500/10'
            }`}
          >
            {showConfirmClear ? 'Confirm Clear All Data?' : 'Clear All Watchlist Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
