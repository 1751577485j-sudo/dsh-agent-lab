import { interpolate } from "remotion";
import { COLOR } from "./theme";

type AccentProps = { scene: string; frame: number; from: number; to: number };

/** 按场景绘制扁平几何图形；文字仍然只来自 layout.json。 */
export const Accent: React.FC<AccentProps> = ({ scene, frame, from, to }) => {
  if (frame < from - 12 || frame > to + 12) return null;
  const t = frame - from;

  if (scene === "s2") return <ContrastSplit t={t} />;
  if (scene === "s3") return <Devices t={t} />;
  if (scene === "s4") return <Monitors t={t} />;
  return null;
};

const fade = (t: number, inEnd: number, outStart: number, life: number) =>
  interpolate(t, [0, inEnd, outStart, life], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** s2：左侧接近黑、右侧接近白，中间的空隙逐渐拉大，示意“明暗反差过大”。 */
const ContrastSplit: React.FC<{ t: number }> = ({ t }) => {
  const opacity = fade(t, 35, 395, 420);
  const gap = interpolate(t, [30, 390], [28, 96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blockW = 350;
  const blockH = 110;
  const y = 670 + Math.sin(t / 45) * 4;

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div
        style={{
          position: "absolute",
          left: 960 - gap / 2 - blockW,
          top: y,
          width: blockW,
          height: blockH,
          background: "#05080C",
          border: "2px solid rgba(147,161,177,0.35)",
          borderRadius: 6,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 960 + gap / 2,
          top: y,
          width: blockW,
          height: blockH,
          background: COLOR.ink,
          borderRadius: 6,
        }}
      />
    </div>
  );
};

/** s3：手机 / 电视 / 显示器，从左到右排列。 */
const Devices: React.FC<{ t: number }> = ({ t }) => {
  const opacity = fade(t, 35, 455, 480);

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <DeviceScreen
        left={635}
        top={610 + Math.sin(t / 45) * 6}
        w={90}
        h={160}
        r={18}
        accentBottom={0.54}
      />
      {/* 电视 */}
      <DeviceScreen
        left={795}
        top={630 + Math.sin(t / 52 + 1.2) * 6}
        w={200}
        h={120}
        r={8}
        accentBottom={0.42}
      />
      <div
        style={{
          position: "absolute",
          left: 878,
          top: 750 + Math.sin(t / 52 + 1.2) * 6,
          width: 34,
          height: 18,
          background: COLOR.muted,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 848,
          top: 768 + Math.sin(t / 52 + 1.2) * 6,
          width: 94,
          height: 6,
          borderRadius: 3,
          background: COLOR.muted,
          opacity: 0.55,
        }}
      />
      {/* 显示器 */}
      <DeviceScreen
        left={1065}
        top={620 + Math.sin(t / 58 + 2.4) * 6}
        w={220}
        h={130}
        r={6}
        accentBottom={0.34}
      />
      <div
        style={{
          position: "absolute",
          left: 1167,
          top: 750 + Math.sin(t / 58 + 2.4) * 6,
          width: 16,
          height: 24,
          background: COLOR.muted,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1130,
          top: 774 + Math.sin(t / 58 + 2.4) * 6,
          width: 90,
          height: 6,
          borderRadius: 3,
          background: COLOR.muted,
          opacity: 0.55,
        }}
      />
    </div>
  );
};

const DeviceScreen: React.FC<{
  left: number;
  top: number;
  w: number;
  h: number;
  r: number;
  accentBottom: number;
}> = ({ left, top, w, h, r, accentBottom }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: w,
      height: h,
      border: `4px solid ${COLOR.muted}`,
      borderRadius: r,
      background: "rgba(121,184,255,0.07)",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 10,
        right: 10,
        bottom: 10,
        height: 4,
        borderRadius: 2,
        background: COLOR.accent2,
        opacity: accentBottom,
      }}
    />
  </div>
);

/** s4：两台外观相同的显示器，内部层次数量不同，示意“画质不一样”。 */
const Monitors: React.FC<{ t: number }> = ({ t }) => {
  const opacity = fade(t, 40, 575, 600);

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <MonitorFrame
        left={300}
        top={430 + Math.sin(t / 55) * 5}
        bars={[1, 0.82, 0.64, 0.46, 0.28]}
      />
      <MonitorFrame
        left={1380}
        top={430 + Math.sin(t / 55 + Math.PI) * 5}
        bars={[1, 0.6, 0.26]}
      />
    </div>
  );
};

const MonitorFrame: React.FC<{ left: number; top: number; bars: number[] }> = ({
  left,
  top,
  bars,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: 240,
      height: 170,
      border: `4px solid ${COLOR.muted}`,
      borderRadius: 8,
      background: "rgba(121,184,255,0.06)",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        top: 16,
        bottom: 16,
        background: "#0B0F14",
        borderRadius: 4,
        padding: "12px 14px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            height: 12,
            width: `${Math.round(v * 100)}%`,
            borderRadius: 2,
            background: i % 2 === 0 ? COLOR.accent : COLOR.accent2,
            opacity: 0.45 + v * 0.25,
          }}
        />
      ))}
    </div>
  </div>
);
