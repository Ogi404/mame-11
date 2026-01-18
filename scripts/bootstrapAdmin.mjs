/**
 * Bootstrap the first admin user
 *
 * This script sets the 'admin' role on a user via Firebase custom claims.
 * Run this once to create your first admin, then use the app's admin UI.
 *
 * Usage:
 *   node scripts/bootstrapAdmin.mjs your-email@example.com
 *
 * Prerequisites:
 *   - Have gcloud CLI installed and authenticated: gcloud auth application-default login
 *   - OR set GOOGLE_APPLICATION_CREDENTIALS to a service account key file
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/bootstrapAdmin.mjs <email>');
  console.error('Example: node scripts/bootstrapAdmin.mjs coach@example.com');
  process.exit(1);
}

// Initialize with Application Default Credentials
// This works if you've run: gcloud auth application-default login
initializeApp({
  credential: applicationDefault(),
  projectId: 'mame-11',
});

async function bootstrapAdmin() {
  const auth = getAuth();

  try {
    // Find user by email
    const user = await auth.getUserByEmail(email);
    console.log(`Found user: ${user.uid} (${user.email})`);

    // Check current claims
    const currentRole = user.customClaims?.role;
    if (currentRole === 'admin') {
      console.log('User is already an admin. No changes made.');
      process.exit(0);
    }

    if (currentRole) {
      console.log(`Current role: ${currentRole}`);
    }

    // Set admin role
    await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`\nSuccess! Set 'admin' role for ${email}`);
    console.log('\nNext steps:');
    console.log('1. Sign out of the app');
    console.log('2. Sign back in to refresh your auth token');
    console.log('3. You should now have admin access');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`Error: No user found with email: ${email}`);
      console.error('Make sure the user has signed into the app at least once.');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }

  process.exit(0);
}

bootstrapAdmin();
