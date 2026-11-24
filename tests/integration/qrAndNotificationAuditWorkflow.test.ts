import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import {
  bookToken,
  decodeAndValidateQRPayload,
  generateQRCodeSVG,
  generateQRCodeDataURL,
  checkInVisitorWithQR,
  dispatchTicketNotification,
  getAuditLogs,
  AuditAction,
  TokenStatus,
  UserRole,
} from '../../shared';

describe('QR Code Lifecycle, Notification Dispatch & System Audit Logging Integration', () => {
  const targetDate = new Date().toISOString().split('T')[0];
  const testPhone = '+1 (555) 019-9876';
  let bookedToken: any = null;

  it('Step 1: Books a slot, generates real scannable QR payload and logs TOKEN_CREATED in system history', async () => {
    bookedToken = await bookToken({
      institutionId: 'inst-apex-health',
      branchId: 'branch-apex-main',
      departmentId: 'dep-cardio',
      serviceId: 'srv-ecg',
      visitorId: 'usr-visitor-sim-01',
      visitorName: 'Elena Rostova',
      visitorPhone: testPhone,
      visitorEmail: 'elena.rostova@example.com',
      targetDate,
      targetSlotTime: '10:30',
    });

    assert.ok(bookedToken, 'Token must be booked');
    assert.strictEqual(bookedToken.status, TokenStatus.ISSUED);
    assert.ok(bookedToken.qrCodeValue, 'Token must carry cryptographic QR payload');

    // Verify QR payload integrity
    const qrValidation = decodeAndValidateQRPayload(
      bookedToken.qrCodeValue,
      'inst-apex-health',
      'branch-apex-main'
    );
    assert.strictEqual(qrValidation.isValid, true);
    assert.strictEqual(qrValidation.payload?.tokenId, bookedToken.tokenId);
    assert.strictEqual(qrValidation.payload?.tokenNumber, bookedToken.tokenNumber);

    // Verify authentic 2D matrix barcode generation (SVG & DataURL)
    const svgOutput = await generateQRCodeSVG(bookedToken.qrCodeValue);
    assert.ok(svgOutput.includes('<svg'), 'Real QR SVG must be generated');
    assert.ok(svgOutput.includes('viewBox='), 'Real QR SVG must have viewBox');

    const dataUrlOutput = await generateQRCodeDataURL(bookedToken.qrCodeValue);
    assert.ok(dataUrlOutput.startsWith('data:image/png;base64,'), 'Real QR DataURL must be generated');

    // Verify action logged in system history
    const auditLogs = await getAuditLogs('inst-apex-health');
    const createdLog = auditLogs.find(
      (l) => l.action === AuditAction.TOKEN_CREATED && l.targetEntityId === bookedToken.tokenId
    );
    assert.ok(createdLog, 'Token creation event must be recorded in system history');
    assert.strictEqual(createdLog.performedByUserId, 'usr-visitor-sim-01');
    assert.ok(createdLog.details?.includes('Elena Rostova'));
    assert.ok(createdLog.details?.includes(testPhone));
  });

  it('Step 2: Dispatches ticket details via SMS to user phone number and logs notification in system history', async () => {
    const notifResponse = await dispatchTicketNotification({
      channel: 'SMS',
      recipientPhone: testPhone,
      hasUserConsent: true,
      institutionId: 'inst-apex-health',
      branchId: 'branch-apex-main',
      tokenNumber: bookedToken.tokenNumber,
      departmentName: 'Cardiology & Vascular Center',
      estimatedWaitMinutes: bookedToken.estimatedWaitMinutes || 12,
      qrPayload: bookedToken.qrCodeValue,
    });

    assert.ok(notifResponse, 'Notification response must exist');
    assert.strictEqual(notifResponse.recipientPhone, testPhone);
    assert.strictEqual(notifResponse.channel, 'SMS');

    // Verify dispatch event logged in system history
    const auditLogs = await getAuditLogs('inst-apex-health');
    const notifLog = auditLogs.find(
      (l) => l.targetEntity === 'NOTIFICATION' && l.targetEntityId === bookedToken.tokenNumber
    );
    assert.ok(notifLog, 'SMS notification dispatch must be recorded in system history');
    assert.ok(notifLog.details?.includes(testPhone));
    assert.ok(notifLog.details?.includes(bookedToken.tokenNumber));
  });

  it('Step 3: First QR scan succeeds, checks in visitor, and logs check-in in system history', async () => {
    const checkInResult = await checkInVisitorWithQR({
      qrPayload: bookedToken.qrCodeValue,
      expectedInstitutionId: 'inst-apex-health',
      expectedBranchId: 'branch-apex-main',
      targetZoneId: 'zone-apex-cardio',
    });

    assert.strictEqual(checkInResult.success, true);
    assert.ok(checkInResult.checkIn);
    assert.strictEqual(checkInResult.checkIn.tokenId, bookedToken.tokenId);

    // Verify check-in event logged in system history
    const auditLogs = await getAuditLogs('inst-apex-health');
    const checkInLog = auditLogs.find(
      (l) =>
        l.action === AuditAction.TOKEN_STATUS_CHANGE &&
        l.targetEntityId === bookedToken.tokenId &&
        l.details?.includes('QR Code check-in verified')
    );
    assert.ok(checkInLog, 'QR check-in verification must be recorded in system history');
    assert.ok(checkInLog.details?.includes('Single-use QR pass expired'));
  });

  it('Step 4: Second QR scan is strictly rejected to enforce single-use pass expiration', async () => {
    const duplicateResult = await checkInVisitorWithQR({
      qrPayload: bookedToken.qrCodeValue,
      expectedInstitutionId: 'inst-apex-health',
      expectedBranchId: 'branch-apex-main',
      targetZoneId: 'zone-apex-cardio',
    });

    assert.strictEqual(duplicateResult.success, false);
    assert.ok(
      duplicateResult.errorMessage?.toLowerCase().includes('already checked in'),
      'Duplicate scan must be rejected with already checked in error'
    );
  });
});
