import React, { useState } from 'react';
import { Plus, Pin, Tag, X, Sparkles, Clipboard, ShieldCheck, Lock } from 'lucide-react';
import { ClipItem } from '../types';
import { createNewClip } from '../utils/storage';
import { sound } from '../utils/sound';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClip: (clip: ClipItem) => void;
  soundEnabled: boolean;
  defaultVault?: boolean;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddClip,
  soundEnabled,
  defaultVault = false,
}) => {
  const [text, setText] = useState('');
  const [label, setLabel] = useState('');
  const [pinned, setPinned] = useState(false);
  const [isVault, setIsVault] = useState(defaultVault);
  const [vaultCategory, setVaultCategory] = useState<'password' | 'api_key' | 'token' | 'note' | 'crypto' | 'card'>('password');
  const [sourceApp, setSourceApp] = useState('Safari');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const clip = createNewClip(text.trim(), sourceApp, isVault, label.trim() || undefined);
    if (isVault) {
      clip.isVault = true;
      clip.isMasked = true;
      clip.type = 'secret';
      clip.vaultCategory = vaultCategory;
    }
    if (pinned) {
      clip.pinned = true;
      clip.pinnedOrder = Date.now();
    }

    onAddClip(clip);
    if (soundEnabled) {
      if (pinned) sound.playPin();
      else sound.playCopy();
    }

    setText('');
    setLabel('');
    setPinned(false);
    setIsVault(false);
    onClose();
  };

  const handlePasteSystem = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        if (soundEnabled) sound.playPop();
      }
    } catch {
      // Ignore if permission denied
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 select-none bg-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isVault ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-600/30 text-blue-400 border border-blue-500/30'}`}>
              {isVault ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-semibold text-white">
              {isVault ? 'Add Secret to Sensitive Vault' : 'Add New Clip'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-zinc-400">
                {isVault ? 'Secret / Password / API Key:' : 'Clipboard Text / Snippet:'}
              </label>
              <button
                type="button"
                onClick={handlePasteSystem}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Clipboard className="w-3 h-3" />
                <span>Paste from Mac</span>
              </button>
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isVault ? 'Enter password, private API key, seed phrase, token...' : 'Type or paste anything to store in KopyKlip...'}
              rows={4}
              className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Nickname / Label */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Label / Description (Optional):
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={isVault ? 'e.g. AWS Secret Key, WiFi Password, Recovery Key' : 'e.g. Work WiFi, Zoom Link, Postgres URL'}
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* SENSITIVE VAULT TOGGLE (Touch ID Protected) */}
          <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between cursor-pointer" onClick={() => setIsVault(!isVault)}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-200 block">
                  Lock in Sensitive Vault
                </span>
                <span className="text-[10.5px] text-zinc-400 block leading-tight">
                  Protected by Touch ID & Mac password before copying or viewing
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isVault}
              onChange={(e) => setIsVault(e.target.checked)}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {isVault && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Secret Category:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
                {(
                  [
                    { id: 'password', label: '🔑 Password' },
                    { id: 'api_key', label: '⚡ API Key' },
                    { id: 'token', label: '🎟️ Token' },
                    { id: 'crypto', label: '🪙 Crypto Seed' },
                    { id: 'note', label: '📝 Note' },
                    { id: 'card', label: '💳 Card' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setVaultCategory(cat.id)}
                    className={`py-1 px-2 rounded-lg border text-center transition-colors ${
                      vaultCategory === cat.id
                        ? 'bg-amber-500/30 border-amber-500 text-amber-200 font-semibold'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Source app */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Source App:
              </label>
              <select
                value={sourceApp}
                onChange={(e) => setSourceApp(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 outline-none"
              >
                <option value="Safari">Safari</option>
                <option value="VS Code">VS Code</option>
                <option value="Terminal">Terminal</option>
                <option value="Figma">Figma</option>
                <option value="Slack">Slack</option>
                <option value="Notes">Notes</option>
              </select>
            </div>

            {/* Pin to top */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Pin to Top:
              </label>
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`w-full py-1.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  pinned
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${pinned ? 'fill-amber-400' : ''}`} />
                <span>{pinned ? 'Pinned at Top' : 'Standard'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-md ${
                isVault
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
              }`}
            >
              {isVault ? <ShieldCheck className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isVault ? 'Store in Vault' : 'Save Clip'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
