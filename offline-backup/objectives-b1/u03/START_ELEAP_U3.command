#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
python3 server.py &
PID=$!
sleep 1
open "http://localhost:${PORT}/"
echo "E-LEAP Unit 3 is running. Keep this window open while teaching."
echo "Press Ctrl+C to stop."
wait $PID
