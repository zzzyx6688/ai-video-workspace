import { Composition } from "remotion";
import { Demo } from "./compositions/Demo";
import { Tribute } from "./compositions/Tribute";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Demo"
        component={Demo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* 「他自杀了……」爆款情绪短片公式：65s @ 30fps = 1950 帧 */}
      <Composition
        id="Tribute"
        component={Tribute}
        durationInFrames={1950}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
