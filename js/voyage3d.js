/**
 * 上路：第三人稱沿路走。城門有步卒，市集有另一位旅人。
 * 模型係課堂用的縮圖，原檔留在下載資料夾。
 */
import * as THREE from "../vendor/three/three.module.js";
import { GLTFLoader } from "../vendor/three/GLTFLoader.js";

const SPAWN = [
  { x: 0, z: 0 },
  { x: 0, z: 36 },
  { x: 0, z: 46 },
  { x: 0, z: 52 },
  { x: -5.2, z: 55 },
  { x: 6.0, z: 48 },
  { x: 0, z: 62 },
  { x: 0, z: 76 },
  { x: 0, z: 88 },
];
const BARRIER_Z = [16, 44, 50, 56, 60, 60, 76, 92, 106];
const MARK = [
  { x: 0, z: 34 },
  { x: 0, z: 46 },
  { x: 0, z: 54 },
  { x: -5.4, z: 55 },
  { x: 6.2, z: 48 },
  { x: 0, z: 68 },
  { x: 0, z: 82 },
  { x: 0, z: 96 },
];
const Z_MIN = -8;
const Z_MAX = 106;
const ROAD_HALF = 2.15;
const SPEED = 4.1;

let active = null;

function assetUrl(name) {
  const v = new URL(import.meta.url).search;
  return new URL(`../assets/voyage/${name}${v}`, import.meta.url).href;
}

