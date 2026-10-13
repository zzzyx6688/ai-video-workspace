import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

// 综合演示 Remotion 核心 API：
// useCurrentFrame / useVideoConfig / interpolate / spring / AbsoluteFill / Sequence
export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 1) 背景色随帧渐变（多段插值）
  const hue = interpolate(frame, [0, durationInFrames], [200, 280]);
  const background = `linear-gradient(160deg, hsl(${hue}, 60%, 12%), hsl(${
    hue + 30
  }, 70%, 22%))`;

  // 2) 标题：前 30 帧淡入 + 上移（clamp 防止溢出）
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 30], [40, 0], {
    extrapolateRight: "clamp",
  });

  // 3) 副标题：延迟到 20-50 帧淡入
  const subOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 4) 圆形：spring 弹簧弹入（0-45 帧）
  const enter = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.8 },
  });
  const circleScale = interpolate(enter, [0, 1], [0.3, 1]);
  const rotate = interpolate(frame, [0, durationInFrames], [0, 360]);

  // 5) 底部进度条
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Noto Sans CJK SC, sans-serif",
      }}
    >
      {/* 持续旋转的圆环（spring 弹入 + 旋转） */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.6)",
            transform: `scale(${circleScale}) rotate(${rotate}deg)`,
          }}
        />
      </AbsoluteFill>

      {/* 标题与副标题（帧驱动淡入） */}
      <h1
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          color: "white",
          fontSize: 72,
          textAlign: "center",
          margin: 0,
        }}
      >
        云山之间
      </h1>
      <p
        style={{
          opacity: subOpacity,
          color: "rgba(255,255,255,0.8)",
          fontSize: 34,
          marginTop: 16,
        }}
      >
        Made with Remotion
      </p>

      {/* 进度条 */}
      <AbsoluteFill
        style={{ justifyContent: "flex-end", alignItems: "stretch", padding: 24 }}
      >
        <div
          style={{
            height: 6,
            width: `${progress * 100}%`,
            background: "white",
            borderRadius: 3,
          }}
        />
      </AbsoluteFill>

      {/* 结束页：最后 30 帧黑屏收尾（Sequence 控制时间段） */}
      <Sequence from={durationInFrames - 30} durationInFrames={30}>
        <AbsoluteFill
          style={{ background: "black", justifyContent: "center", alignItems: "center" }}
        >
          <p style={{ color: "white", fontSize: 40 }}>Remotion · 完全掌握</p>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
