import { Composition } from "remotion";
import layout from "./layout.json";
import { Video } from "./Video";

export const RemotionRoot: React.FC = () => {
  const c = layout.composition;
  return (
    <Composition
      id={c.id}
      component={Video}
      durationInFrames={c.durationInFrames}
      fps={c.fps}
      width={c.width}
      height={c.height}
    />
  );
};
