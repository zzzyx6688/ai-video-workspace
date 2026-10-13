import * as THREE from "three";
import { mulberry32, rand } from "../core/rng";

/**
 * THE CYPRESS GATE — the village cypress turned into a pair of towering
 * dark spires that frame a passage through space. Flying between them gives a
 * violent sense of scale, then they fall behind as silhouettes against the
 * glow of the galaxy.
 *
 * Kept deliberately near-black: these are pure silhouette, lit only by a
 * golden falloff toward their tips and a faint fresnel edge.
 */
const vert = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  void main() {
    // silhouette base: near-black cypress green-blue
    vec3 ink = vec3(0.012, 0.025, 0.045);

    // vertical falloff: only the very tips catch the golden light of the sky
    float h = smoothstep(0.0, 1.0, clamp(vWorldPos.y / 2400.0, 0.0, 1.0));
    vec3 tipGlow = vec3(0.95, 0.66, 0.28) * pow(h, 2.6) * 0.28;

    // faint fresnel edge so the spires separate from the dark
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fres = pow(1.0 - max(dot(normalize(vNormalW), viewDir), 0.0), 3.0);

    vec3 col = ink + tipGlow + vec3(0.30, 0.45, 0.80) * fres * 0.18;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeSpireGeometry(height: number, baseR: number, seed: number): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const geo = new THREE.ConeGeometry(baseR, height, 14, 12, false);
  geo.translate(0, height / 2, 0);

  // warp the cone into an organic, flame-like cypress silhouette
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = y / height;
    const wob = Math.sin(t * 9.0 + seed) * 0.12 + (rng() - 0.5) * 0.06;
    const s = 1.0 + wob;
    pos.setXYZ(i, x * s, y, z * s);
  }
  geo.computeVertexNormals();
  return geo;
}

export class CypressGate {
  public group = new THREE.Group();

  constructor(center = new THREE.Vector3(0, -700, 2400), seed = 9) {
    const rng = mulberry32(seed);
    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag });

    for (const side of [-1, 1]) {
      const cluster = new THREE.Group();
      const n = 3;
      for (let i = 0; i < n; i++) {
        const height = rand(rng, 1900, 3000);
        const baseR = rand(rng, 115, 185);
        const geo = makeSpireGeometry(height, baseR, seed + i * 7 + (side + 1) * 3);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          rand(rng, -200, 200),
          rand(rng, -120, 120),
          rand(rng, -280, 280),
        );
        mesh.scale.set(1, 1, rand(rng, 0.6, 1.0));
        cluster.add(mesh);
      }
      cluster.position.set(side * 560, rand(rng, -60, 60), rand(rng, -150, 150));
      this.group.add(cluster);
    }

    this.group.position.copy(center);
  }

  update(): void {
    // static — the sense of motion comes entirely from the camera
  }
}
