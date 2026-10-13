import * as THREE from "three";
import { PostFX } from "../postfx/PostFX";

export interface RenderRig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  postfx: PostFX;
  size: THREE.Vector2;
}

/**
 * Builds the renderer / scene / camera / post-processing stack.
 * `preserveDrawingBuffer` is on so headless frame capture (Playwright) can
 * grab WebGL pixels reliably.
 */
export function createRenderRig(container: HTMLElement): RenderRig {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03040b);

  // Huge near/far ratio: we fly from far outside a galaxy to right up against
  // the face of a moon, all in one unbroken take.
  const camera = new THREE.PerspectiveCamera(62, width / height, 0.5, 90000);
  camera.position.set(0, 200, 5200);

  const size = new THREE.Vector2(width, height);
  const postfx = new PostFX(renderer, scene, camera, size);

  return { renderer, scene, camera, postfx, size };
}

/** Wire up a resize handler that keeps renderer + composer in sync. */
export function bindResize(rig: RenderRig): () => void {
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    rig.size.set(w, h);
    rig.camera.aspect = w / h;
    rig.camera.updateProjectionMatrix();
    rig.renderer.setSize(w, h);
    rig.postfx.setSize(w, h);
  };
  window.addEventListener("resize", onResize);
  return onResize;
}
