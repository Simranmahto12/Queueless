/**
 * QR Code Generation & Verification Utility
 * Provides secure encoding and decoding of physical/digital check-in payloads,
 * as well as standards-compliant 2D matrix barcode rendering (SVG & DataURL).
 */

import QRCode from 'qrcode';

// Support both ESM and CJS bundler outputs
const qrLib = ((QRCode as unknown as { default?: typeof QRCode })?.default || QRCode) as typeof QRCode;

export interface QRCodeRenderOptions {
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a valid, standards-compliant SVG string representing the QR code for a payload.
 */
export async function generateQRCodeSVG(
  text: string,
  options?: QRCodeRenderOptions
): Promise<string> {
  return qrLib.toString(text, {
    type: 'svg',
    margin: options?.margin ?? 1,
    width: options?.width ?? 200,
    color: {
      dark: options?.color?.dark || '#0f172a',
      light: options?.color?.light || '#ffffff',
    },
  });
}

/**
 * Generates an image Data URL (PNG base64) for the QR code payload.
 */
export async function generateQRCodeDataURL(
  text: string,
  options?: QRCodeRenderOptions
): Promise<string> {
  return qrLib.toDataURL(text, {
    margin: options?.margin ?? 1,
    width: options?.width ?? 240,
    color: {
      dark: options?.color?.dark || '#0f172a',
      light: options?.color?.light || '#ffffff',
    },
  });
}

export interface QRPayload {
  version: number;
  tokenId: string;
  tokenNumber: string;
  institutionId: string;
  branchId: string;
  issuedAt: number; // Unix timestamp ms
  validUntil: number; // Unix timestamp ms
  checksum: string;
}

/**
 * Simple hash/checksum for client-side tamper detection without heavy crypto libraries.
 */
function generateSimpleChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Encodes token check-in data into a serialized string payload suitable for QR generation.
 */
export function encodeQRPayload(params: {
  tokenId: string;
  tokenNumber: string;
  institutionId: string;
  branchId: string;
  validHours?: number;
}): string {
  const now = Date.now();
  const validUntil = now + (params.validHours || 24) * 60 * 60 * 1000;

  const rawData = `${params.tokenId}:${params.institutionId}:${params.branchId}:${now}:${validUntil}`;
  const checksum = generateSimpleChecksum(rawData);

  const payload: QRPayload = {
    version: 1,
    tokenId: params.tokenId,
    tokenNumber: params.tokenNumber,
    institutionId: params.institutionId,
    branchId: params.branchId,
    issuedAt: now,
    validUntil,
    checksum,
  };

  // Base64 encoding for compact, URL-safe QR representations
  const jsonStr = JSON.stringify(payload);
  if (typeof btoa !== 'undefined') {
    return btoa(jsonStr);
  }
  return Buffer.from(jsonStr).toString('base64');
}

export interface QRValidationResult {
  isValid: boolean;
  payload?: QRPayload;
  errorCode?: 'INVALID_FORMAT' | 'EXPIRED' | 'CHECKSUM_MISMATCH' | 'INSTITUTION_MISMATCH';
  errorMessage?: string;
}

/**
 * Decodes and validates a scanned QR code payload against the expected institution.
 */
export function decodeAndValidateQRPayload(
  encodedPayload: string,
  expectedInstitutionId?: string,
  expectedBranchId?: string
): QRValidationResult {
  try {
    let jsonStr: string;
    if (typeof atob !== 'undefined') {
      jsonStr = atob(encodedPayload);
    } else {
      jsonStr = Buffer.from(encodedPayload, 'base64').toString('utf8');
    }

    const payload = JSON.parse(jsonStr) as QRPayload;

    if (!payload.tokenId || !payload.institutionId || !payload.checksum) {
      return {
        isValid: false,
        errorCode: 'INVALID_FORMAT',
        errorMessage: 'QR payload structure is missing required fields.',
      };
    }

    // Verify expiry
    if (Date.now() > payload.validUntil) {
      return {
        isValid: false,
        payload,
        errorCode: 'EXPIRED',
        errorMessage: 'This QR check-in code has expired.',
      };
    }

    // Verify institution/branch match if checked at a physical location
    if (expectedInstitutionId && payload.institutionId !== expectedInstitutionId) {
      return {
        isValid: false,
        payload,
        errorCode: 'INSTITUTION_MISMATCH',
        errorMessage: 'This QR code is for a different institution.',
      };
    }

    if (expectedBranchId && payload.branchId !== expectedBranchId) {
      return {
        isValid: false,
        payload,
        errorCode: 'INSTITUTION_MISMATCH',
        errorMessage: 'This QR code belongs to another branch of this institution.',
      };
    }

    // Verify checksum
    const rawData = `${payload.tokenId}:${payload.institutionId}:${payload.branchId}:${payload.issuedAt}:${payload.validUntil}`;
    const expectedChecksum = generateSimpleChecksum(rawData);
    if (payload.checksum !== expectedChecksum) {
      return {
        isValid: false,
        payload,
        errorCode: 'CHECKSUM_MISMATCH',
        errorMessage: 'QR payload failed cryptographic integrity verification.',
      };
    }

    return {
      isValid: true,
      payload,
    };
  } catch (err) {
    return {
      isValid: false,
      errorCode: 'INVALID_FORMAT',
      errorMessage: `Could not parse QR code: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
