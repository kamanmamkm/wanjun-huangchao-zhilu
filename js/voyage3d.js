/**
 * 上路：第三人稱沿路走。城門有步卒，市集有另一位旅人。
 * 模型係課堂用的縮圖，原檔留在下載資料夾。
 */
import * as THREE from "../vendor/three/three.module.js";
import { GLTFLoader } from "../vendor/three/GLTFLoader.js";

const SPAWN_Z = [0, 36, 46];
const BARRIER_Z = [16, 44, 48];
const ARRIVE_Z = [30, 46];
const MARK_Z = [34, 46];
const Z_MIN = -8;
const Z_MAX = 48;
const ROAD_HALF = 2.15;
const SPEED = 4.1;

let active = null;

function assetUrl(name) {
  return new URL(`../assets/voyage/${name}`, import.meta.url).href;
}

function normalize(root, height) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.scale.multiplyScalar(height / (size.y || 1));
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  root.position.x -= (box.min.x + box.max.x) / 2;
  root.position.y -= box.min.y;
  root.position.z -= (box.min.z + box.max.z) / 2;
  root.updateMatrixWorld(true);
}

function prepare(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      if (!mat) return;
      mat.metalness = 0.05;
      mat.roughness = 0.88;
      mat.metalnessMap = null;
      mat.roughnessMap = null;
    });
  });
}

