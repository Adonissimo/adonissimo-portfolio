const base = '/images/projects/zeldabonk';

export const gameScreens = [
  { src: `${base}/menu.jpg`, title: 'Your adventure starts here', alt: 'ZeldaBonk title menu overlooking Kokiri Forest, with game modes and hero choices.', caption: 'The real game menu. Choose Adventure or Survival, then pick your hero.' },
  { src: `${base}/gameplay.jpg`, title: 'Zelda at the Great Sea', alt: 'Zelda fighting enemies beside a shrine in the Great Sea training arena.', caption: 'A live Training Grounds capture with Zelda and Light Arrows. Practice runs do not change your saved adventure.' },
  { src: `${base}/sealing-power.jpg`, title: 'A little extra power', alt: 'Zelda activating Sealing Power in the Great Sea Training Grounds.', caption: 'Zelda’s Sealing Power in Training Grounds. Each hero brings a different play style.' }
] as const;

export const gameRealms = [
  { id: 'kokiri-forest', name: 'Kokiri Forest', landmark: 'Great Deku Tree', guardian: 'Gohma' },
  { id: 'zoras-fountain', name: 'Zora’s Fountain', landmark: 'Water Temple', guardian: 'Morpha' },
  { id: 'hyrule-field', name: 'Hyrule Field', landmark: 'Hyrule Castle Courtyard', guardian: 'King Bulblin' },
  { id: 'great-sea', name: 'The Great Sea', landmark: 'Forsaken Fortress', guardian: 'Helmaroc King' },
  { id: 'twilight-realm', name: 'Twilight Realm', landmark: 'Palace of Twilight', guardian: 'Zant' },
  { id: 'skyloft', name: 'Skyloft', landmark: 'Sky Keep', guardian: 'Ghirahim' },
  { id: 'the-depths', name: 'The Depths', landmark: 'Wind Temple', guardian: 'Colgera' },
  { id: 'termina-field', name: 'Termina Field', landmark: 'Inside the Moon', guardian: 'Majora’s Mask' }
].map(realm => ({ ...realm, src: `${base}/map-${realm.id}.jpg`, title: realm.name, alt: `ZeldaBonk’s ${realm.name} scenery shown in the game’s realm preview.`, caption: `${realm.landmark} · Guardian: ${realm.guardian}. Captured from the menu’s realm preview, not an unlocked campaign save.` }));

export const gameHeroes = [
  { id: 'link', name: 'Link', role: 'Hero of Courage', style: 'Sword cuts and a sweeping Spin Attack.' },
  { id: 'zelda', name: 'Zelda', role: 'Princess of Hyrule', style: 'Light Arrows and Sealing Power.' },
  { id: 'midna', name: 'Midna', role: 'Twilight Princess', style: 'Hair-hand strikes and Fused Shadow transformation.' },
  { id: 'tetra', name: 'Tetra', role: 'Pirate Captain', style: 'Quick cutlass attacks and a Water Gun.' },
  { id: 'sheik', name: 'Sheik', role: 'Sheikah Warrior', style: 'Fast kunai cuts and a magical harp pulse.' },
  { id: 'skullkid', name: 'Skull Kid', role: 'Lost Woods Trickster', style: 'Tatl, Tael, and a targeted Moon Crash.' },
  { id: 'impa', name: 'Impa', role: 'Sage of Shadow', style: 'Giant Blade cuts and a forward water sweep.' },
  { id: 'saria', name: 'Saria', role: 'Sage of Forest', style: 'Fairy Slingshot attacks and a Saria’s Song story scene.' },
  { id: 'darunia', name: 'Darunia', role: 'Sage of Fire', style: 'Heavy hammer strikes and a Goron Body Slam.' },
  { id: 'ruto', name: 'Ruto', role: 'Sage of Water', style: 'Water attacks that push enemies back.' },
  { id: 'nabooru', name: 'Nabooru', role: 'Sage of Spirit', style: 'Iron Knuckle axe attacks and a Spirit Medallion story scene.' }
].map(hero => ({ ...hero, src: `${base}/character-${hero.id}.png`, title: hero.name, alt: hero.id === 'darunia' ? 'Custom Darunia pixel art with golden skin, an ivory mane and beard, white markings, and brown wrist cuffs.' : `${hero.name} character artwork exported from ZeldaBonk.`, caption: `${hero.role}. ${hero.style}${hero.id === 'darunia' ? ' Custom portfolio portrait based on the supplied model reference.' : ''}` }));
