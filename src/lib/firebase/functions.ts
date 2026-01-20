import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { UserRole } from '@/types';

/**
 * Set a user's role (admin only)
 */
export async function setUserRole(
  targetEmail: string,
  role: UserRole
): Promise<{ success: boolean; message: string }> {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }

  const callable = httpsCallable<
    { targetEmail: string; role: UserRole },
    { success: boolean; message: string }
  >(functions, 'setUserRole');

  const result = await callable({ targetEmail, role });
  return result.data;
}

/**
 * Get a user's role
 * - If no email provided, returns the caller's role
 * - If email provided, requires admin privileges
 */
export async function getUserRole(
  targetEmail?: string
): Promise<{ email: string; role: UserRole; disabled?: boolean }> {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }

  const callable = httpsCallable<
    { targetEmail?: string },
    { email: string; role: UserRole; disabled?: boolean }
  >(functions, 'getUserRole');

  const result = await callable({ targetEmail });
  return result.data;
}

/**
 * Disable or enable a user account (admin only)
 */
export async function setUserDisabled(
  targetEmail: string,
  disabled: boolean
): Promise<{ success: boolean; message: string; disabled: boolean }> {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }

  const callable = httpsCallable<
    { targetEmail: string; disabled: boolean },
    { success: boolean; message: string; disabled: boolean }
  >(functions, 'setUserDisabled');

  const result = await callable({ targetEmail, disabled });
  return result.data;
}
