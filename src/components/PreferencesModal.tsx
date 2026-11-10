import React from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Shield,
  Sliders,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  HardDrive,
  Monitor,
  Check,
} from 'lucide-react';
import { KopyKlipSettings, ClipItem } from '../types';
import { sound } from '../utils/sound';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: KopyKlipSettings;
  onUpdateSettings: (newSettings: Partial<KopyKlipSettings>) => void;
  onClearHistory: () => void;
  clips: ClipItem[];
  onImportClips: (imported: ClipItem[]) => void;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearHistory,
  clips,
  onImportClips,
}) => {
  if (!isOpen) return null;

  const handleTestSound = () => {
    sound.playCopy();
    setTimeout(() => sound.playPin(), 180);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(clips, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `kopyklip-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    if (settings.soundEnabled) sound.playCopy();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportClips(parsed);
          if (settings.soundEnabled) sound.playPin();
        }
      } catch (err) {
        alert('Invalid JSON backup file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-800/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-rose-500 hover:opacity-80 transition-opacity flex items-center justify-center group"
            >
              <X className="w-2 h-2 text-rose-950 opacity-0 group-hover:opacity-100" />
            </button>
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-xs font-semibold text-zinc-200">
            KopyKlip Settings & Preferences
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* General Section */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Clipboard History Limits
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">Remember Clips</div>
                <div className="text-[11px] text-zinc-400">
                  Maximum number of recent items to store
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={settings.maxHistory}
                  onChange={(e) =>
                    onUpdateSettings({ maxHistory: Number(e.target.value) })
                  }
                  className="w-28 accent-blue-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-blue-400 w-8 text-right">
                  {settings.maxHistory}
                </span>
              </div>
            </div>
          </div>

          {/* Audio Feedback */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Audio & Feedback
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-zinc-500" />
                )}
                <div>
                  <div className="text-xs font-medium text-white">macOS Sound Effects</div>
                  <div className="text-[11px] text-zinc-400">
                    Play crisp Tink & Chime sound on copy and pin
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-medium transition-colors"
                >
                  Test Sound
                </button>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ soundEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-500 cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Privacy & Biometric Vault
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs font-medium text-white">Mask Passwords & API Keys</div>
                  <div className="text-[11px] text-zinc-400">
                    Hide secrets with bullet points unless toggled
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maskPasswords}
                onChange={(e) =>
                  onUpdateSettings({ maskPasswords: e.target.checked })
                }
                className="w-4 h-4 accent-blue-500 cursor-pointer rounded"
              />
            </div>

            {/* Vault Passcode & Auto Lock */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-200">
                    Vault Fallback Passcode (PIN)
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Used if Touch ID or Apple Biometrics is cancelled
                  </div>
                </div>
                <input
                  type="password"
                  value={settings.vaultPasscode || '1234'}
                  onChange={(e) => onUpdateSettings({ vaultPasscode: e.target.value })}
                  placeholder="1234"
                  className="w-24 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white text-center font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <div className="text-xs font-semibold text-amber-200">
                    macOS User Account
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Account name for native authentication prompt
                  </div>
                </div>
                <input
                  type="text"
                  value={settings.vaultUserAccount || 'kathir-8201'}
                  onChange={(e) => onUpdateSettings({ vaultUserAccount: e.target.value })}
                  placeholder="kathir-8201"
                  className="w-28 bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <div className="text-xs font-semibold text-amber-200">
                    Vault Auto-Lock Timer
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Automatically re-locks after inactivity
                  </div>
                </div>
                <select
                  value={settings.vaultAutoLockSeconds || 120}
                  onChange={(e) => onUpdateSettings({ vaultAutoLockSeconds: Number(e.target.value) })}
                  className="bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-xs text-white outline-none"
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workspace Wallpaper Theme */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Desktop Wallpaper Theme
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'sonoma', label: 'Sonoma', color: 'from-amber-600 via-orange-700 to-indigo-900' },
                { id: 'sequoia', label: 'Sequoia', color: 'from-emerald-800 via-teal-900 to-blue-950' },
                { id: 'graphite', label: 'Graphite', color: 'from-zinc-800 via-zinc-900 to-black' },
                { id: 'abstract', label: 'Neon Cyber', color: 'from-fuchsia-800 via-purple-900 to-indigo-950' },
              ].map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => onUpdateSettings({ wallpaper: wp.id as any })}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                    settings.wallpaper === wp.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-full h-8 rounded-lg bg-gradient-to-tr ${wp.color} shadow-inner flex items-center justify-center`}
                  >
                    {settings.wallpaper === wp.id && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-300">
                    {wp.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Backup & Data */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Backup & Management
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                Export JSON Backup
              </button>
              <label className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Clear History */}
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-rose-300">Clear Unpinned History</div>
                <div className="text-[11px] text-rose-200/70">
                  Pinned clips remain safely preserved
                </div>
              </div>
              <button
                type="button"
                onClick={onClearHistory}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950/80 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          <span>KopyKlip macOS Edition • v1.0.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
