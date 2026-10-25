import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de Texto a Voz (TTS) para ALIAKIT
 * Utiliza Azure AI Speech con la voz neuronal multilingüe 'en-US-JennyMultilingualNeural'.
 * Jenny Multilingual puede leer español e inglés en una sola síntesis sin cambiar de voz.
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

/**
 * Detecta el idioma predominante del texto para el atributo xml:lang del SSML.
 * Jenny Multilingual adaptará su pronunciación automáticamente para ambos idiomas.
 */
function detectLang(text: string): string {
  const spanishMarkers =
    /\b(el|la|los|las|un|una|que|de|en|y|es|son|con|para|por|del|al|se|su|no|sí|más|pero|como|este|esta|lo|le|yo|vos|te|mi|tu|qué|cómo|leé|respondé|escribí|revisá|buscá|hacé|primero|después)\b/gi;
  const englishMarkers =
    /\b(the|a|an|is|are|was|were|and|or|but|for|in|on|at|to|of|that|this|with|read|write|answer|complete|explain|find|identify|what|how|where|when|sentences|paragraph|text|questions)\b/gi;

  const spanishCount = (text.match(spanishMarkers) || []).length;
  const englishCount = (text.match(englishMarkers) || []).length;

  return englishCount > spanishCount ? 'en-US' : 'es-AR';
}

export async function GET() {
  const speechKey = getServerEnv('SPEECH_KEY') || getServerEnv('AZURE_SPEECH_KEY');
  const speechRegion = getServerEnv('SPEECH_REGION') || getServerEnv('AZURE_SPEECH_REGION');

  return NextResponse.json({
    configured: Boolean(speechKey && speechRegion),
    voice: 'en-US-JennyMultilingualNeural',
    languages: ['es-AR', 'en-US'],
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

    // Detectar idioma predominante para el atributo xml:lang raíz
    const rootLang = detectLang(text);

    /**
     * SSML para Jenny Multilingual.
     * - La voz en-US-JennyMultilingualNeural puede pronunciar español e inglés dentro de la
     *   misma síntesis sin cambiar de voz ni fragmentar el audio.
     * - Usamos xml:lang en el nodo <speak> con el idioma detectado como predominante.
     * - Jenny adapta la pronunciación de cada palabra automáticamente (multilingüe nativo).
     */
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${rootLang}'>
  <voice name='en-US-JennyMultilingualNeural'>
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
          {
            error:
              'Límite de solicitudes del servicio de voz alcanzado. Intentá en unos segundos.',
          },
          { status: 429 }
        );
      }

      // Loguear solo el status code, nunca el body ni las credenciales
      console.error('[TTS] Azure Speech error status:', response.status);

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
