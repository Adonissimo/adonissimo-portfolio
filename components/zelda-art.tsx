type ArtProps = { className?: string };

/** Original vector fan art. The Legend of Zelda belongs to Nintendo. */
export function ZeldaArt({ className }: ArtProps) {
  return (
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="620" viewBox="0 0 760 620" fill="none" aria-hidden="true" focusable="false" className={className}>
  <defs>
    <radialGradient id="zelda-scene-sky-glow"><stop stopColor="#dac18a" stopOpacity=".16"/><stop offset=".62" stopColor="#91aa81" stopOpacity=".045"/><stop offset="1" stopColor="#91aa81" stopOpacity="0"/></radialGradient>
    <radialGradient id="zelda-scene-sun-halo"><stop stopColor="#dac18a" stopOpacity=".28"/><stop offset="1" stopColor="#dac18a" stopOpacity="0"/></radialGradient>
    <linearGradient id="zelda-scene-sun" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e5d3a5" stopOpacity=".7"/><stop offset="1" stopColor="#dac18a" stopOpacity=".14"/></linearGradient>
    <linearGradient id="zelda-scene-far-mountains" x1="380" y1="133" x2="380" y2="348" gradientUnits="userSpaceOnUse"><stop stopColor="#91aa81" stopOpacity=".22"/><stop offset="1" stopColor="#91aa81" stopOpacity="0"/></linearGradient>
    <linearGradient id="zelda-scene-near-mountains" x1="500" y1="210" x2="420" y2="393" gradientUnits="userSpaceOnUse"><stop stopColor="#667c48" stopOpacity=".55"/><stop offset="1" stopColor="#193c2d" stopOpacity=".3"/></linearGradient>
    <linearGradient id="zelda-scene-land" x1="328" y1="282" x2="420" y2="475" gradientUnits="userSpaceOnUse"><stop stopColor="#7b905b"/><stop offset=".35" stopColor="#667c48"/><stop offset=".74" stopColor="#354e32"/><stop offset="1" stopColor="#203c2b"/></linearGradient>
    <linearGradient id="zelda-scene-upper-land" x1="503" y1="292" x2="456" y2="402" gradientUnits="userSpaceOnUse"><stop stopColor="#9aa879"/><stop offset=".38" stopColor="#768a52"/><stop offset="1" stopColor="#465e38"/></linearGradient>
    <linearGradient id="zelda-scene-cliff" x1="454" y1="424" x2="405" y2="573" gradientUnits="userSpaceOnUse"><stop stopColor="#3f5038"/><stop offset=".42" stopColor="#263e2e"/><stop offset="1" stopColor="#0e211a" stopOpacity=".2"/></linearGradient>
    <linearGradient id="zelda-scene-cliff-light" x1="334" y1="432" x2="347" y2="558" gradientUnits="userSpaceOnUse"><stop stopColor="#899270" stopOpacity=".7"/><stop offset="1" stopColor="#23392b" stopOpacity="0"/></linearGradient>
    <linearGradient id="zelda-scene-path" x1="491" y1="331" x2="216" y2="444" gradientUnits="userSpaceOnUse"><stop stopColor="#ddcb97"/><stop offset=".44" stopColor="#c0b790"/><stop offset="1" stopColor="#8e9570"/></linearGradient>
    <linearGradient id="zelda-scene-water" x1="357" y1="420" x2="368" y2="579" gradientUnits="userSpaceOnUse"><stop stopColor="#c2d3bd" stopOpacity=".86"/><stop offset=".45" stopColor="#96b9a4" stopOpacity=".6"/><stop offset="1" stopColor="#96b9a4" stopOpacity="0"/></linearGradient>
    <linearGradient id="zelda-scene-stone" x1="472" y1="226" x2="565" y2="356" gradientUnits="userSpaceOnUse"><stop stopColor="#a1a383"/><stop offset=".25" stopColor="#798469"/><stop offset=".7" stopColor="#56654f"/><stop offset="1" stopColor="#354a36"/></linearGradient>
    <linearGradient id="zelda-scene-stone-edge" x1="493" y1="241" x2="558" y2="323" gradientUnits="userSpaceOnUse"><stop stopColor="#d5c493"/><stop offset=".8" stopColor="#9ba07a"/></linearGradient>
    <linearGradient id="zelda-scene-door-light" x1="516" y1="260" x2="516" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="#dac18a" stopOpacity="0"/><stop offset=".55" stopColor="#dac18a" stopOpacity=".14"/><stop offset="1" stopColor="#eddaa3" stopOpacity=".43"/></linearGradient>
    <linearGradient id="zelda-scene-pine" x1="0" y1="0" x2="0" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#18392a"/><stop offset="1" stopColor="#0b1c16"/></linearGradient>
    <radialGradient id="zelda-scene-mist"><stop stopColor="#b8ccaa" stopOpacity=".18"/><stop offset="1" stopColor="#b8ccaa" stopOpacity="0"/></radialGradient>
    <filter id="zelda-scene-soft-blur"><feGaussianBlur stdDeviation="5"/></filter>
    <g id="zelda-scene-conifer">
      <path d="M-2 119 0 8 3 119" fill="#132d22"/>
      <path d="m0 0-12 30 8-3-16 23 11-3-21 28 15-3-26 33 23-6-19 20 37-8 36 8-18-21 22 7-24-34 15 4-22-29 10 4-16-24 8 3L0 0Z" fill="url(#zelda-scene-pine)"/>
      <path d="m0 3-4 28-7 11 8-2-11 19 10-4-14 24 12-4-19 29 21-9L0 3Z" fill="#36543a" opacity=".33"/>
    </g>
    <g id="zelda-scene-grass" strokeLinecap="round"><path d="m0 0-3-9M1 0l2-13M3 0l7-7" stroke="#a6b288" strokeOpacity=".5"/><path d="m-2 1-6-5M4 1l8-2" stroke="#24472c" strokeWidth="1.4"/></g>
    <g id="zelda-scene-bush"><path d="M-19 2c-5-8 0-15 7-13-2-9 12-14 16-6 8-4 13 2 11 7 10 0 15 9 7 14L-19 2Z" fill="#294b32"/><path d="M-13-9c2-5 5-5 9-3M1-15c4-1 6 2 6 4M11-8c4 0 6 3 6 5" stroke="#789360" strokeWidth="2" opacity=".5" strokeLinecap="round"/></g>
  
    <linearGradient id="zelda-scene-blade" x1="351" y1="309" x2="374" y2="309" gradientUnits="userSpaceOnUse">
      <stop stopColor="#94aeb7"/><stop offset=".46" stopColor="#f0f1d9"/><stop offset=".5" stopColor="#bfd5d1"/><stop offset="1" stopColor="#708e9e"/>
    </linearGradient>
    <linearGradient id="zelda-scene-hilt" x1="330" y1="263" x2="395" y2="303" gradientUnits="userSpaceOnUse">
      <stop stopColor="#8c7da8"/><stop offset=".45" stopColor="#5d557e"/><stop offset="1" stopColor="#36395e"/>
    </linearGradient>
    <radialGradient id="zelda-scene-ancient-glow"><stop stopColor="#83e5c7" stopOpacity=".3"/><stop offset="1" stopColor="#83e5c7" stopOpacity="0"/></radialGradient>
  </defs>

  
  <ellipse cx="434" cy="289" rx="315" ry="260" fill="url(#zelda-scene-sky-glow)"/>
  <g stroke="#dac18a" strokeWidth=".65" opacity=".17">
    <circle cx="438" cy="284" r="225" strokeDasharray="2 11"/>
    <path d="M297 108a225 225 0 0 1 306 24M656 225a225 225 0 0 1-39 195M238 387a225 225 0 0 1 20-240"/>
    <circle cx="438" cy="284" r="200" opacity=".55"/>
    <path d="M438 48v17M438 503v17M202 284h17M658 284h17M278 117l10 10M590 440l10 10M273 450l12-12M591 128l11-11"/>
    <path d="m432 58 6-9 6 9M666 278l9 6-9 6"/>
  </g>
  <circle cx="489" cy="183" r="106" fill="url(#zelda-scene-sun-halo)"/>
  <circle cx="489" cy="183" r="47" fill="url(#zelda-scene-sun)" opacity=".4"/>
  <g fill="#e9d499">
    <path d="m489 151 17 29.5h-34Z"/>
    <path d="m472 180.5 17 29.5h-34Z"/>
    <path d="m506 180.5 17 29.5h-34Z"/>
  </g>
  <circle cx="489" cy="183" r="57" stroke="#dac18a" strokeWidth=".5" opacity=".23"/>
  <path d="M489 115v10M489 241v10M421 183h10M547 183h10" stroke="#dac18a" opacity=".35" strokeWidth=".7"/>

  
  <path d="m103 340 66-85 24 26 65-94 40 52 26-31 59 85 47-67 37 38 35-73 30 46 29-20 48 75 18-23 38 39 69 48H103Z" fill="url(#zelda-scene-far-mountains)"/>
  <path d="m225 232 33-45 40 52-27-14-12 4-11-14-23 17ZM450 244l17 20 35-73-5 39-11-5-19 47-17-28Z" fill="#c0cca7" opacity=".12"/>
  <path d="m79 386 75-47 32 12 49-75 40 35 39-67 49 67 32-32 49 57 46-40 41 31 39-70 32 26 17-8 52 69 39-27 60 81H79Z" fill="url(#zelda-scene-near-mountains)"/>
  <path d="m277 311 37-67 25 35-20-10-12 18-5-3-25 27ZM531 327l39-70 18 16-21 11-10 24-26 19Z" fill="#8ea073" opacity=".16"/>
  <path d="M132 351c50 17 85-7 119 8s84 27 136 3c37-17 113-29 175 2 46 22 76-2 111 10" stroke="#a7bc99" strokeOpacity=".08" strokeWidth="9" filter="url(#zelda-scene-soft-blur)"/>
  <g opacity=".47">
    <use href="#zelda-scene-conifer" transform="translate(198 304) scale(.34)"/><use href="#zelda-scene-conifer" transform="translate(223 312) scale(.24)"/>
    <use href="#zelda-scene-conifer" transform="translate(603 299) scale(.39)"/><use href="#zelda-scene-conifer" transform="translate(580 312) scale(.25)"/>
    <use href="#zelda-scene-conifer" transform="translate(625 320) scale(.32)"/>
  </g>

  
  <path d="m133 416 63-51 99-33 112-28 98 2 88 40 70 52 26 45-25 44-39 15-23 35-71 23-22-8-58 31-57-13-28 12-61-43-33 5-36-47-55-9-26-36-27-16Z" fill="url(#zelda-scene-cliff)"/>
  <path d="m180 421 39 28 7 39 23 4 20 36 11-68-32-40-68 1Z" fill="#142d22" opacity=".78"/>
  <path d="m307 435 39-11 25 17-10 41 20 52-9 43-22-37-18-3-15-68-10-34Z" fill="url(#zelda-scene-cliff-light)"/>
  <path d="m400 442 36-4-5 32 15 40-13 63-20-22-7-50-13-20 7-39Z" fill="#172f24" opacity=".75"/>
  <path d="m454 442 37-18 23 3-5 53-25 26-10 41-35 14 15-56-6-26 6-37Z" fill="#708064" opacity=".22"/>
  <path d="m527 420 56-16 36 35-18 50-32 45-40 13 19-45-21-17 10-34-10-31Z" fill="#122c22" opacity=".7"/>
  <path d="m621 405 42-7 26 45-25 44-39 15 12-48-16-49Z" fill="#485b42" opacity=".5"/>
  <g stroke="#8a9874" strokeOpacity=".14" strokeWidth="1.5">
    <path d="m234 461 28 4 13 36M287 474l17-3 18 32M396 459l-6 29 10 36M462 482l28-7 8-31M551 486l25-15 3-26M630 455l28-18"/>
    <path d="m416 526 11 11M475 510l-9 25M338 509l9 28M591 490l-13 21"/>
  </g>
  <path d="M134 414c33-22 42-55 90-64 41-8 55-20 90-29 35-10 61-9 88-22 40-19 69-12 94-6 44 12 47 31 84 42 46 14 54 37 85 52 12 7 18 20 24 37-44 17-65 21-93 15-32-8-51-2-78 17-31 21-65 17-93 9-30-7-58-1-85-12-29-12-57-3-82-11-36-12-60 3-85-8l-39-20Z" fill="url(#zelda-scene-land)"/>
  <path d="M291 353c46-35 82-21 113-49 19-17 62-19 92-11 44 12 47 31 84 42l28 15c-51-14-88-3-121 13-47 22-80 7-106-1-31-10-54 0-90-9Z" fill="url(#zelda-scene-upper-land)"/>
  <path d="M146 414c35 7 43 21 76 15 35-7 49 3 77 11 28 8 45-1 67 6 37 12 52 5 81 12 33 9 49-7 71-18 24-13 51-14 73-8 28 8 48-1 87-15" stroke="#a8b383" strokeOpacity=".45" strokeWidth="2"/>
  <path d="M246 376c42-3 59 20 109 13 40-6 81 2 117 15 24 9 56-13 87-21 32-8 61 7 86 4" stroke="#b4bc90" strokeOpacity=".13" strokeWidth="1.5"/>
  <path d="M205 408c30-17 58-13 78-15M387 319c35-14 63-12 91-4M556 369c30-6 47 0 60 6M434 434c29 9 47-3 62-11" stroke="#bfd1a0" strokeOpacity=".18" strokeWidth="1.5" strokeLinecap="round"/>

  
  <path d="M189 426c25-17 46-30 78-35 40-7 57-13 70-22 16-13 36-18 64-19 45-2 67-12 83-28l29 4c-14 16-50 29-92 31-40 2-58 8-73 20-16 12-41 19-75 25-24 5-36 20-46 32l-38-8Z" fill="url(#zelda-scene-path)"/>
  <path d="M204 426c24-20 41-26 69-31 44-7 56-18 69-26 22-14 34-13 66-16 48-3 75-14 90-28" stroke="#e5d8b1" strokeOpacity=".4" strokeWidth="1.4"/>
  <path d="m249 403 13 2M285 393l12 1M320 381l9 1M363 361l9 3M389 355l8 1M446 348l6 1M471 339l7 1" stroke="#767e5b" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round"/>

  
  <path d="M439 366c-26 11-63 24-69 39-4 9 5 17-8 29l-16-1c10-15 6-19 11-31 7-17 46-30 74-38l8 2Z" fill="#a3bdac" opacity=".6"/>
  <path d="M436 366c-29 12-64 25-70 39-4 10 2 17-10 29" stroke="#d1dcc5" strokeOpacity=".75" strokeWidth="1.4"/>
  <path d="M345 429c3 25 8 34 7 59-2 33 7 57 12 91h20c-15-46-10-70-15-94-4-20-6-38-7-55l-17-1Z" fill="url(#zelda-scene-water)"/>
  <path d="M348 432c6 23 8 41 8 56-1 23 8 48 12 64M358 432c-1 26 7 46 5 64 0 18 6 32 9 45" stroke="#dde7ce" strokeOpacity=".48" strokeWidth="1.5"/>
  <path d="M346 434c3 8 12 6 19 2M351 445c3 4 11 4 14 0" stroke="#dfebd4" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round"/>
  <ellipse cx="376" cy="551" rx="78" ry="33" fill="url(#zelda-scene-mist)"/>
  <ellipse cx="385" cy="574" rx="112" ry="26" fill="url(#zelda-scene-mist)" opacity=".5"/>

  
  <path d="m459 357 25-9 86-1 28 10-86 10-53-10Z" fill="#152f23" opacity=".4"/>
  <path d="M481 354v-68c0-28 15-44 34-44s35 17 35 44v68h-69Z" fill="url(#zelda-scene-door-light)"/>
  <path d="m464 354-2-62 2-30 12-22 16-14 16-6 22 1 18 9 15 18 9 24 1 37-2 44-21-1 1-65c0-20-11-41-28-44-20-4-37 18-38 41l-1 70h-20Z" fill="url(#zelda-scene-stone)"/>
  <path d="m464 263 12-22 16-14 16-6 22 1 18 9 13 16-8 1-12-13-13-6-20-1-14 7-12 14-9 17-9-3Z" fill="#a3a483"/>
  <path d="M486 350v-67c0-21 13-40 31-40 19 0 34 23 34 44v66l5-2v-65c0-25-17-49-39-48-23 0-37 23-38 46v65l7 1Z" fill="url(#zelda-scene-stone-edge)" opacity=".84"/>
  <path d="m463 297 20 1M465 324l19 2M550 313l22-2M551 337l20-2M465 271l18 5M472 250l17 10M488 233l12 14M509 222l2 17M534 225l-8 18M553 238l-15 14M564 258l-16 8M572 285l-20 1" stroke="#304633" strokeWidth="2.3"/>
  <path d="m465 272 17 5M490 234l10 13M510 225v12M552 314l19-2M551 338l16-1" stroke="#d2c69b" strokeOpacity=".38" strokeWidth=".9"/>
  <path d="m463 297 8 8-5 10M542 228l-6 6 1 8M568 282l-7 7 6 7M472 341l7-6-2-9" stroke="#263f2c" strokeWidth="1.2"/>
  <path d="m490 226 4-10 14 1 2 5-20 4ZM530 222l4-9 16 7-1 12-19-10Z" fill="#718268"/>
  <path d="m462 351 25-1 4 9-33 1 4-9ZM547 350l27-1 6 8-36 3 3-10Z" fill="#899372"/>
  <path d="m464 351 20-1M550 350l22-1" stroke="#b8b58b" strokeWidth="1.2"/>
  <path d="M463 291c8-2 7 9 12 9 2 0 4-5 8-3M465 320c7-1 7 6 14 3M546 232c-1 6 8 8 5 15M558 252c3-2 6 0 6 5M553 331c6 0 11 5 18 2" stroke="#526e3d" strokeWidth="4" strokeLinecap="round"/>
  <path d="M468 284c2-13 3-21 10-29M546 240l7 10" stroke="#acb286" strokeOpacity=".4" strokeWidth="1.5"/>
  <path d="M493 347c8 0 14-5 21-4 9 1 15 1 25 5" stroke="#ead8a4" strokeWidth="2" opacity=".65" strokeLinecap="round"/>

  
  <path d="m408 337 1-20 15-3 3 21-19 2Z" fill="#7b876a"/><path d="m409 317 10-5 5 2-15 3Z" fill="#acac84"/><path d="m419 317 5-3 3 21-7 1-1-19Z" fill="#40573b"/>
  <path d="m428 341 8-9 11 2 3 8-22-1Z" fill="#939778"/><path d="m438 335 9-1 3 8-10-1-2-6Z" fill="#566b49"/>
  <path d="m584 364 2-17 13-3 2 18-17 2Z" fill="#758265"/><path d="m586 347 6-6 7 3-13 3Z" fill="#a1a480"/>
  <path d="m582 372 21-2 7 7-30 1 2-6Z" fill="#758065"/>
  <path d="m439 322 7-5 11 3-4 6-14-4Z" fill="#bec09a" opacity=".57"/>

  
  <use href="#zelda-scene-bush" transform="translate(300 357) scale(.7)"/>
  <use href="#zelda-scene-bush" transform="translate(394 333) scale(.64)"/>
  <use href="#zelda-scene-bush" transform="translate(575 365) scale(.88)"/>
  <use href="#zelda-scene-bush" transform="translate(625 398) scale(1.13)"/>
  <use href="#zelda-scene-bush" transform="translate(284 438) scale(.7)"/>
  <use href="#zelda-scene-bush" transform="translate(433 448) scale(.8)"/>
  <use href="#zelda-scene-conifer" transform="translate(242 282) scale(.63)"/>
  <use href="#zelda-scene-conifer" transform="translate(212 300) scale(.61)"/>
  <use href="#zelda-scene-conifer" transform="translate(267 310) scale(.47)"/>
  <use href="#zelda-scene-conifer" transform="translate(656 326) scale(.63)"/>
  <use href="#zelda-scene-conifer" transform="translate(613 302) scale(.69)"/>
  <use href="#zelda-scene-conifer" transform="translate(635 292) scale(.88)"/>
  <use href="#zelda-scene-conifer" transform="translate(158 330) scale(.9)"/>
  <use href="#zelda-scene-conifer" transform="translate(130 366) scale(.73)"/>
  <use href="#zelda-scene-conifer" transform="translate(185 360) scale(.69)"/>
  <use href="#zelda-scene-conifer" transform="translate(564 372) scale(.86)"/>
  <use href="#zelda-scene-conifer" transform="translate(602 355) scale(1.13)"/>
  <use href="#zelda-scene-conifer" transform="translate(647 386) scale(.87)"/>
  <use href="#zelda-scene-grass" transform="translate(278 375) scale(.75)"/><use href="#zelda-scene-grass" transform="translate(290 379) scale(.6)"/>
  <use href="#zelda-scene-grass" transform="translate(315 410) scale(.85)"/><use href="#zelda-scene-grass" transform="translate(327 413) scale(.65)"/>
  <use href="#zelda-scene-grass" transform="translate(383 391) scale(.75)"/><use href="#zelda-scene-grass" transform="translate(474 379) scale(.7)"/>
  <use href="#zelda-scene-grass" transform="translate(520 360) scale(.6)"/><use href="#zelda-scene-grass" transform="translate(405 430) scale(.8)"/>
  <use href="#zelda-scene-grass" transform="translate(510 421) scale(.75)"/><use href="#zelda-scene-grass" transform="translate(523 416) scale(.6)"/>
  <use href="#zelda-scene-grass" transform="translate(249 419) scale(.8)"/><use href="#zelda-scene-grass" transform="translate(279 348) scale(.65)"/>
  <g fill="#d6cd9c" opacity=".68">
    <ellipse cx="289" cy="390" rx="1.4" ry=".9"/><ellipse cx="297" cy="387" rx="1" ry=".8"/>
    <ellipse cx="376" cy="376" rx="1.1" ry=".8"/><ellipse cx="379" cy="372" rx="1" ry=".7"/>
    <ellipse cx="454" cy="374" rx="1.3" ry=".8"/><ellipse cx="460" cy="370" rx=".9" ry=".7"/>
    <ellipse cx="498" cy="401" rx="1.2" ry=".9"/><ellipse cx="503" cy="398" rx=".8" ry=".8"/>
  </g>
  <g stroke="#11291e" strokeWidth="1.4" strokeLinecap="round" opacity=".65">
    <path d="M373 216q4-4 8 0 4-4 8 0M401 201q3-3 6 0 3-3 6 0M346 229q3-3 6 0 3-3 6 0"/>
  </g>
  <g fill="#dac18a">
    <circle cx="453" cy="280" r="1.3" opacity=".7"/><circle cx="571" cy="217" r="1" opacity=".5"/>
    <circle cx="419" cy="257" r="1" opacity=".35"/><circle cx="548" cy="178" r="1.2" opacity=".5"/>
    <circle cx="318" cy="298" r="1.1" opacity=".4"/><circle cx="579" cy="311" r="1.3" opacity=".65"/>
    <circle cx="296" cy="423" r="1.3" opacity=".4"/><circle cx="446" cy="404" r="1.2" opacity=".4"/>
  </g>

  <g opacity=".55" stroke="#85ceb5" strokeWidth="1.5" fill="none" transform="translate(516 301)">
    <path d="M-17 0Q0-17 17 0Q0 12-17 0Z"/>
    <circle r="5"/>
    <path d="m-11-9-3-7M0-13v-8m11 12 3-7M0 6v7"/>
    <path d="M0 13c-7 10-4 12 0 12s7-2 0-12Z" fill="#85ceb5" stroke="none"/>
  </g>

  <g>
    <ellipse cx="365" cy="435" rx="86" ry="29" fill="url(#zelda-scene-ancient-glow)"/>
    <ellipse cx="365" cy="448" rx="66" ry="17" fill="#0d241d" opacity=".7"/>
    <path d="m307 429 56-16 57 16v14l-57 20-56-18Z" fill="#4b6152"/>
    <path d="m307 429 56-16 57 16-57 19Z" fill="#879379"/>
    <path d="m363 448 57-19v14l-57 20Z" fill="#344c40"/>
    <path d="m323 416 40-12 41 13v15l-41 13-40-14Z" fill="#5d7361"/>
    <path d="m323 416 40-12 41 13-41 13Z" fill="#a0a889"/>
    <path d="m363 430 41-13v15l-41 13Z" fill="#456253"/>
    <path d="m330 420 33-10 32 10-32 10Z" fill="none" stroke="#c0c7a0" strokeWidth="1" opacity=".7"/>
    <path d="m343 425 19-6 20 5" stroke="#1b3c32" strokeWidth="3"/>
    <path d="m326 445 4 2m5-4 4 2m4-4 4 2m34-1 3-1m4-3 3-1m4-4 3-1" stroke="#86e2c1" strokeWidth="1.5"/>
    <path d="m312 431 8 3-3 8m82-7-8 4 1 11" stroke="#324e3e" strokeWidth="1.4"/>
    <path d="m309 430 10-3 9 3m63 17 11-6 11 1" stroke="#688355" strokeWidth="4" strokeLinecap="round"/>
  </g>

  <g>
    <path d="m355 296-5 17 7 15v87l6 9 7-9v-87l7-15-6-17Z" fill="url(#zelda-scene-blade)" stroke="#c2d6d2" strokeWidth=".7"/>
    <path d="M363 299v121" stroke="#ecf5df" strokeWidth="1.2" opacity=".8"/>
    <path d="m356 338 7-6 7 6-7 15Z" fill="#91b2ae"/>
    <path d="m363 337 4 7h-8Zm-4 7 4 7h-8Zm8 0 4 7h-8Z" fill="#eff0cb" opacity=".9"/>
    <path d="m357 251-3 38h18l-3-38Z" fill="#395c6c" stroke="#263d4e" strokeWidth="1"/>
    <path d="m357 254 13 8m-14 0 14 8m-14 0 15 8m-15 0 15 8M357 255l12 0" stroke="#8cadad" strokeWidth="2" opacity=".82"/>
    <path d="m353 247 10-15 10 15-4 9h-12Z" fill="url(#zelda-scene-hilt)" stroke="#a6a0b8" strokeWidth=".7"/>
    <path d="m363 237 5 10-5 5-5-5Z" fill="#777597"/>
    <path d="m351 285-18-9-10-16-1 28 22 12 9-1 2 12h16l2-12 9 1 22-12-1-28-10 16-18 9Z" fill="url(#zelda-scene-hilt)" stroke="#aaa0bc" strokeWidth=".8"/>
    <path d="m324 264 3 21 19 10 7-1M402 264l-3 21-19 10-7-1" stroke="#b1a5c4" strokeWidth="1.5" opacity=".8"/>
    <path d="m352 287 11-7 11 7-4 13h-14Z" fill="#5c5881"/>
    <path d="m363 284 6 8-6 9-6-9Z" fill="#d9bd72"/>
    <path d="m363 286 3 6-3 4-3-4Z" fill="#f0df9c"/>
    <path d="M355 305h16" stroke="#aaa5bd" strokeWidth="2"/>
  </g>

  <g transform="translate(410 405) rotate(13) scale(.69)">
    <path d="M0-48c-12 10-28 12-38 16l3 52C-29 39-14 53 0 63c14-10 29-24 35-43l3-52C28-36 12-38 0-48Z" fill="#b8c7ca" stroke="#213d46" strokeWidth="2"/>
    <path d="M0-38c-9 7-21 10-29 13l3 43C-21 34-10 44 0 52c10-8 21-18 26-34l3-43C21-28 9-31 0-38Z" fill="#314a75" stroke="#e0ddc3" strokeWidth="1.4"/>
    <path d="m0-27 8 14H-8Zm-8 14L0 1h-16Zm16 0L16 1H0Z" fill="#dfc475"/>
    <path d="m0 8-6 9-12-6-6-8 3 15 13 7-14-3 5 8 16 3-7 6 8 10 8-10-7-6 16-3 5-8-14 3 13-7 3-15-6 8-12 6-6-9Z" fill="#cc635c"/>
    <path d="m-35-24 7 3M35-24l-7 3M-30 17l6-2m54 2-6-2M-13 48l4-5m22 5-4-5" stroke="#758e9d" strokeWidth="2"/>
    <g fill="#eef2de"><circle cx="-32" cy="-26" r="1.4"/><circle cx="32" cy="-26" r="1.4"/><circle cx="-29" cy="17" r="1.4"/><circle cx="29" cy="17" r="1.4"/><circle cx="0" cy="57" r="1.4"/></g>
  </g>

  <g fill="#96e5c6" opacity=".8">
    <circle cx="326" cy="352" r="1.7"/><circle cx="391" cy="343" r="1.3"/>
    <circle cx="340" cy="307" r="1.1"/><circle cx="382" cy="379" r="1.2"/>
    <circle cx="323" cy="403" r="1"/>
  </g>
  <path d="m584 190 1.4 4.6 4.6 1.4-4.6 1.4-1.4 4.6-1.4-4.6-4.6-1.4 4.6-1.4L584 190Z" fill="#dac18a" opacity=".55"/>
</svg>

  );
}

export function Triforce({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 40 36" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="m20 1 10 17.3H10ZM10 18.3 20 35.6H0Zm20 0 10 17.3H20Z" />
    </svg>
  );
}

export function SheikahEye({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 48 56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4 23Q24 4 44 23Q24 40 4 23Z" />
      <circle cx="24" cy="23" r="7" />
      <path d="m11 12-4-7M24 8V1m13 11 4-7M24 30v8" />
      <path d="M24 38c-10 13-6 16 0 16s10-3 0-16Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
