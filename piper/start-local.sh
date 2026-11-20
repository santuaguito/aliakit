#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
VENV="$ROOT_DIR/.piper-venv"
MODEL_DIR="$ROOT_DIR/piper/models"

if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
fi

"$VENV/bin/python" -m pip install -r "$ROOT_DIR/piper/requirements.txt"
"$VENV/bin/python" -m piper.download_voices --download-dir "$MODEL_DIR" en_GB-alba-medium es_AR-daniela-high
exec "$VENV/bin/python" -m piper.http_server --host 127.0.0.1 --port 5000 --data-dir "$MODEL_DIR" -m en_GB-alba-medium
