/**
 * QueueLess Secure Admin Provisioning CLI Tool
 *
 * Used by DevOps / Platform Administrators to provision initial authorized
 * administrators and managers without exposing public administrator registration.
 *
 * Usage:
 *   npx tsx scripts/createAdmin.ts --email admin@apexhealth.org --password AdminPass123! --name "Dr. Sarah Jenkins" --role INSTITUTION_ADMIN --institution inst-apex-health --branch branch-apex-main
 *
 * Or quick bootstrap:
 *   npm run create:admin
 */

import { provisionStaffOrAdmin } from '../shared/services/firebase/authService';
import { UserRole } from '../shared/types/enums';

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      params[key] = val;
      if (val !== 'true') i++;
    }
  }
  return params;
}

async function main() {
  console.log('====================================================');
  console.log('  QueueLess Authorized Administrator Provisioning');
  console.log('====================================================');

  const args = parseArgs();

  if (args.help || args.h) {
    console.log(`
Syntax:
  npx tsx scripts/createAdmin.ts [options]

Options:
  --email        Administrator institutional email (required)
  --password     Initial secure temporary password (min 6 chars, required)
  --name         Full display name of administrator (required)
  --role         SUPER_ADMIN | INSTITUTION_ADMIN | BRANCH_ADMIN | DEPARTMENT_MANAGER (default: INSTITUTION_ADMIN)
  --institution  Target institution ID (e.g. inst-apex-health) (default: inst-apex-health)
  --branch       Target branch ID (e.g. branch-apex-main) (default: branch-apex-main)
  --phone        Contact telephone number (optional)

Example:
  npx tsx scripts/createAdmin.ts --email admin@apexhealth.org --password AdminPass123! --name "Dr. Sarah Jenkins"
    `);
    process.exit(0);
  }

  const { email, password, name: displayName } = args;
  if (!email || !password || !displayName) {
    console.error('Error: --email, --password, and --name are required.');
    process.exit(1);
  }

  const roleStr = (args.role || 'INSTITUTION_ADMIN').toUpperCase();
  const institutionId = args.institution || 'inst-apex-health';
  const branchId = args.branch || 'branch-apex-main';
  const phone = args.phone || '+1 (555) 234-5678';

  const validRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.DEPARTMENT_MANAGER,
    UserRole.COUNTER_STAFF,
  ];

  const matchedRole = validRoles.find((r) => r === roleStr) || UserRole.INSTITUTION_ADMIN;

  console.log(`[PROVISIONING] Assigning elevated credentials:`);
  console.log(`  - Name:        ${displayName}`);
  console.log(`  - Email:       ${email}`);
  console.log(`  - Role:        ${matchedRole}`);
  console.log(`  - Institution: ${institutionId}`);
  console.log(`  - Branch:      ${branchId}`);
  console.log(`  - Password:    ${password.replace(/./g, '*')}`);

  try {
    const admin = await provisionStaffOrAdmin({
      email,
      password,
      displayName,
      phone,
      role: matchedRole,
      institutionId,
      branchId,
      authorizedByUserId: 'system-cli-provisioner',
    });

    console.log('----------------------------------------------------');
    console.log(`[SUCCESS] Account provisioned with verified role ${admin.role}.`);
    console.log(`[USER ID] ${admin.userId}`);
    console.log(`Ready to log into the Admin Console at http://localhost:5173`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error(`[FAILED] Error provisioning administrator account:`, err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal CLI execution error:', err);
  process.exit(1);
});
