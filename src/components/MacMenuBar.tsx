import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Search,
  Sliders,
  Battery,
  HardDrive,
  Monitor,
  AppWindow,
  Sparkles,
  Command,
} from 'lucide-react';
import { KopyKlipSettings } from '../types';

interface MacMenuBarProps {
  isPopoverOpen: boolean;
  onTogglePopover: () => void;
  pinnedCount: number;
  totalClipsCount: number;
  settings: KopyKlipSettings;
  onUpdateSettings: (newSettings: Partial<KopyKlipSettings>) => void;
  onOpenPreferences: () => void;
  onOpenDMGModal: () => void;
}

export const MacMenuBar: React.FC<MacMenuBarProps> = ({
  isPopoverOpen,
  onTogglePopover,
  pinnedCount,
  totalClipsCount,
  settings,
  onUpdateSettings,
  onOpenPreferences,
  onOpenDMGModal,
}) => {
  const [timeString, setTimeString] = useState('');
  const [showAppleMenu, setShowAppleMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) + '  ' + now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setTimeString(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative z-40 w-full h-7 bg-black/40 backdrop-blur-2xl border-b border-white/10 text-white text-[12.5px] font-medium flex items-center justify-between px-2.5 select-none transition-all shadow-sm">
      {/* Left Menu: Apple & App Title */}
      <div className="flex items-center gap-3.5">
        {/* Apple Logo Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAppleMenu(!showAppleMenu)}
            className="p-1 hover:bg-white/15 rounded transition-colors text-white"
            title="Apple Menu"
          >
            {/* Apple Logo SVG */}
            <svg
              className="w-3.5 h-3.5 fill-current"
              viewBox="0 0 170 170"
            >
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.3-9.49-11.19-20.7-14.68-33.62-3.49-12.92-5.24-24.97-5.24-36.14 0-14.82 3.65-27.14 10.95-36.97 7.3-9.83 16.5-14.88 27.6-15.15 4.8 0 10.19 1.3 16.16 3.9 5.97 2.6 9.88 4.02 11.72 4.26 2.18-.32 6.28-1.78 12.3-4.38 6.03-2.6 11.25-3.8 15.68-3.6 12.32.65 22.37 5.16 30.15 13.53-10.78 6.53-16.05 15.54-15.82 27.03.24 9.17 3.82 16.89 10.74 23.16 6.92 6.27 14.87 9.8 23.85 10.6-2.29 7.07-5.02 13.93-8.19 20.59zM119.22 31.84c0-7.39 2.65-14.28 7.95-20.67 5.3-6.39 11.83-10.45 19.59-12.17.65 1.74.98 3.59.98 5.56 0 7.39-2.73 14.44-8.19 21.15-5.46 6.71-12.16 10.76-20.1 12.15-.11-1.96-.23-3.97-.23-6.02z" />
            </svg>
          </button>

          {showAppleMenu && (
            <div
              onClick={() => setShowAppleMenu(false)}
              className="absolute left-0 top-7 w-48 bg-zinc-800/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl py-1 text-xs text-zinc-200 z-50 animate-fade-in"
            >
              <div className="px-3 py-1.5 font-semibold text-white">About KopyKlip</div>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={onOpenPreferences}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white"
              >
                System Preferences...
              </button>
              <button
                onClick={onOpenDMGModal}
                className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white"
              >
                Download KopyKlip.dmg...
              </button>
              <div className="h-px bg-white/10 my-1" />
              <div className="px-3 py-1 text-zinc-400">Lock Screen</div>
              <div className="px-3 py-1 text-zinc-400">Restart...</div>
              <div className="px-3 py-1 text-zinc-400">Shut Down...</div>
            </div>
          )}
        </div>

        {/* Current App: KopyKlip */}
        <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
          <span>KopyKlip</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded font-mono">v1.0</span>
        </span>

        {/* Traditional macOS App Menus */}
        <div className="hidden sm:flex items-center gap-3 text-zinc-300">
          <button
            onClick={onTogglePopover}
            className="hover:text-white hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          >
            Clipboard
          </button>
          <button
            onClick={onOpenPreferences}
            className="hover:text-white hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
          >
            Preferences
          </button>
          <button
            onClick={onOpenDMGModal}
            className="hover:text-white hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
          >
            <HardDrive className="w-3 h-3 text-blue-400" />
            <span>DMG Installer</span>
          </button>
        </div>
      </div>

      {/* Right Menu: System Tray + KOPYKLIP STATUS ICON */}
      <div className="flex items-center gap-2">
        {/* Quick DMG Direct Download Button */}
        <button
          onClick={onOpenDMGModal}
          title="Download finished macOS .dmg file"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all shadow-sm"
        >
          <HardDrive className="w-3 h-3" />
          <span className="hidden md:inline">Download .dmg</span>
        </button>

        {/* View Mode Switcher: Menu Bar Popover vs Floating App */}
        <button
          onClick={() =>
            onUpdateSettings({
              displayMode:
                settings.displayMode === 'menubar' ? 'window' : 'menubar',
            })
          }
          title={`Switch to ${settings.displayMode === 'menubar' ? 'Floating Window Mode' : 'Menu Bar Dropdown Mode'}`}
          className="p-1 hover:bg-white/15 rounded text-zinc-300 hover:text-white transition-colors"
        >
          {settings.displayMode === 'menubar' ? (
            <AppWindow className="w-3.5 h-3.5" />
          ) : (
            <Monitor className="w-3.5 h-3.5" />
          )}
        </button>

        {/* KOPYKLIP STATUS ICON (The Core Mac Menu-Bar Item!) */}
        <button
          onClick={onTogglePopover}
          title={`KopyKlip (${totalClipsCount} clips, ${pinnedCount} pinned) • Press Cmd+Shift+V`}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all ${
            isPopoverOpen
              ? 'bg-blue-600 text-white shadow-sm'
              : 'hover:bg-white/15 text-white'
          }`}
        >
          <div className="relative flex items-center justify-center">
            {/* Native Paperclip Menu Bar Icon */}
            <span className="text-sm leading-none">📎</span>
            {pinnedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full border border-black" />
            )}
          </div>
          <span className="text-[11px] font-bold font-mono">
            {pinnedCount > 0 ? `★${pinnedCount}` : totalClipsCount}
          </span>
        </button>

        {/* macOS Control Center & WiFi icons */}
        <div className="hidden lg:flex items-center gap-2 text-zinc-300">
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4 text-emerald-400" />
          <Sliders className="w-3.5 h-3.5" />
          <Search className="w-3.5 h-3.5" />
        </div>

        {/* Live macOS Clock */}
        <span className="text-zinc-200 text-xs font-medium pl-1">
          {timeString || 'Mac Menu Bar'}
        </span>
      </div>
    </header>
  );
};
