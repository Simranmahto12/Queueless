import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bookToken,
  callNextToken,
  markTokenServed,
  skipToken,
  recallToken,
  undoTokenAction,
  dispatchTicketNotification,
  validatePhoneNumber,
  listenBranchTokens,
  listenCounters,
  TokenStatus,
  TokenPriority,
  CounterStatus,
  MOCK_INSTITUTIONS,
  MOCK_COUNTERS,
} from '../../shared';

test('Physical Operations, Counter Station & Walk-in Kiosk Workflow', async (t) => {
  const institution = MOCK_INSTITUTIONS[0]; // Apex City Hospital
  const branchId = 'branch-apex-main';
  const departmentId = 'dep-cardio';
  const serviceId = 'srv-ecg';
  const counterId = 'ctr-cardio-02';

  let testTokenId = '';
  let testTokenNumber = '';

  await t.test('1. Walk-In Kiosk generates immediate walk-in token', async () => {
    const today = new Date().toISOString().split('T')[0];
    const token = await bookToken({
      institutionId: institution.institutionId,
      branchId,
      departmentId,
      serviceId,
      visitorName: 'Walk-in Visitor',
      visitorPhone: '+1 (555) 987-6543',
      targetDate: today,
      priority: TokenPriority.EMERGENCY,
    });

    assert.ok(token.tokenId);
    assert.ok(token.tokenNumber.startsWith('T-'));
    assert.equal(token.visitorName, 'Walk-in Visitor');
    assert.equal(token.status, TokenStatus.ISSUED);

    testTokenId = token.tokenId;
    testTokenNumber = token.tokenNumber;
  });

  await t.test('2. Kiosk Notification Dispatcher validates phone and records consent', async () => {
    // Valid Phone format validation
    assert.equal(validatePhoneNumber('+15559876543'), true);
    assert.equal(validatePhoneNumber('invalid-phone'), false);

    // Rejection if consent is false
    await assert.rejects(
      async () => {
        await dispatchTicketNotification({
          channel: 'SMS',
          recipientPhone: '+15559876543',
          hasUserConsent: false,
          institutionId: institution.institutionId,
          branchId,
          tokenNumber: testTokenNumber,
          departmentName: 'Cardiology',
          estimatedWaitMinutes: 15,
        });
      },
      (err: Error) => {
        assert.match(err.message, /consent is strictly required/i);
        return true;
      }
    );

    // Transparent notification status report with consent
    const res = await dispatchTicketNotification({
      channel: 'SMS',
      recipientPhone: '+15559876543',
      hasUserConsent: true,
      institutionId: institution.institutionId,
      branchId,
      tokenNumber: testTokenNumber,
      departmentName: 'Cardiology',
      estimatedWaitMinutes: 15,
    });

    assert.equal(res.channel, 'SMS');
    assert.equal(res.recipientPhone, '+15559876543');
    assert.ok(res.dispatchedAt);
  });

  await t.test('3. TV Display listener receives queue update', async () => {
    let receivedTokensCount = 0;
    const unsub = listenBranchTokens(institution.institutionId, branchId, (tokens) => {
      receivedTokensCount = tokens.length;
    });

    assert.ok(receivedTokensCount > 0, 'TV Display listener receives tokens');
    unsub();
  });

  await t.test('4. Counter Station: Call Next token summons visitor to counter', async () => {
    const calledToken = await callNextToken({
      institutionId: institution.institutionId,
      branchId,
      counterId,
      staffId: 'usr-admin-apex',
    });

    assert.ok(calledToken, 'callNextToken should return called token');
    assert.equal(calledToken.status, TokenStatus.CALLED);

    // Verify counter status via listener
    let counter: any = null;
    const unsub = listenCounters(institution.institutionId, branchId, (counters) => {
      counter = counters.find((c) => c.counterId === counterId);
    });

    assert.ok(counter);
    assert.equal(counter.status, CounterStatus.BUSY);
    assert.equal(counter.currentServedTokenId, calledToken.tokenId);
    unsub();
  });

  await t.test('5. Counter Station: Staff skips token with preset reason chip', async () => {
    const reason = 'No Show — configured call attempts completed';
    await skipToken(testTokenId, counterId, reason);

    // Counter becomes OPEN again
    let counter: any = null;
    const unsub = listenCounters(institution.institutionId, branchId, (counters) => {
      counter = counters.find((c) => c.counterId === counterId);
    });

    assert.ok(counter);
    assert.equal(counter.status, CounterStatus.OPEN);
    unsub();
  });

  await t.test('6. Counter Station: 5-Second Undo restores skipped token', async () => {
    const undoRes = await undoTokenAction(testTokenId, TokenStatus.CALLED, counterId);
    assert.equal(undoRes.success, true);
    assert.match(undoRes.message, /restored to CALLED/i);

    // Counter becomes BUSY again with restored token
    let counter: any = null;
    const unsub = listenCounters(institution.institutionId, branchId, (counters) => {
      counter = counters.find((c) => c.counterId === counterId);
    });

    assert.ok(counter);
    assert.equal(counter.status, CounterStatus.BUSY);
    assert.equal(counter.currentServedTokenId, testTokenId);
    unsub();
  });

  await t.test('7. Counter Station: Re-broadcast recall chime for present token', async () => {
    await recallToken(testTokenId);
  });

  await t.test('8. Counter Station: Complete token finishes service', async () => {
    await markTokenServed(testTokenId, counterId);

    // Irreversible protection check: cannot undo completed token
    await assert.rejects(
      async () => {
        await undoTokenAction(testTokenId, TokenStatus.CALLED, counterId);
      },
      (err: Error) => {
        assert.match(err.message, /cannot be undone/i);
        return true;
      }
    );
  });
});
