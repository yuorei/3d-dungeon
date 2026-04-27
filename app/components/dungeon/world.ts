import * as THREE from "three";
import { chapters } from "./chapters";

export function buildWorld(scene: THREE.Scene, root: THREE.Group) {
  scene.background = new THREE.Color(0xbfefff);
  scene.fog = new THREE.FogExp2(0xb9efe7, 0.008);
  scene.add(new THREE.HemisphereLight(0xdff9ff, 0x66866a, 2.25));

  const sun = new THREE.DirectionalLight(0xfff4cf, 4.4);
  sun.position.set(-24, 48, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(210, 470, 80, 220),
    new THREE.MeshStandardMaterial({
      color: 0x365d43,
      roughness: 0.86,
      metalness: 0.02,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -190;
  ground.receiveShadow = true;
  ripplePlane(ground.geometry as THREE.PlaneGeometry, 0.34, 1.4);
  root.add(ground);

  buildPanorama(root);
  buildForest(root);
  buildCaveMouth(root);
  buildDungeon(root);
  buildRuins(root);
  buildSanctuary(root);
  buildPathLights(root);
  buildMist(root);
}

function buildForest(root: THREE.Group) {
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5a3b24,
    roughness: 0.92,
  });
  const barkDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2f2118,
    roughness: 0.96,
  });
  const leafMats = [0x3f8a55, 0x5ea96a, 0x2f7450].map((color) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
  }));
  const fernMat = new THREE.MeshStandardMaterial({
    color: 0x2e8f5d,
    roughness: 0.85,
  });
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0x8ffff0,
    emissive: 0x39d8c8,
    emissiveIntensity: 0.8,
    roughness: 0.4,
  });
  const fernGeo = new THREE.ConeGeometry(0.32, 1.45, 7);
  const leafGeo = new THREE.IcosahedronGeometry(1, 2);

  for (let i = 0; i < 82; i += 1) {
    const z = 24 - seeded(i, 2) * 126;
    const side = seeded(i, 3) > 0.5 ? 1 : -1;
    const x = side * (9.5 + seeded(i, 4) * 38);
    const height = 8.2 + seeded(i, 5) * 6.5;
    const lean = new THREE.Vector3((seeded(i, 6) - 0.5) * 1.6, height, (seeded(i, 7) - 0.5) * 1.8);
    const base = new THREE.Vector3(x, 0.1, z);
    const top = base.clone().add(lean);

    addTaperedBranch(root, base, top, 0.55 + seeded(i, 8) * 0.28, 0.2, trunkMat, 10);

    for (let r = 0; r < 4; r += 1) {
      const angle = seeded(i, r + 20) * Math.PI * 2;
      const rootEnd = base.clone().add(new THREE.Vector3(Math.cos(angle) * (1.0 + seeded(i, r + 21) * 1.2), 0.18, Math.sin(angle) * (0.9 + seeded(i, r + 22))));
      addTaperedBranch(root, base.clone().add(new THREE.Vector3(0, 0.2, 0)), rootEnd, 0.22, 0.06, barkDarkMat, 7);
    }

    for (let b = 0; b < 4; b += 1) {
      const t = 0.48 + b * 0.1 + seeded(i, b + 30) * 0.07;
      const start = base.clone().lerp(top, Math.min(t, 0.9));
      const sideSign = seeded(i, b + 31) > 0.5 ? 1 : -1;
      const branchAngle = lookAngle(sideSign, seeded(i, b + 32));
      const length = 1.25 + seeded(i, b + 33) * 1.55;
      const end = start.clone().add(new THREE.Vector3(Math.cos(branchAngle) * length, 0.8 + seeded(i, b + 34) * 1.2, Math.sin(branchAngle) * length));
      addTaperedBranch(root, start, end, 0.13, 0.045, trunkMat, 8);

      for (let k = 0; k < 3; k += 1) {
        const leaf = new THREE.Mesh(leafGeo, leafMats[(i + b + k) % leafMats.length]);
        leaf.position.set(
          end.x + (seeded(i, b * 10 + k + 40) - 0.5) * 1.5,
          end.y + (seeded(i, b * 10 + k + 41) - 0.4) * 0.9,
          end.z + (seeded(i, b * 10 + k + 42) - 0.5) * 1.5,
        );
        leaf.scale.set(0.9 + seeded(i, b * 10 + k + 43) * 0.75, 0.42 + seeded(i, b * 10 + k + 44) * 0.3, 0.75 + seeded(i, b * 10 + k + 45) * 0.7);
        leaf.rotation.set(seeded(i, b * 10 + k + 46) * Math.PI, seeded(i, b * 10 + k + 47) * Math.PI, seeded(i, b * 10 + k + 48) * Math.PI);
        leaf.castShadow = true;
        root.add(leaf);
      }
    }

    const crownCenter = top.clone().add(new THREE.Vector3(0, -0.8, 0));
    for (let j = 0; j < 9; j += 1) {
      const crown = new THREE.Mesh(leafGeo, leafMats[(i + j) % leafMats.length]);
      const angle = seeded(i, j + 80) * Math.PI * 2;
      const radius = seeded(i, j + 81) * 2.6;
      crown.position.set(
        crownCenter.x + Math.cos(angle) * radius,
        crownCenter.y + (seeded(i, j + 82) - 0.25) * 2.2,
        crownCenter.z + Math.sin(angle) * radius,
      );
      crown.scale.set(1.05 + seeded(i, j + 83) * 1.05, 0.48 + seeded(i, j + 84) * 0.42, 0.85 + seeded(i, j + 85) * 1.05);
      crown.rotation.set(seeded(i, j + 86) * Math.PI, seeded(i, j + 87) * Math.PI, seeded(i, j + 88) * Math.PI);
      crown.castShadow = true;
      root.add(crown);
    }
  }

  for (let i = 0; i < 170; i += 1) {
    const z = 22 - seeded(i, 8) * 136;
    const side = seeded(i, 9) > 0.5 ? 1 : -1;
    const fern = new THREE.Mesh(fernGeo, fernMat);
    fern.position.set(side * (4.2 + seeded(i, 10) * 12), 0.65, z);
    fern.scale.set(0.45 + seeded(i, 11) * 0.9, 0.65 + seeded(i, 12) * 1.4, 0.45 + seeded(i, 14) * 0.9);
    fern.rotation.y = seeded(i, 12) * Math.PI * 2;
    fern.castShadow = true;
    root.add(fern);
  }

  for (let i = 0; i < 28; i += 1) {
    const light = new THREE.PointLight(0x7fffe2, 0.24, 7);
    light.position.set((seeded(i, 120) - 0.5) * 18, 0.75, 8 - seeded(i, 121) * 88);
    root.add(light);
  }

  const pathGlowMat = new THREE.MeshStandardMaterial({
    color: 0x43ffe1,
    emissive: 0x18cdb9,
    emissiveIntensity: 1.4,
    roughness: 0.35,
  });
  for (let i = 0; i < 36; i += 1) {
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.035 + seeded(i, 124) * 0.045, 8, 8), i % 5 === 0 ? flowerMat : pathGlowMat);
    ember.position.set((seeded(i, 125) - 0.5) * 3.4, 0.12, 3 - i * 3.2);
    root.add(ember);
  }
}

