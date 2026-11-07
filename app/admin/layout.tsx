import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageActor } from '@/lib/backend/auth';
import { backendConfigured } from '@/lib/backend/config';
export const metadata: Metadata = { title: 'Journal desk', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: ReactNode }) { if (backendConfigured()) await pageActor(); return children; }
