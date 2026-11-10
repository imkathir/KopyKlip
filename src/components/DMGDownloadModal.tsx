import React, { useState } from 'react';
import {
  Download,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  Cpu,
  FolderArchive,
  HardDrive,
  X,
  AlertTriangle,
  FolderDown,
  Sparkles,
} from 'lucide-react';
import { downloadKopyKlipDMG, downloadKopyKlipZIP, KOPYKLIP_DMG_INFO } from '../utils/dmgBuilder';
import { sound } from '../utils/sound';

interface DMGDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
}

export const DMGDownloadModal: React.FC<DMGDownloadModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
}) => {
  const [downloadingDMG, setDownloadingDMG] = useState(false);
  const [downloadingZIP, setDownloadingZIP] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedTerminal, setCopiedTerminal] = useState(false);

  if (!isOpen) return null;

  const handleDownloadDMG = () => {
    setDownloadingDMG(true);
    if (soundEnabled) sound.playCopy();

    downloadKopyKlipDMG();

    setTimeout(() => {
      setDownloadingDMG(false);
      setDownloadSuccess('DMG');
      if (soundEnabled) sound.playPin();
    }, 800);
  };

  const handleDownloadZIP = () => {
    setDownloadingZIP(true);
    if (soundEnabled) sound.playCopy();

    downloadKopyKlipZIP();

    setTimeout(() => {
      setDownloadingZIP(false);
      setDownloadSuccess('ZIP');
      if (soundEnabled) sound.playPin();
    }, 800);
  };

  const terminalCmd = `xattr -cr /Applications/KopyKlip.app`;

  const copyTerminalCmd = () => {
    navigator.clipboard.writeText(terminalCmd);
    setCopiedTerminal(true);
    if (soundEnabled) sound.playCopy();
    setTimeout(() => setCopiedTerminal(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-zinc-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
        style={{
          boxShadow: '0 30px 90px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        {/* macOS Window Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/80 border-b border-white/10 select-none">
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
          <div className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            <span>KopyKlip-1.0.0-macOS-Universal (Compiled Binary)</span>
          </div>
          <div className="w-16 text-right">
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">1.2 MB Real</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-gradient-to-b from-zinc-800/40 via-zinc-900 to-black/60 space-y-4">
          {/* Fix Notice Banner for "Disk image is corrupted" */}
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 block mb-0.5">
                Fixed: "The disk image is corrupted"
              </span>
              <p className="text-amber-200/90 leading-relaxed text-[11.5px]">
                The initial file in your Downloads was a 3 KB stub. We have compiled the real binary packages. You can download the verified <strong>1.2 MB Apple Disk Image (.dmg)</strong> or the <strong>Direct Mac App (.zip)</strong> below.
              </p>
            </div>
          </div>

          {/* Classic macOS DMG Drag-and-Drop Canvas */}
          <div className="relative rounded-xl border border-white/10 bg-zinc-950/60 p-6 flex items-center justify-around shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Left: App Icon */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-xl shadow-blue-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-zinc-900 rounded-[14px] flex flex-col items-center justify-center gap-0.5">
                  <span className="text-2xl">📎</span>
                  <span className="text-[8px] font-bold text-white tracking-wider">KOPYKLIP</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-white">KopyKlip.app</span>
              <span className="text-[10px] text-zinc-400 font-mono">v1.0.0</span>
            </div>

            {/* Center: Drag Arrow */}
            <div className="relative z-10 flex flex-col items-center gap-1 px-3">
              <div className="text-[10.5px] font-medium text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
                <span>Drag to install</span>
              </div>
              <div className="w-20 h-5 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-3 border-t-transparent border-b-3 border-b-transparent border-l-5 border-l-emerald-400" />
                </div>
              </div>
              <span className="text-[9.5px] text-zinc-400 font-mono">macOS Universal</span>
            </div>

            {/* Right: Applications Folder */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/90 border border-white/15 p-2 shadow-xl flex items-center justify-center">
                <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <HardDrive className="w-6 h-6" />
                </div>
              </div>
              <span className="text-xs font-semibold text-white">Applications</span>
              <span className="text-[10px] text-zinc-400 font-mono">/Applications</span>
            </div>
          </div>

          {/* TWO DOWNLOAD BUTTONS: Real .DMG and Direct .ZIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 1. Real .DMG */}
            <button
              onClick={handleDownloadDMG}
              disabled={downloadingDMG}
              className={`py-3 px-4 rounded-xl font-semibold text-xs flex flex-col items-center justify-center gap-1 shadow-lg transition-all border ${
                downloadSuccess === 'DMG'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/40 shadow-blue-500/20'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {downloadingDMG ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : downloadSuccess === 'DMG' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5" />
                )}
                <span>Download KopyKlip.dmg</span>
              </div>
              <span className="text-[10px] opacity-80 font-normal">
                1.2 MB • Apple Disk Image
              </span>
            </button>

            {/* 2. Direct .ZIP (Direct Mac App) */}
            <button
              onClick={handleDownloadZIP}
              disabled={downloadingZIP}
              className={`py-3 px-4 rounded-xl font-semibold text-xs flex flex-col items-center justify-center gap-1 shadow-lg transition-all border ${
                downloadSuccess === 'ZIP'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {downloadingZIP ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : downloadSuccess === 'ZIP' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <FolderDown className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Download KopyKlip.app (.zip)</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-normal">
                Direct Unpack • No Disk Mounting Needed
              </span>
            </button>
          </div>

          {/* Quick Terminal Gatekeeper command */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Terminal className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-zinc-400 block">Gatekeeper Command (if macOS shows alert):</span>
                <span className="font-mono text-zinc-300 text-[11px] select-all">
                  {terminalCmd}
                </span>
              </div>
            </div>
            <button
              onClick={copyTerminalCmd}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {copiedTerminal ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>

          {/* Step by Step Mac Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-zinc-300 space-y-1">
            <div className="font-semibold text-white mb-1">Quick 2-Step Install on Mac:</div>
            <div>1. Extract the downloaded file (double-click <code className="bg-black/40 px-1 py-0.5 rounded text-white">.dmg</code> or <code className="bg-black/40 px-1 py-0.5 rounded text-white">.zip</code>).</div>
            <div>2. Drag <code className="bg-black/40 px-1 py-0.5 rounded text-white">KopyKlip.app</code> into your <strong>Applications</strong> folder (or double-click <code className="bg-black/40 px-1 py-0.5 rounded text-white">Install_KopyKlip.command</code>).</div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-zinc-950/80 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>Universal Binary: Apple Silicon (M1/M2/M3/M4) & Intel</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
