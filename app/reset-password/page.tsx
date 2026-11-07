import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { AuthForm } from '@/components/auth-form';
import { pageActor } from '@/lib/backend/auth';
export const metadata: Metadata = { title: 'Choose a new password.', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Page() { await pageActor(); return <main id="main" data-realm="zonai" className="chapter-page auth-page page-shell"><PageHeading realm="zonai" title="Choose a new password." description="Use a unique password for this account."/><AuthForm mode="reset-password" enabled/></main>; }
