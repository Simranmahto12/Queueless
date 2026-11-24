import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerVisitor,
  loginUser,
  logoutUser,
  resetUserPassword,
  bookToken,
  listenVisitorTokens,
  cancelToken,
  UserRole,
  TokenStatus,
  TokenPriority,
  MOCK_INSTITUTIONS,
  InstitutionSector,
} from '../../shared';

test('Visitor Web Portal & Admin Route Separation Workflow', async (t) => {
  const visitorEmail = `web.visitor.${Date.now()}@example.com`;
  const visitorPass = 'WebSecurePass123!';
  const visitorName = 'Jessica Vance';

  await t.test('1. Visitor registers through Web Registration (/visitor/register)', async () => {
    const user = await registerVisitor({
      displayName: visitorName,
      email: visitorEmail,
      phone: '+1 (555) 789-0123',
      password: visitorPass,
    });

    assert.equal(user.displayName, visitorName);
    assert.equal(user.email, visitorEmail);
    assert.equal(user.role, UserRole.VISITOR);
  });

  await t.test('2. Visitor logs in through Web Login (/visitor/login)', async () => {
    const user = await loginUser(visitorEmail, visitorPass);
    assert.equal(user.email, visitorEmail);
    assert.equal(user.role, UserRole.VISITOR);
  });

  await t.test('3. Visitor is strictly rejected when attempting Admin Portal login (/admin/login)', async () => {
    await assert.rejects(
      async () => {
        await loginUser(visitorEmail, visitorPass, { requireAdminOrStaff: true });
      },
      (err: Error) => {
        assert.match(err.message, /visitor/i);
        return true;
      }
    );
  });

  await t.test('4. Authorized Institution Administrator logs in successfully (/admin/login)', async () => {
    const admin = await loginUser('admin.sarah@apexhealth.org', 'securePass', {
      requireAdminOrStaff: true,
    });
    assert.equal(admin.role, UserRole.INSTITUTION_ADMIN);
    assert.equal(admin.institutionId, 'inst-apex-health');
  });

  await t.test('5. Multi-Sector Directory covers all four core sectors', () => {
    const sectors = MOCK_INSTITUTIONS.map((i) => i.sector);
    assert.ok(sectors.includes(InstitutionSector.HEALTHCARE), 'Healthcare sector present');
    assert.ok(sectors.includes(InstitutionSector.BANKING), 'Banking sector present');
    assert.ok(sectors.includes(InstitutionSector.GOVERNMENT), 'Government sector present');
    assert.ok(sectors.includes(InstitutionSector.EDUCATION), 'Education sector present');
  });

  await t.test('6. Visitor books token through Web Dashboard (/visitor/dashboard)', async () => {
    const visitor = await loginUser(visitorEmail, visitorPass);
    const token = await bookToken({
      institutionId: 'inst-metro-univ',
      branchId: 'branch-metro-main',
      departmentId: 'dept-univ-admissions',
      serviceId: 'srv-univ-undergrad',
      visitorId: visitor.id,
      visitorName: visitor.displayName,
      visitorEmail: visitor.email,
      targetDate: '2026-11-25',
      targetSlotTime: '11:00',
      priority: TokenPriority.STANDARD,
    });

    assert.ok(token.tokenId);
    assert.ok(token.tokenNumber.startsWith('T-'));
    assert.equal(token.visitorId, visitor.id);
    assert.equal(token.status, TokenStatus.ISSUED);
    assert.ok(token.scheduledSlot.startTime);

    // Verify visitor real-time listener receives the active token
    let receivedActiveTokenNumber = '';
    const unsubscribe = listenVisitorTokens(visitor.id, ({ active }) => {
      if (active) receivedActiveTokenNumber = active.tokenNumber;
    });

    assert.equal(receivedActiveTokenNumber, token.tokenNumber);
    unsubscribe();

    // Visitor cancels token
    await cancelToken(token.tokenId, 'Visitor rescheduled');
  });

  await t.test('7. Visitor requests password reset (/visitor/forgot-password)', async () => {
    const res = await resetUserPassword(visitorEmail);
    assert.equal(res.success, true);
    assert.match(res.message, /password reset/i);
  });

  await t.test('8. Logout clears session', async () => {
    await logoutUser();
  });
});
