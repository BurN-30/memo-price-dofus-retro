#!/usr/bin/env bash
# Memo Price - serveur local (macOS / Linux)
cd "$(dirname "$0")" || exit 1
echo
echo "  ============================================="
echo "    Memo Price - serveur local"
echo "  ============================================="
echo
echo "    URL    :  http://127.0.0.1:8765/"
echo "    Stop   :  Ctrl+C ici, ou ./stop.sh"
echo
echo "  ============================================="
echo
PYTHON="$(command -v python3 || command -v python)"
if [ -z "$PYTHON" ]; then
  echo "  ERREUR : python introuvable. Installe Python 3.8+ d'abord."
  exit 1
fi
"$PYTHON" serve.py
