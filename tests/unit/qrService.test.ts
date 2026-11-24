import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import {
  encodeQRPayload,
  decodeAndValidateQRPayload,
  generateQRCodeSVG,
  generateQRCodeDataURL,
} from '../../shared/services/qrService';

describe('QR Service Encoding & Verification', () => {
  it('should encode and decode a valid check-in QR payload', () => {
    const encoded = encodeQRPayload({
      tokenId: 'token-abc-123',
      tokenNumber: 'A-101',
      institutionId: 'inst-metro-99',
      branchId: 'branch-main-01',
      validHours: 2,
    });

    assert.ok(typeof encoded === 'string' && encoded.length > 20);

    const validation = decodeAndValidateQRPayload(
      encoded,
      'inst-metro-99',
      'branch-main-01'
    );

    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.payload?.tokenId, 'token-abc-123');
    assert.strictEqual(validation.payload?.tokenNumber, 'A-101');
  });

  it('should reject QR codes scanned for the wrong institution', () => {
    const encoded = encodeQRPayload({
      tokenId: 'token-xyz',
      tokenNumber: 'B-202',
      institutionId: 'hospital-alpha',
      branchId: 'branch-1',
    });

    const validation = decodeAndValidateQRPayload(
      encoded,
      'bank-beta' // Expected institution mismatch
    );

    assert.strictEqual(validation.isValid, false);
    assert.strictEqual(validation.errorCode, 'INSTITUTION_MISMATCH');
  });

  it('should reject tampered QR codes that fail checksum validation', () => {
    const encoded = encodeQRPayload({
      tokenId: 'token-tamper',
      tokenNumber: 'C-303',
      institutionId: 'inst-1',
      branchId: 'branch-1',
    });

    // Tamper with payload
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    decoded.tokenId = 'token-hacked';
    const tamperedBase64 = Buffer.from(JSON.stringify(decoded)).toString('base64');

    const validation = decodeAndValidateQRPayload(tamperedBase64);
    assert.strictEqual(validation.isValid, false);
    assert.strictEqual(validation.errorCode, 'CHECKSUM_MISMATCH');
  });

  it('should generate valid standards-compliant SVG and DataURL QR codes', async () => {
    const payload = encodeQRPayload({
      tokenId: 'tok-qr-render-test',
      tokenNumber: 'T-TEST-99',
      institutionId: 'inst-1',
      branchId: 'branch-1',
    });

    const svgString = await generateQRCodeSVG(payload);
    assert.ok(svgString.includes('<svg'), 'SVG QR code should contain opening svg tag');
    assert.ok(svgString.includes('</svg>'), 'SVG QR code should contain closing svg tag');
    assert.ok(svgString.includes('viewBox='), 'SVG QR code should specify viewBox');

    const dataUrl = await generateQRCodeDataURL(payload);
    assert.ok(dataUrl.startsWith('data:image/png;base64,'), 'DataURL should be a base64 PNG');
    assert.ok(dataUrl.length > 100, 'DataURL should have valid image payload length');
  });
});
