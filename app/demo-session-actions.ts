'use server';
import { cookies } from 'next/headers';
// Retired Phase 3 actions cannot grant access to the Phase 4 dashboard.
export async function startDemoSession(): Promise<never> { throw new Error('Demo roles are retired. Sign in with your account.'); }
export async function endDemoSession(): Promise<void> { (await cookies()).delete('adonissimo-demo-role'); }
