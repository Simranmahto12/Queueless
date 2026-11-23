/**
 * QueueLess Database Seeder CLI
 * Usage: npm run seed:db
 */

import { seedFirestoreDatabase } from './shared/services/firebase/seedService';

async function main() {
  console.log('----------------------------------------------------');
  console.log(' QueueLess Firestore Seeder');
  console.log('----------------------------------------------------');

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
