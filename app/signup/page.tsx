import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { AuthForm } from '@/components/auth-form';
import { backendConfigured } from '@/lib/backend/config';
export const metadata: Metadata = { title: 'Begin a new adventure.', robots: { index: false, follow: false } };
export default function Page() { return <main id="main" data-realm="zonai" className="chapter-page auth-page page-shell"><PageHeading realm="zonai" title="Begin a new adventure." description="Create your account and confirm your email."/><AuthForm mode="signup" enabled={backendConfigured()}/></main>; }
