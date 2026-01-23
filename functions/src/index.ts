import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

const db = getFirestore();

type UserRole = 'user' | 'editor' | 'admin';

/**
 * Cloud Function to set a user's role via custom claims.
 * Only admins can call this function.
 *
 * Usage from client:
 *   const setRole = httpsCallable(functions, 'setUserRole');
 *   await setRole({ targetEmail: 'user@example.com', role: 'editor' });
 */
export const setUserRole = onCall<{ targetEmail: string; role: UserRole }>(
  { region: 'europe-west4' },
  async (request) => {
    // 1. Verify caller is authenticated
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    // 2. Verify caller is admin
    const caller = await getAuth().getUser(callerUid);
    if (caller.customClaims?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can set roles');
    }

    // 3. Validate input
    const { targetEmail, role } = request.data;
    if (!targetEmail || typeof targetEmail !== 'string') {
      throw new HttpsError('invalid-argument', 'targetEmail is required');
    }
    if (!['user', 'editor', 'admin'].includes(role)) {
      throw new HttpsError('invalid-argument', 'Invalid role. Must be: user, editor, or admin');
    }

    // 4. Find target user by email
    let targetUser;
    try {
      targetUser = await getAuth().getUserByEmail(targetEmail);
    } catch {
      throw new HttpsError('not-found', `User with email ${targetEmail} not found`);
    }

    // 5. Prevent removing the last admin (optional safety check)
    if (targetUser.customClaims?.role === 'admin' && role !== 'admin') {
      // Could add logic here to check if there are other admins
      // For now, we'll allow it but log a warning
      console.warn(`Removing admin role from ${targetEmail}`);
    }

    // 6. Set custom claims
    await getAuth().setCustomUserClaims(targetUser.uid, { role });

    console.log(`Set role '${role}' for user ${targetEmail} (${targetUser.uid})`);

    return {
      success: true,
      message: `Role '${role}' set for ${targetEmail}`,
    };
  }
);

/**
 * Cloud Function to get a user's current role.
 * Any authenticated user can check their own role.
 * Admins can check any user's role.
 */
export const getUserRole = onCall<{ targetEmail?: string }>(
  { region: 'europe-west4' },
  async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const caller = await getAuth().getUser(callerUid);
    const callerRole = (caller.customClaims?.role as UserRole) || 'user';

    // If no targetEmail, return caller's own role
    const { targetEmail } = request.data;
    if (!targetEmail) {
      return {
        email: caller.email,
        role: callerRole,
      };
    }

    // Only admins can check other users' roles
    if (callerRole !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can check other users\' roles');
    }

    let targetUser;
    try {
      targetUser = await getAuth().getUserByEmail(targetEmail);
    } catch {
      throw new HttpsError('not-found', `User with email ${targetEmail} not found`);
    }

    return {
      email: targetUser.email,
      role: (targetUser.customClaims?.role as UserRole) || 'user',
      disabled: targetUser.disabled,
    };
  }
);

/**
 * Cloud Function to disable or enable a user account.
 * Only admins can call this function.
 * Disabled users cannot sign in until re-enabled.
 */
export const setUserDisabled = onCall<{ targetEmail: string; disabled: boolean }>(
  { region: 'europe-west4' },
  async (request) => {
    // 1. Verify caller is authenticated
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    // 2. Verify caller is admin
    const caller = await getAuth().getUser(callerUid);
    if (caller.customClaims?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can disable users');
    }

    // 3. Validate input
    const { targetEmail, disabled } = request.data;
    if (!targetEmail || typeof targetEmail !== 'string') {
      throw new HttpsError('invalid-argument', 'targetEmail is required');
    }
    if (typeof disabled !== 'boolean') {
      throw new HttpsError('invalid-argument', 'disabled must be a boolean');
    }

    // 4. Find target user by email
    let targetUser;
    try {
      targetUser = await getAuth().getUserByEmail(targetEmail);
    } catch {
      throw new HttpsError('not-found', `User with email ${targetEmail} not found`);
    }

    // 5. Prevent disabling yourself
    if (targetUser.uid === callerUid && disabled) {
      throw new HttpsError('failed-precondition', 'Cannot disable your own account');
    }

    // 6. Update disabled status
    await getAuth().updateUser(targetUser.uid, { disabled });

    const action = disabled ? 'disabled' : 'enabled';
    console.log(`User ${targetEmail} (${targetUser.uid}) ${action} by ${caller.email}`);

    return {
      success: true,
      message: `User ${targetEmail} has been ${action}`,
      disabled,
    };
  }
);

/**
 * Scheduled Cloud Function to clean up empty expired sessions.
 * Runs daily at 2:00 AM and deletes sessions where:
 * - planVersionId is null (no plan assigned)
 * - date is in the past (before today)
 */
export const cleanupEmptySessions = onSchedule(
  {
    schedule: 'every day 02:00',
    timeZone: 'Europe/Amsterdam',
    region: 'europe-west1',  // Cloud Scheduler requires supported region
  },
  async () => {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Query sessions with no plan and date in the past
    const snapshot = await db.collection('sessions')
      .where('planVersionId', '==', null)
      .where('date', '<', today)
      .get();

    if (snapshot.empty) {
      console.log('No empty expired sessions to clean up');
      return;
    }

    // Delete in batches (Firestore limit: 500 per batch)
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    console.log(`Cleaned up ${snapshot.size} empty expired sessions`);
  }
);
