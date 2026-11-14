#!/usr/bin/env python3
"""Frame-level checks for the video audit spec v1.2.

Checks implemented (pixel side):
  A2.1 first frame not black
  A2.2 no black run
  A2.4 background motion (frame diff)
  A4.1 text safe area  (OCR based)
  A4.6 contrast        (OCR box based, approximate)
  A5.3 min font size   (OCR box height based, approximate)

Exit code 0 when every hard check passes, 1 otherwise, 2 on error.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image


def luma(img: np.ndarray) -> np.ndarray:
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def load_frames(frame_dir: str) -> list[tuple[str, np.ndarray]]:
    files = sorted(f for f in os.listdir(frame_dir) if f.lower().endswith(".png"))
    out = []
    for f in files:
        path = os.path.join(frame_dir, f)
        out.append((f, np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)))
    return out


def ocr_words(path: str) -> list[dict]:
    """Return word boxes via tesseract TSV (chi_sim+eng)."""
    with tempfile.TemporaryDirectory() as td:
        base = os.path.join(td, "o")
        subprocess.run(
            ["tesseract", path, base, "-l", "chi_sim+eng", "--psm", "11", "tsv"],
            check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        tsv = base + ".tsv"
        if not os.path.exists(tsv):
            return []
        rows = open(tsv, encoding="utf-8", errors="replace").read().splitlines()[1:]
    words = []
    for line in rows:
        p = line.split("\t")
        if len(p) < 12:
            continue
        text = p[11].strip()
        if not text:
            continue
        try:
            left, top, w, h = int(p[6]), int(p[7]), int(p[8]), int(p[9])
            conf = float(p[10])
        except ValueError:
            continue
        if conf < 60 or w < 8 or h < 12:
            continue
        if not re.search(r"[\u4e00-\u9fffA-Za-z0-9]", text):
            continue
        words.append({"text": text, "x": left, "y": top, "w": w, "h": h, "conf": conf})
    return words


def box_contrast(img: np.ndarray, box: dict) -> float:
    """Approximate WCAG contrast inside a text box (5th vs 95th percentile luma)."""
    y0, x0 = max(0, box["y"]), max(0, box["x"])
    y1, x1 = min(img.shape[0], box["y"] + box["h"]), min(img.shape[1], box["x"] + box["w"])
    if y1 <= y0 or x1 <= x0:
        return 0.0
    patch = luma(img[y0:y1, x0:x1]) / 255.0
    lo, hi = np.percentile(patch, 5), np.percentile(patch, 95)

    def rel(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    l1, l2 = rel(float(hi)), rel(float(lo))
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", required=True)
    ap.add_argument("--spec", required=True)
    ap.add_argument("--probe", required=True, help="ffprobe json path")
    ap.add_argument("--out", required=True)
    ap.add_argument("--ocr", action="store_true", help="enable OCR based checks")
    ap.add_argument("--layout", help="out/layout.json emitted by the render script (exact boxes, preferred over OCR)")
    ap.add_argument("--target-duration", type=float, default=None,
                    help="expected duration in seconds; omitted -> fall back to spec default")
    args = ap.parse_args()

    spec = json.load(open(args.spec, encoding="utf-8"))
    probe = json.load(open(args.probe, encoding="utf-8"))

    W = spec["canvas"]["width"]
    H = spec["canvas"]["height"]
    step = spec["sampling"]["frameStepSec"]
    ocr_step = spec["sampling"]["ocrStepSec"]
    tol = spec["tolerance"]["edgePx"]
    safe = spec["safeArea"]
    typ = spec["typography"]
    bg = spec["background"]

    frames = load_frames(args.frames)
    if not frames:
        print("no frames", file=sys.stderr)
        return 2

    items: list[dict] = []
    failed = 0

    # ---- A1 container and stream spec
    streams = probe.get("streams", [])
    vs = next((s for s in streams if s.get("codec_type") == "video"), {})
    audio_streams = [s for s in streams if s.get("codec_type") == "audio"]
    dur = float(probe.get("format", {}).get("duration") or 0)
    width, height = int(vs.get("width") or 0), int(vs.get("height") or 0)
    try:
        num, den = (vs.get("r_frame_rate") or "0/1").split("/")
        fps = float(num) / float(den) if float(den) else 0.0
    except ValueError:
        fps = 0.0

    ok = width == W and height == H
    items.append({"id": "A1.1", "pass": ok, "value": f"{width}x{height}",
                  "threshold": f"{W}x{H}", "detail": "分辨率"})
    failed += 0 if ok else 1

    ok = abs(fps - spec["canvas"]["fps"]) < 0.01
    items.append({"id": "A1.2", "pass": ok, "value": round(fps, 2),
                  "threshold": spec["canvas"]["fps"], "detail": "帧率"})
    failed += 0 if ok else 1

    ok = True
    dur_spec = spec["duration"]
    target = args.target_duration
    if target is None:
        target = dur_spec.get("defaultTargetSec")
    tol = float(dur_spec.get("tolerancePct", 0.1))
    if target:
        ok = abs(dur - float(target)) <= float(target) * tol
        threshold = f"{target}±{tol*100:.0f}%"
        detail = "时长（对照目标时长）"
    else:
        ok = dur_spec["sanityMinSec"] <= dur <= dur_spec["sanityMaxSec"]
        threshold = f"{dur_spec['sanityMinSec']}–{dur_spec['sanityMaxSec']}s"
        detail = "时长（仅合理性区间）"
    items.append({"id": "A1.3", "pass": ok, "value": round(dur, 2),
                  "threshold": threshold, "detail": detail})
    failed += 0 if ok else 1

    if spec["audio"].get("requireNone", True):
        ok = len(audio_streams) == 0
        items.append({"id": "A1.7", "pass": ok, "value": len(audio_streams),
                      "threshold": "0 条音频流", "detail": "音频流数量"})
        failed += 0 if ok else 1

    # ---- A2.1 first frame not black
    first_luma = float(luma(frames[0][1]).mean())
    ok = first_luma > spec["blackFrame"]["lumaBelow"]
    items.append({"id": "A2.1", "pass": ok, "value": round(first_luma, 1),
                  "threshold": f">{spec['blackFrame']['lumaBelow']}",
                  "detail": "首帧亮度"})
    failed += 0 if ok else 1

    # ---- A2.2 black runs
    lumas = [float(luma(f).mean()) for _, f in frames]
    below = spec["blackFrame"]["lumaBelow"]
    need = spec["blackFrame"]["minConsecutive"]
    run = best = 0
    for v in lumas:
        run = run + 1 if v < below else 0
        best = max(best, run)
    ok = best < need
    items.append({"id": "A2.2", "pass": ok, "value": best,
                  "threshold": f"<{need} 连续黑帧", "detail": "最长连续黑帧数"})
    failed += 0 if ok else 1

    # ---- A2.4 background motion (per window, no scene map -> whole video in 5s windows)
    window = max(2, int(round(5.0 / step)))
    diffs = []
    for i in range(1, len(frames)):
        a, b = frames[i - 1][1], frames[i][1]
        diffs.append(float(np.abs(a - b).mean() / 255.0))
    windows = []
    for start in range(0, len(diffs), window):
        chunk = diffs[start:start + window]
        if not chunk:
            continue
        windows.append({"t": round((start + 1) * step, 1), "diff": round(float(np.mean(chunk)), 4)})
    static = [w for w in windows if w["diff"] < bg["frameDiffMin"]]
    static_pct = len(static) / len(windows) if windows else 0.0
    ok = static_pct <= bg["staticCheckpointMaxPct"]
    items.append({"id": "A2.4", "pass": ok,
                  "value": round(static_pct * 100, 1),
                  "threshold": f"静止窗口占比 ≤{bg['staticCheckpointMaxPct']*100:.0f}%",
                  "detail": "背景动态（按 5 秒窗口）",
                  "windows": windows})
    failed += 0 if ok else 1

    # ---- exact box checks (preferred: boxes come from the render itself)
    if args.layout:
        lay = json.load(open(args.layout, encoding="utf-8"))
        top_min = safe["topPct"] * H
        bot_max = H - safe["bottomPct"] * H
        left_min = safe["leftPx"]
        right_max = W - safe["rightPx"]

        worst_margin = None
        min_font = None
        worst_contrast = None

        for box in lay.get("boxes", []):
            margin = min(
                box["y"] - top_min,
                bot_max - (box["y"] + box["h"]),
                box["x"] - left_min,
                right_max - (box["x"] + box["w"]),
            )
            if worst_margin is None or margin < worst_margin["margin"]:
                worst_margin = {"id": box["id"], "text": box["text"], "margin": round(margin, 1),
                                "box": [box["x"], box["y"], box["w"], box["h"]], "t": round((box["from"] + box["to"]) / 2 * step, 1)}
            if min_font is None or box["fontSize"] < min_font["fontSize"]:
                min_font = {"id": box["id"], "text": box["text"], "fontSize": box["fontSize"]}

            # contrast measured on the frame closest to the middle of its visible window
            mid = (box["from"] + box["to"]) / 2
            fps = spec["canvas"]["fps"]
            idx = min(len(frames) - 1, max(0, int(round(mid / fps / step))))
            c = box_contrast(frames[idx][1], box)
            if worst_contrast is None or c < worst_contrast["contrast"]:
                worst_contrast = {"id": box["id"], "text": box["text"], "contrast": round(c, 2)}

        if worst_margin:
            ok = worst_margin["margin"] >= -tol
            items.append({"id": "A4.1", "pass": ok, "value": worst_margin["margin"],
                          "threshold": f"≥{-tol} 像素（负值=越界）",
                          "detail": f"文字距安全区最小余量（{worst_margin['text']}）",
                          "worst": worst_margin, "source": "layout.json"})
            failed += 0 if ok else 1

        if min_font:
            ok = min_font["fontSize"] >= typ["minFontPx"]
            items.append({"id": "A5.3", "pass": ok, "value": min_font["fontSize"],
                          "threshold": f"≥{typ['minFontPx']}px",
                          "detail": f"最小字号（{min_font['text']}）",
                          "worst": min_font, "source": "layout.json"})
            failed += 0 if ok else 1

        if worst_contrast:
            ok = worst_contrast["contrast"] >= typ["contrast"]["small"]
            items.append({"id": "A4.6", "pass": ok, "value": worst_contrast["contrast"],
                          "threshold": f"≥{typ['contrast']['small']}:1",
                          "detail": f"最低文字对比度（{worst_contrast['text']}）",
                          "worst": worst_contrast, "source": "layout.json"})
            failed += 0 if ok else 1

    # ---- OCR based checks
    elif args.ocr:
        top_min = safe["topPct"] * H
        bot_max = H - safe["bottomPct"] * H
        left_min = safe["leftPx"]
        right_max = W - safe["rightPx"]

        worst_margin = None
        min_font = None
        worst_contrast = None
        ocr_frames = 0

        for name, img in frames:
            t = float(name.split("_")[-1].split(".")[0]) * step if "_" in name else 0.0
            if (t % max(ocr_step, step)) > 1e-6:
                continue
            ocr_frames += 1
            path = os.path.join(args.frames, name)
            words = ocr_words(path)
            for w in words:
                top, bottom = w["y"], w["y"] + w["h"]
                left, right = w["x"], w["x"] + w["w"]
                margin = min(top - top_min, bot_max - bottom, left - left_min, right_max - right)
                if worst_margin is None or margin < worst_margin["margin"]:
                    worst_margin = {"t": t, "margin": round(margin, 1), "text": w["text"][:20],
                                    "box": [left, top, w["w"], w["h"]]}
                if min_font is None or w["h"] < min_font["h"]:
                    min_font = {"t": t, "h": w["h"], "text": w["text"][:20]}
                c = box_contrast(img, w)
                if worst_contrast is None or c < worst_contrast["contrast"]:
                    worst_contrast = {"t": t, "contrast": round(c, 2), "text": w["text"][:20]}

        if worst_margin:
            ok = worst_margin["margin"] >= -tol
            items.append({"id": "A4.1", "pass": ok, "value": worst_margin["margin"],
                          "threshold": f"≥{-tol} 像素（负值=越界）",
                          "detail": f"文字距安全区最小余量（{worst_margin['text']}）",
                          "worst": worst_margin, "ocrFrames": ocr_frames})
            failed += 0 if ok else 1

        if min_font:
            ok = min_font["h"] >= typ["minFontPx"] * 0.7  # cap-height ≈ 0.7em
            items.append({"id": "A5.3", "pass": ok, "value": min_font["h"],
                          "threshold": f"字高 ≥{typ['minFontPx']*0.7:.0f}px（对应 {typ['minFontPx']}px 字号）",
                          "detail": f"最小文字高度（{min_font['text']}）", "worst": min_font})
            failed += 0 if ok else 1

        if worst_contrast:
            ok = worst_contrast["contrast"] >= typ["contrast"]["small"]
            items.append({"id": "A4.6", "pass": ok, "value": worst_contrast["contrast"],
                          "threshold": f"≥{typ['contrast']['small']}:1",
                          "detail": f"最低文字对比度（{worst_contrast['text']}）", "worst": worst_contrast})
            failed += 0 if ok else 1
    else:
        items.append({"id": "A4.1/A4.6/A5.3", "pass": None, "detail": "OCR 未启用，文字相关检查跳过"})

    report = {
        "version": "1.2",
        "verdict": "pass" if failed == 0 else "fail",
        "video": {
            "durationSec": float(probe.get("format", {}).get("duration", 0)),
            "size": probe.get("format", {}).get("size"),
        },
        "failed": failed,
        "items": items,
    }
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
