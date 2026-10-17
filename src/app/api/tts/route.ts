import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de Texto a Voz (TTS) para ALIAKIT
 * Utiliza Azure AI Speech con la voz neuronal argentina 'es-AR-ElenaNeural'.
 * Las credenciales residen exclusivamente en el servidor.
 */

import { getServerEnv } from '@/lib/serverEnv';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const speechKey = getServerEnv('SPEECH_KEY') || getServerEnv('AZURE_SPEECH_KEY');
  const speechRegion = getServerEnv('SPEECH_REGION') || getServerEnv('AZURE_SPEECH_REGION');

  return NextResponse.json({
    configured: Boolean(speechKey && speechRegion),
    voice: 'es-AR-ElenaNeural',
    language: 'es-AR',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, speed = 1.0 } = body;

    // Validación de texto de entrada
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'El texto a sintetizar no puede estar vacío.' },
        { status: 400 }
      );
    }

    if (text.length > 4000) {
      return NextResponse.json(
        { error: 'El texto excede el límite máximo permitido (4000 caracteres).' },
        { status: 400 }
      );
    }

    // Extracción segura de credenciales en el servidor
    const speechKey = getServerEnv('SPEECH_KEY') || getServerEnv('AZURE_SPEECH_KEY');
    const speechRegion = getServerEnv('SPEECH_REGION') || getServerEnv('AZURE_SPEECH_REGION');

    if (!speechKey || !speechRegion) {
      return NextResponse.json(
        {
          error:
            'El servicio de Azure Speech no está configurado en el servidor. Verificá SPEECH_KEY y SPEECH_REGION.',
        },
        { status: 503 }
      );
    }

    // Cálculo de velocidad para SSML (-25% para 0.75x, +0% para 1.0x, +25% para 1.25x)
    const normalizedSpeed = Math.max(0.5, Math.min(2.0, Number(speed) || 1.0));
    const ratePercent = Math.round((normalizedSpeed - 1) * 100);
    const rateString = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

    const escapedText = escapeXml(text.trim());

    // Construcción del SSML oficial para Azure AI Speech
    const ssml = `<speak version='1.0' xml:lang='es-AR'>
  <voice xml:lang='es-AR' xml:gender='Female' name='es-AR-ElenaNeural'>
    <prosody rate='${rateString}'>
      ${escapedText}
    </prosody>
  </voice>
</speak>`;

    const azureUrl = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'ALIAKIT-Edu-App',
      },
      body: ssml,
    });

    if (!response.ok) {
      // Manejo seguro de errores sin revelar tokens ni datos sensibles
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'Error de autenticación con el servicio de voz de Azure.' },
          { status: 502 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Límite de solicitudes del servicio de voz alcanzado. Intentá en unos segundos.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'No se pudo generar el audio con Azure Speech en este momento.' },
        { status: 502 }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno al comunicarse con el servicio de voz.' },
      { status: 500 }
    );
  }
}
