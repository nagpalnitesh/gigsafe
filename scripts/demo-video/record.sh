#!/bin/bash
# GigSafe Demo Video Recorder
# Uses Xvfb virtual display + Puppeteer automation + ffmpeg recording

set -e

DISPLAY_NUM=99
OUTPUT_DIR="/home/ubuntu/gigsafe/scripts/demo-video"
VIDEO_OUTPUT="$OUTPUT_DIR/gigsafe-demo.mp4"
SCRIPT_DIR="$OUTPUT_DIR"

echo "🎬 GigSafe Demo Video Recorder"
echo "================================"

# Kill any existing Xvfb on this display
pkill -f "Xvfb :$DISPLAY_NUM" 2>/dev/null || true
sleep 0.5

# Start virtual display (1920x1080, 24-bit color)
echo "[1/4] Starting virtual display..."
Xvfb :$DISPLAY_NUM -screen 0 1920x1080x24 -ac &
XVFB_PID=$!
sleep 2
echo "      Virtual display started (PID: $XVFB_PID)"

# Start ffmpeg recording in background
echo "[2/4] Starting screen recording..."
DISPLAY=:$DISPLAY_NUM ffmpeg -y \
  -f x11grab \
  -video_size 1920x1080 \
  -framerate 30 \
  -i :$DISPLAY_NUM \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -preset ultrafast \
  -crf 18 \
  "$VIDEO_OUTPUT" \
  -loglevel error &
FFMPEG_PID=$!
sleep 1
echo "      Recording started (PID: $FFMPEG_PID)"

# Run the Puppeteer automation script
echo "[3/4] Running demo automation..."
DISPLAY=:$DISPLAY_NUM node "$SCRIPT_DIR/demo.js" 2>&1
echo "      Demo automation complete"

# Stop ffmpeg gracefully
echo "[4/4] Finalizing video..."
sleep 1
kill -SIGTERM $FFMPEG_PID 2>/dev/null || true
wait $FFMPEG_PID 2>/dev/null || true

# Stop Xvfb
kill $XVFB_PID 2>/dev/null || true

# Check result
if [ -f "$VIDEO_OUTPUT" ]; then
  SIZE=$(du -h "$VIDEO_OUTPUT" | cut -f1)
  DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO_OUTPUT" 2>/dev/null | cut -d. -f1)
  echo ""
  echo "✅ Demo video created!"
  echo "   File: $VIDEO_OUTPUT"
  echo "   Size: $SIZE"
  echo "   Duration: ${DURATION}s"
else
  echo "❌ Video not created"
  exit 1
fi
