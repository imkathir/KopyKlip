import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadClips,
  saveClips,
  loadSettings,
  saveSettings,
  createNewClip,
} from './utils/storage';
import { ClipItem, KopyKlipSettings } from './types';
import { sound } from './utils/sound';
import { MacMenuBar } from './components/MacMenuBar';
import { KopyKlipPopover } from './components/KopyKlipPopover';
import { DMGDownloadModal } from './components/DMGDownloadModal';
import { PreferencesModal } from './components/PreferencesModal';
import { QuickAddModal } from './components/QuickAddModal';
import {
  HardDrive,
  Copy,
  Pin,
  Sparkles,
  Command,
  Plus,
  Sliders,
  Check,
  Maximize2,
  Folder,
  Globe,
  Terminal,
  Code2,
  Palette,
} from 'lucide-react';

export default function App() {
  const [clips, setClips] = useState<ClipItem[]>(() => loadClips());
  const [settings, setSettings] = useState<KopyKlipSettings>(() => loadSettings());
  const [isPopoverOpen, setIsPopoverOpen] = useState(true);
  const [isDMGModalOpen, setIsDMGModalOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddVaultDefault, setQuickAddVaultDefault] = useState(false);

  // macOS Notification Toast
  const [toast, setToast] = useState<{ title: string; subtitle: string; icon?: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showMacNotification = (title: string, subtitle: string, icon = '📋') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ title, subtitle, icon });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Save changes to localStorage
  useEffect(() => {
    saveClips(clips);
  }, [clips]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Copy clip action
  const handleCopyClip = useCallback(
    async (clip: ClipItem) => {
      try {
        await navigator.clipboard.writeText(clip.text);
      } catch (err) {
        console.warn('Clipboard write fallback', err);
      }

      if (settings.soundEnabled) {
        sound.playCopy();
      }

      // Update copy count and bump timestamp
      setClips((prev) =>
        prev.map((c) =>
          c.id === clip.id
            ? { ...c, copyCount: (c.copyCount || 0) + 1, createdAt: Date.now() }
            : c
        )
      );

      const preview =
        clip.label ||
        (clip.text.length > 35 ? clip.text.slice(0, 35) + '...' : clip.text);
      showMacNotification('KopyKlip Copied', preview, clip.pinned ? '📌' : '📋');
    },
    [settings.soundEnabled]
  );

  // Toggle Pin action
  const handleTogglePin = useCallback(
    (clipId: string) => {
      setClips((prev) => {
        const target = prev.find((c) => c.id === clipId);
        if (!target) return prev;

        const nextPinned = !target.pinned;
        if (settings.soundEnabled) {
          if (nextPinned) sound.playPin();
          else sound.playPop();
        }

        showMacNotification(
          nextPinned ? 'Pinned to Top' : 'Unpinned',
          target.label || (target.text.length > 30 ? target.text.slice(0, 30) + '...' : target.text),
          nextPinned ? '📌' : '↩️'
        );

        return prev.map((c) =>
          c.id === clipId
            ? {
                ...c,
                pinned: nextPinned,
                pinnedOrder: nextPinned ? Date.now() : undefined,
              }
            : c
        );
      });
    },
    [settings.soundEnabled]
  );

  // Delete clip action
  const handleDeleteClip = useCallback(
    (clipId: string) => {
      if (settings.soundEnabled) {
        sound.playDelete();
      }
      setClips((prev) => prev.filter((c) => c.id !== clipId));
    },
    [settings.soundEnabled]
  );

  // Toggle vault status for clip
  const handleToggleVault = useCallback(
    (clipId: string) => {
      setClips((prev) =>
        prev.map((c) => {
          if (c.id === clipId) {
            const nextVault = !c.isVault;
            if (settings.soundEnabled) sound.playPin();
            showMacNotification(
              nextVault ? 'Moved to Sensitive Vault' : 'Removed from Vault',
              c.label || c.text.slice(0, 30),
              nextVault ? '🔒' : '🔓'
            );
            return {
              ...c,
              isVault: nextVault,
              isMasked: nextVault ? true : c.isMasked,
              type: nextVault ? 'secret' : c.type,
            };
          }
          return c;
        })
      );
    },
    [settings.soundEnabled, showMacNotification]
  );

  // Update custom label
  const handleUpdateLabel = useCallback((clipId: string, label: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, label } : c))
    );
  }, []);

  // Clear unpinned history
  const handleClearHistory = useCallback(() => {
    if (settings.soundEnabled) {
      sound.playDelete();
    }
    setClips((prev) => prev.filter((c) => c.pinned || c.isVault));
    showMacNotification('History Cleared', 'Pinned items & Sensitive Vault were kept safe', '🧹');
  }, [settings.soundEnabled]);

  // Sync real system clipboard
  const handleSyncClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) return;

      const trimmed = text.trim();
      setClips((prev) => {
        // Avoid duplicate top item
        if (prev.length > 0 && prev[0].text === trimmed) {
          return prev;
        }
        // Remove existing duplicate if any, or create new
        const existing = prev.find((c) => c.text === trimmed);
        if (existing) {
          if (existing.pinned) return prev;
          return [
            { ...existing, createdAt: Date.now() },
            ...prev.filter((c) => c.id !== existing.id),
          ];
        }

        const newClip = createNewClip(trimmed, 'System Clipboard');
        return [newClip, ...prev.slice(0, settings.maxHistory - 1)];
      });

      if (settings.soundEnabled) {
        sound.playPop();
      }
      showMacNotification('Clipboard Synced', 'Captured latest copied text', '🔄');
    } catch {
      // User didn't grant clipboard permission; modal / UI handles fallback
    }
  }, [settings.maxHistory, settings.soundEnabled]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Toggle Popover: Cmd+Shift+V or Ctrl+Shift+V
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setIsPopoverOpen((prev) => !prev);
        if (settings.soundEnabled) sound.playPop();
        return;
      }

      // Close popover / modal on Escape
      if (e.key === 'Escape') {
        if (isDMGModalOpen) {
          setIsDMGModalOpen(false);
          return;
        }
        if (isPreferencesOpen) {
          setIsPreferencesOpen(false);
          return;
        }
        if (isQuickAddOpen) {
          setIsQuickAddOpen(false);
          return;
        }
        if (isPopoverOpen) {
          setIsPopoverOpen(false);
          return;
        }
      }

      if (isInput) return;

      // Numeric shortcuts 1-9: Quick copy
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        // Pinned clips have priority on shortcuts if any
        const pinnedList = clips.filter((c) => c.pinned);
        const unpinnedList = clips.filter((c) => !c.pinned);
        const targetList = pinnedList.length > 0 ? pinnedList : unpinnedList;

        if (index < targetList.length) {
          e.preventDefault();
          handleCopyClip(targetList[index]);
        }
        return;
      }

      // Cmd+N: Quick Add
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickAddOpen(true);
        return;
      }

      // Cmd+D: DMG Download
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDMGModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    clips,
    isDMGModalOpen,
    isPreferencesOpen,
    isQuickAddOpen,
    isPopoverOpen,
    handleCopyClip,
    settings.soundEnabled,
  ]);

  // Auto clipboard sync on window focus if enabled
  useEffect(() => {
    if (!settings.autoSyncClipboard) return;

    const handleFocus = () => {
      handleSyncClipboard();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [settings.autoSyncClipboard, handleSyncClipboard]);

  // Wallpaper backgrounds
  const getWallpaperClass = () => {
    switch (settings.wallpaper) {
      case 'sequoia':
        return 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950';
      case 'graphite':
        return 'bg-gradient-to-b from-zinc-900 via-neutral-950 to-black';
      case 'abstract':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900 via-purple-950 to-slate-950';
      case 'sonoma':
      default:
        return 'bg-gradient-to-tr from-amber-700 via-rose-900 to-indigo-950';
    }
  };

  const pinnedClipsCount = clips.filter((c) => c.pinned).length;

  return (
    <div
      className={`relative w-screen h-screen flex flex-col overflow-hidden text-white ${getWallpaperClass()} transition-colors duration-500`}
    >
      {/* Decorative desktop ambient light aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />

      {/* TOP MAC MENU BAR */}
      <MacMenuBar
        isPopoverOpen={isPopoverOpen}
        onTogglePopover={() => {
          setIsPopoverOpen(!isPopoverOpen);
          if (settings.soundEnabled) sound.playPop();
        }}
        pinnedCount={pinnedClipsCount}
        totalClipsCount={clips.length}
        settings={settings}
        onUpdateSettings={(newSet) =>
          setSettings((prev) => ({ ...prev, ...newSet }))
        }
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenDMGModal={() => setIsDMGModalOpen(true)}
      />

      {/* MACOS NATIVE NOTIFICATION BANNER (Top Right) */}
      {toast && (
        <div className="absolute top-10 right-4 z-50 animate-slide-in flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl max-w-sm">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-sm shrink-0">
            {toast.icon || '📎'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-wide">
                {toast.title}
              </span>
              <span className="text-[10px] text-zinc-400">now</span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono truncate mt-0.5">
              {toast.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* MAIN DESKTOP WORKSPACE */}
      <main className="relative flex-1 flex flex-col p-4 overflow-hidden">
        {/* Floating Quick Action Badge & Direct Download Bar */}
        <div className="absolute top-4 left-6 hidden md:flex items-center gap-3 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-xs shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">KopyKlip macOS</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-300 font-mono text-[11px]">
              {pinnedClipsCount} Pinned • {clips.length} Clips
            </span>
          </div>

          {/* Direct Download .DMG Button */}
          <a
            href="/KopyKlip-1.0.0-macOS-Universal.dmg"
            download="KopyKlip-1.0.0-macOS-Universal.dmg"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold backdrop-blur-xl border border-blue-400/40 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.03]"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Download .dmg (1.2 MB)</span>
          </a>

          {/* Direct Download .ZIP Button */}
          <a
            href="/KopyKlip-1.0.0-macOS.zip"
            download="KopyKlip-1.0.0-macOS.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-white text-xs font-semibold backdrop-blur-xl border border-white/15 shadow-lg transition-all hover:scale-[1.03]"
          >
            <Folder className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download .zip</span>
          </a>
        </div>

        {/* Shortcuts Cheat Sheet Banner */}
        <div className="absolute bottom-24 right-6 hidden lg:flex flex-col gap-1.5 p-3 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 text-[11px] text-zinc-300 shadow-xl max-w-xs">
          <div className="flex items-center justify-between text-white font-semibold text-xs border-b border-white/10 pb-1 mb-1">
            <div className="flex items-center gap-1">
              <Command className="w-3.5 h-3.5 text-blue-400" />
              <span>Keyboard Shortcuts</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Mac</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Toggle KopyKlip</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
              ⌘ + ⇧ + V
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Quick Copy Clip</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
              Keys 1 - 9
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Add New Clip</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
              ⌘ + N
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Download .dmg</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
              ⌘ + D
            </kbd>
          </div>
        </div>

        {/* POPOVER WINDOW CONTAINER */}
        <div className="flex-1 flex items-start sm:items-center justify-center z-30 p-1 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-[420px] my-auto">
            <KopyKlipPopover
              clips={clips}
              settings={settings}
              onCopyClip={handleCopyClip}
              onTogglePin={handleTogglePin}
              onToggleVault={handleToggleVault}
              onDeleteClip={handleDeleteClip}
              onUpdateLabel={handleUpdateLabel}
              onClearHistory={handleClearHistory}
              onOpenQuickAdd={(vaultDefault?: boolean) => {
                setQuickAddVaultDefault(!!vaultDefault);
                setIsQuickAddOpen(true);
              }}
              onOpenPreferences={() => setIsPreferencesOpen(true)}
              onOpenDMGModal={() => setIsDMGModalOpen(true)}
              onSyncClipboard={handleSyncClipboard}
              isFloatingWindow={true}
            />
          </div>
        </div>
      </main>

      {/* MACOS DOCK AT BOTTOM */}
      <footer className="relative z-30 pb-3 flex justify-center select-none pointer-events-auto">
        <div className="flex items-end gap-2 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl">
          {/* Finder */}
          <div
            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 p-2 flex items-center justify-center shadow-md transform hover:scale-125 transition-transform cursor-pointer"
            title="Finder"
          >
            <Folder className="w-6 h-6 text-white" />
          </div>

          {/* Safari */}
          <div
            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 flex items-center justify-center shadow-md transform hover:scale-125 transition-transform cursor-pointer"
            title="Safari"
          >
            <Globe className="w-6 h-6 text-white" />
          </div>

          {/* VS Code */}
          <div
            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-800 p-2 flex items-center justify-center shadow-md transform hover:scale-125 transition-transform cursor-pointer"
            title="Visual Studio Code"
          >
            <Code2 className="w-6 h-6 text-white" />
          </div>

          {/* Terminal */}
          <div
            className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/20 p-2 flex items-center justify-center shadow-md transform hover:scale-125 transition-transform cursor-pointer"
            title="Terminal"
          >
            <Terminal className="w-6 h-6 text-emerald-400" />
          </div>

          {/* Figma */}
          <div
            className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-2 flex items-center justify-center shadow-md transform hover:scale-125 transition-transform cursor-pointer"
            title="Figma"
          >
            <Palette className="w-6 h-6 text-white" />
          </div>

          {/* Divider in Dock */}
          <div className="w-px h-8 bg-white/20 mx-1 self-center" />

          {/* KOPYKLIP (Running App in Dock) */}
          <div
            onClick={() => {
              setIsPopoverOpen(!isPopoverOpen);
              if (settings.soundEnabled) sound.playPop();
            }}
            className="group relative flex flex-col items-center cursor-pointer transform hover:scale-125 transition-transform"
            title="KopyKlip - Click to Open Popover"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-xl shadow-blue-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-900 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">📎</span>
              </div>
            </div>
            {/* Active Running indicator dot */}
            <span className="w-1 h-1 bg-white rounded-full mt-1" />
          </div>

          {/* DMG Installer Disk Image Icon in Dock */}
          <div
            onClick={() => setIsDMGModalOpen(true)}
            className="group relative flex flex-col items-center cursor-pointer transform hover:scale-125 transition-transform"
            title="Download KopyKlip.dmg"
          >
            <div className="w-11 h-11 rounded-xl bg-zinc-800/90 border border-white/20 flex items-center justify-center text-blue-400 shadow-md">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <DMGDownloadModal
        isOpen={isDMGModalOpen}
        onClose={() => setIsDMGModalOpen(false)}
        soundEnabled={settings.soundEnabled}
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        settings={settings}
        onUpdateSettings={(newSet) =>
          setSettings((prev) => ({ ...prev, ...newSet }))
        }
        onClearHistory={handleClearHistory}
        clips={clips}
        onImportClips={(imported) => {
          setClips(imported);
          showMacNotification('Backup Imported', `Loaded ${imported.length} clips`, '📥');
        }}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultVault={quickAddVaultDefault}
        onAddClip={(newClip) => {
          setClips((prev) => [newClip, ...prev]);
          showMacNotification(
            newClip.isVault
              ? 'Stored in Sensitive Vault'
              : newClip.pinned
              ? 'Pinned New Clip'
              : 'Clip Added',
            newClip.label || newClip.text.slice(0, 30),
            newClip.isVault ? '🔒' : newClip.pinned ? '📌' : '✨'
          );
        }}
        soundEnabled={settings.soundEnabled}
      />
    </div>
  );
}
