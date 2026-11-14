# AGENTS.md — 视频工单执行说明

本仓库用于**用代码生成视频**。所有工作以 superagent 工单的形式下发，按下面的流程执行。

## 0. 仓库结构

```
video/                     Remotion 工程（唯一的视频来源）
  src/layout.json          文案、场景、文字位置（改文案改这里）
  src/theme.ts             字阶、配色、字重
  src/Background.tsx       扁平风 MG 背景动画
  src/Scene.tsx            按 layout.json 渲染文字
  scripts/render.mjs       渲染 + 生成 build-info.json / layout.json
  out/                     产物（不提交）

video-audit/               审核器（只读，不要修改）
  spec.json                阈值配置
  check.sh                 入口
  check_layout.py          帧级检查
```

## 1. 一次工单的完整流程

```
① 读需求 → 改 video/src/layout.json（必要时改场景组件）
② pnpm --dir video run typecheck
③ pnpm --dir video run render            # 产出 final.mp4 / preview.mp4 / build-info.json / layout.json
④ ./video-audit/check.sh video/out/final.mp4 --layout video/out/layout.json \
     --build-info video/out/build-info.json --commit $(git rev-parse --short HEAD)
⑤ 通过 → 开 PR；不通过 → 按 report.json 的失败项修改，回到 ②
⑥ 最多 3 轮
⑦ 把 CHANGES.md 和预览路径写进 PR 描述
```

## 2. 命令

```bash
pnpm --dir video install          # 首次
pnpm --dir video run typecheck
pnpm --dir video run render       # 约 2–4 分钟
./video-audit/check.sh video/out/final.mp4 --layout video/out/layout.json \
  --build-info video/out/build-info.json --commit "$(git rev-parse --short HEAD)"
```

审核器退出码：`0` 通过 / `1` 有未通过项 / `2` 执行错误。报告在 `video/out/report.json`。

## 3. 验收标准

以 `video-audit/spec.json` 与 `docs/视频制作通用审核规范-v1.2.md` 为准。核心几条：

- 1920×1080 / 30fps / **无音频流** / 时长 54–66 秒
- 场景内背景持续动态（相邻帧差异率 ≥2%）
- 文字全部在安全区内：上边 ≥162、下边 ≤918、左右 ≥96
- 字号 ≥40 像素；同一场景不超过 3 种字级
- 文字与背景对比度 ≥4.5:1
- `build-info.json` 的 commit 必须等于当前 HEAD

## 4. 循环规则

- **最多 3 轮**。第 3 轮仍不通过，停止修改，在 PR 里列出「三轮累计未解决项」并标记需要人工处理。
- 每轮都要在 `CHANGES.md` 追加一行：轮次、改了哪几项、哪条从失败转通过。
- **禁止修改 `video-audit/` 下的任何文件**（包括 spec.json），也禁止为了让检查通过而调整阈值。阈值只能由人修改。
- 禁止通过删除检查项、跳过渲染、复用旧产物来“通过”。

## 5. 交付物

- `video/out/final.mp4`（正式）
- `video/out/preview.mp4`（预览）
- `video/out/build-info.json`
- `video/out/layout.json`
- `video/out/report.json`
- `CHANGES.md`

`out/` 不进版本库（见 .gitignore），PR 描述里写清产物路径与最后一份 report 的结论。

## 6. 不要做

- 不要修改 `video-audit/`、不要改 `spec.json` 的阈值
- 不要引入音频轨（本规范要求无音轨）
- 不要用 JPEG 帧格式（暗部会出现色带，用 PNG + CRF 16）
- 不要在 `layout.json` 之外硬编码文字（否则 `layout.json` 与画面不一致，审核会误判）