export function mountVoyageScene(opts) {
  active?.dispose();
  const canvas = opts.canvas;
  const stick = opts.stick;
  const knob = opts.knob;
  let disposed = false;
  let raf = 0;
  let stopIndex = Math.max(0, Math.min(2, opts.stop || 0));
  let open = false;
  let yaw = 0;
  const pos = new THREE.Vector3(0, 0, SPAWN_Z[stopIndex]);
  const cam = new THREE.Vector3(0, 2.6, pos.z - 5.6);
  const stickVec = { x: 0, z: 0 };
  const keys = new Set();
  const clock = new THREE.Clock();
  let bob = 0;
  let pointed = null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xc3d5e2, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc3d5e2);
  scene.fog = new THREE.Fog(0xc3d5e2, 24, 92);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 150);
  camera.position.copy(cam);

  scene.add(new THREE.HemisphereLight(0xfff4e4, 0x6d5a45, 0.85));
  const sun = new THREE.DirectionalLight(0xfff7ea, 1.25);
  sun.position.set(-6, 12, -8);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 120),
    new THREE.MeshStandardMaterial({ color: 0x7d684c, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 36);
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 96),
    new THREE.MeshStandardMaterial({ color: 0xd2b48a, roughness: 1, metalness: 0 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 34);
  scene.add(road);

  function mound(x, z, r, lift, color) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 18, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 })
    );
    mesh.position.set(x, -r * 0.55 + lift, z);
    scene.add(mesh);
  }
  mound(-10, 8, 7, 0.4, 0x6e8b78);
  mound(11, 18, 8, 0.2, 0x5f7f88);
  mound(-12, 40, 9, 0.5, 0x6a7f68);
  mound(13, 58, 8, 0.3, 0x7a6a52);
  mound(-9, 72, 7, 0.2, 0x5d7468);

  const npcs = [];

  const mark = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.15, 28),
    new THREE.MeshBasicMaterial({ color: 0xf4e2c4, side: THREE.DoubleSide })
  );
  mark.rotation.x = -Math.PI / 2;
  mark.position.y = 0.06;
  mark.visible = false;
  scene.add(mark);

  const player = new THREE.Group();
  const avatar = new THREE.Group();
  player.add(avatar);
  const shade = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 18),
    new THREE.MeshBasicMaterial({ color: 0x1c140c, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shade.rotation.x = -Math.PI / 2;
  shade.position.y = 0.03;
  player.add(shade);
  scene.add(player);

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas);

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
      keys.add(k);
      e.preventDefault();
    }
  }
  function onKeyUp(e) {
    keys.delete(e.key.toLowerCase());
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function setKnob(x, y) {
    if (!knob) return;
    const max = 34;
    knob.style.transform = `translate(${x * max}px, ${y * max}px)`;
  }
  function onPointerDown(e) {
    if (!stick) return;
    pointed = e.pointerId;
    stick.setPointerCapture(e.pointerId);
    onPointerMove(e);
  }
  function onPointerMove(e) {
    if (e.pointerId !== pointed || !stick) return;
    const rect = stick.getBoundingClientRect();
    let x = (e.clientX - (rect.left + rect.width / 2)) / 42;
    let y = (e.clientY - (rect.top + rect.height / 2)) / 42;
    const len = Math.hypot(x, y) || 1;
    if (len > 1) {
      x /= len;
      y /= len;
    }
    stickVec.x = x;
    stickVec.z = -y;
    setKnob(x, y);
  }
  function onPointerUp(e) {
    if (e.pointerId !== pointed) return;
    pointed = null;
    stickVec.x = 0;
    stickVec.z = 0;
    setKnob(0, 0);
  }
  stick?.addEventListener("pointerdown", onPointerDown);
  stick?.addEventListener("pointermove", onPointerMove);
  stick?.addEventListener("pointerup", onPointerUp);
  stick?.addEventListener("pointercancel", onPointerUp);

  function moveInput() {
    let x = stickVec.x;
    let z = stickVec.z;
    if (keys.has("w") || keys.has("arrowup")) z += 1;
    if (keys.has("s") || keys.has("arrowdown")) z -= 1;
    if (keys.has("a") || keys.has("arrowleft")) x -= 1;
    if (keys.has("d") || keys.has("arrowright")) x += 1;
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }
    return { x, z, moving: len > 0.08 };
  }

  function placeMark() {
    if (!open || stopIndex > 1) {
      mark.visible = false;
      return;
    }
    mark.visible = true;
    mark.position.x = 0;
    mark.position.z = MARK_Z[stopIndex];
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!canvas.isConnected) {
      api.dispose();
      return;
    }
    const dt = Math.min(0.05, clock.getDelta());
    const mv = moveInput();
    if (mv.moving) {
      const aim = Math.atan2(mv.x, mv.z);
      let dy = aim - yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      yaw += dy * Math.min(1, dt * 8);
      pos.x = Math.max(-ROAD_HALF, Math.min(ROAD_HALF, pos.x + mv.x * SPEED * dt));
      let nz = pos.z + mv.z * SPEED * dt;
      const cap = open ? null : BARRIER_Z[stopIndex];
      if (cap != null && nz > cap) nz = cap;
      pos.z = Math.max(Z_MIN, Math.min(Z_MAX, nz));
      bob += dt * 10;
      if (open && stopIndex < 2 && pos.z >= ARRIVE_Z[stopIndex]) {
        stopIndex += 1;
        open = false;
        placeMark();
        opts.onArrive?.(stopIndex);
      }
    }
    player.position.set(pos.x, 0, pos.z);
    avatar.rotation.y = yaw;
    avatar.position.y = mv.moving ? Math.sin(bob) * 0.045 : 0;
    npcs.forEach((npc) => {
      const dx = pos.x - npc.position.x;
      const dz = pos.z - npc.position.z;
      const dist = Math.hypot(dx, dz);
      const aim = dist < 7 ? Math.atan2(dx, dz) : Math.PI;
      let turn = aim - npc.rotation.y;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      npc.rotation.y += turn * Math.min(1, dt * 4);
    });
    mark.rotation.z += dt * 0.8;

    const k = 1 - Math.exp(-dt * 4);
    const tx = pos.x - Math.sin(yaw) * 5.5;
    const tz = pos.z - Math.cos(yaw) * 5.5;
    cam.x += (tx - cam.x) * k;
    cam.y += (2.55 - cam.y) * k;
    cam.z += (tz - cam.z) * k;
    camera.position.copy(cam);
    camera.lookAt(pos.x, 1.25, pos.z);
    renderer.render(scene, camera);
  }

  const api = {
    place(stop) {
      stopIndex = Math.max(0, Math.min(2, stop || 0));
      open = false;
      yaw = 0;
      pos.set(0, 0, SPAWN_Z[stopIndex]);
      cam.set(0, 2.6, pos.z - 5.6);
      placeMark();
    },
    setOpen(next) {
      open = !!next;
      placeMark();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObs.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      stick?.removeEventListener("pointerdown", onPointerDown);
      stick?.removeEventListener("pointermove", onPointerMove);
      stick?.removeEventListener("pointerup", onPointerUp);
      stick?.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
        mats.forEach((mat) => {
          mat.map?.dispose();
          mat.dispose?.();
        });
      });
      renderer.dispose();
      if (active === api) active = null;
    },
  };
  active = api;

  const loader = new GLTFLoader();
  const youFile = opts.gender === "female" ? "female.glb" : "male.glb";
  const otherFile = opts.gender === "female" ? "male.glb" : "female.glb";
  const jobs = [
    [youFile, 1.7, "you"],
    [otherFile, 1.7, "other"],
    ["soldier.glb", 1.7, "soldier"],
    ["gate.glb", 5.6, "gate"],
    ["flag.glb", 3.5, "flag"],
    ["tower.glb", 8.2, "tower"],
  ];
  let done = 0;

  function stand(model, x, z) {
    const holder = new THREE.Group();
    holder.add(model);
    const shade = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 18),
      new THREE.MeshBasicMaterial({ color: 0x1c140c, transparent: true, opacity: 0.28, depthWrite: false })
    );
    shade.rotation.x = -Math.PI / 2;
    shade.position.y = 0.03;
    holder.add(shade);
    holder.position.set(x, 0, z);
    holder.rotation.y = Math.PI;
    scene.add(holder);
    npcs.push(holder);
  }

  (async () => {
    try {
      let flag = null;
      for (const job of jobs) {
        if (disposed) return;
        const [name, height, role] = job;
        opts.onProgress?.(`載入中 ${done}／${jobs.length}`);
        const gltf = await loader.loadAsync(assetUrl(name));
        const model = gltf.scene;
        prepare(model);
        normalize(model, height);
        if (role === "you") avatar.add(model);
        else if (role === "other") stand(model, -1.45, 37.5);
        else if (role === "soldier") stand(model, 1.55, 4.2);
        else if (role === "flag") {
          flag = model;
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(-4.4, 0, 38);
          scene.add(holder);
        } else if (role === "gate") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(0, 0, 8);
          scene.add(holder);
        } else if (role === "tower") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(0, 0, 74);
          scene.add(holder);
        }
        done += 1;
        opts.onProgress?.(`載入中 ${done}／${jobs.length}`);
      }
      if (flag && !disposed) {
        const other = flag.clone(true);
        const holder = new THREE.Group();
        holder.add(other);
        holder.position.set(4.4, 0, 38);
        holder.rotation.y = Math.PI;
        scene.add(holder);
      }
      if (disposed) return;
      placeMark();
      opts.onReady?.();
      clock.getDelta();
      frame();
    } catch {
      if (!disposed) opts.onFail?.();
    }
  })();

  return api;
}