function buildCaveMouth(root: THREE.Group) {
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.98 });
  for (let i = 0; i < 72; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + seeded(i, 16) * 5.8, 2), rockMat);
    const side = seeded(i, 17) > 0.5 ? 1 : -1;
    rock.position.set(side * (4.5 + seeded(i, 18) * 18), 1.2 + seeded(i, 19) * 9.5, -108 - seeded(i, 20) * 36);
    rock.scale.y = 0.7 + seeded(i, 21) * 1.8;
    rock.rotation.set(seeded(i, 22) * 2, seeded(i, 23) * 2, seeded(i, 24) * 2);
    rock.castShadow = true;
    root.add(rock);
  }

  const arch = new THREE.Mesh(new THREE.TorusGeometry(11.8, 2.4, 18, 48, Math.PI), rockMat);
  arch.position.set(0, 6.7, -119);
  arch.rotation.z = Math.PI;
  arch.scale.y = 1.15;
  arch.castShadow = true;
  root.add(arch);

  for (let i = 0; i < 16; i += 1) {
    addCrystalCluster(root, (seeded(i, 29) - 0.5) * 20, -100 - seeded(i, 30) * 46, 0.85 + seeded(i, 31), i);
  }
}

function addTaperedBranch(
  root: THREE.Group,
  start: THREE.Vector3,
  end: THREE.Vector3,
  startRadius: number,
  endRadius: number,
  material: THREE.Material,
  segments: number,
) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(endRadius, startRadius, length, segments),
    material,
  );
  branch.position.copy(start).addScaledVector(direction, 0.5);
  branch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  branch.castShadow = true;
  branch.receiveShadow = true;
  root.add(branch);
}

