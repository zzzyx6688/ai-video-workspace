# Remotion 完全掌握笔记

> 目标：学会并用 React 写视频。已在本环境安装 `remotion@4.0.535` 并渲染出 `Demo.mp4` 实证。
> 官方站：https://www.remotion.dev/ ｜ GitHub：`remotion-dev/remotion`

---

## 1. 它是什么

Remotion 是一个**用 React 写视频**的开源框架。你写 React 组件，Remotion 在每一帧把组件渲染成图片，再合成视频。

> 核心心智模型：**视频 = 时间的函数（frame → 画面）**。你拿到「当前帧号」，用代码决定这一帧画什么，连起来就是动画。

同类对比（我们已用过的）：
| 框架 | 写法 | 渲染器 | 适合 |
|------|------|------|------|
| **HyperFrames** | 手写 HTML/CSS | 浏览器截图 | 简单排版动画 |
| **Remotion** | React 组件 | 自带 Chromium + ffmpeg | 组件化、数据驱动、复杂交互视频 |

**关键优势**：Remotion 自带 Chromium 和 ffmpeg（支持 H.264），**规避了本沙箱系统 ffmpeg 缺 libx264 的限制**，输出是标准 H.264 mp4，体积更小、兼容性更好。

---

## 2. 核心 API 速查

| API | 作用 | 典型用法 |
|-----|------|------|
| `useCurrentFrame()` | 拿到当前帧号（0-based） | `const frame = useCurrentFrame()` |
| `useVideoConfig()` | 拿到 `{fps, width, height, durationInFrames}` | 算秒数、进度 |
| `<AbsoluteFill>` | 绝对定位的全屏容器 | 叠层背景/居中内容 |
| `interpolate(frame, [in,out], [a,b], opts)` | 把帧线性/缓动映射到任意值 | 透明度、位移、颜色 |
| `spring({frame, fps, config})` | 物理弹簧动画 | 弹入、回弹 |
| `<Sequence from durationInFrames>` | 在指定时间段放置内容 | 分镜、结尾页 |
| `<Series>` | 顺序堆叠多段 | 自动接龙分镜 |

`interpolate` 的 `extrapolateLeft/Right: "clamp"` 很常用——防止动画在范围外溢出。

---

## 3. 项目结构（最小可跑）

```
remotion-demo/
├── package.json          # 依赖 remotion + @remotion/cli
├── tsconfig.json
└── src/
    ├── index.ts          # registerRoot(RemotionRoot)
    ├── Root.tsx          # 用 <Composition> 注册可渲染视频
    └── compositions/
        └── Demo.tsx      # 你的视频组件（核心）
```

**`src/index.ts`** — 入口，注册根组件：
```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

**`src/Root.tsx`** — 绑定组件 + 视频参数：
```tsx
import { Composition } from "remotion";
import { Demo } from "./compositions/Demo";
export const RemotionRoot = () => (
  <Composition id="Demo" component={Demo}
    durationInFrames={150} fps={30} width={1080} height={1920} />
);
```

**`src/compositions/Demo.tsx`** — 真正画每一帧的组件（已包含全部核心 API 的实战演示）。

---

## 4. 渲染命令

```bash
# 渲染：入口文件 + composition id + 输出文件
npx remotion render src/index.ts Demo out.mp4

# 交互式预览（本地起服务，逐帧看效果）
npx remotion studio src/index.ts
```

常用选项：
- `--codec=h264` / `--audio-codec=aac`
- `--concurrency=4` 并行渲染加速
- `--frames=0-30` 只渲某几帧（调试快）
- `--props='{"title":"xxx"}'` 给组件传参（数据驱动批量出片）

---

## 5. 与现有视频工作流的整合

我们之前做视频的工具链：`ImageGen/VideoGen`（AI 生素材）+ `ffmpeg`（合成/字幕/混音）+ 偶尔 `HyperFrames`（排版）。

Remotion 的切入点：

1. **替代 HyperFrames 做排版动画**：卡片清单、片头片尾、数据可视化，用 React 组件写比手写 HTML 更易维护和复用。
2. **数据驱动批量出片**：同一模板 + 不同 `--props` 数据（如 10 个 skill 卡片、N 条天气文案），一条命令出 N 片。
3. **与 AI 素材结合**：把 `ImageGen/VideoGen` 产出的图/视频放进 `public/` 目录，在组件里用 `<Img>` / `<Video>` 引入作为图层；Remotion 负责动画、转场、字幕层。
4. **输出质量更好**：自带 H.264 ffmpeg，不再受系统 mpeg4 限制。

**推荐分工**：
- AI 生图/生视频 → `ImageGen`/`VideoGen`
- 排版/动画/字幕层/参数化批量 → `Remotion`
- 最终简单拼接/混音兜底 → `ffmpeg`

---

## 6. 本环境实证（验证"完全掌握"）

- ✅ `npm install remotion@4.0.535 @remotion/cli` 成功
- ✅ 写出覆盖全部核心 API 的 `Demo.tsx`（帧驱动背景渐变、interpolate 淡入位移、spring 弹入旋转圆、Sequence 结尾页、进度条）
- ✅ `npx remotion render src/index.ts Demo out.mp4` 渲染出 `remotion-demo/out.mp4`
- ✅ **实测产物**（`ffprobe`）：`h264 / 1080×1920 / 5.0s / 1.0MB` —— 证实 Remotion 自带 ffmpeg 输出标准 H.264，成功规避本沙箱系统 ffmpeg 缺 libx264 的限制（此前 HyperFrames 只能出 mpeg4）

> 注：Remotion 首次渲染会自动下载自带 Chromium；若沙箱网络限制下载，可用
> `npx remotion render ... --browser-executable=<已有 chrome 路径>` 指定本地浏览器。

---

## 7. 快速上手 Checklist

- [ ] `npm i remotion @remotion/cli`
- [ ] 写 `index.ts`（registerRoot）+ `Root.tsx`（Composition 注册）
- [ ] 在组件里用 `useCurrentFrame` + `interpolate/spring` 驱动画面
- [ ] 用 `<Sequence>` 切分镜
- [ ] `npx remotion render src/index.ts <id> out.mp4`
- [ ] 需要批量/换数据 → 用 `--props` 参数化
