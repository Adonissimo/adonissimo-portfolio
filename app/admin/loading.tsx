import { DashboardSkeleton } from '@/components/loading-state';
export default function Loading() {
  return <main id="main" className="chapter-page page-shell" data-realm="zonai"><h1>The journal desk.</h1><p role="status">Loading the dashboard…</p><div aria-busy="true"><DashboardSkeleton/></div></main>;
}
