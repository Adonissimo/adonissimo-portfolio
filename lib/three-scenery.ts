import * as THREE from 'three';

function rim(angle: number, seed: number) {
  return 1 + Math.sin(angle * 5 + seed) * .065 + Math.sin(angle * 11 - seed) * .025;
}

function groundHeight(x: number, z: number, radius: number) {
  return .035 + Math.sin(x * 8 / radius) * Math.cos(z * 7 / radius) * radius * .024
    + Math.sin(x * 19 / radius + z * 13 / radius) * radius * .009;
}

/** Eroded cliff and a matching, densely tessellated terrain cap, rather than a cone/disc silhouette. */
export function createIslandGeometry(radius: number, seed: number, compact: boolean, foreground: boolean) {
  const columns = foreground ? (compact ? 64 : 128) : (compact ? 32 : 48);
  const levels = foreground ? (compact ? 28 : 48) : 20;
  const cliff = new THREE.CylinderGeometry(1, 1, 1, columns, levels, true);
  const vertices = cliff.attributes.position;
  for (let index = 0; index < vertices.count; index++) {
    const x = vertices.getX(index), z = vertices.getZ(index), q = vertices.getY(index) + .5;
    const angle = Math.atan2(z, x);
    const ledges = Math.sin(q * 32 + seed) * .045 + Math.sin(angle * 9 + q * 14) * .07;
    const profile = .06 + .94 * Math.pow(q, .55) + ledges * Math.sin(q * Math.PI);
    const distance = radius * .96 * rim(angle, seed) * profile;
    const px = Math.cos(angle) * distance, pz = Math.sin(angle) * distance;
    vertices.setXYZ(index, px, (q - 1) * radius * 2.2 + groundHeight(px, pz, radius) * q, pz);
  }
  cliff.computeVertexNormals();
  const rings = foreground ? (compact ? 20 : 36) : 12;
  const positions: number[] = [0, groundHeight(0, 0, radius), 0], uv: number[] = [.5, .5], indices: number[] = [];
  for (let ring = 1; ring <= rings; ring++) for (let column = 0; column <= columns; column++) {
    const angle = column / columns * Math.PI * 2;
    const distance = radius * .96 * ring / rings * rim(angle, seed);
    const x = Math.cos(angle) * distance, z = Math.sin(angle) * distance;
    positions.push(x, groundHeight(x, z, radius), z); uv.push(x / radius / 2 + .5, z / radius / 2 + .5);
  }
  for (let column = 0; column < columns; column++) indices.push(0, column + 2, column + 1);
  for (let ring = 0; ring < rings - 1; ring++) for (let column = 0; column < columns; column++) {
    const a = 1 + ring * (columns + 1) + column, b = a + columns + 1;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const ground = new THREE.BufferGeometry();
  ground.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  ground.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ground.setIndex(indices); ground.computeVertexNormals();
  // The bottom is closed separately so the gateway camera never sees inside the island.
  const base = new THREE.CircleGeometry(radius * .058, columns); base.rotateX(Math.PI / 2); base.translate(0, -radius * 2.2, 0);
  return { cliff, ground, base };
}

/** Curved, pointed leaf surface. Instancing provides individual foliage without per-leaf draw calls. */
export function createLeafGeometry() {
  const geometry = new THREE.PlaneGeometry(1, 1, 4, 8), vertices = geometry.attributes.position;
  for (let index = 0; index < vertices.count; index++) {
    const x = vertices.getX(index), y = vertices.getY(index), t = y + .5;
    const width = Math.pow(Math.sin(Math.PI * t), .8);
    vertices.setXYZ(index, x * width * .48, y, Math.sin(t * Math.PI) * .08 + Math.abs(x) * width * .08);
  }
  geometry.computeVertexNormals(); return geometry;
}

export function createLeafTexture() {
  const size = 256, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const center = Math.abs(x / size - .5), vein = Math.abs(Math.sin(y * .23 - center * 20));
    const grain = Math.sin(x * 13.1 + y * 47.7) * Math.sin(x * 31.2 - y * 9.2);
    const highlight = center < .012 || vein < .08 ? 18 : 0;
    const offset = (y * size + x) * 4;
    pixels[offset] = 55 + highlight + grain * 7;
    pixels[offset + 1] = 86 + highlight + grain * 10 + Math.sin(y / size * Math.PI) * 12;
    pixels[offset + 2] = 30 + highlight * .4 + grain * 4; pixels[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size); texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true; return texture;
}
