import { ClipType } from '../types';

export function detectClipType(text: string): { type: ClipType; colorHex?: string; isMasked?: boolean } {
  const trimmed = text.trim();

  // Check URL
  if (/^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    return { type: 'url' };
  }

  // Check HEX or RGB color
  const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (hexMatch) {
    return { type: 'color', colorHex: trimmed };
  }
  const rgbMatch = trimmed.match(/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+\s*)?\)$/i);
  if (rgbMatch) {
    return { type: 'color', colorHex: trimmed };
  }

  // Check JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return { type: 'json' };
    } catch {
      // Not valid JSON
    }
  }

  // Check Secret / API Key / Password
  if (
    /^(sk_live|pk_live|ghp_|glpat-|bearer\s+|xox[baprs]-|AKIA|AIzaSy)[a-zA-Z0-9_\-]{10,}/i.test(trimmed) ||
    /password\s*[:=]\s*[^\s]+/i.test(trimmed) ||
    (trimmed.length >= 24 && !trimmed.includes(' ') && /[A-Za-z0-9+/=]{24,}/.test(trimmed))
  ) {
    return { type: 'secret', isMasked: true };
  }

  // Check Code snippet
  const codePatterns = [
    /\b(function|const|let|var|class|interface|type|import|export|def|return|public|private)\b/,
    /(<\w+>|<\/\w+>|\/>)/, // HTML/JSX tags
    /(\{|\}\s*$|;\s*$|=>)/m, // brackets or arrows
    /console\.(log|error|warn)/,
  ];
  if (codePatterns.some((pattern) => pattern.test(trimmed))) {
    return { type: 'code' };
  }

  return { type: 'text' };
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function getStats(text: string) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  return { chars, words, lines };
}
