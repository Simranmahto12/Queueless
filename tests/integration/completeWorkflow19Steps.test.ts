import test from 'node:test';
import assert from 'node:assert/strict';

import {
  registerVisitor,
  loginUser,
  logoutUser,
} from '../../shared/services/firebase/authService';
import {
  bookToken,
  callNextToken,
  markTokenServed,
  listenBranchTokens,
  listenVisitorTokens,
} from '../../shared/services/firebase/tokenService';
import {
  checkInVisitorWithQR,
  checkOutVisitor,
  listenZones,
} from '../../shared/services/firebase/occupancyService';
import { decodeAndValidateQRPayload } from '../../shared/services/qrService';
import {
  MOCK_INSTITUTIONS,
  MOCK_BRANCHES,
  MOCK_DEPARTMENTS,
  MOCK_SERVICES,
  MOCK_COUNTERS,
} from '../../shared/services/mockData';
import { UserRole, TokenStatus, TokenPriority } from '../../shared/types/enums';
import { Token } from '../../shared/types/models';

test('19-Step Complete End-to-End Workflow Verification', async (t) => {
  let visitorUser: any = null;
  let bookedToken: Token | null = null;
  let adminUser: any = null;
  const targetDate = '2026-11-26';
  const targetSlot = '10:30';

  // Step 1: Register a new visitor
  await t.test('Step 1: Register a new visitor independently', async () => {
    visitorUser = await registerVisitor({
      displayName: 'Marcus Aurelius',
      email: 'marcus.aurelius@stoic.org',
      password: 'StoicPass2026!',
      phone: '+1 (555) 333-2211',
    });

    assert.ok(visitorUser.userId, 'Visitor must have unique userId');
    assert.equal(visitorUser.email, 'marcus.aurelius@stoic.org');
    assert.equal(visitorUser.role, UserRole.VISITOR, 'Role must strictly be locked to VISITOR');
  });

  // Step 2: Log in as that visitor
  await t.test('Step 2: Log in as that visitor on mobile client', async () => {
    const session = await loginUser('marcus.aurelius@stoic.org', 'StoicPass2026!');
    assert.equal(session.userId, visitorUser.userId);
    assert.equal(session.displayName, 'Marcus Aurelius');
    assert.equal(session.role, UserRole.VISITOR);
  });

  // Step 3: Discover an institution
  let selectedInstitution: any = null;
  await t.test('Step 3: Discover institution across multi-sector directory', async () => {
    selectedInstitution = MOCK_INSTITUTIONS.find((i) => i.institutionId === 'inst-apex-health');
    assert.ok(selectedInstitution, 'Institution should be discovered');
    assert.equal(selectedInstitution.name, 'Apex City Hospital & Medical Center');
  });

  // Step 4: Select a branch
  let selectedBranch: any = null;
  await t.test('Step 4: Select an authorized branch of the institution', async () => {
    selectedBranch = MOCK_BRANCHES.find(
      (b) => b.institutionId === selectedInstitution.institutionId && b.branchId === 'branch-apex-main'
    );
    assert.ok(selectedBranch, 'Branch should be found');
    assert.equal(selectedBranch.code, 'DWTN-01');
  });

  // Step 5: Select a department
  let selectedDepartment: any = null;
  await t.test('Step 5: Select department under branch', async () => {
    selectedDepartment = MOCK_DEPARTMENTS.find(
      (d) => d.branchId === selectedBranch.branchId && d.departmentId === 'dep-cardio'
    );
    assert.ok(selectedDepartment, 'Cardiology department should be found');
    assert.equal(selectedDepartment.code, 'DEP-CARDIO');
  });

  // Step 6: Select a service
  let selectedService: any = null;
  await t.test('Step 6: Select service procedure and view duration', async () => {
    selectedService = MOCK_SERVICES.find(
      (s) => s.departmentId === selectedDepartment.departmentId && s.serviceId === 'srv-ecg'
    );
    assert.ok(selectedService, 'ECG service should be found');
    assert.equal(selectedService.estimatedDurationMinutes, 12);
  });

  // Step 7: Book a token
  await t.test('Step 7: Book a digital token with slot validation', async () => {
    bookedToken = await bookToken({
      institutionId: selectedInstitution.institutionId,
      branchId: selectedBranch.branchId,
      departmentId: selectedDepartment.departmentId,
      serviceId: selectedService.serviceId,
      visitorId: visitorUser.userId,
      visitorName: visitorUser.displayName,
      visitorEmail: visitorUser.email,
      visitorPhone: visitorUser.phone,
      priority: TokenPriority.EMERGENCY,
      targetDate,
      targetSlotTime: targetSlot,
    });

    assert.ok(bookedToken, 'Token booking should succeed');
    assert.equal(bookedToken.status, TokenStatus.ISSUED);
    assert.equal(bookedToken.scheduledSlot.date, targetDate);
  });

  // Step 8: Verify unique token generation
  await t.test('Step 8: Verify unique token number and cryptographic QR generation', async () => {
    assert.ok(bookedToken?.tokenId, 'Unique tokenId required');
    assert.ok(
      bookedToken?.tokenNumber.includes('CARD') && bookedToken?.tokenNumber.startsWith('T-'),
      'Token number should have department code and standard prefix'
    );
    assert.ok(bookedToken?.qrCodeValue, 'Cryptographic QR payload must be generated');
  });

  // Step 9: Retrieve the token (Visitor app session restoration)
  await t.test('Step 9: Retrieve active token after reopening visitor application', async () => {
    let retrievedActiveToken: Token | null = null;
    const unsub = listenVisitorTokens(visitorUser.userId, ({ active }) => {
      retrievedActiveToken = active;
    });

    assert.ok(retrievedActiveToken, 'Active token must be restored');
    assert.equal((retrievedActiveToken as any).tokenId, bookedToken?.tokenId);
    unsub();
  });

  // Step 10: Log in as an authorised administrator on the admin portal
  await t.test('Step 10: Log in as authorised administrator on admin portal', async () => {
    adminUser = await loginUser('admin@apexhealth.org', 'AdminPass123!', {
      requireAdminOrStaff: true,
    });
    assert.ok(adminUser, 'Admin login should succeed');
    assert.equal(adminUser.role, UserRole.INSTITUTION_ADMIN);
    assert.equal(adminUser.institutionId, selectedInstitution.institutionId);
  });

  // Step 11: Verify that the same token appears in the admin dashboard
  await t.test('Step 11: Verify that the newly booked token appears in admin dashboard', async () => {
    let dashboardTokens: Token[] = [];
    const unsub = listenBranchTokens(
      selectedInstitution.institutionId,
      selectedBranch.branchId,
      (tokens) => {
        dashboardTokens = tokens;
      }
    );

    const found = dashboardTokens.find((t) => t.tokenId === bookedToken?.tokenId);
    assert.ok(found, 'Booked token must be visible in admin queue stream');
    assert.equal(found.visitorName, 'Marcus Aurelius');
    unsub();
  });

  // Step 12: Call the next token
  let calledToken: Token | null = null;
  await t.test('Step 12: Call next token from counter 01 in admin console', async () => {
    calledToken = await callNextToken({
      institutionId: selectedInstitution.institutionId,
      branchId: selectedBranch.branchId,
      counterId: 'ctr-cardio-01',
      staffId: 'usr-admin-apex',
    });

    assert.ok(calledToken, 'callNextToken should return called token');
    assert.equal(calledToken.status, TokenStatus.CALLED);
    assert.equal(calledToken.assignedCounterId, 'ctr-cardio-01');
  });

  // Step 13: Verify automatic queue updates in the visitor application
  await t.test('Step 13: Verify automatic real-time update in visitor app', async () => {
    let liveVisitorToken: Token | null = null;
    const unsub = listenVisitorTokens(visitorUser.userId, ({ active }) => {
      liveVisitorToken = active;
    });

    assert.ok(liveVisitorToken);
    assert.equal((liveVisitorToken as any).status, TokenStatus.CALLED);
    assert.equal((liveVisitorToken as any).assignedCounterId, 'ctr-cardio-01');
    unsub();
  });

  // Step 14: Scan and validate the QR code
  await t.test('Step 14: Scan and validate cryptographic QR code', async () => {
    const scanResult = decodeAndValidateQRPayload(
      bookedToken!.qrCodeValue!,
      selectedInstitution.institutionId,
      selectedBranch.branchId
    );

    assert.equal(scanResult.isValid, true);
    assert.equal(scanResult.payload?.tokenId, bookedToken!.tokenId);
  });

  // Step 15: Check in the visitor
  const testZoneId = 'zone-apex-cardio';
  await t.test('Step 15: Check in the visitor and record check-in event', async () => {
    const checkInRes = await checkInVisitorWithQR({
      qrPayload: bookedToken!.qrCodeValue!,
      expectedInstitutionId: selectedInstitution.institutionId,
      expectedBranchId: selectedBranch.branchId,
      targetZoneId: testZoneId,
    });

    assert.equal(checkInRes.success, true);
    assert.equal(checkInRes.checkIn?.tokenId, bookedToken!.tokenId);
  });

  // Step 16: Verify occupancy increases
  let initialOccupancy = 0;
  await t.test('Step 16: Verify zone occupancy increases', async () => {
    let zonesList: any[] = [];
    const unsub = listenZones(selectedInstitution.institutionId, selectedBranch.branchId, (zones) => {
      zonesList = zones;
    });

    const targetZone = zonesList.find((z) => z.zoneId === testZoneId);
    assert.ok(targetZone);
    initialOccupancy = targetZone.currentOccupancy;
    assert.ok(initialOccupancy >= 1, 'Occupancy should be incremented');
    unsub();
  });

  // Step 17: Check out the visitor
  await t.test('Step 17: Check out the visitor upon consultation departure', async () => {
    await checkOutVisitor({
      tokenId: bookedToken!.tokenId,
      zoneId: testZoneId,
      institutionId: selectedInstitution.institutionId,
    });
  });

  // Step 18: Verify occupancy decreases
  await t.test('Step 18: Verify zone occupancy decreases without negative bounds', async () => {
    let zonesList: any[] = [];
    const unsub = listenZones(selectedInstitution.institutionId, selectedBranch.branchId, (zones) => {
      zonesList = zones;
    });

    const targetZone = zonesList.find((z) => z.zoneId === testZoneId);
    assert.ok(targetZone);
    assert.equal(targetZone.currentOccupancy, initialOccupancy - 1);
    assert.ok(targetZone.currentOccupancy >= 0, 'Occupancy must never be negative');
    unsub();
  });

  // Step 19: Verify booking history
  await t.test('Step 19: Complete visit and verify visitor booking history', async () => {
    await markTokenServed(bookedToken!.tokenId, 'ctr-cardio-01');

    let historyRecords: Token[] = [];
    const unsub = listenVisitorTokens(visitorUser.userId, ({ history }) => {
      historyRecords = history;
    });

    const completed = historyRecords.find((t) => t.tokenId === bookedToken!.tokenId);
    assert.ok(completed, 'Token must exist in visitor history');
    assert.equal(completed.status, TokenStatus.COMPLETED);
    unsub();
  });
});
