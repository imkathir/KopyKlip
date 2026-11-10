/**
 * WebAuthn Biometrics & macOS Touch ID / System Password Authenticator
 */

export interface AuthResult {
  success: boolean;
  method: 'touch_id' | 'passcode';
  error?: string;
}

/**
 * Check if Touch ID / Windows Hello / Platform Biometrics are supported
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Trigger native macOS Touch ID or System Password prompt via WebAuthn
 */
export async function authenticateWithTouchID(): Promise<AuthResult> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, method: 'touch_id', error: 'Biometrics not supported on this browser' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Request platform authenticator (Touch ID / Apple Biometrics)
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'KopyKlip Secure Vault',
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          name: 'kathir-mac',
          displayName: 'Mac User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required', // Enforces Touch ID or System Password
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    });

    if (credential) {
      return { success: true, method: 'touch_id' };
    }
    return { success: false, method: 'touch_id', error: 'Authentication dismissed' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
    return {
      success: false,
      method: 'touch_id',
      error: errorMsg,
    };
  }
}
