import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Route } from "./+types/_index";

type KeyState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
};

type Chapter = {
  title: string;
  subtitle: string;
  z: number;
};

const chapters: Chapter[] = [
  { title: "森", subtitle: "湿った土と青い霧の中で目を覚ます", z: 0 },
  { title: "違和感", subtitle: "木々の奥で、地面そのものが淡く脈打つ", z: -62 },
  { title: "洞窟入口", subtitle: "苔むした岩肌が月光を飲み込んでいる", z: -116 },
  { title: "神秘ダンジョン", subtitle: "水音、結晶、古い道が深部へ誘う", z: -184 },
  { title: "遺跡", subtitle: "忘れられた柱と紋様が問いを残す", z: -264 },
  { title: "巨大空間", subtitle: "青と紫の光に満ちた地底の聖域", z: -352 },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Mystic 3D Dungeon" },
    {
      name: "description",
      content: "森から洞窟、遺跡、巨大空間へ歩いて進む一人称3D体験",
    },
  ];
}

export default function Index() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05090d);
    scene.fog = new THREE.FogExp2(0x071114, 0.015);

    const camera = new THREE.PerspectiveCamera(
      72,
      mount.clientWidth / mount.clientHeight,
      0.1,
      900,
    );
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    let previousTime = performance.now();
    let elapsedTime = 0;
    const player = new THREE.Object3D();
    player.position.set(0, 2.2, 18);
    scene.add(player);
    player.add(camera);

    const keys: KeyState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };
    const look = { yaw: 0, pitch: 0 };
    const velocity = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    buildWorld(scene, worldGroup);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const onKey = (event: KeyboardEvent, isDown: boolean) => {
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.forward = isDown;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.backward = isDown;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.left = isDown;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.right = isDown;
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.sprint = isDown;
    };
    const onKeyDown = (event: KeyboardEvent) => onKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => onKey(event, false);

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      look.yaw -= event.movementX * 0.0022;
      look.pitch -= event.movementY * 0.0022;
      look.pitch = THREE.MathUtils.clamp(look.pitch, -1.1, 1.05);
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      setIsLocked(locked);
      if (locked) setHasStarted(true);
    };

    const onCanvasClick = () => {
      renderer.domElement.requestPointerLock();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    renderer.domElement.addEventListener("click", onCanvasClick);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;
      elapsedTime += delta;
      const time = elapsedTime;

      player.rotation.y = look.yaw;
      camera.rotation.x = look.pitch;

      forward.set(Math.sin(look.yaw), 0, Math.cos(look.yaw) * -1).normalize();
      side.set(Math.cos(look.yaw), 0, Math.sin(look.yaw)).normalize();

      const input = new THREE.Vector3();
      if (keys.forward) input.add(forward);
      if (keys.backward) input.sub(forward);
      if (keys.right) input.add(side);
      if (keys.left) input.sub(side);
      if (input.lengthSq() > 0) input.normalize();

      const speed = keys.sprint ? 12 : 7.2;
      velocity.lerp(input.multiplyScalar(speed), 1 - Math.pow(0.0008, delta));
      player.position.addScaledVector(velocity, delta);
      player.position.x = THREE.MathUtils.clamp(player.position.x, corridorMinX(player.position.z), corridorMaxX(player.position.z));
      player.position.z = THREE.MathUtils.clamp(player.position.z, -408, 24);
      player.position.y = 2.15 + Math.sin(time * 6.5) * Math.min(velocity.length() * 0.012, 0.05);

      updateLivingWorld(scene, worldGroup, player.position, time);
      renderer.render(scene, camera);

      const nextChapter = getChapterIndex(player.position.z);
      setChapterIndex((current) => (current === nextChapter ? current : nextChapter));
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      disposeObject(scene);
    };
  }, []);

  const chapter = chapters[chapterIndex];
  const progress = Math.round(
    THREE.MathUtils.clamp((18 - chapters[chapterIndex].z) / 426, 0, 1) * 100,
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#03070a] text-stone-100">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,rgba(1,5,8,0.14)_42%,rgba(1,5,8,0.75)_100%)]" />

      <section className="pointer-events-none absolute left-0 right-0 top-0 p-4 sm:p-6">
        <div className="flex max-w-5xl items-start justify-between gap-4">
          <div className="max-w-[min(76vw,520px)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Mystic Dungeon
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-5xl">
              {chapter.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-cyan-50/78 sm:text-base">
              {chapter.subtitle}
            </p>
          </div>
          <div className="hidden min-w-40 text-right sm:block">
            <p className="text-xs text-cyan-100/60">進行度</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-100">{progress}%</p>
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 max-w-full p-4 sm:p-6">
        <div className="flex w-full max-w-5xl min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <ol className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {chapters.map((item, index) => (
              <li
                key={item.title}
                className={[
                  "shrink-0 border px-3 py-2 text-xs backdrop-blur-md",
                  index === chapterIndex
                    ? "border-cyan-200/70 bg-cyan-100/16 text-white"
                    : index < chapterIndex
                      ? "border-emerald-200/35 bg-emerald-200/10 text-emerald-50/80"
                      : "border-white/12 bg-black/22 text-white/52",
                ].join(" ")}
              >
                {item.title}
              </li>
            ))}
          </ol>
          <div className="w-full max-w-sm border border-white/12 bg-black/30 px-4 py-3 text-xs leading-5 text-cyan-50/74 backdrop-blur-md">
            {isLocked
              ? "WASDで移動、マウスで視点操作、Shiftで早歩き。Escでカーソルを戻せます。"
              : hasStarted
                ? "クリックすると探索に戻ります。"
                : "クリックして目を覚ます。森の奥へ進むと、洞窟が開きます。"}
          </div>
        </div>
      </div>
    </main>
  );
}

