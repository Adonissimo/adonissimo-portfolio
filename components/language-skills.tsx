import { languageSkills } from '@/lib/resume';
import { TechMark } from './tech-mark';

export function LanguageSkills({ compact = false }: { compact?: boolean }) {
  const skills = compact ? languageSkills.slice(0, 6) : languageSkills;
  return <ul className={`language-skills${compact ? ' language-skills-compact' : ''}`}>{skills.map(skill => <li key={skill.name}><TechMark name={skill.name}/><span><strong>{skill.name}</strong><small>{skill.note}</small></span></li>)}</ul>;
}
