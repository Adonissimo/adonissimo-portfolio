import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { LanguageSkills } from '@/components/language-skills';
import { profile } from '@/lib/content';
import { resume, supportingSkills } from '@/lib/resume';
import { CinematicLink as Link } from '@/components/cinematic-link';
export const metadata: Metadata = { title: 'About Lorenz', description: 'Meet Lorenz Salvador, a Computer Science student specializing in Software Engineering, building full-stack web, Android, and browser game projects.' };

export default function Page() {
  return <main id="main" data-realm="fields" className="chapter-page page-shell resume-page">
    <PageHeading realm="fields" title="The builder behind the adventure." description="Computer Science student. Full-stack projects. Room to keep learning."/>
    <div className="resume-intro">
      <div className="prose"><p className="resume-eyebrow">{resume.focus}</p><h2>{profile.name}</h2><p>{resume.summary}</p><p>{resume.opportunity}</p><p>{resume.approach}</p><p>Based in {profile.location}. Hyrule at heart.</p><div className="resume-actions"><Link className="button" href="/projects">Explore my projects</Link><Link className="quiet-link" href="/contact">Get in touch</Link></div></div>
      <aside className="resume-education" aria-labelledby="education-title"><h2 id="education-title">The path so far</h2>{resume.education.map(item => <div key={item.school}><p className="resume-meta">{item.period}</p><h3>{item.school}</h3><p>{item.qualification}</p></div>)}</aside>
    </div>
    <section className="resume-section" aria-labelledby="work-title"><div className="resume-section-heading"><h2 id="work-title">What I’ve contributed</h2><p>Academic and personal projects, with my role made clear.</p></div><div className="resume-work-grid">{resume.contributions.map(item => <article key={item.title}><p className="resume-meta">{item.type}</p><h3>{item.title}</h3><p>{item.text}</p><p className="resume-stack">{item.detail}</p>{'href' in item && <Link className="quiet-link" href={item.href}>View game showcase <span aria-hidden="true">↗</span></Link>}</article>)}</div></section>
    <section className="resume-section" aria-labelledby="languages-title"><div className="resume-section-heading"><h2 id="languages-title">Languages & web foundations</h2><p>Project experience, coursework, and the skills I’m still building.</p></div><LanguageSkills/><dl className="resume-supporting-skills">{supportingSkills.map(group => <div key={group.title}><dt>{group.title}</dt><dd>{group.items}</dd></div>)}</dl></section>
    <section className="resume-section" aria-labelledby="credentials-title"><div className="resume-section-heading"><h2 id="credentials-title">Learning with purpose</h2><p>Certifications and courses listed in my résumé.</p></div><ul className="resume-credentials">{resume.certifications.map(item => <li key={item.name}><strong>{item.name}</strong><span>{item.issuer} · {item.date}</span></li>)}</ul></section>
    <section className="resume-section" aria-labelledby="leadership-title"><div className="resume-section-heading"><h2 id="leadership-title">Beyond the code</h2><p>Coordination, service, and showing up for a team.</p></div><div className="resume-leadership">{resume.leadership.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
  </main>;
}
