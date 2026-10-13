/**
 * A compact 3D Simplex noise implementation (Stefan Gustavson's public-domain
 * algorithm, ported to TypeScript) plus a curl-noise helper.
 *
 * Curl noise is the soul of the "Stroke Cosmos": Van Gogh's brush strokes are
 * directional, swirling marks. Running particles through the curl of a noise
 * field gives us a divergence-free 3D flow that looks exactly like living,
 * three-dimensional brushwork.
 */
const F3 = 1 / 3;
const G3 = 1 / 6;

/* prettier-ignore */
const grad3 = new Float32Array([
  1,1,0, -1,1,0, 1,-1,0, -1,-1,0,
  1,0,1, -1,0,1, 1,0,-1, -1,0,-1,
  0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1,
]);

export class SimplexNoise {
  private perm = new Uint8Array(512);
  private permMod12 = new Uint8Array(512);

  constructor(seedFn: () => number) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher–Yates with the supplied seeded rng
    for (let i = 255; i > 0; i--) {
      const n = Math.floor(seedFn() * (i + 1));
      const q = p[i];
      p[i] = p[n];
      p[n] = q;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  /** 3D simplex noise in roughly [-1, 1]. */
  noise3d(xin: number, yin: number, zin: number): number {
    const perm = this.perm;
    const permMod12 = this.permMod12;
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const z0 = zin - (k - t);

    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;

    const ii = i & 255, jj = j & 255, kk = k & 255;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
      t3 *= t3;
      n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
    }
    return 32 * (n0 + n1 + n2 + n3);
  }

  /** Three independent noise fields, used to build a vector potential. */
  private potential(x: number, y: number, z: number): [number, number, number] {
    return [
      this.noise3d(x, y + 11.7, z + 3.1),
      this.noise3d(x + 27.3, y, z + 7.9),
      this.noise3d(x + 5.5, y + 19.2, z),
    ];
  }

  /**
   * Curl of the vector potential → a divergence-free 3D flow field.
   * Perfect for swirling, non-collapsing particle motion.
   */
  curl(x: number, y: number, z: number, eps = 0.12): [number, number, number] {
    const p1 = this.potential(x, y, z + eps);
    const p2 = this.potential(x, y, z - eps);
    const p3 = this.potential(x, y + eps, z);
    const p4 = this.potential(x, y - eps, z);
    const p5 = this.potential(x + eps, y, z);
    const p6 = this.potential(x - eps, y, z);

    const x1 = (p3[2] - p4[2]) / (2 * eps);
    const x2 = (p5[1] - p6[1]) / (2 * eps);
    const y1 = (p5[0] - p6[0]) / (2 * eps);
    const y2 = (p1[2] - p2[2]) / (2 * eps);
    const z1 = (p1[1] - p2[1]) / (2 * eps);
    const z2 = (p3[0] - p4[0]) / (2 * eps);

    return [x1 - x2, y1 - y2, z1 - z2];
  }
}
