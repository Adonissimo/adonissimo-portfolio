import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { AuthForm } from '@/components/auth-form';
import { backendConfigured } from '@/lib/backend/config';
export const metadata: Metadata = { title: 'Return to the journal.', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  return <main id="main" data-realm="zonai" className="chapter-page auth-page page-shell"><PageHeading realm="zonai" title="Return to the journal." description="Sign in to your journal desk."/><div className="auth-content">{notice === 'reset' && <p role="status">Password updated. Sign in with your new password.</p>}<AuthForm mode="login" enabled={backendConfigured()} callbackError={notice === 'callback'}/></div></main>;
}
