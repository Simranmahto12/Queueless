import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  recordAuditLog,
  getAuditLogs,
  listenAuditLogs,
} from '../../shared/services/firebase/auditService';
import { AuditAction, UserRole } from '../../shared/types/enums';

describe('System Audit & History Logging Service', () => {
  it('should record an immutable audit log entry in system history', async () => {
    const log = await recordAuditLog({
      institutionId: 'inst-metro-health',
      branchId: 'branch-metro-main',
      action: AuditAction.TOKEN_CREATED,
      performedByUserId: 'usr-visitor-test',
      performedByRole: UserRole.VISITOR,
      targetEntity: 'TOKEN',
      targetEntityId: 'tok-audit-001',
      details: 'Token T-CARD-999 booked with SMS notification to +1 555-0199',
    });

    assert.ok(log.logId.startsWith('log-'));
    assert.strictEqual(log.action, AuditAction.TOKEN_CREATED);
    assert.strictEqual(log.performedByUserId, 'usr-visitor-test');
    assert.strictEqual(log.targetEntityId, 'tok-audit-001');
    assert.ok(log.createdAt);

    const logs = await getAuditLogs('inst-metro-health');
    const found = logs.find((l) => l.targetEntityId === 'tok-audit-001');
    assert.ok(found, 'Recorded audit log should be present in history retrieval');
  });

  it('should stream audit events to real-time subscribers', async () => {
    let capturedLogsCount = 0;
    const unsub = listenAuditLogs('inst-realtime-test', (logs) => {
      capturedLogsCount = logs.length;
    });

    await recordAuditLog({
      institutionId: 'inst-realtime-test',
      action: AuditAction.TOKEN_STATUS_CHANGE,
      performedByUserId: 'staff-qr-scanner',
      performedByRole: UserRole.COUNTER_STAFF,
      targetEntity: 'TOKEN',
      targetEntityId: 'tok-stream-002',
      details: 'Visitor QR verified. Single-use QR pass expired.',
    });

    assert.ok(capturedLogsCount >= 1, 'Subscriber must receive updated audit stream');
    unsub();
  });
});
