/**
 * KopyKlip macOS Package Downloader
 * Downloads the real compiled macOS DMG and ZIP packages
 */

export interface DMGMetadata {
  appName: string;
  version: string;
  architecture: string;
  bundleId: string;
  fileSize: string;
}

export const KOPYKLIP_DMG_INFO: DMGMetadata = {
  appName: 'KopyKlip',
  version: '1.0.0',
  architecture: 'Universal (Apple Silicon M1-M4 & Intel)',
  bundleId: 'com.kopyklip.mac.clipboard',
  fileSize: '1.2 MB',
};

/**
 * Downloads the real compiled macOS DMG disk image
 */
export function downloadKopyKlipDMG(): void {
  const link = document.createElement('a');
  link.href = '/KopyKlip-1.0.0-macOS-Universal.dmg';
  link.download = 'KopyKlip-1.0.0-macOS-Universal.dmg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads the direct macOS .app ZIP archive (safest, zero disk-mounter error)
 */
export function downloadKopyKlipZIP(): void {
  const link = document.createElement('a');
  link.href = '/KopyKlip-1.0.0-macOS.zip';
  link.download = 'KopyKlip-1.0.0-macOS.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
