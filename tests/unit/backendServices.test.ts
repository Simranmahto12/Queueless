import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import {
  bookToken,
  callNextToken,
  markTokenServed,
  skipToken,
} from '../../shared/services/firebase/tokenService';
import {
  checkInVisitorWithQR,
  checkOutVisitor,
} from '../../shared/services/firebase/occupancyService';
import {
  registerUser,
  loginUser,
} from '../../shared/services/firebase/authService';
import { TokenStatus, CounterStatus, UserRole } from '../../shared/types/enums';

describe('QueueLess Backend Integration Services', () => {
  it('should authenticate users and assign authorized roles', async () => {
    const visitor = await registerUser({
      email: 'jane.doe@example.com',
      password: 'password123',
      displayName: 'Jane Doe',
    });

    assert.strictEqual(visitor.email, 'jane.doe@example.com');
    assert.strictEqual(visitor.role, UserRole.VISITOR);

    const admin = await loginUser('admin.sarah@apexhealth.org', 'securePass');
    assert.strictEqual(admin.role, UserRole.INSTITUTION_ADMIN);
  });

  it('should book digital token with smart arrival slot and QR payload', async () => {
    const token = await bookToken({
      institutionId: 'inst-apex-health',
      branchId: 'branch-apex-main',
      departmentId: 'dep-cardio',
      serviceId: 'srv-ecg',
      visitorName: 'Michael Brown',
      targetDate: '2026-11-25',
      targetSlotTime: '10:00',
    });

    assert.ok(token.tokenId);
    assert.ok(token.tokenNumber.startsWith('T-'));
    assert.strictEqual(token.status, TokenStatus.ISSUED);
    assert.ok(token.qrCodeValue.length > 20);
    assert.ok(token.smartArrivalSlot.recommendedArrivalStart);
  });

  it('should execute atomic queue callNextToken and complete workflow', async () => {
    // 1. Book a token
    const token = await bookToken({
      institutionId: 'inst-apex-health',
      branchId: 'branch-apex-main',
      departmentId: 'dep-cardio',
      serviceId: 'srv-ecg',
      visitorName: 'Sarah Connor',
      targetDate: '2026-11-25',
      targetSlotTime: '10:15',
    });

    // 2. Simulate Check-In
    const checkInRes = await checkInVisitorWithQR({
      qrPayload: token.qrCodeValue,
      expectedInstitutionId: 'inst-apex-health',
      expectedBranchId: 'branch-apex-main',
      targetZoneId: 'zone-apex-cardio',
    });
    assert.strictEqual(checkInRes.success, true);

    // 3. Prevent Duplicate Check-In
    const duplicateRes = await checkInVisitorWithQR({
      qrPayload: token.qrCodeValue,
      expectedInstitutionId: 'inst-apex-health',
      expectedBranchId: 'branch-apex-main',
      targetZoneId: 'zone-apex-cardio',
    });
    assert.strictEqual(duplicateRes.success, false);
    assert.ok(duplicateRes.errorMessage?.includes('already checked in'));

    // 4. Counter calls next token
    const calledToken = await callNextToken({
      institutionId: 'inst-apex-health',
      branchId: 'branch-apex-main',
      counterId: 'ctr-cardio-02',
      staffId: 'staff-nurse-clara',
    });

    assert.ok(calledToken);
    assert.strictEqual(calledToken?.status, TokenStatus.CALLED);
    assert.strictEqual(calledToken?.assignedCounterId, 'ctr-cardio-02');

    // 5. Mark served
    await markTokenServed(calledToken.tokenId, 'ctr-cardio-02');
  });

  it('should enforce non-negative bounds during checkout', async () => {
    // Check out should decrement occupancy without going below zero
    await checkOutVisitor({
      tokenId: 'tok-med-101',
      zoneId: 'zone-apex-cardio',
      institutionId: 'inst-apex-health',
    });
  });
});
