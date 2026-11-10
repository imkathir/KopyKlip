export type ClipType = 'text' | 'code' | 'url' | 'color' | 'json' | 'secret';

export interface ClipItem {
  id: string;
  text: string;
  label?: string; // Optional user nickname (e.g., "Work WiFi Password", "Stripe API Key")
  pinned: boolean;
  pinnedOrder?: number;
  createdAt: number;
  copyCount: number;
  sourceApp?: string; // 'Safari' | 'VS Code' | 'Notes' | 'Slack' | 'Terminal' | 'Figma'
  type: ClipType;
  colorHex?: string; // For hex colors
  isMasked?: boolean; // For passwords / secrets
  isVault?: boolean; // Sensitive info locked behind biometrics / password
  vaultCategory?: 'password' | 'api_key' | 'token' | 'note' | 'crypto' | 'card';
}

export interface KopyKlipSettings {
  maxHistory: number; // default 50
  soundEnabled: boolean; // macOS audio feedback
  autoSyncClipboard: boolean;
  maskPasswords: boolean;
  hotkey: string; // 'Cmd+Shift+V'
  theme: 'dark' | 'light';
  wallpaper: 'sonoma' | 'sequoia' | 'graphite' | 'abstract';
  displayMode: 'menubar' | 'window';
  showLineNumbers: boolean;
  vaultPasscode?: string;
  vaultAutoLockSeconds?: number;
  vaultUserAccount?: string;
}

export type FilterCategory = 'all' | 'pinned' | 'vault' | 'links' | 'code' | 'colors';