function lookAngle(sideSign: number, variation: number) {
  const base = sideSign > 0 ? 0 : Math.PI;
  return base + (variation - 0.5) * 1.7;
}

function buildDungeon(root: THREE.Group) {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x172433, roughness: 0.95 });
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x29333a, roughness: 0.83 });
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x13bfe0,
    emissive: 0x086b8d,
    emissiveIntensity: 1.8,
    roughness: 0.18,
    metalness: 0,
    transmission: 0.2,
  });

  for (let i = 0; i < 96; i += 1) {
    const z = -144 - i * 2.15;
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2 + seeded(i, side) * 3.8, 2), wallMat);
      wall.position.set(side * (8.8 + seeded(i, side + 40) * 5.8), 2.7 + seeded(i, side + 42) * 4.2, z);
      wall.scale.set(1.2, 1.8 + seeded(i, side + 44), 0.75);
      wall.rotation.set(seeded(i, side + 46), seeded(i, side + 48), seeded(i, side + 50));
      wall.castShadow = true;
      root.add(wall);
    }
  }

  const stream = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 168, 8, 90), waterMat);
  stream.rotation.x = -Math.PI / 2;
  stream.position.set(0, 0.08, -222);
  ripplePlane(stream.geometry as THREE.PlaneGeometry, 0.18, 0.8);
  root.add(stream);

  for (let i = 0; i < 34; i += 1) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.8 + seeded(i, 150) * 2.4, 0.22, 2.0 + seeded(i, 151) * 2.2), pathMat);
    slab.position.set((seeded(i, 152) - 0.5) * 5.8, 0.2, -146 - i * 4.8);
    slab.rotation.y = (seeded(i, 153) - 0.5) * 0.28;
    slab.receiveShadow = true;
    root.add(slab);
  }

  for (let i = 0; i < 42; i += 1) {
    const side = seeded(i, 160) > 0.5 ? 1 : -1;
    addCrystalCluster(root, side * (3.8 + seeded(i, 161) * 5.2), -145 - seeded(i, 162) * 180, 0.45 + seeded(i, 163) * 0.95, i + 50);
  }
}

function buildRuins(root: THREE.Group) {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5b5a50, roughness: 0.86 });
  const glyphMat = new THREE.MeshStandardMaterial({
    color: 0xd6f7ff,
    emissive: 0x62e0ff,
    emissiveIntensity: 1.5,
  });
  for (let row = 0; row < 9; row += 1) {
    const z = -252 - row * 9.5;
    for (const x of [-9, 9]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 7 + seeded(row, x) * 4, 9), stoneMat);
      pillar.position.set(x, pillar.geometry.parameters.height / 2, z);
      pillar.rotation.z = (seeded(row, x + 1) - 0.5) * 0.12;
      pillar.castShadow = true;
      root.add(pillar);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 3.2), stoneMat);
      cap.position.set(x, pillar.position.y * 2 + 0.35, z);
      cap.rotation.y = seeded(row, x + 2) * 0.4;
      root.add(cap);
    }
  }

  for (let i = 0; i < 26; i += 1) {
    const glyph = new THREE.Mesh(new THREE.TorusGeometry(0.45 + seeded(i, 60) * 0.8, 0.035, 6, 22), glyphMat);
    glyph.position.set((seeded(i, 61) - 0.5) * 12, 0.12, -248 - seeded(i, 62) * 84);
    glyph.rotation.x = -Math.PI / 2;
    glyph.rotation.z = seeded(i, 63) * Math.PI;
    root.add(glyph);
  }
}

