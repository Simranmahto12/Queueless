import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerVisitor,
  provisionStaffOrAdmin,
  loginUser,
  resetUserPassword,
  logoutUser,
  subscribeAuth,
  hasAdminPermission,
} from '../../shared/services/firebase/authService';
import { UserRole } from '../../shared/types/enums';

test('QueueLess Authentication & RBAC Suite', async (t) => {
  await t.test('1. Visitor can independently register and role is locked to VISITOR', async () => {
    const visitor = await registerVisitor({
      displayName: 'Alice Cooper',
      email: 'alice.cooper@example.com',
      password: 'SecurePass123!',
      phone: '+1 (555) 888-9999',
    });

    assert.equal(visitor.email, 'alice.cooper@example.com');
    assert.equal(visitor.displayName, 'Alice Cooper');
    assert.equal(visitor.role, UserRole.VISITOR);
    assert.equal(visitor.isActive, true);
    assert.ok(visitor.userId, 'User should have assigned ID');
  });

  await t.test('2. Duplicate registration with same email is rejected', async () => {
    await assert.rejects(
      async () => {
        await registerVisitor({
          displayName: 'Alice Duplicate',
          email: 'alice.cooper@example.com',
          password: 'Password999!',
        });
      },
      /already exists/
    );
  });

  await t.test('3. Visitor can log in with correct credentials on mobile client', async () => {
    const loggedIn = await loginUser('alice.cooper@example.com', 'SecurePass123!');
    assert.equal(loggedIn.displayName, 'Alice Cooper');
    assert.equal(loggedIn.role, UserRole.VISITOR);
  });

  await t.test('4. Visitor is strictly BLOCKED from accessing Institution Admin console', async () => {
    await assert.rejects(
      async () => {
        await loginUser('alice.cooper@example.com', 'SecurePass123!', {
          requireAdminOrStaff: true,
        });
      },
      /This account is registered as a visitor/
    );
  });

  await t.test('5. Pre-seeded visitor (David Miller) is also blocked from admin console', async () => {
    await assert.rejects(
      async () => {
        await loginUser('visitor.david@example.com', 'VisitorPass123!', {
          requireAdminOrStaff: true,
        });
      },
      /This account is registered as a visitor/
    );
  });

  await t.test('6. Authorized institution admin can log into admin console', async () => {
    const admin = await loginUser('admin@apexhealth.org', 'AdminPass123!', {
      requireAdminOrStaff: true,
    });
    assert.equal(admin.displayName, 'Dr. Sarah Jenkins');
    assert.equal(admin.role, UserRole.INSTITUTION_ADMIN);
    assert.equal(hasAdminPermission(admin.role), true);
  });

  await t.test('6b. Priya Patel (priyachi89711@gmail.com) can log into admin console', async () => {
    const priyaAdmin = await loginUser('priyachi89711@gmail.com', '1234567890', {
      requireAdminOrStaff: true,
    });
    assert.equal(priyaAdmin.email, 'priyachi89711@gmail.com');
    assert.equal(priyaAdmin.displayName, 'Priya Patel');
    assert.equal(priyaAdmin.role, UserRole.INSTITUTION_ADMIN);
    assert.equal(hasAdminPermission(priyaAdmin.role), true);
  });

  await t.test('7. Authorized counter staff can log into admin console', async () => {
    const staff = await loginUser('staff.clara@apexhealth.org', 'StaffPass123!', {
      requireAdminOrStaff: true,
    });
    assert.equal(staff.displayName, 'Nurse Clara Oswald');
    assert.equal(staff.role, UserRole.COUNTER_STAFF);
    assert.equal(hasAdminPermission(staff.role), true);
  });

  await t.test('8. Password reset dispatches instructions without information leakage', async () => {
    const validReset = await resetUserPassword('admin@apexhealth.org');
    assert.equal(validReset.success, true);
    assert.ok(validReset.message.length > 0);

    const unknownReset = await resetUserPassword('nonexistent.user@random.org');
    assert.equal(unknownReset.success, true);
  });

  await t.test('9. Admin provisioning creates authorized staff and manager accounts', async () => {
    const newStaff = await provisionStaffOrAdmin({
      displayName: 'Pharmacist Bob Vance',
      email: 'bob.vance@apexhealth.org',
      password: 'StaffPass456!',
      role: UserRole.COUNTER_STAFF,
      institutionId: 'inst-apex-health',
      branchId: 'branch-apex-main',
      assignedCounterId: 'ctr-cardio-01',
    });

    assert.equal(newStaff.email, 'bob.vance@apexhealth.org');
    assert.equal(newStaff.role, UserRole.COUNTER_STAFF);
    assert.equal(newStaff.institutionId, 'inst-apex-health');

    // Verify Bob can log into admin console
    const bobLogin = await loginUser('bob.vance@apexhealth.org', 'StaffPass456!', {
      requireAdminOrStaff: true,
    });
    assert.equal(bobLogin.displayName, 'Pharmacist Bob Vance');
  });

  await t.test('10. Logout clears active session', async () => {
    let capturedUser: unknown = 'init';
    const unsubscribe = subscribeAuth((user) => {
      capturedUser = user;
    });

    await logoutUser();
    assert.equal(capturedUser, null);
    unsubscribe();
  });
});
