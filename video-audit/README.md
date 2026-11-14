# video-audit · 视频审核检查器

对应《视频制作通用审核规范 v1.2》。纯本地脚本，**不消耗模型 token**。

## 用法

```bash
# 只做规格 + 画面检查（快，约 5 秒）
./check.sh out/final.mp4

# 加上文字检查（OCR，约 15 秒 / 40 秒素材）
./check.sh out/final.mp4 --ocr

# 检查成片是否由最新提交渲染
./check.sh out/final.mp4 --ocr --build-info out/build-info.json --commit $(git rev-parse --short HEAD)
```

退出码：`0` 全部通过 / `1` 有未通过项 / `2` 执行错误。报告写入 `report.json`。

## 已实现的检查项

| ID | 检查 | 方法 | 状态 |
| --- | --- | --- | --- |
| A1.1 | 分辨率 1920×1080 | ffprobe | ✅ 稳定 |
| A1.2 | 帧率 30fps | ffprobe | ✅ 稳定 |
| A1.3 | 时长 54–66s | ffprobe | ✅ 稳定 |
| A1.7 | 无音频流 | ffprobe | ✅ 稳定 |
| A2.1 | 首帧非黑 | 抽帧亮度 | ✅ 稳定 |
| A2.2 | 无连续黑帧 | 抽帧亮度 | ✅ 稳定 |
| A2.4 | 背景持续动态 | 相邻帧差异率，5 秒窗口 | ✅ 稳定 |
| A4.1 | 文字在安全区内 | tesseract OCR 取框 | ⚠️ 有误报，见下 |
| A5.3 | 字号 ≥ 40px | OCR 框高 × 0.7 | ⚠️ 有误报，见下 |
| A4.6 | 文字对比度 | OCR 框内 5%/95% 分位亮度 | ⚠️ 有误报，见下 |

## 已知限制（重要）

**OCR 在扁平 MG 背景上会产生误报。** 装饰性图形经常被识别成文字，导致：
- 误报“文字越界”（贴着画面边缘的图形被当成文字）
- 误报“字号过小”（识别到 6–12px 的“字符”）
- 误报“对比度不足”（把色块边缘当成文字）

当前已加过滤：置信度 ≥60、框高 ≥12px、必须含中英文数字。仍不够。

**推荐的根治方案：不要 OCR，让工程自己报坐标。**

Remotion 是代码生成的，文字位置在渲染时是已知的。在工程里加一个 audit 渲染模式，把每个文字元素的 bbox 导出成 `layout.json`：

```json
[{"t": 12.4, "text": "降噪 50dB", "box": [160, 220, 1180, 96], "fontSize": 96}]
```

检查器直接读这个文件，**精确到像素，零误报**。代价是要在工程里加约 20 行代码。

## 依赖

```
ffmpeg / ffprobe 6.1
tesseract-ocr 5.3 + chi_sim
python3 + numpy + Pillow
```

## 目录

```
spec.json        阈值配置（改这里，不改代码）
check.sh         入口：ffprobe → 抽帧 → 调用 check_layout.py
check_layout.py  帧级检查实现
```
