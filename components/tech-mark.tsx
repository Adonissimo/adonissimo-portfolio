export function TechMark({ name }: { name: string }) {
  return <svg className="tech-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    {name === 'React' ? <><circle cx="16" cy="16" r="2.4" fill="currentColor"/>{[0,60,120].map(angle => <ellipse key={angle} cx="16" cy="16" rx="14" ry="5.4" transform={`rotate(${angle} 16 16)`} stroke="currentColor" strokeWidth="1.4"/>)}</>
      : name === 'TypeScript' ? <><rect x="3" y="3" width="26" height="26" rx="3" fill="currentColor" opacity=".18"/><path d="M7 13h10m-5 0v13m14-11c-5-5-12 1-5 4 8 3 2 9-4 5" stroke="currentColor" strokeWidth="2"/></>
      : name === 'Tailwind CSS' ? <path d="M3 14c3-7 7-7 12-3 4 4 8 4 14-3-3 8-7 9-13 5-5-3-8-3-13 1Zm0 9c3-7 7-7 12-3 4 4 8 4 14-3-3 8-7 9-13 5-5-3-8-3-13 1Z" fill="currentColor"/>
      : name === 'Vercel' ? <path d="m16 4 14 24H2Z" fill="currentColor"/>
      : <><circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5"/><path d="M10 24V9l13 17M22 9v12" stroke="currentColor" strokeWidth="2"/></>}
  </svg>;
}
