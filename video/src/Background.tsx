import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLOR } from "./theme";

/**
 * 扁平风 MG 背景：色块、几何、线条缓慢运动。
 * 规范要求「场景内持续有可察觉的动态」（帧差 ≥2%），因此每个形状的运动
 * 都必须贯穿整段，不能只在开头出现。
 */
export const Background: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame;

  // 大色块：水平往返 + 轻微旋转
  const blockX = 240 + Math.sin(t / 90) * 180;
  const blockRot = Math.sin(t / 120) * 12;

  // 圆：垂直漂浮
  const circleY = 820 + Math.cos(t / 70) * 60;

  // 线条：持续延展与收缩
  const lineW = 520 + Math.sin(t / 55) * 260;

  // 三角：缓慢旋转
  const triRot = t * 0.35;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.bg }}>
      <div
        style={{
          position: "absolute",
          left: blockX,
          top: 620,
          width: 520,
          height: 320,
          background: COLOR.bgAlt,
          transform: `rotate(${blockRot}deg)`,
          borderRadius: 8,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1380,
          top: circleY - 320,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: COLOR.accent2,
          opacity: 0.12,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 300,
          width: lineW,
          height: 6,
          background: COLOR.accent,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 260,
          bottom: 200,
          width: 180,
          height: 180,
          background: COLOR.accent,
          opacity: 0.18,
          transform: `rotate(${triRot}deg)`,
        }}
      />
      <Grid />
    </AbsoluteFill>
  );
};

const Grid: React.FC = () => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
    {Array.from({ length: 12 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 160} y1={0} x2={i * 160} y2={1080} stroke="#fff" strokeWidth={1} />
    ))}
    {Array.from({ length: 7 }).map((_, i) => (
      <line key={`h${i}`} x1={0} y1={i * 180} x2={1920} y2={i * 180} stroke="#fff" strokeWidth={1} />
    ))}
  </svg>
);
