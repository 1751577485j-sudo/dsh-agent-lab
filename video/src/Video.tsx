import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import layout from "./layout.json";
import { Background } from "./Background";
import { Scene } from "./Scene";

export const Video: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0E1116" }}>
      <Background frame={frame} />
      {layout.scenes.map((scene) => (
        <Scene key={scene.id} scene={scene} frame={frame} />
      ))}
      <Chrome />
    </AbsoluteFill>
  );
};

/** 固定角标：既是版式元素，也用于验证“文字不出安全区” */
const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 96,
          fontSize: 42,
          letterSpacing: "0.02em",
          color: "#93A1B1",
          fontFamily: '"Noto Sans SC", sans-serif',
        }}
      >
        VIDEO LAB
      </div>
    </AbsoluteFill>
  );
};
