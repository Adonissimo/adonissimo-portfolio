import { CinematicLink as Link } from './cinematic-link';
import { MotionControls } from './motion-controls';
import { FooterScenery } from './footer-scenery';
import { profile } from '@/lib/content';
import { Triforce } from './zelda-art';

export function Footer() {
  return <footer className="site-footer page-shell"><FooterScenery/>
    <div className="footer-main"><Link href="/" className="footer-signature" data-sfx="home"><Triforce/><span>{profile.brand}</span></Link><nav className="footer-links" aria-label="Footer"><Link href="/projects">Projects</Link><Link href="/blog">Field notes</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/login">Journal desk</Link></nav></div>
    <div className="footer-bottom"><div className="footer-fine"><span>© {new Date().getFullYear()} {profile.displayName}</span><p>Unofficial fan portfolio. The Legend of Zelda belongs to Nintendo. Original fan artwork.</p></div><MotionControls/></div>
  </footer>;
}
