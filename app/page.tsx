import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { contactConfigured } from '@/lib/backend/config';
import { CinematicLink as Link } from '@/components/cinematic-link';
import { profile, toolkit, safeHttps, emailHref } from '@/lib/content';
import { getSiteUrl } from '@/lib/site';
import { RealmGlyph } from '@/components/realm-glyph';
import { RealmScene } from '@/components/realm-scene';
import { WorldDivider } from '@/components/world-divider';
import { TechMark } from '@/components/tech-mark';
import { AncientSeal, RealmOrnament } from '@/components/realm-ornament';
import { Icon } from '@/components/icons';
import { HomeProjects } from '@/components/home-projects';
import { HomeProjectsSkeleton } from '@/components/loading-state';
import { ThreeScene } from '@/components/three-scene';

const siteUrl = getSiteUrl();
export const dynamic = 'force-dynamic';
export const metadata: Metadata = siteUrl ? { alternates: { canonical: '/' } } : {};

export default function Home() {
  const email = emailHref(profile.email);
  const github = safeHttps(profile.github);
  const linkedin = safeHttps(profile.linkedin);
  const canSendContact = contactConfigured();
  const hasContact = canSendContact || email || github || linkedin;

  return <main id="main" data-realm="sky">
    <section id="home" className="hero page-shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="zelda-wordmark" aria-label={`The Legend of ${profile.brand}`}><span>THE LEGEND OF</span><strong>{profile.brand.toUpperCase()}</strong></div>
        <h1 id="hero-title" tabIndex={-1}>Full-stack work.<br/><em>A little wonder.</em></h1>
        <p><strong>I’m {profile.displayName}.</strong> I build full-stack web projects with curiosity and care.</p><p className="hero-opportunity">Open to internships and developer opportunities.</p>
        <div className="hero-actions"><a href="#projects" className="button" data-sfx="discover">Explore projects <Icon name="arrow"/></a><Link href="/about" className="quiet-link">Meet Lorenz <Icon name="diagonal"/></Link></div>
      </div>
      <figure className="hero-landscape"><ThreeScene kind="hero"/><AncientSeal className="hero-etching"/><Image className="hero-art" src="/images/backgrounds/sky-atlas.png" alt="Original fan artwork of floating sky islands, stone gateways, golden foliage and a waterfall." width={1536} height={1024} sizes="(max-width: 560px) 280px, (max-width: 1000px) 48vw, 510px" loading="eager" fetchPriority="high" draggable={false}/><RealmOrnament realm="sky" className="hero-relic" sizes="(max-width: 560px) 112px, 196px"/><figcaption className="landscape-caption"><RealmGlyph realm="sky"/>A new path is always worth exploring.</figcaption></figure>
      <div className="hero-hud"><span className="hearts" aria-hidden="true"><Icon name="heart"/><Icon name="heart"/><Icon name="heart"/></span><span className="hero-location">{profile.location} · Hyrule at heart</span><a href="#projects" className="discover-link">The adventure log <span aria-hidden="true">↓</span></a></div>
    </section>

    <section id="projects" className="projects-section page-shell" aria-labelledby="projects-heading">
      <WorldDivider realm="zonai"/><RealmOrnament realm="zonai" className="section-margin-relic" sizes="128px"/><div className="section-title"><div><h2 id="projects-heading">The adventure log.</h2><p>A few things I’ve built, and what I learned along the way.</p></div><Link href="/projects" className="quiet-link">All projects <Icon name="arrow"/></Link></div>
      <Suspense fallback={<HomeProjectsSkeleton/>}><HomeProjects/></Suspense>
    </section>

    <section id="about" className="about-section page-shell" aria-labelledby="about-heading">
      <WorldDivider realm="fields"/><div className="about-vista-frame"><RealmScene realm="fields" className="about-vista"/><RealmOrnament realm="fields" className="about-relic" sizes="(max-width: 560px) 96px, 140px"/></div><div className="about-copy"><h2 id="about-heading">A little curiosity.<br/><em>A lot of heart.</em></h2><p>I’m {profile.name}. This journal is where I collect the things I make and the lessons that come with them.</p><Link className="quiet-link" href="/about">More about the adventurer <Icon name="diagonal"/></Link></div>
      <div id="inventory" className="home-inventory"><h3>In my inventory</h3><dl className="inventory-list">{toolkit.map(tool => <div key={tool.name} className="inventory-item"><dt><TechMark name={tool.name}/>{tool.name}</dt><dd>{tool.detail}</dd></div>)}</dl></div>
    </section>

    <section id="contact" className="contact-section page-shell" aria-labelledby="contact-heading"><div className="contact-frame"><RealmScene realm="fields" className="contact-vista"/><div className="contact-copy"><h2 id="contact-heading">Have a quest in mind?</h2><p>An idea, a collaboration, or just a hello.</p></div>{hasContact ? <div className="contact-actions">{canSendContact && <Link className="button" href="/contact">Send a letter <Icon name="mail"/></Link>}{email && <a className="quiet-link" href={email}>Email me <Icon name="diagonal"/></a>}{github && <a className="quiet-link" href={github} target="_blank" rel="noopener noreferrer" aria-label="GitHub, opens in a new tab">GitHub <Icon name="diagonal"/></a>}{linkedin && <a className="quiet-link" href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn, opens in a new tab">LinkedIn <Icon name="diagonal"/></a>}</div> : <p className="contact-pending"><Icon name="mail"/>Contact details are coming soon.</p>}</div></section>
  </main>;
}
