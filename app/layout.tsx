import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { profile } from '@/lib/content';
import { getMetadataBase } from '@/lib/site';
import { themeBootstrap } from '@/lib/theme';
import { motionBootstrap } from '@/lib/motion';
import { CinematicIntro } from '@/components/cinematic-intro';
import { CinematicEffects } from '@/components/cinematic-effects';
import { MusicProvider, BackgroundMusicControls } from '@/components/background-music';
import { backgroundMusic } from '@/lib/music';
import { SoundEffectsProvider } from '@/components/sound-effects';
import { StorybookTransition } from '@/components/storybook-transition';
import { WorldBackdrop } from '@/components/world-backdrop';
import { AmbientWorld } from '@/components/ambient-world';
import { FairyCursor } from '@/components/fairy-cursor';
import { WorldFog } from '@/components/world-fog';
import './globals.css';
import './motion.css';
import './welcome.css';
import './storybook.css';
import './phase-three.css';
import './realms.css';
import './graphics.css';
import './ornaments.css';
import './atlas.css';
import './ambience.css';
import './fairy.css';
import './mobile.css';
import './opening.css';
import './fog.css';

const fieldSerif = localFont({
  src: [
    { path: './fonts/LMRoman-Regular.woff', weight: '400', style: 'normal' },
    { path: './fonts/LMRoman-Italic.woff', weight: '400', style: 'italic' }
  ],
  variable: '--font-display', display: 'swap', adjustFontFallback: 'Times New Roman', fallback: ['Georgia', 'serif']
});
const fieldSans = localFont({
  src: [
    { path: './fonts/LMSans-Regular.woff', weight: '400', style: 'normal' },
    { path: './fonts/LMSans-Bold.woff', weight: '700', style: 'normal' }
  ],
  variable: '--font-interface', display: 'swap', adjustFontFallback: 'Arial', fallback: ['Arial', 'sans-serif']
});
const title = `${profile.brand} — ${profile.displayName}`;
const description = 'Adonissimo is Lorenz Salvador’s full-stack web portfolio. Explore real projects, field notes, and a Tears of the Kingdom-inspired world.';

export const metadata: Metadata = {
  title: { default: title, template: `%s | ${profile.brand}` },
  description,
  authors: [{ name: profile.name }],
  metadataBase: getMetadataBase(),
  openGraph: { title, description, type: 'website', locale: 'en_PH', siteName: profile.brand },
  twitter: { card: 'summary_large_image', title, description },
  icons: { icon: '/icon.svg' }
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#111e19' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" data-theme="night" data-scroll-behavior="smooth" className={`${fieldSerif.variable} ${fieldSans.variable}`} suppressHydrationWarning>
    <head><script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrap + motionBootstrap }}/></head>
    {/* Extensions such as Grammarly inject body attributes before hydration.
        This escape hatch applies to body itself; descendants retain hydration checks. */}
    <body suppressHydrationWarning data-music-enabled={backgroundMusic.enabled ? 'true' : 'false'} data-sound-enabled="true">
      <a className="skip-link" href="#main">Skip to content</a>
      <WorldBackdrop/>
      <AmbientWorld/>
      <WorldFog/>
      <FairyCursor/>
      <MusicProvider track={backgroundMusic}>
        <SoundEffectsProvider>
          <CinematicIntro/>
          <CinematicEffects/>
          <StorybookTransition/>
          <Header/>
          {children}
          <Footer/>
          <BackgroundMusicControls/>
        </SoundEffectsProvider>
      </MusicProvider>
    </body>
  </html>;
}
