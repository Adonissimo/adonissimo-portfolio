import type { Project } from '@/lib/content';

export function ProjectArt({ art }: { art: Project['art'] }) {
  return <svg viewBox="0 0 420 260" fill="none" aria-hidden="true" focusable="false" className={`project-art art-${art}`}>
    <path d="M210 24v212M104 130h212" stroke="currentColor" opacity=".1"/>
    <circle cx="210" cy="130" r="86" stroke="currentColor" opacity=".12"/>
    <circle cx="210" cy="130" r="101" stroke="currentColor" opacity=".16" strokeDasharray="2 9"/>
    {art === 'sword' ? <>
      <path d="m119 204 91-26 91 26-91 29Z" fill="#415d3c"/>
      <path d="m145 179 65-19 65 19v26l-65 19-65-19Z" fill="#879778"/>
      <path d="m145 179 65 19 65-19-65-19Z" fill="#b0b38b"/>
      <path d="m210 198 65-19v26l-65 19Z" fill="#63795e"/>
      <path d="m201 105 9-7 9 7-3 70-6 9-6-9Z" fill="#d3e3da"/>
      <path d="M210 104v73" stroke="#fff6d4"/>
      <path d="m205 53 5-9 5 9-2 42h-6Z" fill="#5c638b"/>
      <path d="m202 94-25-10 3 14 23 9 3 8h8l3-8 23-9 3-14-25 10-8-6Z" fill="#7a6da0"/>
      <path d="m210 91 5 8-5 8-5-8Z" fill="#e2c77e"/>
      <path d="m210 116 4 7h-8Zm-4 7 4 7h-8Zm8 0 4 7h-8Z" fill="#6d8f9c"/>
      <path d="m193 204 17 6 17-6" stroke="#7ee5cb" strokeWidth="2"/>
      <path d="m155 171-16-2-8 11 15 7M267 171l17-2 9 11-16 7" stroke="#647e49" strokeWidth="5"/>
    </> : art === 'map' ? <g transform="translate(207 139) rotate(-12)">
      <path d="m-74-58 48 13 48-14 49 13v99l-49-11-48 14-48-12Z" fill="#9ba77b"/>
      <path d="m-26-45 48-14v101l-48 14Z" fill="#c1c593"/>
      <path d="m-74-58 48 13V56l-48-12Z" fill="#7e956b"/>
      <path d="M-55 27Q-45-27-16 0T44-26" stroke="#e4d7a6" strokeWidth="2" strokeDasharray="4 5"/>
      <path d="m37-33 13 13m-13 0 13-13" stroke="#345039" strokeWidth="2"/>
      <circle cx="-55" cy="27" r="4" fill="#edd59b"/>
      <path d="M-63-33h20m-20 6h12M36 23h20m-20 6h12" stroke="#5a7048" opacity=".6"/>
    </g> : <>
      <ellipse cx="210" cy="200" rx="70" ry="15" stroke="#b4c49c" opacity=".2"/>
      <path d="M207 192q-10-47 9-77" stroke="#b7c894" strokeWidth="3"/>
      <path d="M212 153c-44 0-48-26-48-41 30 0 48 13 48 41Z" fill="#7f9a5e"/>
      <path d="M215 134c-3-37 21-63 45-58 0 32-18 52-45 58Z" fill="#b4c484"/>
      <path d="m215 134 28-40m-31 59-34-27" stroke="#dae2ac"/>
      <path d="m207 192-25 8 29 9 30-10-27-8Z" fill="#8d9b73"/>
      <path d="m182 200 4 10 25 8 27-10 3-9-30 10Z" fill="#425c42"/>
      <path d="m175 72 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#e2c98a"/>
    </>}
  </svg>;
}
