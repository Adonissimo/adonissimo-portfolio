export type Realm = 'sky' | 'zonai' | 'fields' | 'depths';

/** Original decorative geometry, not a transcription of in-game writing. */
export function RealmGlyph({ realm, className }: { realm: Realm; className?: string }) {
  return <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
    {realm === 'sky' ? <>
      <path d="M18 47h84L87 59H33Z" fill="currentColor" opacity=".18"/>
      <path d="m33 59 16 34 11-21 10 14 17-27" stroke="currentColor" strokeWidth="2"/>
      <path d="M39 46V33a21 21 0 0 1 42 0v13M48 46V33a12 12 0 0 1 24 0v13" stroke="currentColor" strokeWidth="2"/>
      <path d="M14 99h24m44-5h24M8 27h17m71-5h16" stroke="currentColor" strokeWidth="2" opacity=".5"/>
    </> : realm === 'zonai' ? <>
      <circle cx="60" cy="60" r="45" stroke="currentColor" strokeWidth="2"/>
      <path d="M35 28a39 39 0 0 1 54 51M85 92a39 39 0 0 1-54-51" stroke="currentColor" strokeWidth="5"/>
      <path d="m60 34 23 13v26L60 86 37 73V47Z" fill="currentColor" opacity=".15"/>
      <path d="m60 42 16 9v18l-16 9-16-9V51Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M60 10v10m0 80v10M10 60h10m80 0h10M54 57h12v12H54Z" stroke="currentColor" strokeWidth="2"/>
    </> : realm === 'fields' ? <>
      <path d="M60 103V38M60 80 35 55m25 9 23-26" stroke="currentColor" strokeWidth="2"/>
      <path d="M59 79C32 78 21 64 23 44c22-1 37 12 36 35ZM62 62c-3-26 12-41 34-42 2 24-9 40-34 42Z" fill="currentColor" opacity=".2"/>
      <path d="M59 79C32 78 21 64 23 44c22-1 37 12 36 35ZM62 62c-3-26 12-41 34-42 2 24-9 40-34 42ZM26 104h68" stroke="currentColor" strokeWidth="2"/>
      <circle cx="25" cy="25" r="4" fill="currentColor"/>
    </> : <>
      <circle cx="60" cy="30" r="11" fill="currentColor" opacity=".18"/>
      <circle cx="60" cy="30" r="6" fill="currentColor"/>
      <path d="M60 40v27m0-14L40 39m20 20 21-19M60 67 44 83l-19 10m35-26 16 17 19 9M44 83l-4 21m36-20 4 20M60 67v39M40 39l-3-14m44 15 3-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="m48 18-4-7m28 7 4-7M40 30h-9m49 0h9" stroke="currentColor" strokeWidth="2" opacity=".6"/>
    </>}
  </svg>;
}
