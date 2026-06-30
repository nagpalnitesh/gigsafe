#!/bin/bash
# GigSafe Interactive Demo Recorder

set -e

DISPLAY_NUM=99
OUTPUT_DIR="/home/ubuntu/gigsafe/scripts/demo-video"
RAW="$OUTPUT_DIR/interactive-raw.mp4"
INTRO="$OUTPUT_DIR/intro-v2.mp4"
OUTRO="$OUTPUT_DIR/outro-v2.mp4"
FINAL="$OUTPUT_DIR/gigsafe-interactive-demo.mp4"

echo "🎬 GigSafe Interactive Demo"
echo "==========================="
echo "10 scenes covering full product flow"

pkill -f "Xvfb :$DISPLAY_NUM" 2>/dev/null || true
sleep 0.5

echo "[1/5] Virtual display..."
Xvfb :$DISPLAY_NUM -screen 0 1920x1080x24 -ac +extension GLX 2>/dev/null &
XVFB_PID=$!
sleep 2

echo "[2/5] Recording..."
DISPLAY=:$DISPLAY_NUM ffmpeg -y \
  -f x11grab -video_size 1920x1080 -framerate 30 \
  -i :$DISPLAY_NUM \
  -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 20 \
  "$RAW" -loglevel error &
FFMPEG_PID=$!
sleep 1

echo "[3/5] Demo automation (10 scenes)..."
DISPLAY=:$DISPLAY_NUM node "$OUTPUT_DIR/demo-interactive.js" 2>&1
echo "      Done"

sleep 1
kill -SIGTERM $FFMPEG_PID 2>/dev/null || true
wait $FFMPEG_PID 2>/dev/null || true
kill $XVFB_PID 2>/dev/null || true

echo "[4/5] Title cards..."

ffmpeg -y -f lavfi -i "color=c=0x030712:s=1920x1080:d=6" \
  -vf "drawtext=text='GigSafe':fontcolor=0x10b981:fontsize=110:x=(w-text_w)/2:y=(h/2)-110:font=monospace:borderw=2:bordercolor=0x065f46,\
drawtext=text='Trustless Freelance Escrow on Solana':fontcolor=0xffffff:fontsize=40:x=(w-text_w)/2:y=(h/2)+5:font=monospace,\
drawtext=text='0.5%% fees  |  Instant payouts  |  AI dispute resolution':fontcolor=0x6b7280:fontsize=26:x=(w-text_w)/2:y=(h/2)+65:font=monospace,\
drawtext=text='Program: 2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4':fontcolor=0x374151:fontsize=17:x=(w-text_w)/2:y=(h/2)+130:font=monospace,\
drawtext=text='Solana Frontier Hackathon  2026':fontcolor=0x4b5563:fontsize=22:x=(w-text_w)/2:y=(h/2)+175:font=monospace" \
  -c:v libx264 -pix_fmt yuv420p "$INTRO" -loglevel error

ffmpeg -y -f lavfi -i "color=c=0x030712:s=1920x1080:d=7" \
  -vf "drawtext=text='Try GigSafe Today':fontcolor=0x10b981:fontsize=72:x=(w-text_w)/2:y=(h/2)-100:font=monospace:borderw=2:bordercolor=0x065f46,\
drawtext=text='gigsafe.wildsnap.in':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=(h/2):font=monospace,\
drawtext=text='Devnet live  ·  Connect Phantom  ·  Start free':fontcolor=0x6b7280:fontsize=26:x=(w-text_w)/2:y=(h/2)+75:font=monospace,\
drawtext=text='@nagpalnitesh  |  @pixxmo  |  Solana Frontier 2026':fontcolor=0x4b5563:fontsize=22:x=(w-text_w)/2:y=(h/2)+130:font=monospace" \
  -c:v libx264 -pix_fmt yuv420p "$OUTRO" -loglevel error

echo "[5/5] Assembling..."
cat > /tmp/concat-v2.txt << EOF
file '$INTRO'
file '$RAW'
file '$OUTRO'
EOF

ffmpeg -y -f concat -safe 0 -i /tmp/concat-v2.txt \
  -c:v libx264 -pix_fmt yuv420p -preset slow -crf 18 \
  "$FINAL" -loglevel error

rm -f "$INTRO" "$OUTRO" "$RAW" /tmp/concat-v2.txt

if [ -f "$FINAL" ]; then
  SIZE=$(du -h "$FINAL" | cut -f1)
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FINAL" 2>/dev/null | cut -d. -f1)
  echo ""
  echo "✅ gigsafe-interactive-demo.mp4"
  echo "   Size: $SIZE | Duration: ${DUR}s (~$(( DUR / 60 ))m $(( DUR % 60 ))s)"
else
  echo "❌ Failed"
  exit 1
fi
