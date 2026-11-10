import { ClipItem, KopyKlipSettings } from '../types';
import { detectClipType } from './formatters';

const STORAGE_KEY_CLIPS = 'kopyklip_clips_v1';
const STORAGE_KEY_SETTINGS = 'kopyklip_settings_v1';

export const INITIAL_CLIPS: ClipItem[] = [
  {
    id: 'pin-1',
    text: 'https://github.com/apple/swift-evolution',
    label: 'Swift Evolution Specs',
    pinned: true,
    pinnedOrder: 1,
    createdAt: Date.now() - 1000 * 60 * 15,
    copyCount: 14,
    sourceApp: 'Safari',
    type: 'url',
  },
  {
    id: 'pin-2',
    text: 'const formatCurrency = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);',
    label: 'Currency Formatter Snippet',
    pinned: true,
    pinnedOrder: 2,
    createdAt: Date.now() - 1000 * 60 * 45,
    copyCount: 9,
    sourceApp: 'VS Code',
    type: 'code',
  },
  {
    id: 'pin-3',
    text: '#007AFF',
    label: 'macOS Accent System Blue',
    pinned: true,
    pinnedOrder: 3,
    createdAt: Date.now() - 1000 * 60 * 120,
    copyCount: 22,
    sourceApp: 'Figma',
    type: 'color',
    colorHex: '#007AFF',
  },
  {
    id: 'pin-4',
    text: 'sk_live_51M08920194819481abcdef9048123984',
    label: 'Stripe Secret Key (Masked)',
    pinned: true,
    pinnedOrder: 4,
    createdAt: Date.now() - 1000 * 60 * 300,
    copyCount: 4,
    sourceApp: 'Terminal',
    type: 'secret',
    isMasked: true,
  },
  {
    id: 'vault-1',
    text: 'ghp_92nK819xZlpM09184Bdf8a9128aa9182390a',
    label: 'GitHub Personal Access Token',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 60,
    copyCount: 8,
    sourceApp: 'Terminal',
    type: 'secret',
    isMasked: true,
    isVault: true,
    vaultCategory: 'token',
  },
  {
    id: 'vault-2',
    text: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    label: 'AWS Production IAM Secret Key',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 180,
    copyCount: 3,
    sourceApp: 'Terminal',
    type: 'secret',
    isMasked: true,
    isVault: true,
    vaultCategory: 'api_key',
  },
  {
    id: 'vault-3',
    text: 'apple-orchard-velvet-galaxy-timber-sunset-orbit-canvas-beacon-echo',
    label: 'Crypto Wallet Recovery Seed (12 Words)',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 360,
    copyCount: 1,
    sourceApp: 'Notes',
    type: 'secret',
    isMasked: true,
    isVault: true,
    vaultCategory: 'crypto',
  },
  {
    id: 'vault-4',
    text: 'Tr0ub4dor&3#99MacSecurityKey!',
    label: 'Server Root Admin Password',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 480,
    copyCount: 12,
    sourceApp: 'Safari',
    type: 'secret',
    isMasked: true,
    isVault: true,
    vaultCategory: 'password',
  },
  {
    id: 'hist-1',
    text: 'sudo lsof -i :3000 | awk "NR>1 {print $2}" | xargs kill -9',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 2,
    copyCount: 3,
    sourceApp: 'Terminal',
    type: 'code',
  },
  {
    id: 'hist-2',
    text: '{"status": 200, "message": "Clipboard sync event dispatched", "client": "KopyKlip-v1.0.0"}',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 8,
    copyCount: 1,
    sourceApp: 'Postman',
    type: 'json',
  },
  {
    id: 'hist-3',
    text: 'Meeting notes: Finalize menu-bar popover animation and DMG bundle distribution for macOS Sequoia.',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 25,
    copyCount: 2,
    sourceApp: 'Notes',
    type: 'text',
  },
  {
    id: 'hist-4',
    text: 'git commit -m "feat(clipboard): add pinned clips up top with instant key shortcuts"',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 55,
    copyCount: 5,
    sourceApp: 'Terminal',
    type: 'code',
  },
  {
    id: 'hist-5',
    text: '#34C759',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 70,
    copyCount: 1,
    sourceApp: 'Figma',
    type: 'color',
    colorHex: '#34C759',
  },
  {
    id: 'hist-6',
    text: 'https://news.ycombinator.com',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 180,
    copyCount: 2,
    sourceApp: 'Safari',
    type: 'url',
  },
];

export const DEFAULT_SETTINGS: KopyKlipSettings = {
  maxHistory: 50,
  soundEnabled: true,
  autoSyncClipboard: true,
  maskPasswords: true,
  hotkey: 'Cmd+Shift+V',
  theme: 'dark',
  wallpaper: 'sonoma',
  displayMode: 'menubar',
  showLineNumbers: false,
  vaultPasscode: '1234',
  vaultAutoLockSeconds: 120,
};

export function loadClips(): ClipItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIPS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // Only return INITIAL_CLIPS on absolute first launch (when key is null)
    saveClips(INITIAL_CLIPS);
    return INITIAL_CLIPS;
  } catch {
    return [];
  }
}

export function saveClips(clips: ClipItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CLIPS, JSON.stringify(clips));
  } catch (err) {
    console.error('Failed to save clips to localStorage', err);
  }
}

export function loadSettings(): KopyKlipSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: KopyKlipSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function createNewClip(
  text: string,
  sourceApp?: string,
  isVault?: boolean,
  label?: string
): ClipItem {
  const { type, colorHex, isMasked } = detectClipType(text);
  return {
    id: 'clip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    text,
    label,
    pinned: false,
    createdAt: Date.now(),
    copyCount: 0,
    sourceApp: sourceApp || 'Clipboard',
    type: isVault ? 'secret' : type,
    colorHex,
    isMasked: isVault ? true : isMasked,
    isVault: !!isVault,
    vaultCategory: isVault ? 'password' : undefined,
  };
}

