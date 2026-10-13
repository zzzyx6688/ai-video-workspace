import * as THREE from "three";
import { SimplexNoise } from "../core/noise";
import { mulberry32, rand } from "../core/rng";
import { makeGlowTexture } from "./Starfield";

/**
 * THE STROKE FIELD — the conceptual heart of the piece.
 *
 * Van Gogh's Starry Night is made of directional, swirling brush marks. Here
 * each mark becomes a glowing particle, and the marks are woven into a set of
 * giant three-dimensional vortices scattered through the void. Every vortex
 * spins at its own rate, its particles breathing along the local tangent, so
 * the whole scene reads like living, three-dimensional brushwork.
 */
interface Spinner {
  group: THREE.Group;
  mat: THREE.ShaderMaterial;
  speed: number;
}

const vert = /* glsl */ `
  attribute vec3 aTangent;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  uniform float uTime;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    // each stroke breathes back and forth along the local tangent
    vec3 p = position + aTangent * sin(uTime * aSpeed + aPhase) * 65.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * (620.0 / -mv.z), 1.0, 88.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  varying vec3 vColor;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

export class StrokeField {
  public group = new THREE.Group();
  private spinners: Spinner[] = [];
  private glow: THREE.Texture;
  public particleCount = 0;

  constructor(seed = 11) {
    const rng = mulberry32(seed);
    const noise = new SimplexNoise(rng);
    this.glow = makeGlowTexture();

    const vertexCount = 6;
    for (let i = 0; i < vertexCount; i++) {
      const center = new THREE.Vector3(
        rand(rng, -3400, 3400),
        rand(rng, -1100, 1100),
        rand(rng, -3400, 3400),
      );
      const radius = rand(rng, 850, 1750);
      const arms = Math.round(rand(rng, 3, 6));
      this.buildVortex(center, radius, arms, rng, noise);
    }
  }

  private buildVortex(
    center: THREE.Vector3,
    radius: number,
    arms: number,
    rng: () => number,
    noise: SimplexNoise,
  ): void {
    const count = 1500;
    this.particleCount += count;

    const positions = new Float32Array(count * 3);
    const tangents = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    const warm = new THREE.Color(0xffcf7a);
    const cool = new THREE.Color(0x7fb0ff);
    const vw = new THREE.Color(0xffffff);
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = radius * Math.sqrt(rng());
      const arm = Math.floor(rng() * arms);
      const swirl = (r / radius) * 7.0;
      const theta = (arm * Math.PI * 2) / arms + swirl + rand(rng, -0.35, 0.35);

      // local coordinates (vortex plane ~ XZ, with a soft vertical thickness)
      let x = Math.cos(theta) * r;
      let z = Math.sin(theta) * r;
      let y = (rng() + rng() + rng() - 1.5) * 130 * (1.0 - (r / radius) * 0.45);

      // curl-noise displacement → organic, non-uniform brushwork
      const c = noise.curl(x * 0.0016, y * 0.0016, z * 0.0016);
      const amp = 120;
      x += c[0] * amp;
      y += c[1] * amp;
      z += c[2] * amp;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // tangent of the spiral = direction the stroke "points"
      const tx = -Math.sin(theta);
      const tz = Math.cos(theta);
      tangents[i * 3] = tx;
      tangents[i * 3 + 1] = 0.15 * (rng() - 0.5);
      tangents[i * 3 + 2] = tz;

      const t = r / radius;
      tmp.copy(vw).lerp(t < 0.5 ? warm : cool, 0.35 + t * 0.6);
      const bright = 0.35 + rng() * 0.45;
      colors[i * 3] = tmp.r * bright;
      colors[i * 3 + 1] = tmp.g * bright;
      colors[i * 3 + 2] = tmp.b * bright;

      sizes[i] = rand(rng, 3.5, 13);
      phases[i] = rng() * Math.PI * 2;
      speeds[i] = rand(rng, 0.15, 0.55);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aTangent", new THREE.BufferAttribute(tangents, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geo.computeBoundingSphere();

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMap: { value: this.glow } },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    const sub = new THREE.Group();
    sub.position.copy(center);
    // give each vortex a slightly random tilt so they don't all lie flat
    sub.rotation.set(rand(rng, -0.5, 0.5), rand(rng, 0, Math.PI * 2), rand(rng, -0.5, 0.5));
    sub.add(points);
    this.group.add(sub);

    this.spinners.push({ group: sub, mat, speed: rand(rng, -0.05, 0.05) });
  }

  update(t: number): void {
    // absolute-time rotation keeps the cosmos fully deterministic, so a given
    // T always renders the exact same frame (essential for video capture)
    for (const s of this.spinners) {
      s.group.rotation.y = s.speed * t;
      s.mat.uniforms.uTime.value = t;
    }
  }
}