function buildWorld(scene: THREE.Scene, root: THREE.Group) {
  scene.add(new THREE.HemisphereLight(0x94d8ff, 0x102018, 1.35));

  const moon = new THREE.DirectionalLight(0xaad5ff, 2.2);
  moon.position.set(-28, 44, 18);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  scene.add(moon);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(210, 470, 80, 220),
    new THREE.MeshStandardMaterial({
      color: 0x142017,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -190;
  ground.receiveShadow = true;
  ripplePlane(ground.geometry as THREE.PlaneGeometry, 0.34, 1.4);
  root.add(ground);

  buildForest(root);
  buildCaveMouth(root);
  buildDungeon(root);
  buildRuins(root);
  buildSanctuary(root);
  buildPathLights(root);
}

function buildForest(root: THREE.Group) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c140f, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x12372d, roughness: 0.82 });
  const fernMat = new THREE.MeshStandardMaterial({ color: 0x1e5d45, roughness: 0.85 });
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.42, 8.5, 7);
  const leafGeo = new THREE.ConeGeometry(2.0, 7.5, 8);
  const fernGeo = new THREE.ConeGeometry(0.55, 1.7, 5);

  for (let i = 0; i < 190; i += 1) {
    const z = 24 - seeded(i, 2) * 132;
    const side = seeded(i, 3) > 0.5 ? 1 : -1;
    const x = side * (8 + seeded(i, 4) * 58);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 4.25, z);
    trunk.rotation.z = (seeded(i, 5) - 0.5) * 0.14;
    trunk.castShadow = true;
    root.add(trunk);

    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.set(x, 10.2, z + (seeded(i, 6) - 0.5) * 1.4);
    leaves.rotation.y = seeded(i, 7) * Math.PI;
    leaves.castShadow = true;
    root.add(leaves);
  }

  for (let i = 0; i < 130; i += 1) {
    const z = 22 - seeded(i, 8) * 136;
    const side = seeded(i, 9) > 0.5 ? 1 : -1;
    const fern = new THREE.Mesh(fernGeo, fernMat);
    fern.position.set(side * (4 + seeded(i, 10) * 10), 0.85, z);
    fern.scale.setScalar(0.6 + seeded(i, 11) * 1.2);
    fern.rotation.y = seeded(i, 12) * Math.PI * 2;
    fern.castShadow = true;
    root.add(fern);
  }
}

