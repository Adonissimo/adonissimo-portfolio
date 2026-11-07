import { notFound } from 'next/navigation';
import { AdminDashboard } from '@/components/admin-dashboard';
import { pageActor } from '@/lib/backend/auth';
import { backendConfigured } from '@/lib/backend/config';
import { CinematicLink as Link } from '@/components/cinematic-link';
export default async function Page({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params; const screen = section?.[0] ?? 'overview';
  if ((section?.length ?? 0) > 1 || !['overview','projects','posts','tags','messages','notifications','users','settings','audit'].includes(screen)) notFound();
  if (!backendConfigured()) return <main id="main" className="chapter-page page-shell"><h1>The journal desk is not available yet.</h1><p>Account services are being connected. Please return later.</p><Link className="button" href="/">Return to the portfolio</Link></main>;
  const actor = await pageActor();
  const restricted = ['messages','notifications','users','settings','audit'].includes(screen) && actor.role !== 'owner';
  return <AdminDashboard key={`${screen}-${actor.role}`} role={actor.role} name={actor.name} section={screen} restricted={restricted}/>;
}
