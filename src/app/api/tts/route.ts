import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/serverEnv';

export const runtime = 'nodejs';

const SPANISH_VOICE = 'es_AR-daniela-high';
const ENGLISH_VOICE = 'en_GB-alba-medium';

function detectVoice(text: string): string {
  const spanishWords = /\b(el|la|los|las|un|una|que|de|en|y|es|son|con|para|por|del|al|se|su|no|sí|más|pero|como|este|esta|lo|le|yo|vos|te|mi|tu|qué|cómo|leé|respondé|escribí|revisá|buscá|hacé|primero|después|elegí|ordená)\b/gi;
  const englishWords = /\b(the|a|an|is|are|was|were|and|or|but|for|in|on|at|to|of|that|this|with|read|write|answer|complete|explain|find|identify|what|how|where|when|sentences|paragraph|text|questions)\b/gi;
  return (text.match(englishWords) || []).length > (text.match(spanishWords) || []).length
    ? ENGLISH_VOICE
    : SPANISH_VOICE;
}

export async function GET() {
  const piperUrl = getServerEnv('PIPER_URL') || 'http://127.0.0.1:5000';
  try {
    const response = await fetch(`${piperUrl.replace(/\/$/, '')}/info`, { signal: AbortSignal.timeout(3000) });
    return NextResponse.json({
      configured: response.ok,
      voices: { es_AR: SPANISH_VOICE, en_GB: ENGLISH_VOICE },
    }, { status: response.ok ? 200 : 503 });
  } catch {
    return NextResponse.json({
      configured: false,
      voices: { es_AR: SPANISH_VOICE, en_GB: ENGLISH_VOICE },
      error: 'El servicio de voz Piper no está disponible.',
    }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { text, speed = 1 } = body;

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'El texto a sintetizar no puede estar vacío.' }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: 'El texto excede el límite máximo permitido (4000 caracteres).' }, { status: 400 });
  }

  const normalizedSpeed = Math.max(0.5, Math.min(2, Number(speed) || 1));
  const piperUrl = (getServerEnv('PIPER_URL') || 'http://127.0.0.1:5000').replace(/\/$/, '');

  try {
    const response = await fetch(`${piperUrl}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        voice: detectVoice(text),
        length_scale: 1 / normalizedSpeed,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      console.error('[TTS] Piper returned status:', response.status);
      return NextResponse.json({ error: 'Piper no pudo generar el audio.' }, { status: 502 });
    }

    return new Response(await response.arrayBuffer(), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con Piper. Comprobá que el servicio esté iniciado.' }, { status: 503 });
  }
}
