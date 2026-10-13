import * as THREE from "three";

/**
 * The shot list.
 *
 * Ten camera keyframes, evenly spaced (t = i / 9), so that sampling the
 * Catmull-Rom curves at u = T lands exactly on each authored keyframe. Six
 * "shots" cut the timeline into named movements for the HUD.
 *
 * Scale reference: the galaxy core sits at the origin with a ~1500 radius,
 * the moon at (2900, 700, -1700) with a 700 radius, the cypress gate at
 * (0, -700, 2400). The camera travels from z = +6200 all the way through the
 * core and up to y = +2400 — a single, unbroken 24-second take.
 */

export interface CameraKey {
  t: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  roll: number;
}

export interface Shot {
  start: number;
  end: number;
  name: string;
  desc: string;
}

export const MOON_POS = new THREE.Vector3(2900, 700, -1700);
export const GATE_POS = new THREE.Vector3(0, -700, 2400);

export const CAMERA_KEYS: CameraKey[] = [
  { t: 0 / 9, pos: [150, 1600, 6000], look: [0, 0, 0], fov: 62, roll: 0 }, // 远观（高空俯视全景）
  { t: 1 / 9, pos: [110, 700, 4500], look: [0, 0, 1200], fov: 66, roll: 0 }, // 推进
  { t: 2 / 9, pos: [0, 60, 2600], look: [0, 0, 0], fov: 74, roll: 0.05 }, // 星门
  { t: 3 / 9, pos: [600, 150, 1400], look: [1200, 200, -400], fov: 72, roll: -0.1 }, // 转向
  { t: 4 / 9, pos: [2500, 600, -900], look: [2900, 700, -1700], fov: 58, roll: -0.18 }, // 掠月
  { t: 5 / 9, pos: [900, 100, -600], look: [0, 0, 0], fov: 80, roll: 0.15 }, // 冲向核心
  { t: 6 / 9, pos: [120, 40, 260], look: [0, 0, -200], fov: 88, roll: 0.35 }, // 穿核心
  { t: 7 / 9, pos: [200, 1600, 1400], look: [0, 300, 0], fov: 60, roll: 0.1 }, // 拉升
  { t: 8 / 9, pos: [-400, 2400, 3200], look: [0, 0, 0], fov: 54, roll: 0 }, // 高处巡游
  { t: 9 / 9, pos: [300, 1400, 4800], look: [400, 300, 0], fov: 60, roll: 0 }, // 收束
];

export const SHOTS: Shot[] = [
  { start: 0.0, end: 0.19, name: "远观 · 星夜全景", desc: "整片星夜在虚空尽头缓缓浮现，笔触的漩涡像有生命一样转动。" },
  { start: 0.19, end: 0.3, name: "冲入 · 穿越丝柏星门", desc: "两侧丝柏化作暗色巨塔，我们从一个仅容一线光通过的缝里穿进去。" },
  { start: 0.3, end: 0.5, name: "掠过 · 巨月", desc: "近得能看见月面流动的笔触——巨大尺度带来的压迫感扑面而来。" },
  { start: 0.5, end: 0.67, name: "坠入 · 螺旋星系核心", desc: "加速扎进星系中心，视野被炽热的核心填满，光与旋转裹住了整个世界。" },
  { start: 0.67, end: 0.86, name: "俯瞰 · 巨大空间", desc: "拉升到高处回望：漩涡、星云、丝柏与月亮原来同处一个恢弘的构造之中。" },
  { start: 0.86, end: 1.0, name: "漂移 · 星海收束", desc: "镜头缓缓漂移，把整片星空交给下一次凝视。" },
];
