import * as THREE from 'three';
import { clampProgress, paperPoint, threeBudget, type ThreeSceneKind } from './three-motion';

/** Decorations only. No route, focus, loading, or audio state belongs to this renderer. */
export function createThreeRenderer(canvas: HTMLCanvasElement, kind: ThreeSceneKind, compact: boolean) {
  const budget = threeBudget(compact);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !compact, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 80);
  camera.position.set(0, 0, 7);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xf6eed3, 0x26483e, 2.4));
  const sun = new THREE.DirectionalLight(0xffe3a2, 3);
  sun.position.set(-3, 6, 5); scene.add(sun);
  const stone = new THREE.MeshStandardMaterial({ color: 0xc8c5a7, roughness: .95, flatShading: true });
  const moss = new THREE.MeshStandardMaterial({ color: 0x668a65, roughness: 1, flatShading: true });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9bd7b, roughness: .48, metalness: .5 });
  const jade = new THREE.MeshStandardMaterial({ color: 0x78bda1, roughness: .6, metalness: .18 });
  // All resources are registered at allocation, including materials not currently visible.
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [stone, moss, gold, jade];
  const textures: THREE.Texture[] = [];
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
    const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: .97, transparent: true });
    materials.push(material);
    paper = mesh(new THREE.PlaneGeometry(1, 1, budget.segments, 12), material) as typeof paper;
    world.visible = false;
  } else {
    for (let i = 0; i < budget.islands; i++) {
      const island = new THREE.Group(); world.add(island); islands.push(island);
      const radius = i === 0 ? 1.1 : .32 + i % 3 * .13;
      const rock = mesh(new THREE.ConeGeometry(radius, radius * 1.7, 7), stone, island); rock.rotation.z = Math.PI; rock.position.y = -radius * .85;
      const grass = mesh(new THREE.CylinderGeometry(radius, radius * .95, .14, 7), moss, island); grass.position.y = .02;
      const pillar = mesh(new THREE.BoxGeometry(.16, .7, .16), stone, island); pillar.position.set(radius * .45, .4, 0);
      const leaf = mesh(new THREE.IcosahedronGeometry(.3, 0), moss, island); leaf.position.copy(pillar.position); leaf.position.y += .46;
      island.position.set(i === 0 ? 0 : Math.sin(i * 2.4) * 3.5, i === 0 ? -.7 : Math.cos(i * 1.7) * 1.6, i === 0 ? 0 : -1 - i * .65);
      island.rotation.y = i * .7;
    }
    gateway.position.set(0, .55, 0);
    const ring = mesh(new THREE.TorusGeometry(.72, .11, 6, 32), stone, gateway);
    ring.rotation.z = Math.PI / 8;
    mesh(new THREE.TorusGeometry(.55, .018, 4, 48), jade, gateway);
    for (let i = 0; i < 12; i++) {
      const rune = mesh(new THREE.BoxGeometry(.045, .09, .04), gold, gateway);
      const angle = i * Math.PI / 6; rune.position.set(Math.sin(angle) * .72, Math.cos(angle) * .72, .12); rune.rotation.z = -angle;
    }
    // Three separate triangular prisms retain the familiar crest's open center.
    for (const [x, y] of [[0, .16], [-.16, -.12], [.16, -.12]]) {
      const shape = new THREE.Shape(); shape.moveTo(0, .14); shape.lineTo(-.14, -.1); shape.lineTo(.14, -.1); shape.closePath();
      const crest = mesh(new THREE.ExtrudeGeometry(shape, { depth: .05, bevelEnabled: false }), gold, gateway); crest.position.set(x, y, .1);
    }
  }
  let disposed = false, failed = false, frame = 0, active = false, elapsed = 0, previous = 0, lastPaint = 0;
  let pointerX = 0, pointerY = 0, aimX = 0, aimY = 0, width = 1, height = 1;
  let turnStarted: number | undefined, turnDuration = 940, backward = false;
  let onFailure: (() => void) | undefined;
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
    theme(day: boolean) { stone.color.set(day ? 0xd6cdb4 : 0xb3bca9); sun.intensity = day ? 3 : 1.8; render(); },
    dispose() {
      if (disposed) return; disposed = true; active = false; cancelAnimationFrame(frame);
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose());
      renderer.dispose(); renderer.forceContextLoss();
    }
  };
}
