import test from 'node:test';
import assert from 'node:assert/strict';
import { seedFirestoreDatabase } from '../../shared/services/firebase/seedService';

test('Firestore seeding is disabled without explicit development opt-in', async () => {
  const previousValue = process.env.QUEUELESS_ENABLE_FIRESTORE_SEEDING;
  delete process.env.QUEUELESS_ENABLE_FIRESTORE_SEEDING;

  try {
    const result = await seedFirestoreDatabase();
    assert.equal(result.success, false);
    assert.equal(result.count, 0);
    assert.match(result.message, /Explicitly enable it/);
  } finally {
    if (previousValue === undefined) {
      delete process.env.QUEUELESS_ENABLE_FIRESTORE_SEEDING;
    } else {
      process.env.QUEUELESS_ENABLE_FIRESTORE_SEEDING = previousValue;
    }
  }
});
