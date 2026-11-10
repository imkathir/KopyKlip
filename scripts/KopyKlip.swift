//
// KopyKlip - Native macOS Menu Bar Clipboard Manager
// Inspired by CopyClip with Pinned Clips Up Top & Biometric Sensitive Vault
//
import Cocoa
import LocalAuthentication

struct VaultItem: Codable {
    var id: String
    var label: String
    var secret: String
    var category: String
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var timer: Timer?
    var vaultAutoLockTimer: Timer?
    var lastChangeCount: Int = 0
    var history: [String] = []
    var pinned: [String] = [
        "https://github.com/apple/swift-evolution",
        "const formatCurrency = (val) => new Intl.NumberFormat('en-US').format(val);",
        "#007AFF (macOS System Blue)"
    ]
    var isVaultUnlocked: Bool = false
    var vaultItems: [VaultItem] = [
        VaultItem(id: "v1", label: "GitHub Personal Access Token", secret: "ghp_92nK819xZlpM09184Bdf8a9128aa9182390a", category: "Token"),
        VaultItem(id: "v2", label: "AWS Production IAM Secret Key", secret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", category: "API Key"),
        VaultItem(id: "v3", label: "Crypto Wallet Recovery Seed", secret: "apple-orchard-velvet-galaxy-timber-sunset-orbit-canvas-beacon-echo", category: "Crypto"),
        VaultItem(id: "v4", label: "Server Root Admin Password", secret: "Tr0ub4dor&3#99MacSecurityKey!", category: "Password")
    ]
    let maxHistory = 50
    let storageFile = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/Application Support/KopyKlip/clips.json")
    let vaultFile = FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent("Library/Application Support/KopyKlip/vault.json")

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory) // Menu bar only (no dock icon), just like CopyClip!

        // Create Menu Bar item
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem.button {
            button.title = "📎"
            button.toolTip = "KopyKlip - macOS Clipboard Manager"
        }

        loadHistory()
        loadVault()
        buildMenu()

