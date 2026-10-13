/**
 * Deterministic PRNG (mulberry32).
 * Every world object is seeded so the whole cosmos is reproducible —
 * important for rendering the exact same frames headlessly.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random float in [min, max). */
export function rand(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng();
}

/** Random point on a unit sphere (uniform). */
export function randUnitVector(rng: () => number): [number, number, number] {
  const u = rng() * 2 - 1;
  const t = rng() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(t), r * Math.sin(t), u];
}

/** Random point inside a unit sphere (uniform volume). */
export function randInSphere(rng: () => number): [number, number, number] {
  const [x, y, z] = randUnitVector(rng);
  const r = Math.cbrt(rng());
  return [x * r, y * r, z * r];
}
