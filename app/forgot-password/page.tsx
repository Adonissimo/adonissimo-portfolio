import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { AuthForm } from '@/components/auth-form';
import { backendConfigured } from '@/lib/backend/config';
export const metadata: Metadata = { title: 'Find your way back.', robots: { index: false, follow: false } };
export default function Page() { return <main id="main" data-realm="zonai" className="chapter-page auth-page page-shell"><PageHeading realm="zonai" title="Find your way back." description="Request a secure password recovery link."/><AuthForm mode="forgot-password" enabled={backendConfigured()}/></main>; }
