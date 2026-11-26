import Image from 'next/image';

const logos: Record<string, string> = {
  TypeScript: 'typescript', JavaScript: 'javascript', Kotlin: 'kotlin', Java: 'java',
  Python: 'python', 'C++': 'cplusplus', PHP: 'php', MATLAB: 'matlab', HTML: 'html5', CSS: 'css3'
};

export function TechMark({ name }: { name: string }) {
  const logo = logos[name];
  if (logo) return <Image className="tech-mark" src={`/images/tech/${logo}.svg`} alt="" aria-hidden="true" width={25} height={25} unoptimized/>;
  return <svg className="tech-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    {name === 'SQL' ? <><ellipse cx="16" cy="7" rx="10" ry="4" stroke="currentColor" strokeWidth="2"/><path d="M6 7v17c0 5 20 5 20 0V7M6 15c0 5 20 5 20 0" stroke="currentColor" strokeWidth="2"/></>
      : name === 'React' ? <><circle cx="16" cy="16" r="2.4" fill="currentColor"/>{[0,60,120].map(angle => <ellipse key={angle} cx="16" cy="16" rx="14" ry="5.4" transform={`rotate(${angle} 16 16)`} stroke="currentColor" strokeWidth="1.4"/>)}</>
      : name === 'Tailwind CSS' ? <path d="M3 14c3-7 7-7 12-3 4 4 8 4 14-3-3 8-7 9-13 5-5-3-8-3-13 1Zm0 9c3-7 7-7 12-3 4 4 8 4 14-3-3 8-7 9-13 5-5-3-8-3-13 1Z" fill="currentColor"/>
      : name === 'Vercel' ? <path d="m16 4 14 24H2Z" fill="currentColor"/>
      : <><circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5"/><path d="M10 24V9l13 17M22 9v12" stroke="currentColor" strokeWidth="2"/></>}
  </svg>;
}
