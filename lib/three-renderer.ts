import * as THREE from 'three';
import { clampProgress, paperPoint, threeBudget, type ThreeSceneKind } from './three-motion';
import { createIslandGeometry, createLeafGeometry, createLeafTexture } from './three-scenery';

/** Decorations only. No route, focus, loading, or audio state belongs to this renderer. */
export function createThreeRenderer(canvas: HTMLCanvasElement, kind: ThreeSceneKind, compact: boolean) {
  const budget = threeBudget(compact);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !compact, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 80);
  camera.position.set(0, 0, 7);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xf6eed3, 0x26483e, 1.15));
  const sun = new THREE.DirectionalLight(0xffe3a2, 2.8);
  sun.position.set(-3, 6, 5); scene.add(sun);
  const stone = new THREE.MeshStandardMaterial({ color: 0xc8c5a7, roughness: .88 });
  const moss = new THREE.MeshStandardMaterial({ color: 0x66805b, roughness: .96 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd9b765, roughness: .26, metalness: .92, clearcoat: .18, clearcoatRoughness: .32 });
  const jade = new THREE.MeshPhysicalMaterial({ color: 0x78a98d, roughness: .3, metalness: .08, clearcoat: .4 });
  const bark = new THREE.MeshStandardMaterial({ color: 0x65523c, roughness: .98 });
  // All resources are registered at allocation, including materials not currently visible.
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [stone, moss, gold, jade, bark];
  const textures: THREE.Texture[] = [];
  const instances: THREE.InstancedMesh[] = [];
  let disposed = false, failed = false, frame = 0, active = false, elapsed = 0, previous = 0, lastPaint = 0;
  let onFailure: (() => void) | undefined;
  function photographedMaterial(material: THREE.MeshStandardMaterial, name: 'rock' | 'ground') {
    const loader = new THREE.TextureLoader(), size = compact ? 512 : 1024;
    const ready = (texture: THREE.Texture) => { if (disposed) texture.dispose(); else render(); };
    const load = (map: string, slots: Array<'map' | 'normalMap' | 'roughnessMap' | 'aoMap'>, color = false) => {
      const texture = loader.load(`/textures/terrain/${name}-${map}-${size}.png`, ready, undefined, () => {
        if (disposed) return;
        slots.forEach(slot => { material[slot] = null; }); material.needsUpdate = true; render();
      });
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(name === 'rock' ? 2 : 3, name === 'rock' ? 2 : 3);
      texture.anisotropy = compact ? 2 : 4;
      textures.push(texture); slots.forEach(slot => { material[slot] = texture; });
    };
    load('color', ['map'], true); load('normal', ['normalMap']); load('arm', ['roughnessMap', 'aoMap']);
    material.normalScale.set(.8, .8); material.aoMapIntensity = .7; material.color.set(0xf1eee4); material.needsUpdate = true;
  }
  /** Authored mineral/fiber relief, generated once rather than sampled every frame. */
  function surfaceTexture(organic: boolean) {
    const size = compact ? 64 : 128, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const grain = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const noise = grain - Math.floor(grain);
      const vein = Math.sin(y * .32 + Math.sin(x * .12) * 2.8);
      const relief = Math.round(142 + vein * (organic ? 12 : 30) + (noise - .5) * 54);
      const offset = (y * size + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = relief; data[offset + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true;
    textures.push(texture); return texture;
  }
  const mineralRelief = surfaceTexture(false), organicRelief = surfaceTexture(true);
  stone.bumpMap = stone.roughnessMap = mineralRelief; stone.bumpScale = .045;
  moss.bumpMap = organicRelief; moss.bumpScale = .025;
  bark.bumpMap = mineralRelief; bark.bumpScale = .035;
  gold.roughnessMap = organicRelief;
  // A small original sky/studio environment gives metals real reflection information.
  const skyWidth = 128, skyHeight = 64, skyPixels = new Uint8Array(skyWidth * skyHeight * 4);
  for (let y = 0; y < skyHeight; y++) for (let x = 0; x < skyWidth; x++) {
    const horizon = Math.sin(y / skyHeight * Math.PI);
    const light = x > 22 && x < 48 && y > 8 && y < 26 ? 90 : 0;
    const offset = (y * skyWidth + x) * 4;
    skyPixels[offset] = Math.min(255, 52 + horizon * 110 + light);
    skyPixels[offset + 1] = Math.min(255, 70 + horizon * 105 + light);
    skyPixels[offset + 2] = Math.min(255, 76 + horizon * 88 + light);
    skyPixels[offset + 3] = 255;
  }
  const environment = new THREE.DataTexture(skyPixels, skyWidth, skyHeight);
  environment.mapping = THREE.EquirectangularReflectionMapping; environment.colorSpace = THREE.SRGBColorSpace;
  environment.magFilter = environment.minFilter = THREE.LinearFilter; environment.needsUpdate = true;
  textures.push(environment); scene.environment = environment; scene.environmentIntensity = .75;
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = world) {
    geometries.push(geometry);
    const object = new THREE.Mesh(geometry, material); parent.add(object); return object;
  }
  const gateway = new THREE.Group(); world.add(gateway);
  const islands: THREE.Group[] = [];
  let paper: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | undefined;
  if (kind === 'paper') {
    const source = document.createElement('canvas'); source.width = 512; source.height = 768;
    const ink = source.getContext('2d');
    if (ink) {
      ink.fillStyle = '#e6d7b3'; ink.fillRect(0, 0, 512, 768);
      ink.strokeStyle = '#8b754a'; ink.lineWidth = 2; ink.strokeRect(24, 24, 464, 720);
      ink.strokeStyle = '#c5b58d';
      for (let y = 470; y < 690; y += 22) { ink.beginPath(); ink.moveTo(64, y); ink.lineTo(448, y); ink.stroke(); }
      ink.fillStyle = '#71603e'; ink.textAlign = 'center'; ink.font = '28px Georgia';
      ink.fillText('ADONISSIMO', 256, 380); ink.font = '18px Georgia'; ink.fillText('A Hyrule Field Journal', 256, 418);
      for (const [x, y] of [[256, 190], [218, 256], [294, 256]]) {
        ink.beginPath(); ink.moveTo(x, y); ink.lineTo(x - 36, y + 62); ink.lineTo(x + 36, y + 62); ink.closePath(); ink.fill();
      }
    }
    const texture = new THREE.CanvasTexture(source); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const material = new THREE.MeshStandardMaterial({ map: texture, bumpMap: organicRelief, bumpScale: .012, side: THREE.DoubleSide, roughness: .97, transparent: true });
    materials.push(material);
    paper = mesh(new THREE.PlaneGeometry(1, 1, budget.segments, 12), material) as typeof paper;
    world.visible = false;
  } else {
    photographedMaterial(stone, 'rock'); photographedMaterial(moss, 'ground');
    const leafTexture = createLeafTexture(); textures.push(leafTexture);
    const leafMaterial = new THREE.MeshStandardMaterial({ map: leafTexture, side: THREE.DoubleSide, roughness: .83, color: 0xc5c5a4 }); materials.push(leafMaterial);
    const foliageGeometry = createLeafGeometry(); geometries.push(foliageGeometry);
    for (let i = 0; i < budget.islands; i++) {
      const island = new THREE.Group(); world.add(island); islands.push(island);
      const radius = i === 0 ? 1.1 : .32 + i % 3 * .13;
      const terrain = createIslandGeometry(radius, i, compact, i === 0);
      mesh(terrain.cliff, stone, island); mesh(terrain.ground, moss, island); mesh(terrain.base, stone, island);
      const tree = new THREE.Group(); island.add(tree); tree.position.set(radius * .42, .08, -.1);
      const trunk = mesh(new THREE.CylinderGeometry(.026, .065, .72, compact ? 16 : 24, 8), bark, tree); trunk.position.y = .36; trunk.rotation.z = -.12;
      for (let branch = 0; branch < (compact ? 6 : 10); branch++) {
        const angle = branch * 2.4;
        const limb = mesh(new THREE.CylinderGeometry(.006, .026, .4, compact ? 10 : 16, 4), bark, tree);
        limb.position.set(Math.sin(angle) * .12, .53 + branch * .025, Math.cos(angle) * .12);
        limb.rotation.set(Math.cos(angle) * .7, 0, -Math.sin(angle) * .7);
      }
      const leafCount = i === 0 ? (compact ? 360 : 1100) : (compact ? 100 : 220);
      const leaves = new THREE.InstancedMesh(foliageGeometry, leafMaterial, leafCount); tree.add(leaves); instances.push(leaves);
      const transform = new THREE.Object3D(), tint = new THREE.Color();
      for (let leaf = 0; leaf < leafCount; leaf++) {
        const angle = leaf * 2.399963, fraction = (leaf + .5) / leafCount;
        const height = 1 - fraction * 2, spread = Math.sqrt(1 - height * height);
        const interior = .64 + (Math.sin(leaf * 78.23) * .5 + .5) * .36;
        transform.position.set(Math.cos(angle) * spread * .43 * interior, .8 + height * .28, Math.sin(angle) * spread * .38 * interior);
        transform.rotation.set(leaf * .79, angle, Math.sin(leaf * .7) * .9);
        const size = .07 + leaf % 7 * .006; transform.scale.set(size, size * 1.7, size); transform.updateMatrix();
        leaves.setMatrixAt(leaf, transform.matrix);
        tint.setHSL(.22 + Math.sin(leaf * .6) * .025, .22 + leaf % 5 * .025, .55 + leaf % 9 * .025); leaves.setColorAt(leaf, tint);
      }
      leaves.instanceMatrix.needsUpdate = true; if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
      for (let boulder = 0; boulder < (compact ? 6 : 12); boulder++) {
        const angle = boulder * 2.4 + i;
        const pebble = mesh(new THREE.SphereGeometry(radius * (.09 + boulder % 2 * .04), compact ? 16 : 24, compact ? 12 : 20), stone, island);
        pebble.position.set(Math.sin(angle) * radius * .73, .1, Math.cos(angle) * radius * .73); pebble.scale.set(1.4, .7, 1);
      }
      island.position.set(i === 0 ? 0 : Math.sin(i * 2.4) * 3.5, i === 0 ? -.7 : Math.cos(i * 1.7) * 1.6, i === 0 ? 0 : -1 - i * .65);
      island.rotation.y = i * .7;
    }
    gateway.position.set(0, .55, 0);
    const ringGeometry = new THREE.TorusGeometry(.72, .11, compact ? 24 : 40, compact ? 96 : 160);
    const ringVertices = ringGeometry.attributes.position, ringNormals = ringGeometry.attributes.normal;
    for (let vertex = 0; vertex < ringVertices.count; vertex++) {
      const x = ringVertices.getX(vertex), y = ringVertices.getY(vertex), z = ringVertices.getZ(vertex);
      const erosion = (Math.sin(x * 43 + y * 31) * Math.sin(y * 57 - z * 39) + Math.sin(x * 17 - y * 19)) * .003;
      ringVertices.setXYZ(vertex, x + ringNormals.getX(vertex) * erosion, y + ringNormals.getY(vertex) * erosion, z + ringNormals.getZ(vertex) * erosion);
    }
    ringGeometry.computeVertexNormals();
    const ring = mesh(ringGeometry, stone, gateway);
    ring.rotation.z = Math.PI / 8;
    mesh(new THREE.TorusGeometry(.55, .018, 8, compact ? 48 : 80), jade, gateway);
    const foot = mesh(new THREE.CylinderGeometry(.85, .96, .14, compact ? 24 : 48), stone, gateway); foot.position.y = -.72; foot.scale.z = .45;
    for (let i = 0; i < 12; i++) {
      const rune = mesh(new THREE.BoxGeometry(.045, .09, .04), gold, gateway);
      const angle = i * Math.PI / 6; rune.position.set(Math.sin(angle) * .72, Math.cos(angle) * .72, .12); rune.rotation.z = -angle;
    }
    // Three separate triangular prisms retain the familiar crest's open center.
    for (const [x, y] of [[0, .16], [-.16, -.12], [.16, -.12]]) {
      const shape = new THREE.Shape(); shape.moveTo(0, .14); shape.lineTo(-.14, -.1); shape.lineTo(.14, -.1); shape.closePath();
      const crest = mesh(new THREE.ExtrudeGeometry(shape, { depth: .045, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: compact ? 1 : 3 }), gold, gateway); crest.position.set(x, y, .1);
    }
  }
  let pointerX = 0, pointerY = 0, aimX = 0, aimY = 0, width = 1, height = 1;
  let turnStarted: number | undefined, turnDuration = 940, backward = false;
  function render() {
    if (disposed || failed) return;
    try { renderer.render(scene, camera); } catch { failed = true; active = false; onFailure?.(); }
  }
  function update(seconds: number) {
    if (kind === 'paper') {
      if (!paper || turnStarted === undefined) return;
      const progress = clampProgress((seconds - turnStarted) * 1000 / turnDuration);
      const positions = paper.geometry.attributes.position;
      const segments = budget.segments, rows = 12;
      const pageHeight = 4.6, pageWidth = Math.min(4.6, 4.6 * camera.aspect * .54);
      for (let row = 0; row <= rows; row++) for (let column = 0; column <= segments; column++) {
        const point = paperPoint(column / segments, 1 - row / rows, progress, backward);
        positions.setXYZ(row * (segments + 1) + column, point.x * pageWidth, point.y * pageHeight, point.z * pageWidth);
      }
      positions.needsUpdate = true; paper.geometry.computeVertexNormals();
      paper.material.opacity = Math.min(1, progress / .1, (1 - progress) / .18);
      world.visible = progress < 1;
      if (progress === 1) turnStarted = undefined;
      camera.position.set(0, 0, 7); camera.lookAt(0, 0, 0);
    } else {
      pointerX += (aimX - pointerX) * .06; pointerY += (aimY - pointerY) * .06;
      const entry = kind === 'entry' ? clampProgress(seconds / 4.2) : 0;
      const journey = kind === 'prologue' ? clampProgress(seconds / 5.6) : 0;
      camera.position.set(pointerX * .24, .25 + pointerY * .15 + journey * .65, 7 - entry * 7.6 - journey * 1.3);
      camera.lookAt(0, .25 + journey * .3, -1);
      world.rotation.y = Math.sin(seconds * .13) * .055 + pointerX * .06;
      islands.forEach((island, i) => { island.position.y += (Math.sin(seconds * .65 + i) * .08 + (i === 0 ? -.7 : Math.cos(i * 1.7) * 1.6) - island.position.y) * .1; });
      gateway.rotation.y = Math.sin(seconds * .3) * .1;
      if (kind === 'hero') world.scale.setScalar(1.18);
    }
  }
  function tick(now: number) {
    frame = 0;
    if (!active || disposed) return;
    const delta = previous ? Math.min(64, now - previous) : 0; previous = now; elapsed += delta / 1000;
    if (now - lastPaint >= 1000 / budget.fps) { lastPaint = now; update(elapsed); render(); }
    if (active && (kind !== 'paper' || turnStarted !== undefined)) frame = requestAnimationFrame(tick);
  }
  function start() { if (!frame && active && !disposed) { previous = 0; frame = requestAnimationFrame(tick); } }
  function resize(w: number, h: number) {
    width = Math.max(1, w); height = Math.max(1, h);
    const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.75, Math.sqrt(budget.pixels / (width * height)));
    renderer.setPixelRatio(ratio); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    update(elapsed); render();
  }
  return {
    resize,
    setActive(value: boolean) { active = value && !failed; if (active) start(); else { cancelAnimationFrame(frame); frame = 0; previous = 0; } },
    pointer(x: number, y: number) { aimX = Math.max(-1, Math.min(1, x)); aimY = Math.max(-1, Math.min(1, y)); },
    turn(reverse: boolean, duration: number) { backward = reverse; turnDuration = duration; turnStarted = elapsed; world.visible = true; start(); },
    cancelTurn() { turnStarted = undefined; world.visible = kind !== 'paper'; render(); },
    failure(callback: () => void) { onFailure = callback; },
    theme(day: boolean) { stone.color.set(day ? 0xf4eee1 : 0xc4cfc7); sun.intensity = day ? 2.8 : 1.7; scene.environmentIntensity = day ? .85 : .5; render(); },
    dispose() {
      if (disposed) return; disposed = true; active = false; cancelAnimationFrame(frame);
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose());
      instances.forEach(instance => instance.dispose());
      renderer.dispose(); renderer.forceContextLoss();
    }
  };
}
