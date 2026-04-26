#!/usr/bin/env bash
# Memo Price - stop server (macOS / Linux)
PID=$(lsof -ti :8765 2>/dev/null)
if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null && echo "Serveur arrête (PID $PID)."
else
  echo "Aucun serveur sur le port 8765."
fi