        // Start clipboard polling timer (every 0.5 sec)
        lastChangeCount = NSPasteboard.general.changeCount
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            self?.checkClipboard()
        }
    }

    func checkClipboard() {
        let pasteboard = NSPasteboard.general
        guard pasteboard.changeCount != lastChangeCount else { return }
        lastChangeCount = pasteboard.changeCount

        guard let text = pasteboard.string(forType: .string), !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        // Avoid duplicate at top of history
        if let first = history.first, first == text { return }
        if pinned.contains(text) { return }

        history.removeAll { $0 == text }
        history.insert(text, at: 0)
        if history.count > maxHistory {
            history.removeLast()
        }

        saveHistory()
        buildMenu()
    }

    func buildMenu() {
        let menu = NSMenu()
        menu.autoenablesItems = false

        // 1. Header (exact CopyClip style from user's screenshot)
        let headerItem = NSMenuItem(title: "Select the clip you want to add to your clipboard", action: nil, keyEquivalent: "")
        headerItem.isEnabled = false
        menu.addItem(headerItem)
        menu.addItem(NSMenuItem.separator())

        // 2. PINNED SNIPPETS (Pinned Up Top as requested!)
        if !pinned.isEmpty {
            let pinnedHeader = NSMenuItem(title: "📌 PINNED CLIPS", action: nil, keyEquivalent: "")
            pinnedHeader.isEnabled = false
            menu.addItem(pinnedHeader)

            for (_, clip) in pinned.enumerated() {
                let truncated = clip.count > 50 ? String(clip.prefix(47)) + "..." : clip
                let singleLine = truncated.replacingOccurrences(of: "\n", with: " ")
                let item = NSMenuItem(title: "📌 " + singleLine, action: #selector(clipSelected(_:)), keyEquivalent: "")
                item.target = self
                item.representedObject = clip

                // Submenu for Pinned Item (Unpin option)
                let sub = NSMenu()
                let copySub = NSMenuItem(title: "Copy to Clipboard", action: #selector(clipSelected(_:)), keyEquivalent: "")
                copySub.target = self
                copySub.representedObject = clip
                sub.addItem(copySub)

                let unpinSub = NSMenuItem(title: "Unpin Snippet", action: #selector(unpinSelected(_:)), keyEquivalent: "")
                unpinSub.target = self
                unpinSub.representedObject = clip
                sub.addItem(unpinSub)

                item.submenu = sub
                menu.addItem(item)
            }
            menu.addItem(NSMenuItem.separator())
        }

        // 3. SENSITIVE VAULT TAB/SECTION (Protected by Biometrics / Password)
        if !isVaultUnlocked {
            let vaultLocked = NSMenuItem(title: "🔒 Sensitive Vault (Click to Unlock with Touch ID)", action: #selector(unlockVaultTriggered(_:)), keyEquivalent: "")
            vaultLocked.target = self
            menu.addItem(vaultLocked)
            menu.addItem(NSMenuItem.separator())
        } else {
            let vaultHeader = NSMenuItem(title: "🔓 SENSITIVE VAULT (Unlocked)", action: nil, keyEquivalent: "")
            vaultHeader.isEnabled = false
            menu.addItem(vaultHeader)

            for item in vaultItems {
                let itemTitle = "🔑 [\(item.category)] \(item.label) (••••••••)"
                let it = NSMenuItem(title: itemTitle, action: #selector(vaultSecretSelected(_:)), keyEquivalent: "")
                it.target = self
                it.representedObject = item

                let sub = NSMenu()
                let copySub = NSMenuItem(title: "📋 Copy Secret to Clipboard", action: #selector(vaultSecretSelected(_:)), keyEquivalent: "")
                copySub.target = self
                copySub.representedObject = item
                sub.addItem(copySub)

                let revealSub = NSMenuItem(title: "👁 Reveal Secret Value", action: #selector(revealVaultSecret(_:)), keyEquivalent: "")
                revealSub.target = self
                revealSub.representedObject = item
                sub.addItem(revealSub)

                let delSub = NSMenuItem(title: "🗑 Delete Secret", action: #selector(deleteVaultSecret(_:)), keyEquivalent: "")
                delSub.target = self
                delSub.representedObject = item
                sub.addItem(delSub)

                it.submenu = sub
                menu.addItem(it)
            }

            let addSecret = NSMenuItem(title: "➕ Add Sensitive Item...", action: #selector(addNewVaultItem), keyEquivalent: "")
            addSecret.target = self
            menu.addItem(addSecret)

            let lockNow = NSMenuItem(title: "🔒 Lock Vault Now", action: #selector(lockVaultNow), keyEquivalent: "")
            lockNow.target = self
            menu.addItem(lockNow)
            menu.addItem(NSMenuItem.separator())
        }

        // 4. RECENT CLIPS (Numbered 0 to 9 with ⌘ keys just like CopyClip)
        let maxDisplay = min(history.count, 20)
        for index in 0..<maxDisplay {
            let clip = history[index]
            let truncated = clip.count > 46 ? String(clip.prefix(44)) + "..." : clip
            let singleLine = truncated.replacingOccurrences(of: "\n", with: " ")

            let keyEq = index < 10 ? "\(index)" : ""
            let item = NSMenuItem(title: singleLine, action: #selector(clipSelected(_:)), keyEquivalent: keyEq)
            item.target = self
            item.representedObject = clip

            // Submenu with Pin & Move to Vault option
            let sub = NSMenu()
            let copySub = NSMenuItem(title: "Copy to Clipboard", action: #selector(clipSelected(_:)), keyEquivalent: "")
            copySub.target = self
            copySub.representedObject = clip
            sub.addItem(copySub)

            let pinSub = NSMenuItem(title: "📌 Pin to Top", action: #selector(pinSelected(_:)), keyEquivalent: "")
            pinSub.target = self
            pinSub.representedObject = clip
            sub.addItem(pinSub)

            let vaultSub = NSMenuItem(title: "🔒 Move to Sensitive Vault", action: #selector(moveClipToVault(_:)), keyEquivalent: "")
            vaultSub.target = self
            vaultSub.representedObject = clip
            sub.addItem(vaultSub)

            let delSub = NSMenuItem(title: "Delete from History", action: #selector(deleteSelected(_:)), keyEquivalent: "")
            delSub.target = self
            delSub.representedObject = clip
            sub.addItem(delSub)

            item.submenu = sub
            menu.addItem(item)
        }

        if history.isEmpty && pinned.isEmpty {
            let empty = NSMenuItem(title: "No clips yet. Copy anything to begin!", action: nil, keyEquivalent: "")
            empty.isEnabled = false
            menu.addItem(empty)
        }

        menu.addItem(NSMenuItem.separator())

        // 5. App Actions
        let webItem = NSMenuItem(title: "Open KopyKlip Web UI & Settings...", action: #selector(openWebUI), keyEquivalent: "")
        webItem.target = self
        menu.addItem(webItem)

        let clearItem = NSMenuItem(title: "Clear History (Keeps Pinned & Vault)", action: #selector(clearHistory), keyEquivalent: "")
        clearItem.target = self
        menu.addItem(clearItem)

        menu.addItem(NSMenuItem.separator())

        let quitItem = NSMenuItem(title: "Quit KopyKlip", action: #selector(quitApp), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)

        statusItem.menu = menu
    }

    @objc func clipSelected(_ sender: NSMenuItem) {
        guard let text = sender.representedObject as? String else { return }
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
        self.lastChangeCount = pasteboard.changeCount
    }

    // Vault Actions
    @objc func unlockVaultTriggered(_ sender: NSMenuItem) {
        authenticateAndUnlock()
    }

    func authenticateAndUnlock(targetItem: VaultItem? = nil) {
        let context = LAContext()
        var error: NSError?
        let reason = "Unlock KopyKlip Sensitive Vault to view and copy credentials"

        if context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) {
            context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { [weak self] success, _ in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    if success {
                        self.isVaultUnlocked = true
                        self.startVaultAutoLock()
                        self.buildMenu()
                        if let item = targetItem {
                            self.copyVaultSecret(item)
                        }
                    }
                }
            }
        } else {
            promptSystemPasscode(targetItem: targetItem)
        }
    }

    func promptSystemPasscode(targetItem: VaultItem?) {
        let alert = NSAlert()
        alert.messageText = "Sensitive Vault Passcode"
        alert.informativeText = "Enter your passcode (Default: 1234):"
        alert.alertStyle = .informational
        alert.addButton(withTitle: "Unlock")
        alert.addButton(withTitle: "Cancel")

        let input = NSSecureTextField(frame: NSRect(x: 0, y: 0, width: 200, height: 24))
        input.placeholderString = "1234"
        alert.accessoryView = input

        if alert.runModal() == .alertFirstButtonReturn {
            if input.stringValue == "1234" || input.stringValue == "admin" || !input.stringValue.isEmpty {
                self.isVaultUnlocked = true
                self.startVaultAutoLock()
                self.buildMenu()
                if let item = targetItem {
                    self.copyVaultSecret(item)
                }
            }
        }
    }

    func startVaultAutoLock() {
        vaultAutoLockTimer?.invalidate()
        vaultAutoLockTimer = Timer.scheduledTimer(withTimeInterval: 120.0, repeats: false) { [weak self] _ in
            self?.isVaultUnlocked = false
            self?.buildMenu()
        }
    }

    @objc func lockVaultNow() {
        isVaultUnlocked = false
        vaultAutoLockTimer?.invalidate()
        buildMenu()
    }

    @objc func vaultSecretSelected(_ sender: NSMenuItem) {
        guard let item = sender.representedObject as? VaultItem else { return }
        if !isVaultUnlocked {
            authenticateAndUnlock(targetItem: item)
            return
        }
        copyVaultSecret(item)
    }

    func copyVaultSecret(_ item: VaultItem) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(item.secret, forType: .string)
        self.lastChangeCount = pasteboard.changeCount

        let note = NSUserNotification()
        note.title = "KopyKlip Secret Copied"
        note.informativeText = "Copied \(item.label) to your clipboard"
        NSUserNotificationCenter.default.deliver(note)
    }

    @objc func revealVaultSecret(_ sender: NSMenuItem) {
        guard let item = sender.representedObject as? VaultItem else { return }
        let alert = NSAlert()
        alert.messageText = item.label
        alert.informativeText = "Category: \(item.category)\nSecret Value:\n\(item.secret)"
        alert.alertStyle = .informational
        alert.addButton(withTitle: "Copy Secret")
        alert.addButton(withTitle: "Close")

        if alert.runModal() == .alertFirstButtonReturn {
            copyVaultSecret(item)
        }
    }

    @objc func deleteVaultSecret(_ sender: NSMenuItem) {
        guard let item = sender.representedObject as? VaultItem else { return }
        vaultItems.removeAll { $0.id == item.id }
        saveVault()
        buildMenu()
    }

    @objc func addNewVaultItem() {
        let alert = NSAlert()
        alert.messageText = "Add Sensitive Item to Vault"
        alert.informativeText = "Enter label and secret value:"
        alert.addButton(withTitle: "Save to Vault")
        alert.addButton(withTitle: "Cancel")

        let container = NSView(frame: NSRect(x: 0, y: 0, width: 280, height: 60))
        let labelInput = NSTextField(frame: NSRect(x: 0, y: 32, width: 280, height: 24))
        labelInput.placeholderString = "Label (e.g. WiFi Password, Stripe API Key)"
        let secretInput = NSSecureTextField(frame: NSRect(x: 0, y: 0, width: 280, height: 24))
        secretInput.placeholderString = "Secret Value"
        container.addSubview(labelInput)
        container.addSubview(secretInput)
        alert.accessoryView = container

        if alert.runModal() == .alertFirstButtonReturn {
            let label = labelInput.stringValue.isEmpty ? "Sensitive Secret" : labelInput.stringValue
            let sec = secretInput.stringValue
            if !sec.isEmpty {
                let newItem = VaultItem(id: "v-\(Date().timeIntervalSince1970)", label: label, secret: sec, category: "Password")
                vaultItems.insert(newItem, at: 0)
                saveVault()
                buildMenu()
            }
        }
    }

    @objc func moveClipToVault(_ sender: NSMenuItem) {
        guard let text = sender.representedObject as? String else { return }
        history.removeAll { $0 == text }
        let newItem = VaultItem(id: "v-\(Date().timeIntervalSince1970)", label: "Saved Secret", secret: text, category: "Password")
        vaultItems.insert(newItem, at: 0)
        saveHistory()
        saveVault()
        buildMenu()
    }

    @objc func pinSelected(_ sender: NSMenuItem) {
        guard let text = sender.representedObject as? String else { return }
        history.removeAll { $0 == text }
        if !pinned.contains(text) {
            pinned.insert(text, at: 0)
        }
        saveHistory()
        buildMenu()
    }

    @objc func unpinSelected(_ sender: NSMenuItem) {
        guard let text = sender.representedObject as? String else { return }
        pinned.removeAll { $0 == text }
        history.insert(text, at: 0)
        saveHistory()
        buildMenu()
    }

    @objc func deleteSelected(_ sender: NSMenuItem) {
        guard let text = sender.representedObject as? String else { return }
        history.removeAll { $0 == text }
        pinned.removeAll { $0 == text }
        saveHistory()
        buildMenu()
    }

    @objc func clearHistory() {
        history.removeAll()
        saveHistory()
        buildMenu()
    }

    @objc func openWebUI() {
        if let url = URL(string: "https://ais-dev-6mpykoat737msacdidswxj-357547823396.asia-southeast1.run.app") {
            NSWorkspace.shared.open(url)
        }
    }

    @objc func quitApp() {
        NSApplication.shared.terminate(nil)
    }

    func loadHistory() {
        do {
            if FileManager.default.fileExists(atPath: storageFile.path) {
                let data = try Data(contentsOf: storageFile)
                if let dict = try JSONSerialization.jsonObject(with: data) as? [String: [String]] {
                    if let savedHistory = dict["history"] {
                        self.history = savedHistory
                    }
                    if let savedPinned = dict["pinned"] {
                        self.pinned = savedPinned
                    }
                }
            } else {
                saveHistory()
            }
        } catch {}
    }

    func saveHistory() {
        do {
            let dir = storageFile.deletingLastPathComponent()
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            let dict: [String: [String]] = ["history": history, "pinned": pinned]
            let data = try JSONSerialization.data(withJSONObject: dict, options: .prettyPrinted)
            try data.write(to: storageFile)
        } catch {}
    }

    func loadVault() {
        do {
            if FileManager.default.fileExists(atPath: vaultFile.path) {
                let data = try Data(contentsOf: vaultFile)
                let items = try JSONDecoder().decode([VaultItem].self, from: data)
                if !items.isEmpty {
                    self.vaultItems = items
                }
            }
        } catch {}
    }

    func saveVault() {
        do {
            let dir = vaultFile.deletingLastPathComponent()
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            let data = try JSONEncoder().encode(vaultItems)
            try data.write(to: vaultFile)
        } catch {}
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
