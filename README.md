# 📎 KopyKlip

> **macOS Menu Bar Clipboard Manager with Pinned Snippets Up Top & Biometric Sensitive Info Vault**

KopyKlip is a clipboard manager for macOS inspired by CopyClip, engineered with pinned clips up top, global shortcut keys (`⌘ 0` through `⌘ 9`), and a dedicated **Sensitive Info Vault** protected by **Apple Touch ID** and system password authentication.

---

## ✨ Features

- **macOS Menu Bar App**: Sits quietly in your menu bar (`📎`) without Dock clutter (`LSUIElement = true`).
- **📌 Pinned Snippets Up Top**: Keep frequently used snippets, tokens, and code snippets anchored at the top of your menu for instant access.
- **⌘ 0 - ⌘ 9 Quick Shortcuts**: Paste your recent or pinned clips with standard single-key equivalents.
- **🔒 Sensitive Info Vault (Touch ID & System Password Protected)**:
  - Isolated tab inside the app for passwords, API keys, tokens, recovery phrases, and credit cards.
  - Protected by Apple Touch ID (`LocalAuthentication` on macOS & WebAuthn platform authenticator in browser).
  - Can only be viewed or copied with biometric or system password authorization.
  - Masked values (`••••••••••••••••`) by default with reveal/hide eye toggles.
  - Live auto-lock timer (configurable to 30s, 1m, 2m, 5m).
  - Clearing unpinned history always keeps your Sensitive Vault safe.
- **Audio Feedback**: Crisp macOS audio effects on copy and pin.
- **Native Mach-O & Swift Source**: Includes compiled native Apple Silicon arm64 binary and full Swift source code with `LocalAuthentication` and `NSStatusBar`.
- **DMG & ZIP Installers**: Pre-packaged disk images and `.app` bundles for seamless deployment.

---

## 🚀 Getting Started

### Prerequisites

- macOS 11.0 Big Sur or later (Apple Silicon M1/M2/M3/M4 or Intel)
- Node.js 18+ (for Web UI development)

### Running the Web UI

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 📦 macOS Native Installation

To install the native macOS Menu Bar application:

1. Download **`KopyKlip-1.0.0-macOS.zip`** or **`KopyKlip-1.0.0-macOS-Universal.dmg`** from the `public/` directory.
2. Unpack and copy `KopyKlip.app` to `/Applications`:
   ```bash
   cp -R KopyKlip.app /Applications/
   xattr -cr /Applications/KopyKlip.app
   open /Applications/KopyKlip.app
   ```
3. Look for the **📎** icon in your macOS menu bar!

---

## 🔒 Security Architecture

- **Biometric Authentication**: Utilizes Apple's `LocalAuthentication` framework (`LAContext`) on macOS to enforce biometric verification (Touch ID) or user passcode validation before decrypting and copying sensitive items.
- **WebAuthn Integration**: Leverages `PublicKeyCredential` platform authenticators for browser-based Touch ID and Windows Hello support.
- **Strict Privacy Isolation**: Vault items are segregated from general clipboard history and are never rendered in plaintext in the general clips list.

---

## 🛠️ Project Structure

```
├── public/
│   ├── KopyKlip-1.0.0-macOS.zip              # Direct macOS .app bundle
│   └── KopyKlip-1.0.0-macOS-Universal.dmg     # Apple Disk Image installer
├── scripts/
│   ├── KopyKlip.swift                        # Native Swift Menu Bar app source
│   ├── kopyklip_native.c                     # Native C/Objective-C runtime source
│   └── build_package.py                      # macOS DMG & bundle packaging script
├── src/
│   ├── components/
│   │   ├── KopyKlipPopover.tsx               # Main CopyClip popover & Sensitive Vault tab
│   │   ├── MacOSAuthModal.tsx                # macOS System Password & Touch ID sheet
│   │   ├── MacMenuBar.tsx                    # Top menu bar simulation
│   │   ├── ClipCard.tsx                      # Rich clip preview component
│   │   ├── PreferencesModal.tsx              # System preferences & security settings
│   │   └── QuickAddModal.tsx                 # Fast clip & secret creation dialog
│   ├── utils/
│   │   ├── biometrics.ts                     # WebAuthn & Apple Touch ID connector
│   │   ├── sound.ts                          # macOS audio feedback synthesizer
│   │   └── storage.ts                        # LocalStorage & encryption adapter
│   └── types.ts                              # TypeScript definitions
└── package.json
```

---

## 📄 License

MIT License © 2026 Kathir
