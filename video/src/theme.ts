import type { CSSProperties } from "react";

export const CANVAS = { width: 1920, height: 1080, fps: 30 } as const;

/** 五级字阶，与《视频制作通用审核规范 v1.2》第 4.2 节一致 */
export const FONT_SIZE = {
  L0: 180,
  L1: 110,
  L2: 76,
  L3: 56,
  L4: 42,
} as const;

export type Role = keyof typeof FONT_SIZE;

export const FONT_WEIGHT: Record<Role, number> = {
  L0: 900,
  L1: 800,
  L2: 700,
  L3: 600,
  L4: 400,
};

export const LINE_HEIGHT: Record<Role, number> = {
  L0: 1.05,
  L1: 1.15,
  L2: 1.25,
  L3: 1.35,
  L4: 1.4,
};

export const COLOR = {
  bg: "#0E1116",
  bgAlt: "#18202B",
  ink: "#F5F7FA",
  accent: "#FFB25E",
  accent2: "#79B8FF",
  muted: "#93A1B1",
} as const;

/** 全片唯一字族；字体在 load-fonts.ts 中显式加载 */
export const FONT_FAMILY = '"Noto Sans SC", sans-serif';

/**
 * 估算文字宽度（emoji 等不参与本片）。
 * 中文/全角标点按 1em，英文大写按 0.8em，其余按 0.65em —— 均取偏大值，
 * 保证 layout.json 导出的包围盒不小于实际渲染宽度，安全区检查才有意义。
 * 必须与 scripts/render.mjs 的 textWidth 保持一致。
 */
export function textWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) {
    if (/[\u3000-\u9fff\uff00-\uffef]/.test(ch)) em += 1;
    else if (/[A-Z]/.test(ch)) em += 0.8;
    else em += 0.65;
  }
  return em * fontSize;
}

export type Box = {
  id: string;
  text: string;
  role: Role;
  fontSize: number;
  x: number;
  y: number;
  w: number;
  h: number;
  from: number;
  to: number;
};

export function boxOf(t: {
  id: string;
  text: string;
  role: Role;
  cx: number;
  cy: number;
  from: number;
  to: number;
}): Box {
  const fontSize = FONT_SIZE[t.role];
  const w = textWidth(t.text, fontSize);
  const h = fontSize * LINE_HEIGHT[t.role];
  return {
    id: t.id,
    text: t.text,
    role: t.role,
    fontSize,
    x: t.cx - w / 2,
    y: t.cy - h / 2,
    w,
    h,
    from: t.from,
    to: t.to,
  };
}

export function textStyle(box: Box, opacity: number, translateY = 0): CSSProperties {
  return {
    position: "absolute",
    left: box.x,
    top: box.y,
    width: box.w,
    fontSize: box.fontSize,
    lineHeight: `${box.h}px`,
    fontWeight: FONT_WEIGHT[box.role],
    color: COLOR.ink,
    fontFamily: FONT_FAMILY,
    textAlign: "center",
    opacity,
    whiteSpace: "pre",
    transform: `translateY(${translateY}px)`,
  };
}
