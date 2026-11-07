import { Triforce } from './zelda-art';
import { RealmGlyph, type Realm } from './realm-glyph';
import { RealmScene } from './realm-scene';
import { AncientSeal, RealmOrnament } from './realm-ornament';

export function PageHeading({ title, description, realm }: { title: string; description: string; realm?: Realm }) {
  return realm
    ? <div className="chapter-heading has-realm has-scenery"><div className="chapter-heading-copy"><h1>{title}</h1><p>{description}</p></div><div className="chapter-illustration"><AncientSeal className="chapter-etching"/><RealmScene realm={realm}/><RealmOrnament realm={realm} className="chapter-relic"/><RealmGlyph realm={realm} className="chapter-seal"/></div></div>
    : <div className="chapter-heading"><Triforce/><h1>{title}</h1><p>{description}</p></div>;
}
