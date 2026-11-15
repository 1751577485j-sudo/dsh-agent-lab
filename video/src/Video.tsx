import { AbsoluteFill, useCurrentFrame } from "remotion";
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
    </AbsoluteFill>
  );
};
