import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/**
 * Final colour-grade pass: chromatic aberration, vignette and animated film
 * grain. Runs in display space, after tone-mapping/output conversion.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uAberration: { value: 0.0018 },
    uVignette: { value: 1.15 },
    uGrain: { value: 0.055 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAberration;
    uniform float uVignette;
    uniform float uGrain;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec2 dir = uv - 0.5;
      float r2 = dot(dir, dir);

      // radial chromatic aberration — stronger toward the edges
      vec2 off = dir * uAberration * (0.35 + r2 * 2.2);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + off).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - off).b;

      // warm/cool split grade: push highlights gold, shadows azure
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col * vec3(0.92, 0.97, 1.12), col * vec3(1.12, 1.02, 0.86), smoothstep(0.18, 0.85, luma));

      // vignette
      col *= 1.0 - smoothstep(0.35, 1.15, r2 * uVignette * 1.6);

      // animated film grain
      float g = hash(uv * vec2(1920.0, 1080.0) + fract(uTime) * 97.0) - 0.5;
      col += g * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export class PostFX {
  public composer: EffectComposer;
  public bloom: UnrealBloomPass;
  public grade: ShaderPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    size: THREE.Vector2,
  ) {
    this.composer = new EffectComposer(renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(size.x, size.y);

    const renderPass = new RenderPass(scene, camera);

    // The cosmos is built from millions of tiny emissive points — bloom is what
    // turns them from dots into glowing, painterly light.
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.62, // strength
      0.55, // radius
      0.62, // threshold — only genuinely bright points bloom
    );

    const output = new OutputPass();
    this.grade = new ShaderPass(GradeShader);
    this.grade.renderToScreen = true;

    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(output);
    this.composer.addPass(this.grade);
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
  }

  render(delta: number): void {
    this.grade.uniforms.uTime.value += delta;
    this.composer.render(delta);
  }
}
