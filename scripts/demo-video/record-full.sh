#!/bin/bash
# GigSafe Full Demo Video Recorder with captions

set -e

DISPLAY_NUM=99
OUTPUT_DIR="/home/ubuntu/gigsafe/scripts/demo-video"
DEMO_RAW="$OUTPUT_DIR/demo-raw.mp4"
INTRO_FILE="$OUTPUT_DIR/intro-full.mp4"
OUTRO_FILE="$OUTPUT_DIR/outro-full.mp4"
FINAL_OUTPUT="$OUTPUT_DIR/gigsafe-demo-final.mp4"

echo "🎬 GigSafe Full Demo Video Recorder"
echo "====================================="

# Kill existing Xvfb
pkill -f "Xvfb :$DISPLAY_NUM" 2>/dev/null || true
sleep 0.5

# Start virtual display
echo "[1/5] Starting virtual display..."
Xvfb :$DISPLAY_NUM -screen 0 1920x1080x24 -ac +extension GLX 2>/dev/null &
XVFB_PID=$!
sleep 2
echo "      Done (PID: $XVFB_PID)"

# Start recording
echo "[2/5] Starting recording..."
DISPLAY=:$DISPLAY_NUM ffmpeg -y \
  -f x11grab \
  -video_size 1920x1080 \
  -framerate 30 \
  -i :$DISPLAY_NUM \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -preset ultrafast \
  -crf 20 \
  "$DEMO_RAW" -loglevel error &
FFMPEG_PID=$!
sleep 1
echo "      Done (PID: $FFMPEG_PID)"

# Run automation
echo "[3/5] Running demo..."
DISPLAY=:$DISPLAY_NUM node "$OUTPUT_DIR/demo-full.js" 2>&1
echo "      Done"

# Stop recording
sleep 1
kill -SIGTERM $FFMPEG_PID 2>/dev/null || true
wait $FFMPEG_PID 2>/dev/null || true
kill $XVFB_PID 2>/dev/null || true

echo "[4/5] Creating title cards..."

# Intro (5s)
ffmpeg -y -f lavfi -i "color=c=0x030712:s=1920x1080:d=5" \
  -vf "drawtext=text='GigSafe':fontcolor=0x10b981:fontsize=100:x=(w-text_w)/2:y=(h/2)-90:font=monospace,\
drawtext=text='Trustless Freelance Escrow on Solana':fontcolor=0xffffff:fontsize=38:x=(w-text_w)/2:y=(h/2)+10:font=monospace,\
drawtext=text='0.5%% fees  ·  Instant payouts  ·  AI disputes':fontcolor=0x6b7280:fontsize=26:x=(w-text_w)/2:y=(h/2)+70:font=monospace,\
drawtext=text='Built for Solana Frontier Hackathon 2026':fontcolor=0x4b5563:fontsize=20:x=(w-text_w)/2:y=(h/2)+130:font=monospace" \
  -c:v libx264 -pix_fmt yuv420p "$INTRO_FILE" -loglevel error

# Outro (6s)
ffmpeg -y -f lavfi -i "color=c=0x030712:s=1920x1080:d=6" \
  -vf "drawtext=text='Try GigSafe Free Today':fontcolor=0x10b981:fontsize=64:x=(w-text_w)/2:y=(h/2)-90:font=monospace,\
drawtext=text='gigsafe.wildsnap.in':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=(h/2):font=monospace,\
drawtext=text='Program: 2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4':fontcolor=0x4b5563:fontsize=18:x=(w-text_w)/2:y=(h/2)+80:font=monospace,\
drawtext=text='@nagpalnitesh  |  Solana Frontier Hackathon 2026':fontcolor=0x6b7280:fontsize=22:x=(w-text_w)/2:y=(h/2)+130:font=monospace" \
  -c:v libx264 -pix_fmt yuv420p "$OUTRO_FILE" -loglevel error

echo "[5/5] Assembling final video..."

# Concat
cat > /tmp/concat-full.txt << EOF
file '$INTRO_FILE'
file '$DEMO_RAW'
file '$OUTRO_FILE'
EOF

ffmpeg -y -f concat -safe 0 -i /tmp/concat-full.txt \
  -c:v libx264 -pix_fmt yuv420p -preset slow -crf 18 \
  "$FINAL_OUTPUT" -loglevel error

# Cleanup temp
rm -f "$INTRO_FILE" "$OUTRO_FILE" "$DEMO_RAW" 2>/dev/null

# Report
if [ -f "$FINAL_OUTPUT" ]; then
  SIZE=$(du -h "$FINAL_OUTPUT" | cut -f1)
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FINAL_OUTPUT" 2>/dev/null | cut -d. -f1)
  echo ""
  echo "✅ Demo video: $FINAL_OUTPUT"
  echo "   Size: $SIZE | Duration: ${DUR}s"
else
  echo "❌ Failed"
  exit 1
fi
