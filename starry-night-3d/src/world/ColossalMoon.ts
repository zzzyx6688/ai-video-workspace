import * as THREE from "three";
import { makeGlowTexture } from "./Starfield";

/**
 * A colossal moon — Van Gogh's crescent rendered as a giant glowing world.
 * Its surface is procedural fbm "brushwork", lit by a fixed warm key so the
 * terminator falls across it as the camera sweeps past, delivering the
 * scale-shock of flying metres above something hundreds of kilometres wide.
 */
const vert = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosL;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vPosL = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec3 vNormalW;
  varying vec3 vPosL;
  uniform vec3 uLight;
  uniform float uTime;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.2, 0.4, 0.6));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 dir = normalize(vPosL);

    float bands = fbm(dir * 3.0 + vec3(uTime * 0.01));
    float swirl = fbm(dir * 7.0 - vec3(uTime * 0.02));

    vec3 base = mix(vec3(0.85, 0.72, 0.45), vec3(0.35, 0.42, 0.72), swirl);
    base = mix(base, vec3(1.0, 0.9, 0.65), smoothstep(0.55, 0.9, bands));

    float lambert = max(dot(n, normalize(uLight)), 0.0);
    float term = smoothstep(-0.15, 0.35, dot(n, normalize(uLight)));
    vec3 col = base * (0.05 + lambert * 0.78);

    // warm rim light on the lit edge
    float rim = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    col += vec3(1.0, 0.75, 0.4) * rim * 0.35 * term;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class ColossalMoon {
  public group = new THREE.Group();
  public radius: number;
  private mat: THREE.ShaderMaterial;
  private halo: THREE.Sprite;

  constructor(radius = 700) {
    this.radius = radius;

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uLight: { value: new THREE.Vector3(-0.7, 0.35, 0.6).normalize() },
        uTime: { value: 0 },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });

    const moon = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 96), this.mat);
    this.group.add(moon);

    // outer atmosphere glow (fresnel shell)
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.09, 64, 48),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(0xffcf8a) } },
        vertexShader: /* glsl */ `
          varying float vI;
          void main() {
            vec3 n = normalize(normalMatrix * normal);
            vI = pow(1.0 - abs(dot(n, vec3(0.0,0.0,1.0))), 2.6);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying float vI;
          uniform vec3 uColor;
          void main() { gl_FragColor = vec4(uColor, vI * 0.16); }
        `,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.group.add(atmo);

    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        color: 0xc08a44,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.halo.scale.setScalar(radius * 2.2);
    this.group.add(this.halo);
  }

  update(t: number): void {
    this.mat.uniforms.uTime.value = t;
  }
}
