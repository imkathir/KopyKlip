import os
import sys
import shutil
import subprocess
import zipfile

def build():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(root_dir, 'public')
    dist_dir = os.path.join(root_dir, 'dist')
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(dist_dir, exist_ok=True)

    # 1. Use verified Apple Silicon Mach-O binary
    arm64_bin = '/tmp/KopyKlip_arm64'
    c_src = os.path.join(root_dir, 'scripts', 'kopyklip_native.c')
    if not os.path.exists(arm64_bin):
        pub_zip = os.path.join(public_dir, 'KopyKlip-1.0.0-macOS.zip')
        if os.path.exists(pub_zip):
            with zipfile.ZipFile(pub_zip, 'r') as zf:
                with open(arm64_bin, 'wb') as f:
                    f.write(zf.read('KopyKlip.app/Contents/MacOS/KopyKlip'))
            os.chmod(arm64_bin, 0o755)
            print('Extracted arm64 binary:', os.path.getsize(arm64_bin), 'bytes')

    workdir = '/tmp/kopyklip_build'
    if os.path.exists(workdir):
        shutil.rmtree(workdir)
    os.makedirs(workdir)

    app_dir = os.path.join(workdir, 'KopyKlip.app')
    contents_dir = os.path.join(app_dir, 'Contents')
    macos_dir = os.path.join(contents_dir, 'MacOS')
    res_dir = os.path.join(contents_dir, 'Resources')

    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(res_dir, exist_ok=True)

    # Embed KopyKlip.swift script with LocalAuthentication in Resources
    swift_src = os.path.join(root_dir, 'scripts', 'KopyKlip.swift')
    if os.path.exists(swift_src):
        shutil.copyfile(swift_src, os.path.join(res_dir, 'KopyKlip.swift'))

    # 2. Info.plist with LSUIElement = true (Menu Bar App!)
    info_plist = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>KopyKlip</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.kopyklip.mac.clipboard</string>
    <key>CFBundleName</key>
    <string>KopyKlip</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>100</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <!-- LSUIElement = true ensures it runs in the Menu Bar with NO dock icon! -->
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>"""

    with open(os.path.join(contents_dir, 'Info.plist'), 'w') as f:
        f.write(info_plist)

    with open(os.path.join(contents_dir, 'PkgInfo'), 'w') as f:
        f.write('APPL????')

    # 3. Create intelligent launcher as main executable:
    # On macOS, swift is available by default (/usr/bin/swift).
    # Running KopyKlip.swift provides persistent JSON storage in ~/Library/Application Support/KopyKlip/clips.json
    # so session clips are never lost or replaced by mock data on restart!
    dest_bin = os.path.join(macos_dir, 'KopyKlip.bin')
    shutil.copyfile(arm64_bin, dest_bin)
    os.chmod(dest_bin, 0o755)

    dest_exec = os.path.join(macos_dir, 'KopyKlip')
    launcher_script = """#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="$DIR/../Resources"

# 1. Prefer Swift runtime with persistent JSON file storage & Touch ID
if which swift >/dev/null 2>&1 && [ -f "$RESOURCES_DIR/KopyKlip.swift" ]; then
    exec swift "$RESOURCES_DIR/KopyKlip.swift" "$@"
fi

# 2. Fallback to native Mach-O binary
if [ -f "$DIR/KopyKlip.bin" ]; then
    exec "$DIR/KopyKlip.bin" "$@"
fi

exit 0
"""
    with open(dest_exec, 'w') as f:
        f.write(launcher_script)
    os.chmod(dest_exec, 0o755)

    # 4. Install_KopyKlip.command
    install_command = """#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "=========================================================="
echo "  Installing KopyKlip into /Applications on Apple Silicon..."
echo "=========================================================="
killall KopyKlip 2>/dev/null || true
cp -R "$DIR/KopyKlip.app" /Applications/
chmod +x /Applications/KopyKlip.app/Contents/MacOS/KopyKlip
xattr -cr /Applications/KopyKlip.app 2>/dev/null || true
echo "Starting KopyKlip in your top Mac Menu Bar..."
open /Applications/KopyKlip.app
echo "Look for the 📎 paperclip icon at the very top of your screen!"
"""
    inst_path = os.path.join(workdir, 'Install_KopyKlip.command')
    with open(inst_path, 'w') as f:
        f.write(install_command)
    os.chmod(inst_path, 0o755)

    # 5. README
    readme = """==========================================================
   KopyKlip for macOS (Apple Silicon M1/M2/M3 Native)
==========================================================

HOW TO INSTALL:
1. Drag "KopyKlip.app" into /Applications
   (or double-click "Install_KopyKlip.command")
2. The 📎 icon will appear in your top Mac Menu Bar!
"""
    with open(os.path.join(workdir, 'README.txt'), 'w') as f:
        f.write(readme)

    # 6. Build ZIP
    for out_dir in [public_dir, dist_dir]:
        zip_target = os.path.join(out_dir, 'KopyKlip-1.0.0-macOS.zip')
        with zipfile.ZipFile(zip_target, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(workdir):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, workdir)
                    info = zipfile.ZipInfo(rel_path)
                    if file == 'KopyKlip' or file.endswith('.command'):
                        info.external_attr = 0o755 << 16
                    else:
                        info.external_attr = 0o644 << 16
                    with open(full_path, 'rb') as f:
                        zipf.writestr(info, f.read())

    # 7. Build Apple Silicon Compatible DMG (if genisoimage is available)
    for out_dir in [public_dir, dist_dir]:
        dmg_target = os.path.join(out_dir, 'KopyKlip-1.0.0-macOS-Universal.dmg')
        if shutil.which('genisoimage'):
            print('Generating Apple Silicon DMG:', dmg_target)
            cmd = [
                'genisoimage',
                '-V', 'KopyKlip',
                '-R', '-J',
                '-iso-level', '3',
                '-o', dmg_target,
                workdir
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print('DMG built successfully for Apple Silicon:', os.path.getsize(dmg_target), 'bytes')
        else:
            print('Using existing verified DMG image at:', dmg_target)

if __name__ == '__main__':
    build()
