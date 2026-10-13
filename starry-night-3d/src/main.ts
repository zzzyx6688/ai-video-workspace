import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRenderRig, bindResize } from "./core/SceneSetup";
import { Nebula } from "./world/Nebula";
import { Starfield } from "./world/Starfield";
import { StrokeField } from "./world/StrokeField";
import { VortexGalaxy } from "./world/VortexGalaxy";
import { ColossalMoon } from "./world/ColossalMoon";
import { CypressGate } from "./world/CypressGate";
import { CameraRig } from "./camera/CameraRig";
import { GATE_POS, MOON_POS } from "./camera/shots";

const DURATION = 24; // seconds — one unbroken take, six movements

const params = new URLSearchParams(location.search);
const RENDER_MODE = params.get("render") === "1";

const container = document.getElementById("app")!;
const rig = createRenderRig(container);
bindResize(rig);

// ---------------------------------------------------------------- build world
const nebula = new Nebula();
const starfield = new Starfield(3, 16000);
const strokeField = new StrokeField(11);
const galaxy = new VortexGalaxy(21, 1500, 28000);
const moon = new ColossalMoon(700);
moon.group.position.copy(MOON_POS);
const gate = new CypressGate(GATE_POS, 9);

rig.scene.add(
  nebula.group,
  starfield.group,
  strokeField.group,
  galaxy.group,
  moon.group,
  gate.group,
);

const camRig = new CameraRig();

// -------------------------------------------------------------------- the HUD
const shotEl = document.getElementById("shot")!;
const subEl = document.getElementById("subtitle")!;
const progEl = document.getElementById("progress")!;
const pcountEl = document.getElementById("pcount")!;
const loadingEl = document.getElementById("loading");
const btnPlay = document.getElementById("btn-play") as HTMLButtonElement;
const btnReplay = document.getElementById("btn-replay") as HTMLButtonElement;
const btnFree = document.getElementById("btn-free") as HTMLButtonElement;

pcountEl.textContent = (strokeField.particleCount + galaxy.particleCount).toLocaleString(
  "en-US",
);

// ------------------------------------------------------------- deterministic render
// A single function of T draws the entire cosmos — used identically by the live
// loop and by headless frame capture.
function renderAt(T: number): void {
  const u = THREE.MathUtils.clamp(T, 0, 1);
  const t = u * DURATION;

  nebula.update(t);
  starfield.update();
  strokeField.update(t);
  galaxy.update(t);
  moon.update(t);
  gate.update();

  camRig.update(rig.camera, u);
  rig.postfx.grade.uniforms.uTime.value = t;
  rig.postfx.render(0);
}

function updateHud(T: number): void {
  const shot = camRig.getShot(T);
  shotEl.textContent = shot.name;
  subEl.textContent = shot.desc;
  progEl.style.width = (T * 100).toFixed(2) + "%";
}

// ---------------------------------------------------------------- interactions
let elapsed = 0;
let playing = true;
let freeMode = false;
let last = performance.now();

let orbit: OrbitControls | null = null;
if (!RENDER_MODE) {
  orbit = new OrbitControls(rig.camera, rig.renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.06;
  orbit.target.set(0, 0, 0);
  orbit.enabled = false;
  orbit.maxDistance = 22000;
  orbit.minDistance = 80;
}

btnPlay?.addEventListener("click", () => {
  playing = !playing;
  btnPlay.textContent = playing ? "⏸ 暂停" : "▶ 播放";
});
btnReplay?.addEventListener("click", () => {
  elapsed = 0;
  playing = true;
  if (btnPlay) btnPlay.textContent = "⏸ 暂停";
});
btnFree?.addEventListener("click", () => {
  freeMode = !freeMode;
  if (orbit) orbit.enabled = freeMode;
  if (btnFree) btnFree.textContent = freeMode ? "◎ 回到运镜" : "✦ 自由视角";
  if (freeMode && orbit) {
    orbit.target.set(0, 0, 0);
    orbit.update();
  }
});

// ------------------------------------------------------------------- the loop
function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (playing) elapsed = (elapsed + dt) % DURATION;

  const T = elapsed / DURATION;
  const t = T * DURATION;

  nebula.update(t);
  starfield.update();
  strokeField.update(t);
  galaxy.update(t);
  moon.update(t);
  gate.update();

  if (freeMode && orbit) {
    orbit.update();
  } else {
    camRig.update(rig.camera, T);
  }

  rig.postfx.grade.uniforms.uTime.value = t;
  rig.postfx.render(dt);
  updateHud(T);
}

// ------------------------------------------------------------------ bootstrap
renderAt(0);
updateHud(0);

if (RENDER_MODE) {
  // expose a deterministic setter for headless capture
  (window as unknown as Record<string, unknown>).__ready = true;
  (window as unknown as Record<string, unknown>).__setT = (T: number) => renderAt(T);
  (window as unknown as Record<string, unknown>).__duration = DURATION;
  if (loadingEl) loadingEl.remove();
} else {
  requestAnimationFrame(frame);
  requestAnimationFrame(() => {
    if (loadingEl) {
      loadingEl.style.opacity = "0";
      setTimeout(() => loadingEl.remove(), 900);
    }
  });
}
