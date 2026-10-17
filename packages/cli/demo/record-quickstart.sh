#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."

frames=$(mktemp -d "${TMPDIR:-/tmp}/zaly-recording.XXXXXX")
trap 'rm -rf "$frames"' EXIT

mkdir -p docs/public/demos
export ZALY_DEMO_CAST="$frames/quickstart.cast"
{
  printf 'Output "%s/frames/"\n' "$frames"
  sed '/^Output /d' packages/cli/demo/quickstart.tape
} | vhs
bun packages/cli/demo/cast.ts "$ZALY_DEMO_CAST" docs/public/demos/quickstart.cast

# VHS's default WebM uses lossy 4:2:0 encoding, which softens colored text.
# Encode the original text/cursor frames losslessly with full chroma resolution.
ffmpeg -hide_banner -loglevel error -y \
  -framerate 30 -start_number 1 -i "$frames/frames/frame-text-%05d.png" \
  -framerate 30 -start_number 1 -i "$frames/frames/frame-cursor-%05d.png" \
  -filter_complex '[0:v][1:v]overlay=format=auto,format=yuv444p,pad=1800:1200:(ow-iw)/2:(oh-ih)/2:color=0x16161e' \
  -c:v libvpx-vp9 -lossless 1 -b:v 0 -an \
  docs/public/demos/quickstart.webm
