import * as THREE from "three";
import { mulberry32, rand, randUnitVector } from "../core/rng";
import { makeGlowTexture } from "./Starfield";

/**
 * A colossal spiral galaxy — the three-dimensional reading of the great
 * swirling vortex in Van Gogh's sky. Four logarithmic arms, a bright golden
 * core, and a soft halo. It is the primary landmark of the space: everything
 * else is measured against its ~3000-unit diameter.
 */
const vert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  uniform float uTime;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    // slow differential rotation: inner particles move faster
    float r = length(position.xz);
    float ang = uTime * 0.012 * (1.0 + 900.0 / (r + 400.0));
    float c = cos(ang), s = sin(ang);
    vec3 p = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * (700.0 / -mv.z), 1.0, 95.0);
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

export class VortexGalaxy {
  public group = new THREE.Group();
  public particleCount = 0;
  private mat: THREE.ShaderMaterial;
  private halo: THREE.Sprite;
  private core: THREE.Mesh;

  constructor(seed = 21, radius = 1500, count = 28000) {
    const rng = mulberry32(seed);
    this.particleCount = count;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const gold = new THREE.Color(0xffd27a);
    const white = new THREE.Color(0xfff4dc);
    const azure = new THREE.Color(0x5f8fe0);
    const violet = new THREE.Color(0x8b6fdc);
    const tmp = new THREE.Color();

    const arms = 4;
    for (let i = 0; i < count; i++) {
      let r: number;
      let theta: number;
      let y: number;

      if (i % 4 === 0) {
        // spherical central bulge
        const [ux, uy, uz] = randUnitVector(rng);
        r = Math.pow(rng(), 0.5) * radius * 0.22;
        theta = Math.atan2(uz, ux);
        y = uy * radius * 0.09;
        positions[i * 3] = ux * r;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = uz * r;
      } else {
        r = radius * Math.pow(rng(), 0.62);
        const arm = Math.floor(rng() * arms);
        const swirl = Math.log(r / 60 + 1) * 3.1;
        theta = (arm * Math.PI * 2) / arms + swirl + rand(rng, -0.22, 0.22);
        const thick = 150 * Math.exp(-(r / radius) * 1.8) + 20;
        y = (rng() + rng() + rng() - 1.5) * thick;
        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(theta) * r;
      }

      const t = Math.min(r / radius, 1);
      if (t < 0.35) tmp.copy(white).lerp(gold, t / 0.35);
      else tmp.copy(gold).lerp(azure, (t - 0.35) / 0.65);
      if (rng() > 0.86) tmp.lerp(violet, 0.5);

      const bright = 0.35 + rng() * 0.4;
      colors[i * 3] = tmp.r * bright;
      colors[i * 3 + 1] = tmp.g * bright;
      colors[i * 3 + 2] = tmp.b * bright;
      sizes[i] = rand(rng, 3, 12);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMap: { value: makeGlowTexture() } },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const disk = new THREE.Points(geo, this.mat);
    disk.frustumCulled = false;
    this.group.add(disk);

    // blazing core
    this.core = new THREE.Mesh(
      new THREE.SphereGeometry(22, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0xffcf94 }),
    );
    this.group.add(this.core);

    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        color: 0xb87a2e,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.halo.scale.setScalar(620);
    this.group.add(this.halo);
  }

  update(t: number): void {
    this.mat.uniforms.uTime.value = t;
    const pulse = 1 + Math.sin(t * 0.8) * 0.04;
    this.core.scale.setScalar(pulse);
    this.halo.scale.setScalar(620 * pulse);
  }
}
