import * as THREE from "three";
import { CAMERA_KEYS, SHOTS, type CameraKey, type Shot } from "./shots";

/**
 * Drives the camera along two Catmull-Rom curves (position + look-at target)
 * with per-keyframe FOV (dolly-zoom feel) and roll (banked turns). Sampling is
 * deterministic: `update(camera, T)` renders the same frame for the same T,
 * whether we are live in a browser or capturing video frame by frame.
 */
export class CameraRig {
  private posCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;
  private keys: CameraKey[];
  private shots: Shot[];

  private tmpPos = new THREE.Vector3();
  private tmpLook = new THREE.Vector3();

  constructor() {
    this.keys = CAMERA_KEYS;
    this.shots = SHOTS;
    const p = CAMERA_KEYS.map((k) => new THREE.Vector3(...k.pos));
    const l = CAMERA_KEYS.map((k) => new THREE.Vector3(...k.look));
    this.posCurve = new THREE.CatmullRomCurve3(p, false, "catmullrom", 0.5);
    this.lookCurve = new THREE.CatmullRomCurve3(l, false, "catmullrom", 0.5);
  }

  private sampleFovRoll(T: number): { fov: number; roll: number } {
    const n = this.keys.length;
    const p = THREE.MathUtils.clamp(T, 0, 1) * (n - 1);
    const i0 = Math.min(Math.floor(p), n - 2);
    const f = p - i0;
    const a = this.keys[i0];
    const b = this.keys[i0 + 1];
    return {
      fov: THREE.MathUtils.lerp(a.fov, b.fov, f),
      roll: THREE.MathUtils.lerp(a.roll, b.roll, f),
    };
  }

  update(camera: THREE.PerspectiveCamera, T: number): void {
    const u = THREE.MathUtils.clamp(T, 0, 1);
    this.posCurve.getPoint(u, this.tmpPos);
    this.lookCurve.getPoint(u, this.tmpLook);

    camera.position.copy(this.tmpPos);
    camera.up.set(0, 1, 0);
    camera.lookAt(this.tmpLook);

    const { fov, roll } = this.sampleFovRoll(u);
    if (roll !== 0) camera.rotateZ(roll);
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  /** Which movement are we inside, and how far through the whole take? */
  getShot(T: number): Shot {
    const u = THREE.MathUtils.clamp(T, 0, 1);
    for (const s of this.shots) if (u >= s.start && u < s.end) return s;
    return this.shots[this.shots.length - 1];
  }
}
