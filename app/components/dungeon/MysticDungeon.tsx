import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { DungeonHud } from "./DungeonHud";
import { chapters, getChapterIndex } from "./chapters";
import {
  buildWorld,
  corridorMaxX,
  corridorMinX,
  disposeObject,
  updateLivingWorld,
} from "./world";

type KeyState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
};

export function MysticDungeon() {
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
    renderer.toneMappingExposure = 1.18;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.78,
      0.74,
      0.12,
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    let previousTime = performance.now();
    let elapsedTime = 0;
    const player = new THREE.Object3D();
    player.position.copy(getInitialPlayerPosition());
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
      composer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const onKey = (event: KeyboardEvent, isDown: boolean) => {
      if (event.code === "KeyW" || event.code === "ArrowUp") keys.forward = isDown;
      if (event.code === "KeyS" || event.code === "ArrowDown") keys.backward = isDown;
      if (event.code === "KeyA" || event.code === "ArrowLeft") keys.left = isDown;
      if (event.code === "KeyD" || event.code === "ArrowRight") keys.right = isDown;
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") keys.sprint = isDown;
      if (isDown && event.code.startsWith("Digit")) {
        const index = Number(event.code.replace("Digit", "")) - 1;
        const chapter = chapters[index];
        if (chapter) {
          player.position.set(0, 2.15, chapter.z + 8);
          velocity.set(0, 0, 0);
        }
      }
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
      bloomPass.strength = player.position.z < -105 ? 0.48 : 0.24;
      bloomPass.radius = player.position.z < -105 ? 0.62 : 0.38;
      bloomPass.threshold = player.position.z < -105 ? 0.18 : 0.28;
      composer.render();

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

  const progress = Math.round(
    THREE.MathUtils.clamp((18 - chapters[chapterIndex].z) / 426, 0, 1) * 100,
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#03070a] text-stone-100">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,rgba(1,5,8,0.14)_42%,rgba(1,5,8,0.75)_100%)]" />
      <DungeonHud
        chapterIndex={chapterIndex}
        hasStarted={hasStarted}
        isLocked={isLocked}
        progress={progress}
      />
    </main>
  );
}

function getInitialPlayerPosition() {
  const params = new URLSearchParams(window.location.search);
  const z = Number(params.get("z"));
  if (Number.isFinite(z)) return new THREE.Vector3(0, 2.2, z);
  const area = params.get("area");
  const starts: Record<string, number> = {
    森: 18,
    違和感: -44,
    洞窟入口: -88,
    神秘ダンジョン: -190,
    遺跡: -232,
    巨大空間: -330,
  };
  if (area && starts[area] !== undefined) return new THREE.Vector3(0, 2.2, starts[area]);
  return new THREE.Vector3(0, 2.2, 18);
}
