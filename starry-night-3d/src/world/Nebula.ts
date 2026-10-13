import * as THREE from "three";

/**
 * The "canvas" — an enormous inside-out sphere painted with procedural
 * fbm nebula clouds and thousands of micro-stars. It is the deep background
 * of the whole cosmos and uses 3D noise so there is no visible seam or pole.
 */
const vert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform float uTime;

  // -- classic 3D value noise + fbm --
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = vDir;
    float t = uTime * 0.012;

    // swirling nebula field
    float n = fbm(d * 2.2 + vec3(t, -t * 0.7, t * 0.4));
    float n2 = fbm(d * 5.5 - vec3(t * 1.6, t, 0.0));

    vec3 deep   = vec3(0.008, 0.012, 0.045);  // abyssal blue
    vec3 azure  = vec3(0.06, 0.16, 0.42);     // van gogh blue
    vec3 violet = vec3(0.18, 0.10, 0.34);
    vec3 gold   = vec3(0.95, 0.72, 0.30);     // van gogh gold

    vec3 col = deep;
    col = mix(col, azure, smoothstep(0.35, 0.85, n) * 0.85);
    col = mix(col, violet, smoothstep(0.5, 0.95, n2) * 0.55);

    // warm glow concentrated in "currents" between the swirls
    float veins = smoothstep(0.62, 0.9, fbm(d * 3.1 + vec3(0.0, t * 0.8, 0.0)));
    col += gold * veins * 0.22;

    // micro-stars: sparse bright points
    float starField = fbm(d * 190.0);
    float star = smoothstep(0.965, 1.0, starField);
    col += vec3(0.9, 0.93, 1.0) * star * 1.4;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class Nebula {
  public group = new THREE.Group();
  private mat: THREE.ShaderMaterial;

  constructor() {
    const geo = new THREE.SphereGeometry(26000, 64, 48);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const mesh = new THREE.Mesh(geo, this.mat);
    mesh.frustumCulled = false;
    this.group.add(mesh);
  }

  update(t: number): void {
    this.mat.uniforms.uTime.value = t;
  }
}
