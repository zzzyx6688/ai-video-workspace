import * as THREE from "three";
import { mulberry32, rand, randInSphere } from "../core/rng";

/** Soft round sprite shared by all point-based systems. */
export function makeGlowTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.85)");
  g.addColorStop(0.55, "rgba(255,255,255,0.22)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Volumetric-ish starfield with real parallax. Stars are distributed through a
 * thick spherical shell (and a dense galactic band) so that flying through
 * space actually reads as *motion*, not a painted backdrop.
 */
export class Starfield {
  public group = new THREE.Group();

  constructor(seed = 3, count = 16000) {
    const rng = mulberry32(seed);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const warm = new THREE.Color(0xffd9a0);
    const cool = new THREE.Color(0xa9c8ff);
    const white = new THREE.Color(0xffffff);
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number;
      if (i % 5 === 0) {
        // galactic band: flattened disc of dense stars
        const [ux, uy, uz] = randInSphere(rng);
        const band = 24000;
        x = ux * band;
        z = uz * band;
        y = uy * band * 0.08; // squashed
      } else {
        const [ux, uy, uz] = randInSphere(rng);
        const r = rand(rng, 7000, 24000);
        x = ux * r;
        y = uy * r;
        z = uz * r;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mix = rng();
      tmp.copy(white).lerp(mix > 0.6 ? warm : cool, 0.35 + rng() * 0.5);
      const b = 0.4 + rng() * 0.4;
      colors[i * 3] = tmp.r * b;
      colors[i * 3 + 1] = tmp.g * b;
      colors[i * 3 + 2] = tmp.b * b;

      sizes[i] = rand(rng, 6, 34);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: makeGlowTexture() } },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * (300.0 / -mv.z), 1.0, 55.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D uMap;
        varying vec3 vColor;
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    this.group.add(points);
  }

  update(): void {
    // Static — parallax comes purely from camera motion.
  }
}