function buildCaveMouth(root: THREE.Group) {
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x25313a, roughness: 0.96 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x7ce7ff,
    emissive: 0x38c6ff,
    emissiveIntensity: 1.8,
    roughness: 0.5,
  });
  for (let i = 0; i < 42; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4 + seeded(i, 16) * 4.6, 1), rockMat);
    const side = seeded(i, 17) > 0.5 ? 1 : -1;
    rock.position.set(side * (4.2 + seeded(i, 18) * 16), 1.2 + seeded(i, 19) * 7.4, -112 - seeded(i, 20) * 26);
    rock.scale.y = 0.7 + seeded(i, 21) * 1.8;
    rock.rotation.set(seeded(i, 22) * 2, seeded(i, 23) * 2, seeded(i, 24) * 2);
    rock.castShadow = true;
    root.add(rock);
  }

  const arch = new THREE.Mesh(new THREE.TorusGeometry(10.6, 1.8, 12, 36, Math.PI), rockMat);
  arch.position.set(0, 6.7, -119);
  arch.rotation.z = Math.PI;
  arch.scale.y = 1.15;
  arch.castShadow = true;
  root.add(arch);

  for (let i = 0; i < 14; i += 1) {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.6 + seeded(i, 28) * 3.4, 5), glowMat);
    crystal.position.set((seeded(i, 29) - 0.5) * 20, 0.7, -102 - seeded(i, 30) * 42);
    crystal.rotation.z = (seeded(i, 31) - 0.5) * 0.5;
    root.add(crystal);
    const light = new THREE.PointLight(0x58dcff, 1.4, 18);
    light.position.copy(crystal.position).y += 1.8;
    root.add(light);
  }
}

function buildDungeon(root: THREE.Group) {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1c2630, roughness: 0.94 });
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d7b8c,
    emissive: 0x04333f,
    emissiveIntensity: 0.8,
    roughness: 0.18,
    metalness: 0,
    transmission: 0.2,
  });

  for (let i = 0; i < 90; i += 1) {
    const z = -144 - i * 2.15;
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8 + seeded(i, side) * 2.6, 1), wallMat);
      wall.position.set(side * (8.4 + seeded(i, side + 40) * 4.5), 2.4 + seeded(i, side + 42) * 3.5, z);
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
}

function buildPathLights(root: THREE.Group) {
  for (let i = 0; i < chapters.length; i += 1) {
    const light = new THREE.PointLight(i < 2 ? 0x8eeec7 : i < 4 ? 0x67dfff : 0xb490ff, 2.4, 34);
    light.position.set(i % 2 === 0 ? -3.5 : 3.5, 2.4, chapters[i].z - 12);
    root.add(light);
  }
}

function updateLivingWorld(scene: THREE.Scene, root: THREE.Group, position: THREE.Vector3, time: number) {
  const deep = THREE.MathUtils.clamp((-position.z - 80) / 280, 0, 1);
  scene.fog = new THREE.FogExp2(
    new THREE.Color().lerpColors(new THREE.Color(0x071114), new THREE.Color(0x050716), deep),
    0.015 - deep * 0.006,
  );
  root.children.forEach((child, index) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial && child.material.emissiveIntensity > 0) {
      child.material.emissiveIntensity = 1.1 + Math.sin(time * 2.4 + index) * 0.22;
    }
  });
}

function getChapterIndex(z: number) {
  let index = 0;
  for (let i = 0; i < chapters.length; i += 1) {
    if (z <= chapters[i].z + 18) index = i;
  }
  return index;
}

function corridorMinX(z: number) {
  if (z < -340) return -34;
  if (z < -235) return -12;
  if (z < -118) return -8.5;
  return -18;
}

function corridorMaxX(z: number) {
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

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}
