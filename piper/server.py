"""Small HTTP API for the ALIAKIT Piper service."""

import io
import os
import threading
import wave
from pathlib import Path

from flask import Flask, jsonify, request
from piper import PiperVoice, SynthesisConfig

VOICES = {
    "es_AR-daniela-high",
    "en_GB-alba-medium",
}
MODEL_DIR = Path(os.environ.get("PIPER_MODEL_DIR", "/models"))
_voices = {}
_voice_lock = threading.Lock()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024


def get_voice(voice_name):
    if voice_name not in VOICES:
        raise ValueError("Voz no permitida")

    with _voice_lock:
        voice = _voices.get(voice_name)
        if voice is None:
            model_path = MODEL_DIR / f"{voice_name}.onnx"
            if not model_path.is_file():
                raise FileNotFoundError(f"No se encontró el modelo {voice_name}")
            voice = PiperVoice.load(str(model_path))
            _voices[voice_name] = voice
        return voice


@app.get("/info")
def info():
    return jsonify({"configured": True, "voices": sorted(VOICES)})


@app.post("/synthesize")
def synthesize():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    voice_name = data.get("voice")

    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "El texto a sintetizar no puede estar vacío."}), 400
    if len(text) > 4000:
        return jsonify({"error": "El texto supera los 4000 caracteres."}), 400
    if voice_name not in VOICES:
        return jsonify({"error": "La voz solicitada no está disponible."}), 400

    try:
        speed = float(data.get("length_scale", 1.0))
        length_scale = min(2.0, max(0.5, speed))
        voice = get_voice(voice_name)
        output = io.BytesIO()
        with wave.open(output, "wb") as wav_file:
            voice.synthesize_wav(
                text.strip(),
                wav_file,
                syn_config=SynthesisConfig(length_scale=length_scale),
            )
        audio = output.getvalue()
        return app.response_class(audio, status=200, mimetype="audio/wav")
    except (TypeError, ValueError):
        return jsonify({"error": "La velocidad del audio no es válida."}), 400
    except Exception:
        app.logger.exception("Piper synthesis failed")
        return jsonify({"error": "Piper no pudo generar el audio."}), 500
