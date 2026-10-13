import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from "remotion";

/**
 * Tribute.tsx —— 「他自杀了……」爆款情绪短片公式的 Remotion 实现
 * 5 幕结构（65s @ 30fps = 1950 帧），纯 CSS 油画动效，渲染无需外部素材。
 *
 * 接你自己的素材：把 雨夜·窗.mp4 复制到 remotion-demo/public/ 后，
 * 取消下方 <Video> 注释并删掉 #paint 层即可（Remotion 用 staticFile 引用 public/）。
 *
 * 渲染：在 remotion-demo/ 下 `npm i && npx remotion render Tribute out-tribute.mp4`
 */
export const Tribute: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps; // 当前秒数

  // 流动油画底图：随帧缓慢漂移的暗调渐变（平替 Ken Burns + 油画质感）
  const shift = interpolate(frame, [0, durationInFrames], [0, 100]);
  const bg = `radial-gradient(120% 80% at ${30 + shift * 0.2}% 20%, #2a2438 0%, transparent 60%),
              radial-gradient(120% 90% at 75% 80%, #14202b 0%, transparent 60%),
              linear-gradient(160deg, #0c0e16 0%, #16121c 50%, #080a10 100%)`;
  const vignette = `radial-gradient(120% 95% at 50% 45%, transparent 50%, rgba(3,4,9,0.82) 100%)`;

  // —— 各幕透明度（与 preview.html 时间轴一致）——
  const act0 = interpolate(t, [0.3, 1.4, 3.3, 4.0], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const act1 = interpolate(t, [4.2, 5.2, 13.4, 14.0], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const act2 = interpolate(t, [14.0, 14.6, 43.2, 44.0], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const act3 = interpolate(t, [44.3, 45.3, 56.5, 58.0], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const act4 = interpolate(t, [58.5, 59.5, 65, 65], [0, 1, 1, 1], { extrapolateRight: "clamp" });

  const cardOp = (a: number, b: number, i: number) => {
    const segs = [[14.3, 23], [24, 33], [34, 43]][i];
    return interpolate(t, [segs[0] - 0.4, segs[0], segs[1] - 1.4, segs[1]], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  const hookY = interpolate(t, [0.3, 1.7], [40, 0], { extrapolateRight: "clamp" });

  const text = (op: number, size: number, weight: number, content: string, extra?: React.CSSProperties) => (
    <div style={{ opacity: op, fontSize: size, fontWeight: weight, lineHeight: 1.5, letterSpacing: "0.05em", textShadow: "0 4px 30px rgba(0,0,0,0.6)", ...extra }}>{content}</div>
  );

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: "Noto Sans CJK SC, Songti SC, serif", color: "#f4f1ea" }}>
      {/* 接你自己的素材时启用：<Video src={staticFile("rainy-window.mp4")} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:0.9,filter:'saturate(1.15) contrast(1.05) brightness(0.82)'}} /> */}
      <AbsoluteFill style={{ background: vignette }} />

      {/* A0 钩子 */}
      <AbsoluteFill style={{ opacity: act0, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 8 }}>
        {text(1, 116, 800, "他，走了……", { transform: `translateY(${hookY}px)` })}
        <div style={{ opacity: 0.7, fontSize: 40, marginTop: 8 }}>—— 谨以此片，纪念一位曾燃烧过的人</div>
      </AbsoluteFill>

      {/* A1 引入 */}
      <AbsoluteFill style={{ opacity: act1, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26 }}>
        {text(1, 78, 500, "你或许见过他的画")}
        {text(1, 78, 500, "却没记住，他的名字")}
      </AbsoluteFill>

      {/* A2 峰值蒙太奇 */}
      <AbsoluteFill style={{ opacity: act2, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
        {text(cardOp(0, 0, 0), 72, 600, "他用一生，换一幅不被理解的画")}
        {text(cardOp(0, 0, 1), 72, 600, "孤独，是他最忠实的颜料")}
        {text(cardOp(0, 0, 2), 72, 600, "当世界终于鼓掌，台下已空无一人")}
      </AbsoluteFill>

      {/* A3 沉降 */}
      <AbsoluteFill style={{ opacity: act3, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26 }}>
        {text(1, 92, 700, "可世界记得他时")}
        {text(1, 92, 700, "他早已不在")}
      </AbsoluteFill>

      {/* A4 结尾 */}
      <AbsoluteFill style={{ opacity: act4, justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 52, color: "#cfc7b6", letterSpacing: "0.12em" }}>谨以此片纪念 · 2026</div>
      </AbsoluteFill>

      {/* 进度条 */}
      <AbsoluteFill style={{ justifyContent: "flex-end" }}>
        <div style={{ height: 6, width: `${(frame / durationInFrames) * 100}%`, background: "linear-gradient(90deg,#f3c969,#e8a0a0)" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
