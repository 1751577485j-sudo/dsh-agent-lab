import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const layout = JSON.parse(readFileSync(join(root, "src/layout.json"), "utf8"));

const FONT_SIZE = { L0: 180, L1: 110, L2: 76, L3: 56, L4: 42 };
const LINE_HEIGHT = { L0: 1.05, L1: 1.15, L2: 1.25, L3: 1.35, L4: 1.4 };

/** 必须与 src/theme.ts 的 textWidth 保持一致 */
function textWidth(text, fontSize) {
  let em = 0;
  for (const ch of text) em += /[\u4e00-\u9fff]/.test(ch) ? 1 : 0.55;
  return em * fontSize;
}

function boxes() {
  return layout.texts.map((t) => {
    const fontSize = FONT_SIZE[t.role];
    const w = textWidth(t.text, fontSize);
    const h = fontSize * LINE_HEIGHT[t.role];
    return {
      id: t.id,
      text: t.text,
      role: t.role,
      fontSize,
      x: Math.round(t.cx - w / 2),
      y: Math.round(t.cy - h / 2),
      w: Math.round(w),
      h: Math.round(h),
      from: t.from,
      to: t.to,
    };
  });
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\n[render] 失败：${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}

const bin = join(root, "node_modules", ".bin", "remotion");
if (!existsSync(bin)) {
  console.error("[render] 未找到 remotion，请先执行 pnpm install");
  process.exit(1);
}

mkdirSync(join(root, "out"), { recursive: true });

console.log("[render] 1/2 渲染成片 final.mp4");
run(bin, ["render", "src/index.ts", layout.composition.id, "out/final.mp4"]);

console.log("[render] 2/2 渲染预览 preview.mp4（长边 854）");
run(bin, [
  "render",
  "src/index.ts",
  layout.composition.id,
  "out/preview.mp4",
  "--scale=0.444",
]);

const commit = (() => {
  const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "unknown";
})();

writeFileSync(
  join(root, "out/build-info.json"),
  JSON.stringify(
    {
      commit,
      renderedAt: new Date().toISOString(),
      durationSec: +(layout.composition.durationInFrames / layout.composition.fps).toFixed(3),
      resolution: `${layout.composition.width}x${layout.composition.height}`,
      fps: layout.composition.fps,
      audioStreams: 0,
      sceneCount: layout.scenes.length,
    },
    null,
    2,
  ),
);

writeFileSync(
  join(root, "out/layout.json"),
  JSON.stringify({ composition: layout.composition, safe: layout.safe, boxes: boxes() }, null, 2),
);

console.log("[render] 完成：out/final.mp4 / out/preview.mp4 / out/build-info.json / out/layout.json");
