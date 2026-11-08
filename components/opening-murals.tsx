import Image from 'next/image';
import { AncientSeal } from './realm-ornament';
import { Triforce, SheikahEye } from './zelda-art';

/** Existing alpha PNGs become two worn stone/forest mural wings around the title. */
export function OpeningMurals() {
  return <div className="welcome-murals" aria-hidden="true">
    <div className="welcome-mural welcome-mural-left"><Image src="/images/backgrounds/zonai-atlas.png" alt="" fill sizes="(max-width: 760px) 56vw, (max-width: 1478px) 46vw, 680px" loading="eager" draggable={false}/><AncientSeal className="mural-seal"/><div className="mural-inscriptions"><Triforce/><SheikahEye/><Triforce/></div></div>
    <div className="welcome-mural welcome-mural-right"><Image src="/images/hyrule-atlas.png" alt="" fill sizes="(max-width: 760px) 56vw, (max-width: 1478px) 46vw, 680px" loading="eager" draggable={false}/><AncientSeal className="mural-seal"/><div className="mural-inscriptions"><SheikahEye/><Triforce/><SheikahEye/></div></div>
  </div>;
}
