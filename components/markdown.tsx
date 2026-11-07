import { Fragment, type ReactNode } from 'react';
import { safeMarkdownHref } from '@/lib/phase-three';
function inline(text: string): ReactNode[] {
 return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g).map((part, i) => {
  if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2,-2)}</strong>;
  if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1,-1)}</code>;
  const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link) { const href = safeMarkdownHref(link[2]); return href ? <a key={i} href={href}>{link[1]}</a> : <Fragment key={i}>{link[1]}</Fragment>; }
  return part;
 });
}
/** Deliberately limited Markdown: React escapes all raw HTML. No dangerouslySetInnerHTML. */
export function Markdown({ source }: { source: string }) {
 const lines = source.replace(/\r/g,'').split('\n'); const blocks: ReactNode[] = [];
 for (let i=0; i<lines.length;) {
  const line=lines[i]; if (!line.trim()) { i++; continue; }
  if (line.startsWith('```')) { const code: string[]=[]; i++; while(i<lines.length && !lines[i].startsWith('```')) code.push(lines[i++]); i++; blocks.push(<pre key={i}><code>{code.join('\n')}</code></pre>); continue; }
  const heading=line.match(/^(#{1,3})\s+(.+)$/);
  if (heading) { const content=inline(heading[2]); blocks.push(heading[1].length===1 ? <h2 key={i}>{content}</h2> : <h3 key={i}>{content}</h3>); i++; continue; }
  if (/^[-*] /.test(line)) { const items: string[]=[]; while(i<lines.length && /^[-*] /.test(lines[i])) items.push(lines[i++].slice(2)); blocks.push(<ul key={i}>{items.map((item,j)=><li key={j}>{inline(item)}</li>)}</ul>); continue; }
  if (line.startsWith('> ')) { blocks.push(<blockquote key={i}>{inline(line.slice(2))}</blockquote>); i++; continue; }
  const paragraph: string[]=[line]; i++; while(i<lines.length && lines[i].trim() && !/^(#{1,3} |```|[-*] |> )/.test(lines[i])) paragraph.push(lines[i++]); blocks.push(<p key={i}>{inline(paragraph.join(' '))}</p>);
 }
 return <div className="prose">{blocks}</div>;
}