function buildSanctuary(root: THREE.Group) {
  const cavernMat = new THREE.MeshStandardMaterial({ color: 0x18212c, roughness: 0.92 });
  const crystalMats = [0x63e8ff, 0x9a70ff, 0x57ffc3].map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.25,
        roughness: 0.38,
      }),
  );

  const dome = new THREE.Mesh(new THREE.SphereGeometry(58, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), cavernMat);
  dome.position.set(0, 2, -382);
  dome.scale.set(1.05, 0.58, 1.15);
  dome.rotation.x = Math.PI;
  root.add(dome);

  for (let i = 0; i < 88; i += 1) {
    const radius = 12 + seeded(i, 72) * 42;
    const angle = seeded(i, 73) * Math.PI * 2;
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.7 + seeded(i, 74) * 1.1, 4 + seeded(i, 75) * 12, 6),
      crystalMats[i % crystalMats.length],
    );
    crystal.position.set(Math.cos(angle) * radius, 1.2, -382 + Math.sin(angle) * radius * 0.7);
    crystal.rotation.z = (seeded(i, 76) - 0.5) * 0.38;
    crystal.scale.y = 0.8 + seeded(i, 77) * 1.6;
    root.add(crystal);
  }

  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(28, 72),
    new THREE.MeshPhysicalMaterial({
      color: 0x146e85,
      emissive: 0x0b3448,
      emissiveIntensity: 1.2,
      roughness: 0.12,
      transmission: 0.32,
    }),
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(0, 0.04, -386);
  root.add(lake);

  const core = new THREE.PointLight(0x92e7ff, 18, 120);
  core.position.set(0, 18, -386);
  root.add(core);

  const moonWell = new THREE.Mesh(
    new THREE.TorusGeometry(9, 0.18, 12, 96),
    new THREE.MeshStandardMaterial({
      color: 0xacefff,
      emissive: 0x46d9ff,
      emissiveIntensity: 2.6,
      roughness: 0.2,
    }),
  );
  moonWell.rotation.x = -Math.PI / 2;
  moonWell.position.set(0, 0.18, -386);
  root.add(moonWell);
}

function buildPanorama(root: THREE.Group) {
  const texture = createSanctuaryGradientTexture();
  const panorama = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 70),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  panorama.position.set(0, 24, -438);
  root.add(panorama);
}

function createSanctuaryGradientTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#06101e");
  sky.addColorStop(0.45, "#123b67");
  sky.addColorStop(1, "#04080d");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(512, 96, 20, 512, 160, 420);
  glow.addColorStop(0, "rgba(178,238,255,0.85)");
  glow.addColorStop(0.35, "rgba(70,169,255,0.35)");
  glow.addColorStop(1, "rgba(7,13,22,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawCavernSilhouette(context, canvas.width, canvas.height, "#020509", 0, 0.08);
  drawCavernSilhouette(context, canvas.width, canvas.height, "#07121f", 36, 0.3);
  drawCrystalBand(context, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function drawCavernSilhouette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  offset: number,
  alpha: number,
) {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, 0);
  for (let i = 0; i <= 18; i += 1) {
    const x = (i / 18) * width;
    const y = 60 + Math.sin(i * 1.8 + offset) * 42 + seeded(i, offset) * 80;
    context.lineTo(x, y);
  }
  context.lineTo(width, 0);
  context.closePath();
  context.fill();
  context.restore();
}

function drawCrystalBand(context: CanvasRenderingContext2D, width: number, height: number) {
  for (let i = 0; i < 86; i += 1) {
    const x = seeded(i, 320) * width;
    const base = height * (0.72 + seeded(i, 321) * 0.18);
    const size = 8 + seeded(i, 322) * 38;
    context.fillStyle = i % 3 === 0 ? "rgba(125,90,255,0.42)" : "rgba(74,222,255,0.45)";
    context.beginPath();
    context.moveTo(x, base - size);
    context.lineTo(x + size * 0.32, base);
    context.lineTo(x - size * 0.32, base);
    context.closePath();
    context.fill();
  }
}

