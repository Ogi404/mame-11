import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

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
    };
  }
);
