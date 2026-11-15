import { AbsoluteFill } from "remotion";
import { COLOR } from "./theme";

/**
 * 扁平风 MG 背景。
 *
 * 规范要求「场景内持续有可察觉的动态」（相邻抽帧差异率 ≥2%）。纯缓慢位移的
 * 大色块实测只有 0.1% 左右，所以底部加了一条持续横向滚动的频谱条：它的每根
 * 竖条都有明确的明暗边界，滚动时能稳定产生足够的帧差。其他色块只负责构图。
 */
export const Background: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.bg }}>
      <BigShapes t={t} />
      <Grid />
      <MotionBars t={t} />
    </AbsoluteFill>
  );
};

const BigShapes: React.FC<{ t: number }> = ({ t }) => {
  const blockX = 150 + Math.sin(t / 110) * 70;
  const blockY = 620 + Math.cos(t / 130) * 24;
  const blockRot = -7 + Math.sin(t / 150) * 4;

  const circleX = 1480 + Math.cos(t / 120) * 30;
  const circleY = 100 + Math.sin(t / 95) * 28;

  const lineW = 420 + Math.sin(t / 60) * 60;
  const lineX = 220 + Math.sin(t / 80) * 30;

  const squareRot = t * 0.3;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: blockX,
          top: blockY,
          width: 560,
          height: 380,
          background: COLOR.bgAlt,
          borderRadius: 12,
          transform: `rotate(${blockRot}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: circleX,
          top: circleY,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: COLOR.accent2,
          opacity: 0.1,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: lineX,
          top: 185,
          width: lineW,
          height: 3,
          background: COLOR.accent,
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 330,
          top: 170,
          width: 110,
          height: 110,
          background: COLOR.accent,
          opacity: 0.12,
          transform: `rotate(${squareRot}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1600,
          top: 760,
          width: 180,
          height: 3,
          background: COLOR.muted,
          opacity: 0.25,
        }}
      />
    </>
  );
};

const Grid: React.FC = () => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
    {Array.from({ length: 12 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 160} y1={0} x2={i * 160} y2={1080} stroke="#fff" strokeWidth={1} />
    ))}
    {Array.from({ length: 7 }).map((_, i) => (
      <line key={`h${i}`} x1={0} y1={i * 180} x2={1920} y2={i * 180} stroke="#fff" strokeWidth={1} />
    ))}
  </svg>
);

const BAR_W = 64;
const BAR_GAP = 16;
const STEP = BAR_W + BAR_GAP; // 80
const PERIOD_BARS = 12;
const SPEED = 4; // 像素 / 帧：0.5 秒约 60 像素，稳定产生帧差

const HEIGHTS = [110, 180, 240, 140, 90, 200, 248, 120, 220, 160, 100, 190];
const COLORS = [COLOR.accent, COLOR.accent2, COLOR.muted, COLOR.accent2];
const OPACITY = [0.5, 0.34, 0.18, 0.34];

const MotionBars: React.FC<{ t: number }> = ({ t }) => {
  const offset = (t * SPEED) % (STEP * PERIOD_BARS);
  const bars = [];
  for (let i = -PERIOD_BARS; i <= 1920 / STEP + PERIOD_BARS; i++) {
    const local = ((i % PERIOD_BARS) + PERIOD_BARS) % PERIOD_BARS;
    const tone = ((i % COLORS.length) + COLORS.length) % COLORS.length;
    bars.push({
      key: i,
      x: i * STEP - offset,
      h: HEIGHTS[local],
      color: COLORS[tone],
      opacity: OPACITY[tone],
    });
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: 1920,
        height: 260,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 2,
          background: COLOR.muted,
          opacity: 0.22,
        }}
      />
      {bars.map((b) => (
        <div
          key={b.key}
          style={{
            position: "absolute",
            left: b.x,
            bottom: 0,
            width: BAR_W,
            height: b.h,
            background: b.color,
            opacity: b.opacity,
            borderRadius: "3px 3px 0 0",
          }}
        />
      ))}
    </div>
  );
};