function buildMist(root: THREE.Group) {
  const mistMat = new THREE.PointsMaterial({
    color: 0x8beaff,
    size: 0.18,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const geometry = new THREE.BufferGeometry();
  const points: number[] = [];
  for (let i = 0; i < 850; i += 1) {
    const z = 20 - seeded(i, 180) * 420;
    const width = z < -330 ? 56 : z < -130 ? 18 : 32;
    points.push((seeded(i, 181) - 0.5) * width, 0.8 + seeded(i, 182) * 9, z);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  root.add(new THREE.Points(geometry, mistMat));
}

function addCrystalCluster(root: THREE.Group, x: number, z: number, scale: number, seed: number) {
  const colors = [0x5be8ff, 0x8d70ff, 0x42ffd2];
  const color = colors[seed % colors.length];
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.65,
    roughness: 0.26,
    metalness: 0.05,
  });
  const count = 3 + Math.floor(seeded(seed, 210) * 4);
  for (let i = 0; i < count; i += 1) {
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.26 + seeded(seed, i + 211) * 0.45, 2.2 + seeded(seed, i + 212) * 4.8, 6),
      mat,
    );
    crystal.position.set(
      x + (seeded(seed, i + 213) - 0.5) * 2.8 * scale,
      0.55,
      z + (seeded(seed, i + 214) - 0.5) * 2.4 * scale,
    );
    crystal.scale.setScalar(scale);
    crystal.rotation.z = (seeded(seed, i + 215) - 0.5) * 0.45;
    crystal.rotation.y = seeded(seed, i + 216) * Math.PI;
    root.add(crystal);
  }
  const light = new THREE.PointLight(color, 1.2 * scale, 16 * scale);
  light.position.set(x, 2.4 * scale, z);
  root.add(light);
}

function buildPathLights(root: THREE.Group) {
  for (let i = 0; i < chapters.length; i += 1) {
    const light = new THREE.PointLight(i < 2 ? 0x8eeec7 : i < 4 ? 0x67dfff : 0xb490ff, 2.4, 34);
    light.position.set(i % 2 === 0 ? -3.5 : 3.5, 2.4, chapters[i].z - 12);
    root.add(light);
  }
}

export function updateLivingWorld(scene: THREE.Scene, root: THREE.Group, position: THREE.Vector3, time: number) {
  const deep = THREE.MathUtils.clamp((-position.z - 80) / 280, 0, 1);
  const forestToCave = THREE.MathUtils.clamp((-position.z - 38) / 92, 0, 1);
  const daylight = new THREE.Color(0xbfefff);
  const caveBlue = new THREE.Color(0x071114);
  const deepViolet = new THREE.Color(0x050716);
  scene.background = new THREE.Color().lerpColors(daylight, caveBlue, forestToCave).lerp(deepViolet, deep);
  scene.fog = new THREE.FogExp2(
    new THREE.Color().lerpColors(new THREE.Color(0xb9efe7), caveBlue, forestToCave).lerp(deepViolet, deep),
    0.008 + forestToCave * 0.007 - deep * 0.006,
  );
  root.children.forEach((child, index) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial && child.material.emissiveIntensity > 0) {
      child.material.emissiveIntensity = 1.1 + Math.sin(time * 2.4 + index) * 0.22;
    }
  });
}

export function corridorMinX(z: number) {
  if (z < -340) return -34;
  if (z < -235) return -12;
  if (z < -118) return -8.5;
  return -18;
}

export function corridorMaxX(z: number) {
  return Math.abs(corridorMinX(z));
}

function ripplePlane(geometry: THREE.PlaneGeometry, strength: number, scale: number) {
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    positions.setZ(i, Math.sin(x * 0.8) * strength + Math.cos(y * 0.22) * strength * scale);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

function seeded(a: number, b: number) {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}