function fitLongest(root, span) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z) || 1;
  root.scale.multiplyScalar(span / longest);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  root.position.x -= (box.min.x + box.max.x) / 2;
  root.position.y -= box.min.y;
  root.position.z -= (box.min.z + box.max.z) / 2;
  root.updateMatrixWorld(true);
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
  let stopIndex = Math.max(0, Math.min(SPAWN.length - 1, opts.stop || 0));
  let open = false;
  let follow = !!opts.follow;
  let heldFollow = follow;
  let rivalVisit = false;
  let nameSprite = null;
  let bannerOn = !!opts.banner;
  let crossbowOn = !!opts.crossbow;
  let chariotOn = !!opts.chariot;
  let soldier = null;
  let grip = null;
  let bow = null;
  let cart = null;
  let prize = null;
  let yaw = 0;
  const pos = new THREE.Vector3(SPAWN[stopIndex].x, 0, SPAWN[stopIndex].z);
  const cam = new THREE.Vector3(pos.x, 2.6, pos.z - 5.6);
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
  scene.fog = new THREE.Fog(0xc3d5e2, 24, 120);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 150);
  camera.position.copy(cam);

  scene.add(new THREE.HemisphereLight(0xfff4e4, 0x6d5a45, 0.85));
  const sun = new THREE.DirectionalLight(0xfff7ea, 1.25);
  sun.position.set(-6, 12, -8);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 170),
    new THREE.MeshStandardMaterial({ color: 0x7d684c, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 52);
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 96),
    new THREE.MeshStandardMaterial({ color: 0xd2b48a, roughness: 1, metalness: 0 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 34);
  scene.add(road);
  const roadOn = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 56),
    new THREE.MeshStandardMaterial({ color: 0xd2b48a, roughness: 1, metalness: 0 })
  );
  roadOn.rotation.x = -Math.PI / 2;
  roadOn.position.set(0, 0.02, 102);
  scene.add(roadOn);

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
  mound(-18, 28, 8, 0.5, 0x6a7f68);
  mound(20, 78, 7, 0.3, 0x7a6a52);
  mound(-16, 78, 6, 0.2, 0x5d7468);

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
    if (!open || stopIndex >= MARK.length) {
      mark.visible = false;
      return;
    }
    mark.visible = true;
    mark.position.x = MARK[stopIndex].x;
    mark.position.z = MARK[stopIndex].z;
  }

  function halfLane() {
    if (stopIndex >= 5) return 7.4;
    if (stopIndex === 4) return open ? 7.4 : 6.2;
    if (stopIndex === 3 && open) return 7.4;
    return ROAD_HALF;
  }

  function reached() {
    if (stopIndex === 0) return pos.z >= 30;
    if (stopIndex === 1) return pos.z >= 46;
    if (stopIndex === 2) return pos.z >= 54;
    if (stopIndex === 3) return pos.z >= 52 && pos.x <= -4.2;
    if (stopIndex === 4) return pos.x >= 4.6 && pos.z <= 52;
    if (stopIndex === 5) return pos.z >= 68;
    if (stopIndex === 6) return pos.z >= 82;
    if (stopIndex === 7) return pos.z >= 96;
    return false;
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!canvas.isConnected) {
      api.dispose();
      return;
    }
    const dt = Math.min(0.05, clock.getDelta());
    const mv = rivalVisit ? { moving: false, x: 0, z: 0 } : moveInput();
    if (mv.moving) {
      const aim = Math.atan2(mv.x, mv.z);
      let dy = aim - yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      yaw += dy * Math.min(1, dt * 8);
      const lane = halfLane();
      pos.x = Math.max(-lane, Math.min(lane, pos.x + mv.x * SPEED * dt));
      let nz = pos.z + mv.z * SPEED * dt;
      const cap = open ? null : BARRIER_Z[stopIndex];
      if (cap != null && nz > cap) nz = cap;
      pos.z = Math.max(Z_MIN, Math.min(Z_MAX, nz));
      bob += dt * 10;
      if (open && stopIndex < MARK.length && reached()) {
        stopIndex += 1;
        open = false;
        placeMark();
        opts.onArrive?.(stopIndex);
      }
    }
    player.position.set(pos.x, 0, pos.z);
    avatar.rotation.y = yaw;
    avatar.position.y = mv.moving ? Math.sin(bob) * 0.045 : 0;
    if (follow && soldier) {
      const tx = pos.x + Math.cos(yaw) * 0.95 - Math.sin(yaw) * 1.25;
      const tz = pos.z - Math.sin(yaw) * 0.95 - Math.cos(yaw) * 1.25;
      const catchUp = 1 - Math.exp(-dt * 2.4);
      soldier.position.x += (tx - soldier.position.x) * catchUp;
      soldier.position.z += (tz - soldier.position.z) * catchUp;
      soldier.rotation.y = yaw;
    }
    npcs.forEach((npc) => {
      if (follow && npc === soldier) return;
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

  let plateLabel = "";

  function makeNameSprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.45, 1);
    sprite.userData.canvas = canvas;
    return sprite;
  }

  function paintPlate(sprite, label) {
    const text = String(label || "").slice(0, 8);
    const canvas = sprite.userData.canvas;
    const g = canvas.getContext("2d");
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (!text) {
      sprite.visible = false;
      return;
    }
    g.font = "700 54px PingFang TC, Noto Sans TC, sans-serif";
    const pad = 28;
    const tw = Math.min(canvas.width - pad * 2, g.measureText(text).width);
    const bw = Math.max(tw + pad * 2, 160);
    const bh = 86;
    const x = (canvas.width - bw) / 2;
    const y = 18;
    g.fillStyle = "rgba(36, 49, 46, 0.92)";
    g.beginPath();
    if (typeof g.roundRect === "function") g.roundRect(x, y, bw, bh, 18);
    else g.rect(x, y, bw, bh);
    g.fill();
    g.fillStyle = "#f6f1e7";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, canvas.width / 2, y + bh / 2 + 2);
    sprite.visible = true;
    sprite.material.map.needsUpdate = true;
  }

  function showName(label) {
    plateLabel = String(label || "").slice(0, 8);
    if (!nameSprite) return;
    paintPlate(nameSprite, plateLabel);
  }

  const api = {
    place(stop) {
      stopIndex = Math.max(0, Math.min(SPAWN.length - 1, stop || 0));
      open = false;
      yaw = 0;
      pos.set(SPAWN[stopIndex].x, 0, SPAWN[stopIndex].z);
      cam.set(pos.x, 2.6, pos.z - 5.6);
      placeMark();
    },
    setOpen(next) {
      open = !!next;
      placeMark();
    },
    grant() {
      follow = true;
      if (grip) grip.visible = true;
    },
    raise() {
      bannerOn = true;
      if (prize) prize.visible = true;
    },
    arm() {
      crossbowOn = true;
      if (bow) bow.visible = true;
    },
    hitch() {
      chariotOn = true;
      if (cart) cart.visible = true;
    },
    meet(label) {
      heldFollow = follow;
      follow = false;
      rivalVisit = true;
      if (soldier) soldier.position.set(1.55, 0, 4.2);
      showName(label);
      yaw = 0;
      pos.set(0, 0, 0.6);
      cam.set(0, 2.6, 0.6 - 5.6);
    },
    leaveRival() {
      if (!rivalVisit) return;
      rivalVisit = false;
      follow = heldFollow;
      showName("");
      api.place(stopIndex);
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
    ["ge.glb", 1.15, "ge"],
    ["gate.glb", 5.6, "gate"],
    ["flag.glb", 3.5, "flag"],
    ["tower.glb", 8.2, "tower"],
    ["camp.glb", 2.8, "camp"],
    ["river.glb", 8, "river", "long"],
    ["pine.glb", 7, "pine", "long"],
    ["crossbow.glb", 1.15, "crossbow", "long"],
    ["chariot.glb", 3.2, "chariot", "long"],
    ["general.glb", 1.7, "general"],
    ["states.glb", 4.6, "states", "stand"],
    ["coast.glb", 6.5, "coast", "tilt"],
    ["loft.glb", 5.2, "loft", "long"],
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
    return holder;
  }

  (async () => {
    try {
      let flag = null;
      for (const job of jobs) {
        if (disposed) return;
        const [name, size, role, mode] = job;
        opts.onProgress?.(`載入中 ${done}／${jobs.length}`);
        const gltf = await loader.loadAsync(assetUrl(name));
        const model = gltf.scene;
        prepare(model);
        if (mode === "stand") {
          model.rotation.x = -Math.PI / 2;
          model.rotation.y = Math.PI / 2;
          fitLongest(model, size);
        } else if (mode === "tilt") {
          model.rotation.x = -0.65;
          fitLongest(model, size);
        } else if (mode === "long") fitLongest(model, size);
        else normalize(model, size);
        if (role === "you") avatar.add(model);
        else if (role === "other") stand(model, -1.45, 37.5);
        else if (role === "soldier") {
          soldier = stand(model, 1.55, 4.2);
          nameSprite = makeNameSprite();
          nameSprite.position.set(0, 2.02, 0);
          nameSprite.visible = false;
          soldier.add(nameSprite);
          if (rivalVisit) {
            soldier.position.set(1.55, 0, 4.2);
            showName(plateLabel);
          }
        }
        else if (role === "ge") {
          grip = new THREE.Group();
          grip.add(model);
          grip.position.set(0.58, 0.02, 0.08);
          grip.rotation.y = 0.35;
          grip.visible = follow;
          avatar.add(grip);
        }
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
          holder.position.set(-18, 0, 72);
          scene.add(holder);
        } else if (role === "camp") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(5.2, 0, 56);
          scene.add(holder);
        } else if (role === "river") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(-9.2, 0.04, 55);
          holder.rotation.y = Math.PI / 2;
          scene.add(holder);
        } else if (role === "pine") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(9.6, 0, 52);
          scene.add(holder);
        } else if (role === "crossbow") {
          bow = new THREE.Group();
          bow.add(model);
          bow.position.set(-0.42, 0.48, -0.12);
          bow.rotation.set(-0.5, 1.1, 0.2);
          bow.visible = crossbowOn;
          avatar.add(bow);
        } else if (role === "chariot") {
          cart = new THREE.Group();
          cart.add(model);
          cart.position.set(11.2, 0, 54);
          cart.visible = chariotOn;
          scene.add(cart);
        } else if (role === "general") {
          const holder = stand(model, 4.2, 50.6);
          const plate = makeNameSprite();
          plate.position.set(0, 2.02, 0);
          holder.add(plate);
          paintPlate(plate, "將領");
        } else if (role === "states") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(-9.2, 0, 70);
          scene.add(holder);
        } else if (role === "coast") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(8, 0, 86);
          scene.add(holder);
        } else if (role === "loft") {
          const holder = new THREE.Group();
          holder.add(model);
          holder.position.set(-7.6, 0, 100);
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
        const banner = flag.clone(true);
        prize = new THREE.Group();
        prize.add(banner);
        prize.position.set(-4.6, 0, 56);
        prize.rotation.y = 0.4;
        prize.visible = bannerOn;
        scene.add(prize);
      }
      if (disposed) return;
      if (follow && soldier) {
        soldier.position.set(pos.x + 0.95, 0, pos.z - 1.25);
        soldier.rotation.y = yaw;
      }
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
