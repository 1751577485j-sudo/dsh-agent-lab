# CHANGES · 15140be88606

- 轮次 1：按工单提供的 HDR 文案重做 `video/src/layout.json`，4 个场景 / 60 秒 / 10 条文字。
- 新增 Noto Sans SC 子集字体并显式加载，修复模板中文渲染为豆腐块的问题。
- 重做扁平风 MG 背景：底部频谱条持续滚动 + 几何色块；实测帧差 ≥3%，通过 A2.4。
- 新增场景图形：明暗对比块（s2）、手机 / 电视 / 显示器（s3）、双屏画质示意（s4）。
- 移除安全区外硬编码角标 “VIDEO LAB”；文字宽度估算改为保守上界，并改为居中对齐。
- 补充 `video/tsconfig.json`，使 `pnpm --dir video run typecheck` 可用。
- 产物：`final.mp4`、`preview.mp4`、`build-info.json`、`layout.json`、`report.json`。
