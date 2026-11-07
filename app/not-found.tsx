import { CinematicLink as Link } from '@/components/cinematic-link';
import { SheikahEye } from '@/components/zelda-art';

export default function NotFound() {
  return <main id="main" className="not-found page-shell"><SheikahEye/><h1>This path is<br/><em>uncharted.</em></h1><p>The page may have moved, or the quest hasn’t been written yet.</p><Link className="button" href="/">Return to Hyrule</Link></main>;
}
