import React, { useState } from 'react';
import {
  Pin,
  PinOff,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Code2,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  Tag,
  Palette,
  Terminal,
  Globe,
  Edit2,
  Lock,
} from 'lucide-react';
import { ClipItem } from '../types';
import { formatRelativeTime, getStats } from '../utils/formatters';

interface ClipCardProps {
  clip: ClipItem;
  shortcutNumber?: number; // 1-9
  isPinnedSection?: boolean;
  onCopy: (clip: ClipItem) => void;
  onTogglePin: (clipId: string) => void;
  onToggleVault?: (clipId: string) => void;
  onDelete: (clipId: string) => void;
  onUpdateLabel: (clipId: string, label: string) => void;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  shortcutNumber,
  isPinnedSection = false,
  onCopy,
  onTogglePin,
  onToggleVault,
  onDelete,
  onUpdateLabel,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMasked, setShowMasked] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(clip.label || '');

  const stats = getStats(clip.text);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(clip);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleSaveLabel = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLabel(clip.id, labelInput.trim());
    setIsEditingLabel(false);
  };

  const getSourceIcon = (app?: string) => {
    switch (app) {
      case 'Terminal':
        return <Terminal className="w-3 h-3 text-emerald-400" />;
      case 'Safari':
        return <Globe className="w-3 h-3 text-sky-400" />;
      case 'Figma':
        return <Palette className="w-3 h-3 text-purple-400" />;
      case 'VS Code':
        return <Code2 className="w-3 h-3 text-blue-400" />;
      default:
        return <FileText className="w-3 h-3 text-zinc-400" />;
    }
  };

  const getTypeBadge = () => {
    switch (clip.type) {
      case 'url':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
            <ExternalLink className="w-2.5 h-2.5" /> URL
          </span>
        );
      case 'code':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Code2 className="w-2.5 h-2.5" /> Code
          </span>
        );
      case 'color':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/10">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: clip.colorHex || clip.text }}
            />
            {clip.colorHex || clip.text}
          </span>
        );
      case 'secret':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <KeyRound className="w-2.5 h-2.5" /> Secret
          </span>
        );
      default:
        return null;
    }
  };

  const displayText =
    clip.isMasked && !showMasked
      ? '••••••••••••••••••••••••••••••'
      : clip.text;

  return (
    <div
      onClick={handleCopy}
      className={`group relative flex flex-col p-2.5 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
        isPinnedSection
          ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/25 hover:border-amber-500/40'
          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/15'
      }`}
    >
      {/* Top row: Shortcut Badge / Pin indicator + Labels + Meta */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Quick keyboard shortcut indicator */}
          {shortcutNumber !== undefined && shortcutNumber <= 9 && (
            <span
              title={`Press ${shortcutNumber} on your keyboard to copy`}
              className={`inline-flex items-center justify-center text-[10px] font-bold font-mono h-4 min-w-4 px-1 rounded shadow-sm ${
                isPinnedSection
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/10 text-white/90 border border-white/15 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-400'
              }`}
            >
              {shortcutNumber}
            </span>
          )}

          {isPinnedSection && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded-full border border-amber-400/30">
              <Pin className="w-2.5 h-2.5 fill-amber-400" /> Pinned
            </span>
          )}

          {/* User Custom Label */}
          {clip.label && !isEditingLabel && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
              }}
              title="Click to edit label"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-white/95 bg-white/10 px-2 py-0.5 rounded-md border border-white/15 truncate max-w-[140px]"
            >
              <Tag className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span className="truncate">{clip.label}</span>
            </span>
          )}

          {getTypeBadge()}
        </div>

        {/* Right side metadata */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 shrink-0">
          {clip.sourceApp && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded">
              {getSourceIcon(clip.sourceApp)}
              {clip.sourceApp}
            </span>
          )}
          <span>{formatRelativeTime(clip.createdAt)}</span>
        </div>
      </div>

      {/* Editing Label Form */}
      {isEditingLabel && (
        <form
          onSubmit={handleSaveLabel}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 mb-2"
        >
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Label nickname (e.g. WiFi Password)"
            className="flex-1 bg-black/40 text-xs text-white px-2 py-1 rounded border border-blue-500/50 outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="px-2 py-1 bg-blue-600 text-[10px] font-medium text-white rounded hover:bg-blue-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditingLabel(false)}
            className="px-2 py-1 bg-zinc-700 text-[10px] text-zinc-300 rounded hover:bg-zinc-600"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Snippet text */}
      <div className="relative my-0.5">
        <p
          className={`text-[12.5px] leading-relaxed line-clamp-2 break-all text-zinc-200 select-text ${
            clip.type === 'code' || clip.type === 'json' || clip.type === 'secret'
              ? 'font-mono text-[11.5px] text-zinc-300 bg-black/25 px-2 py-1 rounded border border-white/5'
              : ''
          }`}
        >
          {displayText}
        </p>
      </div>

      {/* Bottom meta & hover action tools */}
      <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span>{stats.chars} chars</span>
          {stats.lines > 1 && <span>• {stats.lines} lines</span>}
          {clip.copyCount > 0 && (
            <span className="text-zinc-400">• copied {clip.copyCount}x</span>
          )}
        </div>

        {/* Hover / Action buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {/* Mask toggle for secrets */}
          {clip.isMasked && (
            <button
              onClick={() => setShowMasked(!showMasked)}
              title={showMasked ? 'Mask password' : 'Show password'}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10"
            >
              {showMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Move to Vault button */}
          {onToggleVault && (
            <button
              onClick={() => onToggleVault(clip.id)}
              title={clip.isVault ? 'Remove from Vault' : 'Lock in Sensitive Vault'}
              className={`p-1 rounded transition-colors ${
                clip.isVault
                  ? 'text-amber-400 hover:bg-amber-400/20'
                  : 'text-zinc-400 hover:text-amber-300 hover:bg-white/10'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit / Add label */}
          <button
            onClick={() => setIsEditingLabel(true)}
            title="Edit alias/label"
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Pin / Unpin button */}
          <button
            onClick={() => onTogglePin(clip.id)}
            title={clip.pinned ? 'Unpin snippet' : 'Pin snippet to top'}
            className={`p-1 rounded transition-colors ${
              clip.pinned
                ? 'text-amber-400 hover:bg-amber-400/20'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-white/10'
            }`}
          >
            {clip.pinned ? (
              <PinOff className="w-3.5 h-3.5" />
            ) : (
              <Pin className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Delete clip */}
          <button
            onClick={() => onDelete(clip.id)}
            title="Delete from clipboard"
            className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Copy trigger button */}
          <button
            onClick={handleCopy}
            title="Click to copy (or press shortcut key)"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
