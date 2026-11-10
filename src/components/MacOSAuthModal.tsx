import React, { useState, useEffect, useRef } from 'react';
import {
  Fingerprint,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  User,
  ShieldAlert,
  Check,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { authenticateWithTouchID } from '../utils/biometrics';
import { sound } from '../utils/sound';

interface MacOSAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vaultPasscode?: string;
  userAccount?: string;
  reason?: string;
}

export const MacOSAuthModal: React.FC<MacOSAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vaultPasscode = '1234',
  userAccount = 'kathir-8201',
  reason = 'view and copy sensitive credentials',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticatingTouchID, setIsAuthenticatingTouchID] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage(null);
      setShake(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerShake = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    sound.playPop();
    setTimeout(() => setShake(false), 500);
  };

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) {
      triggerShake('Please enter your password.');
      return;
    }

    // Accepts either configured passcode (default 1234), or common admin pass, or matches
    const cleanInput = password.trim();
    const cleanTarget = (vaultPasscode || '1234').trim();

    if (cleanInput === cleanTarget || cleanInput === '1234' || cleanInput === 'admin') {
      sound.playPin();
      onSuccess();
      onClose();
    } else {
      triggerShake('Incorrect password. Try again (Default PIN: 1234).');
    }
  };

  const handleTouchID = async () => {
    setIsAuthenticatingTouchID(true);
    setErrorMessage(null);
    try {
      const res = await authenticateWithTouchID();
      if (res.success) {
        sound.playPin();
        onSuccess();
        onClose();
      } else {
        triggerShake(res.error || 'Touch ID authentication was dismissed or not recognized.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Biometric error';
      triggerShake(msg);
    } finally {
      setIsAuthenticatingTouchID(false);
    }
  };

  const handleQuickUnlock = () => {
    sound.playPin();
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-[420px] bg-zinc-900/95 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
        style={{
          boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* macOS Window Title Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-800/80 border-b border-white/10 select-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group"
            >
              <X className="w-2 h-2 text-rose-950 opacity-0 group-hover:opacity-100" />
            </button>
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-400 tracking-tight">
            System Authentication
          </span>
          <div className="w-10" />
        </div>

        {/* macOS LocalAuthentication Sheet Content */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {/* App Icon + Touch ID Ring */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-400 p-0.5 shadow-xl shadow-amber-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow font-bold text-xs">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">
              KopyKlip wants to unlock your Sensitive Vault
            </h3>
            <p className="text-[11.5px] text-zinc-400 max-w-[320px] mt-1 leading-relaxed">
              Touch ID or enter password for user{' '}
              <strong className="text-zinc-200 font-mono">"{userAccount}"</strong> to {reason}.
            </p>
          </div>

          {errorMessage && (
            <div className="w-full px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User Account Row */}
          <div className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-zinc-700/80 border border-white/20 flex items-center justify-center text-zinc-300 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{userAccount}</div>
              <div className="text-[10px] text-zinc-400">macOS Administrator</div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Touch ID Ready
            </span>
          </div>

          {/* Password Input Form */}
          <form onSubmit={handlePasswordSubmit} className="w-full space-y-3">
            <div className="relative">
              <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Mac system password or PIN..."
                className="w-full bg-black/50 border border-white/15 focus:border-amber-500 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick Touch ID Sensor Button */}
            <button
              type="button"
              onClick={handleTouchID}
              disabled={isAuthenticatingTouchID}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-600/90 to-orange-500/90 hover:from-amber-500 hover:to-orange-400 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-[0.98]"
            >
              <Fingerprint className="w-4 h-4" />
              <span>
                {isAuthenticatingTouchID
                  ? 'Waiting for Apple Touch ID...'
                  : 'Authenticate with Apple Touch ID'}
              </span>
            </button>

            {/* Actions: Cancel & Unlock */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={handleQuickUnlock}
                title="Quick demo bypass for testing"
                className="text-[10.5px] text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Demo Unlock (1234)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors"
                >
                  Unlock
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
