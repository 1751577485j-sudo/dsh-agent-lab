import { interpolate } from "remotion";
import layout from "./layout.json";
import { Accent } from "./Accents";
import { boxOf, textStyle, type Role } from "./theme";

type SceneData = { id: string; name: string; from: number; to: number };
type TextData = {
  id: string;
  scene: string;
  role: Role;
  text: string;
  cx: number;
  cy: number;
  from: number;
  to: number;
};

/** 一个场景 = layout.json 中 scenes 的一项，文字由 texts 里 scene 字段关联 */
export const Scene: React.FC<{ scene: SceneData; frame: number }> = ({ scene, frame }) => {
  const texts = (layout.texts as TextData[]).filter((t) => t.scene === scene.id);
  return (
    <>
      <Accent scene={scene.id} frame={frame} from={scene.from} to={scene.to} />
      {texts.map((t) => {
        if (frame < t.from - 12 || frame > t.to + 12) return null;
        const opacity = interpolate(
          frame,
          [t.from - 10, t.from + 4, t.to - 4, t.to + 10],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const rise = interpolate(frame, [t.from - 10, t.from + 8], [16, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const box = boxOf(t);
        return (
          <div key={t.id} style={textStyle(box, opacity, rise)}>
            {box.text}
          </div>
        );
      })}
    </>
  );
};
