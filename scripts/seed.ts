/**
 * QueueLess Database Seeder CLI
 * Usage: npm run seed:db
 */

import { seedFirestoreDatabase } from '../shared/services/firebase/seedService';

async function main() {
  console.log('----------------------------------------------------');
  console.log(' QueueLess Firestore Seeder');
  console.log('----------------------------------------------------');

  if (process.env.QUEUELESS_ENABLE_FIRESTORE_SEEDING !== 'true') {
    console.error(
      '[ERROR] Seeding is disabled. Set QUEUELESS_ENABLE_FIRESTORE_SEEDING=true to explicitly enable development seeding.'
    );
    process.exit(1);
  }

  if (
    process.env.USE_FIREBASE_EMULATOR !== 'true' &&
    process.env.EXPO_PUBLIC_USE_EMULATOR !== 'true'
  ) {
    console.error(
      '[ERROR] Seeding is restricted to the Firebase Emulator. Set USE_FIREBASE_EMULATOR=true.'
    );
    process.exit(1);
  }

  const result = await seedFirestoreDatabase();
  if (result.success) {
    console.log(`[SUCCESS] ${result.message}`);
    process.exit(0);
  } else {
    console.error(`[ERROR] ${result.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
