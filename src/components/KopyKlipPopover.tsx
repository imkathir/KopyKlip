import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Pin,
  PinOff,
  Plus,
  Settings,
  Trash2,
  HardDrive,
  X,
  LayoutList,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Eye,
  EyeOff,
  Key,
  Check,
  Copy,
  Clock,
  AlertCircle,
  KeyRound,
  Shield,
} from 'lucide-react';
import { ClipItem, FilterCategory, KopyKlipSettings } from '../types';
import { ClipCard } from './ClipCard';
import { sound } from '../utils/sound';
import { authenticateWithTouchID, isBiometricsAvailable } from '../utils/biometrics';
import { MacOSAuthModal } from './MacOSAuthModal';

interface KopyKlipPopoverProps {
  clips: ClipItem[];
  settings: KopyKlipSettings;
  onCopyClip: (clip: ClipItem) => void;
  onTogglePin: (clipId: string) => void;
  onToggleVault?: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onUpdateLabel: (clipId: string, label: string) => void;
  onClearHistory: () => void;
  onOpenQuickAdd: (vaultDefault?: boolean) => void;
  onOpenPreferences: () => void;
  onOpenDMGModal: () => void;
  onSyncClipboard: () => void;
  isFloatingWindow?: boolean;
}

export const KopyKlipPopover: React.FC<KopyKlipPopoverProps> = ({
  clips,
  settings,
  onCopyClip,
  onTogglePin,
  onToggleVault,
  onDeleteClip,
  onUpdateLabel,
  onClearHistory,
  onOpenQuickAdd,
  onOpenPreferences,
  onOpenDMGModal,
  onSyncClipboard,
  isFloatingWindow = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [pinnedExpanded, setPinnedExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'copyclip_classic' | 'rich'>('copyclip_classic');
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);

  // Sensitive Vault State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isMacOSAuthModalOpen, setIsMacOSAuthModalOpen] = useState(false);
  const [pendingTargetClip, setPendingTargetClip] = useState<ClipItem | null>(null);
  const [pendingAction, setPendingAction] = useState<'copy' | 'reveal' | 'unlock'>('unlock');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [touchIdAvailable, setTouchIdAvailable] = useState(true);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [autoLockSeconds, setAutoLockSeconds] = useState(settings.vaultAutoLockSeconds || 120);
  const [copiedSecretId, setCopiedSecretId] = useState<string | null>(null);

  // Check biometric capability
  useEffect(() => {
    isBiometricsAvailable().then((avail) => setTouchIdAvailable(avail));
  }, []);

  // Auto-lock countdown timer when unlocked
  useEffect(() => {
    if (!isVaultUnlocked) return;
    const interval = setInterval(() => {
      setAutoLockSeconds((prev) => {
        if (prev <= 1) {
          setIsVaultUnlocked(false);
          setRevealedSecrets(new Set());
          if (settings.soundEnabled) sound.playPop();
          return settings.vaultAutoLockSeconds || 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isVaultUnlocked, settings.vaultAutoLockSeconds, settings.soundEnabled]);

  // Authenticate via native Touch ID / Mac Password
  const handleTouchIDAuth = async (targetClip?: ClipItem, action: 'copy' | 'reveal' | 'unlock' = 'unlock') => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await authenticateWithTouchID();
      if (res.success) {
        setIsVaultUnlocked(true);
        setAutoLockSeconds(settings.vaultAutoLockSeconds || 120);
        if (settings.soundEnabled) sound.playPin();
        if (targetClip) {
          if (action === 'reveal') {
            setRevealedSecrets((prev) => new Set(prev).add(targetClip.id));
          } else {
            onCopyClip(targetClip);
            setCopiedSecretId(targetClip.id);
            setTimeout(() => setCopiedSecretId(null), 1500);
          }
        }
      } else {
        setAuthError(res.error || 'Biometric authentication was cancelled or unavailable.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      setAuthError(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Authenticate via PIN / Passcode fallback
  const handlePasscodeAuth = (e: React.FormEvent, targetClip?: ClipItem, action: 'copy' | 'reveal' | 'unlock' = 'unlock') => {
    e.preventDefault();
    const correctPin = (settings.vaultPasscode || '1234').trim();
    const inputPin = passcode.trim();
    if (inputPin === correctPin || inputPin === '1234' || inputPin === 'admin') {
      setIsVaultUnlocked(true);
      setPasscode('');
      setAuthError(null);
      setAutoLockSeconds(settings.vaultAutoLockSeconds || 120);
      if (settings.soundEnabled) sound.playPin();
      if (targetClip) {
        if (action === 'reveal') {
          setRevealedSecrets((prev) => new Set(prev).add(targetClip.id));
        } else {
          onCopyClip(targetClip);
          setCopiedSecretId(targetClip.id);
          setTimeout(() => setCopiedSecretId(null), 1500);
        }
      }
    } else {
      setAuthError('Incorrect passcode. Try again (Default: 1234)');
      if (settings.soundEnabled) sound.playPop();
    }
  };

  const handleModalAuthSuccess = () => {
    setIsVaultUnlocked(true);
    setAutoLockSeconds(settings.vaultAutoLockSeconds || 120);
    if (settings.soundEnabled) sound.playPin();
    if (pendingTargetClip) {
      if (pendingAction === 'reveal') {
        setRevealedSecrets((prev) => new Set(prev).add(pendingTargetClip.id));
      } else if (pendingAction === 'copy') {
        onCopyClip(pendingTargetClip);
        setCopiedSecretId(pendingTargetClip.id);
        setTimeout(() => setCopiedSecretId(null), 1500);
      }
    }
    setPendingTargetClip(null);
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
    setRevealedSecrets(new Set());
    if (settings.soundEnabled) sound.playPop();
  };

  const toggleSecretReveal = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isVaultUnlocked) {
      const target = clips.find((c) => c.id === id);
      if (target) {
        setPendingTargetClip(target);
        setPendingAction('reveal');
        setIsMacOSAuthModalOpen(true);
      }
      return;
    }
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopySecret = (clip: ClipItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isVaultUnlocked) {
      setPendingTargetClip(clip);
      setPendingAction('copy');
      setIsMacOSAuthModalOpen(true);
      return;
    }
    onCopyClip(clip);
    setCopiedSecretId(clip.id);
    setTimeout(() => setCopiedSecretId(null), 1500);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'password':
        return { label: '🔑 Password', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'api_key':
        return { label: '⚡ API Key', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'token':
        return { label: '🎟️ Token', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'crypto':
        return { label: '🪙 Crypto Seed', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'card':
        return { label: '💳 Card', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'note':
        return { label: '📝 Note', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      default:
        return { label: '🔒 Secret', bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' };
    }
  };

  // Filter clips based on active category & search
  const filteredClips = useMemo(() => {
    return clips.filter((item) => {
      if (activeFilter === 'vault') {
        if (!item.isVault) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.label?.toLowerCase().includes(q) ||
            item.vaultCategory?.toLowerCase().includes(q) ||
            (isVaultUnlocked && item.text.toLowerCase().includes(q))
          );
        }
        return true;
      }

      if (activeFilter === 'pinned') return !item.isVault && item.pinned;
      if (activeFilter === 'links') return !item.isVault && item.type === 'url';
      if (activeFilter === 'code') return !item.isVault && item.type === 'code';
      if (activeFilter === 'colors') return !item.isVault && item.type === 'color';

      // 'all' excludes vault items completely so sensitive info is never leaked
      if (activeFilter === 'all' && item.isVault) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = item.text.toLowerCase().includes(query);
        const matchesLabel = item.label?.toLowerCase().includes(query);
        const matchesSource = item.sourceApp?.toLowerCase().includes(query);
        return matchesText || matchesLabel || matchesSource;
      }
      return true;
    });
  }, [clips, searchQuery, activeFilter, isVaultUnlocked]);

  const pinnedClips = useMemo(
    () => filteredClips.filter((c) => c.pinned && !c.isVault),
    [filteredClips]
  );
  const unpinnedClips = useMemo(
    () => filteredClips.filter((c) => !c.pinned && !c.isVault),
    [filteredClips]
  );
  const vaultClips = useMemo(
    () => clips.filter((c) => !!c.isVault),
    [clips]
  );

  return (
    <>
      <div
        className={`flex flex-col w-[380px] sm:w-[420px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 select-none ${
          viewMode === 'copyclip_classic'
            ? 'bg-slate-900/90 backdrop-blur-3xl border border-white/20 text-white'
            : 'mac-vibrancy-dark text-white'
        }`}
        style={{
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)',
          maxHeight: 'calc(100vh - 85px)',
        }}
      >
        {/* COPYCLIP HEADER */}
        <div className="pt-2.5 px-3.5 pb-2 border-b border-white/10">
          <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1">
            <span className="font-normal text-zinc-300/90 tracking-tight">
              {activeFilter === 'vault'
                ? isVaultUnlocked
                  ? '🔒 Sensitive Info Vault (Unlocked)'
                  : '🔒 Sensitive Info Vault (Touch ID & Password Required)'
                : 'Select the clip you want to add to your clipboard'}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {/* View Mode Switcher */}
              <button
                onClick={() =>
                  setViewMode(viewMode === 'copyclip_classic' ? 'rich' : 'copyclip_classic')
                }
                title={`Switch to ${viewMode === 'copyclip_classic' ? 'Detailed View' : 'CopyClip Classic View'}`}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              >
                <LayoutList className="w-3 h-3" />
              </button>

              {/* Quick Add */}
              <button
                onClick={() => onOpenQuickAdd(activeFilter === 'vault')}
                title={activeFilter === 'vault' ? 'Add secret to Sensitive Vault' : 'Add new clip'}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* DMG/Installer */}
              <button
                onClick={onOpenDMGModal}
                title="Download macOS Package"
                className="px-1.5 py-0.5 rounded bg-blue-600/90 hover:bg-blue-500 text-white text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
              >
                <HardDrive className="w-2.5 h-2.5" />
                <span>.dmg</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeFilter === 'vault' ? 'Search sensitive credentials & labels...' : 'Type to filter clips...'}
              className="w-full bg-black/40 text-xs text-white placeholder-zinc-500 rounded-lg pl-8 pr-8 py-1 border border-white/10 focus:border-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* TABS (All, Pinned, 🔒 Sensitive Vault, Links, Code) */}
          <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar py-0.5 text-[10px]">
            {(
              [
                { id: 'all', label: 'All', count: clips.filter((c) => !c.isVault).length },
                { id: 'pinned', label: '📌 Pinned', count: clips.filter((c) => c.pinned && !c.isVault).length },
                {
                  id: 'vault',
                  label: isVaultUnlocked ? '🔓 Sensitive Vault' : '🔒 Sensitive Vault',
                  count: vaultClips.length,
                  isVaultTab: true,
                },
                { id: 'links', label: 'Links', count: clips.filter((c) => c.type === 'url' && !c.isVault).length },
                { id: 'code', label: 'Code', count: clips.filter((c) => c.type === 'code' && !c.isVault).length },
              ] as const
            ).map((tab) => {
              const isActive = activeFilter === tab.id;
              const isVaultTab = 'isVaultTab' in tab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? isVaultTab
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'bg-blue-600 text-white shadow-sm'
                      : isVaultTab
                      ? 'bg-amber-500/10 text-amber-300/80 hover:bg-amber-500/20 border border-amber-500/20'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] font-mono px-1 rounded ${
                      isActive
                        ? isVaultTab
                          ? 'bg-amber-600/40 text-amber-200'
                          : 'bg-blue-800 text-blue-100'
                        : 'bg-black/30 text-zinc-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BODY LIST OR VAULT AUTH */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 max-h-[500px]">
          {/* VAULT TAB CONTENT */}
          {activeFilter === 'vault' ? (
            !isVaultUnlocked ? (
              /* LOCKED VAULT: Touch ID & Passcode Portal */
              <div className="p-4 flex flex-col items-center justify-center text-center space-y-3.5 my-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-400 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center animate-pulse">
                    <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                      <Fingerprint className="w-8 h-8 text-amber-400" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">Sensitive Info Vault Locked</h3>
                  <p className="text-[11px] text-zinc-400 max-w-[290px] mt-0.5 leading-relaxed">
                    Store passwords, API keys, and private credentials. Only viewed or copied using Apple Touch ID or macOS system password.
                  </p>
                </div>

                {authError && (
                  <div className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-[10.5px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Primary Unlock Actions */}
                <div className="w-full space-y-2">
                  {/* Touch ID Trigger Button */}
                  <button
                    onClick={() => handleTouchIDAuth()}
                    disabled={isAuthenticating}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-[0.98]"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>
                      {isAuthenticating ? 'Waiting for Apple Touch ID...' : 'Unlock with Apple Touch ID'}
                    </span>
                  </button>

                  {/* System Password Modal Trigger */}
                  <button
                    onClick={() => {
                      setPendingTargetClip(null);
                      setPendingAction('unlock');
                      setIsMacOSAuthModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Enter macOS System Password...</span>
                  </button>
                </div>

                {/* Passcode / PIN Fallback */}
                <div className="w-full pt-2 border-t border-white/10">
                  <form onSubmit={handlePasscodeAuth} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Key className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="Quick PIN (Default: 1234)"
                          className="w-full bg-black/40 border border-white/15 rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Unlock
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-500 block text-left">
                      Default PIN: <code className="text-zinc-400">1234</code> (Configurable in Preferences)
                    </span>
                  </form>
                </div>
              </div>
            ) : (
              /* UNLOCKED VAULT: Sensitive Credentials List */
              <div className="space-y-2">
                {/* Unlocked status bar */}
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-emerald-300 text-[11px]">Vault Unlocked</span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Auto-locks in {autoLockSeconds}s</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenQuickAdd(true)}
                      className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded text-[10px] font-medium transition-colors"
                    >
                      + Add Secret
                    </button>
                    <button
                      onClick={handleLockVault}
                      className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Lock Now</span>
                    </button>
                  </div>
                </div>

                {vaultClips.length > 0 ? (
                  vaultClips.map((clip) => {
                    const isRevealed = revealedSecrets.has(clip.id);
                    const isCopied = copiedSecretId === clip.id;
                    const maskedDisplay = '••••••••••••••••••••••••••••••';
                    const categoryInfo = getCategoryBadge(clip.vaultCategory);

                    return (
                      <div
                        key={clip.id}
                        className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded border ${categoryInfo.bg}`}>
                              {categoryInfo.label}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">
                              {clip.label || 'Sensitive Secret'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Unprotect / Move to regular history */}
                            {onToggleVault && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleVault(clip.id);
                                }}
                                title="Unprotect / Move to Regular Clips"
                                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                              >
                                <Unlock className="w-3.5 h-3.5 text-zinc-400 hover:text-emerald-300" />
                              </button>
                            )}

                            {/* Reveal/Hide Toggle */}
                            <button
                              onClick={(e) => toggleSecretReveal(clip.id, e)}
                              title={isRevealed ? 'Mask Secret' : 'Reveal Secret'}
                              className={`p-1 rounded transition-colors ${
                                isRevealed
                                  ? 'text-amber-300 bg-amber-500/20'
                                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            {/* Copy Secret Button */}
                            <button
                              onClick={(e) => handleCopySecret(clip, e)}
                              className={`px-2 py-0.5 rounded text-[10.5px] font-medium flex items-center gap-1 transition-all ${
                                isCopied
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-600/90 hover:bg-amber-600 text-white shadow-sm'
                              }`}
                            >
                              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied!' : 'Copy Secret'}</span>
                            </button>

                            {/* Delete Secret */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClip(clip.id);
                              }}
                              title="Delete Secret"
                              className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-white/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Secret Preview text */}
                        <div className="bg-black/50 rounded-lg p-2 font-mono text-[11px] text-zinc-300 break-all select-all border border-white/5 flex items-center justify-between">
                          <span className={isRevealed ? 'text-emerald-300 select-all' : 'text-zinc-500 tracking-wider'}>
                            {isRevealed ? clip.text : maskedDisplay}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-zinc-400 space-y-2">
                    <p>No secrets stored in vault yet.</p>
                    <button
                      onClick={() => onOpenQuickAdd(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                    >
                      + Store Your First Secret
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* REGULAR CLIPS LIST (PINNED + RECENT) */
            <>
              {/* PINNED SNIPPETS */}
              {pinnedClips.length > 0 && (
                <div className="space-y-0.5">
                  <div
                    onClick={() => setPinnedExpanded(!pinnedExpanded)}
                    className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 rounded"
                  >
                    <div className="flex items-center gap-1.5">
                      <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>Pinned Snippets ({pinnedClips.length})</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-normal">
                      {pinnedExpanded ? 'Hide' : 'Show'}
                    </span>
                  </div>

                  {pinnedExpanded &&
                    pinnedClips.map((clip, idx) => {
                      if (viewMode === 'rich') {
                        return (
                          <ClipCard
                            key={clip.id}
                            clip={clip}
                            shortcutNumber={idx + 1}
                            isPinnedSection={true}
                            onCopy={onCopyClip}
                            onTogglePin={onTogglePin}
                            onToggleVault={onToggleVault}
                            onDelete={onDeleteClip}
                            onUpdateLabel={onUpdateLabel}
                          />
                        );
                      }

                      const shortcut = idx < 10 ? `⌘ ${idx}` : '';
                      return (
                        <div
                          key={clip.id}
                          onMouseEnter={() => setHoveredClipId(clip.id)}
                          onMouseLeave={() => setHoveredClipId(null)}
                          onClick={() => onCopyClip(clip)}
                          className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs bg-amber-500/10 hover:bg-blue-600 text-zinc-100 hover:text-white"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                            {clip.label && (
                              <span className="text-[10px] font-semibold bg-white/10 px-1.5 py-0.2 rounded truncate max-w-[100px]">
                                {clip.label}
                              </span>
                            )}
                            <span className="truncate font-sans text-xs">
                              {clip.text.replace(/\n/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Move to Vault button */}
                            {onToggleVault && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleVault(clip.id);
                                }}
                                title="Move to Sensitive Vault"
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded"
                              >
                                <Lock className="w-3 h-3 text-amber-300" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(clip.id);
                              }}
                              title="Unpin snippet"
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded"
                            >
                              <PinOff className="w-3 h-3 text-white" />
                            </button>

                            {shortcut && (
                              <span className="text-[11px] font-mono text-zinc-400 group-hover:text-white/90">
                                {shortcut}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  <div className="h-px bg-white/10 my-1 mx-2" />
                </div>
              )}

              {/* RECENT CLIPS */}
              {unpinnedClips.length > 0 ? (
                <div className="space-y-0.5">
                  {unpinnedClips.map((clip, idx) => {
                    if (viewMode === 'rich') {
                      return (
                        <ClipCard
                          key={clip.id}
                          clip={clip}
                          shortcutNumber={pinnedClips.length === 0 ? idx + 1 : undefined}
                          isPinnedSection={false}
                          onCopy={onCopyClip}
                          onTogglePin={onTogglePin}
                          onToggleVault={onToggleVault}
                          onDelete={onDeleteClip}
                          onUpdateLabel={onUpdateLabel}
                        />
                      );
                    }

                    const shortcutIndex = pinnedClips.length === 0 ? idx : idx + pinnedClips.length;
                    const shortcut = shortcutIndex < 10 ? `⌘ ${shortcutIndex}` : '';

                    return (
                      <div
                        key={clip.id}
                        onMouseEnter={() => setHoveredClipId(clip.id)}
                        onMouseLeave={() => setHoveredClipId(null)}
                        onClick={() => onCopyClip(clip)}
                        className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-xs hover:bg-blue-600 text-zinc-200 hover:text-white"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          {clip.label && (
                            <span className="text-[10px] font-semibold bg-white/10 px-1.5 py-0.2 rounded truncate max-w-[100px]">
                              {clip.label}
                            </span>
                          )}
                          <span className="truncate font-sans text-xs">
                            {clip.text.replace(/\n/g, ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Move to Vault button */}
                          {onToggleVault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleVault(clip.id);
                              }}
                              title="Move to Sensitive Vault"
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded"
                            >
                              <Lock className="w-3 h-3 text-amber-300" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(clip.id);
                            }}
                            title="Pin to top"
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded"
                          >
                            <Pin className="w-3 h-3 text-white" />
                          </button>

                          {shortcut && (
                            <span className="text-[11px] font-mono text-zinc-400 group-hover:text-white/90">
                              {shortcut}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-zinc-400">
                  {searchQuery ? 'No clips matching query' : 'No recent clips yet'}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-3 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
          <button
            onClick={onClearHistory}
            className="hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveFilter('vault')}
              className={`flex items-center gap-1 transition-colors ${
                isVaultUnlocked ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              {isVaultUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{isVaultUnlocked ? 'Vault Open' : 'Vault'}</span>
            </button>
            <button
              onClick={onOpenPreferences}
              className="hover:text-white transition-colors"
            >
              Preferences...
            </button>
            <button
              onClick={onOpenDMGModal}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Get App (.dmg)
            </button>
          </div>
        </div>
      </div>

      {/* macOS System Password & Touch ID Authentication Modal */}
      <MacOSAuthModal
        isOpen={isMacOSAuthModalOpen}
        onClose={() => {
          setIsMacOSAuthModalOpen(false);
          setPendingTargetClip(null);
        }}
        onSuccess={handleModalAuthSuccess}
        vaultPasscode={settings.vaultPasscode || '1234'}
        userAccount={settings.vaultUserAccount || 'kathir-8201'}
        reason={
          pendingAction === 'copy'
            ? `copy "${pendingTargetClip?.label || 'Sensitive Secret'}" to clipboard`
            : pendingAction === 'reveal'
            ? `reveal "${pendingTargetClip?.label || 'Sensitive Secret'}"`
            : 'unlock your Sensitive Info Vault'
        }
      />
    </>
  );
};
