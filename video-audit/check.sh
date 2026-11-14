#!/usr/bin/env bash
# 视频审核检查器 · 对应《视频制作通用审核规范 v1.2》
#
# 用法：
#   ./check.sh out/final.mp4                      # 只做规格与画面检查
#   ./check.sh out/final.mp4 --ocr                # 增加文字区域/字号/对比度检查
#   ./check.sh out/final.mp4 --ocr --build-info ../build-info.json
#
# 退出码：0 = 全部通过；1 = 有未通过项；2 = 执行错误
set -uo pipefail

VIDEO=""; SPEC="$(dirname "$0")/spec.json"; OUT="report.json"; OCR=""; BUILDINFO=""; COMMIT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --spec) SPEC="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --ocr) OCR="--ocr"; shift ;;
    --build-info) BUILDINFO="$2"; shift 2 ;;
    --commit) COMMIT="$2"; shift 2 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) VIDEO="$1"; shift ;;
  esac
done

if [ -z "$VIDEO" ] || [ ! -f "$VIDEO" ]; then
  echo "usage: check.sh <video.mp4> [--ocr] [--spec spec.json] [--out report.json]" >&2
  exit 2
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# ---------- 1. build-info 版本对应（规范第 6 节） ----------
if [ -n "$BUILDINFO" ] && [ -f "$BUILDINFO" ]; then
  BI_COMMIT=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('commit',''))" "$BUILDINFO")
  if [ -n "$COMMIT" ] && [ "$BI_COMMIT" != "$COMMIT" ]; then
    echo "BUILD-INFO MISMATCH: build-info.commit=$BI_COMMIT, workspace=$COMMIT" >&2
    echo '{"version":"1.2","verdict":"fail","failed":1,"items":[{"id":"A0.1","pass":false,"value":"'"$BI_COMMIT"'","threshold":"'"$COMMIT"'","detail":"成片不是最新提交渲染的，直接退回"}]}' > "$OUT"
    exit 1
  fi
fi

# ---------- 2. ffprobe ----------
ffprobe -v error -print_format json -show_format -show_streams "$VIDEO" > "$WORK/probe.json" 2>/dev/null
if [ ! -s "$WORK/probe.json" ]; then
  echo "ffprobe failed: $VIDEO" >&2
  exit 2
fi

# ---------- 3. 抽帧（全分辨率，每 frameStepSec 一帧） ----------
STEP=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['sampling']['frameStepSec'])" "$SPEC")
mkdir -p "$WORK/frames"
ffmpeg -v error -i "$VIDEO" -vf "fps=1/$STEP" "$WORK/frames/f_%04d.png" -y
FRAMES=$(ls "$WORK/frames" | wc -l)
if [ "$FRAMES" -eq 0 ]; then
  echo "frame extraction produced nothing" >&2
  exit 2
fi

# ---------- 4. 帧级检查 ----------
python3 "$(dirname "$0")/check_layout.py" \
  --frames "$WORK/frames" --spec "$SPEC" --probe "$WORK/probe.json" --out "$OUT" $OCR
RC=$?

echo "--- 报告：$OUT（抽帧 $FRAMES 张，步长 ${STEP}s）---" >&2
exit $RC
