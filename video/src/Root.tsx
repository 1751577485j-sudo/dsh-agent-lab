import { AbsoluteFill, Composition } from "remotion";
import layout from "./layout.json";
import { Video } from "./Video";

/** 预览版：与成片同构图，整体缩到 0.5 倍（960×540），避免分数缩放导致的非整数尺寸 */
const Preview: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0E1116" }}>
    <div
      style={{
        width: layout.composition.width,
        height: layout.composition.height,
        transform: "scale(0.5)",
        transformOrigin: "top left",
      }}
    >
      <Video />
    </div>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => {
  const c = layout.composition;
  return (
    <>
      <Composition
        id={c.id}
        component={Video}
        durationInFrames={c.durationInFrames}
        fps={c.fps}
        width={c.width}
        height={c.height}
      />
      <Composition
        id="Preview"
        component={Preview}
        durationInFrames={c.durationInFrames}
        fps={c.fps}
        width={c.width / 2}
        height={c.height / 2}
      />
    </>
  );
};
