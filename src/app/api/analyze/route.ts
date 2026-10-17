import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/serverEnv';
import { PedagogicalAnalysis } from '@/types/aliakit';

/**
 * Endpoint de Análisis Inteligente Pedagógico para ALIAKIT
 * Utiliza Google Gemini API desde el servidor para interpretar el texto extraído
 * por el OCR y adaptarlo para niños de 6 a 8 años con dislexia.
 */

const SYSTEM_PROMPT = `Actuá como un asistente pedagógico experto en accesibilidad y diseño universal del aprendizaje para niños de 6 a 8 años con dislexia o dificultades de lectoescritura (enfoque escolar rioplatense - Argentina).

Tu función es analizar el texto escolar recibido (obtenido mediante OCR) y transformarlo en una explicación accesible, guiada y paso a paso.

REGLAS PEDAGÓGICAS OBLIGATORIAS:
1. TONO Y LENGUAJE:
   - Explicá SIEMPRE en español rioplatense (usá 'vos', 'tenés', 'mirá', 'completá', 'hacé', 'fijate', 'anotá').
   - Utilizá oraciones cortas, sintaxis directa y vocabulario cotidiano y claro.
   - Tono cálido, paciente y motivador. Evitá explicaciones largas o sobrecargadas.

2. TRATAMIENTO DE MATERIAS E IDIOMAS:
   - Identificá la materia probable: 'math' (Matemática), 'language' (Lengua y Literatura), 'english' (Inglés), 'natural_sciences' (Ciencias Naturales), 'social_sciences' (Ciencias Sociales), 'art' (Arte), u 'other'.
   - Identificá el idioma original del texto: 'es', 'en', u otro.
   - SI LA TAREA ES DE INGLÉS (o idioma extranjero):
     - Mantené la explicación de la consigna en español rioplatense para que el niño entienda qué le piden hacer.
     - NO resuelvas ni traduzcas las oraciones que el niño debe completar o practicar en el idioma original, para preservar el valor formativo de la actividad.

3. AUTONOMÍA SIN RESOLVER AUTOMÁTICAMENTE LA TAREA:
   - NO resuelvas toda la tarea de una vez.
   - 'simplified_instruction': Explicá con tus palabras qué hay que hacer en 1 o 2 oraciones sencillas.
   - 'steps': Proponé una lista de pasos cortos y secuenciales para que el niño avance por su cuenta (ej. 'Leé la primera palabra...', 'Buscá los números...', 'Hacé la cuenta en tu hoja...', 'Escribí la respuesta').
   - Conservá números, datos esenciales y nombres propios originales sin alterarlos.

4. INCERTIDUMBRE Y TEXTO INSUFICIENTE:
   - Si el texto está incompleto, borroso, cortado o no se entiende con certeza la consigna:
     - Establecé 'needs_confirmation': true.
     - En 'uncertainties': detallá qué parte no se entiende con amabilidad (ej. 'No se ve con claridad el segundo número de la suma').
   - NUNCA inventes números, consignas ni consignas que no existan en el texto recibido.

5. FORMATO DE SALIDA ESTRICTO:
   Devolvé ÚNICAMENTE un objeto JSON válido con este esquema exacto:
   {
     "detected_language": "es" | "en" | string,
     "additional_languages": string[],
     "explanation_language": "es-AR",
     "subject": "math" | "language" | "english" | "natural_sciences" | "social_sciences" | "art" | "other",
     "subject_label": string,
     "activity_type": string,
     "activity_type_label": string,
     "task_instruction": string,
     "simplified_instruction": string,
     "steps": string[],
     "difficult_terms": [
       { "term": string, "explanation": string }
     ],
     "uncertainties": string[],
     "needs_confirmation": boolean
   }
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text } = body;

    // Validación de entrada
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'El texto de la tarea no puede estar vacío.' },
        { status: 400 }
      );
    }

    if (text.trim().length < 3) {
      return NextResponse.json(
        { error: 'El texto es demasiado corto para poder interpretarlo.' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'El texto excede el límite máximo permitido (5000 caracteres).' },
        { status: 400 }
      );
    }

    // Extracción segura de la clave en el servidor
    const geminiKey = getServerEnv('GEMINI_API_KEY');

    if (!geminiKey) {
      return NextResponse.json(
        {
          error:
            'El servicio de Gemini no está configurado en el servidor. Verificá que GEMINI_API_KEY esté en .env.local.',
        },
        { status: 503 }
      );
    }

    const prompt = `${SYSTEM_PROMPT}\n\nTexto escolar recibido para analizar:\n"""\n${text.trim()}\n"""`;

    // Llamada segura a Gemini API (gemini-2.5-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!geminiRes.ok) {
      if (geminiRes.status === 400 || geminiRes.status === 403) {
        return NextResponse.json(
          { error: 'Error de autenticación con la API de Gemini. Verificá tu GEMINI_API_KEY.' },
          { status: 502 }
        );
      }
      if (geminiRes.status === 429) {
        return NextResponse.json(
          { error: 'Límite de uso de Gemini alcanzado temporalmente. Por favor intentá en unos segundos.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'El servicio de Gemini no está disponible en este momento. Intentá nuevamente.' },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJson) {
      return NextResponse.json(
        { error: 'No se recibió una respuesta válida de la inteligencia artificial.' },
        { status: 502 }
      );
    }

    let parsed: PedagogicalAnalysis;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return NextResponse.json(
        { error: 'La respuesta no pudo estructurarse correctamente. Intentá de nuevo.' },
        { status: 502 }
      );
    }

    // Normalización y valores seguros por defecto
    const normalizedAnalysis: PedagogicalAnalysis = {
      detected_language: parsed.detected_language || 'es',
      additional_languages: Array.isArray(parsed.additional_languages) ? parsed.additional_languages : [],
      explanation_language: 'es-AR',
      subject: parsed.subject || 'other',
      subject_label: parsed.subject_label || 'Tarea escolar',
      activity_type: parsed.activity_type || 'exercise',
      activity_type_label: parsed.activity_type_label || 'Actividad escolar',
      task_instruction: parsed.task_instruction || text.slice(0, 150),
      simplified_instruction: parsed.simplified_instruction || 'Leé la consigna con atención y seguí los pasos para resolverla.',
      steps: Array.isArray(parsed.steps) && parsed.steps.length > 0
        ? parsed.steps
        : ['Leé la consigna despacio.', 'Anotá los datos en tu hoja.', 'Respondé lo que te pide.'],
      difficult_terms: Array.isArray(parsed.difficult_terms) ? parsed.difficult_terms : [],
      uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties : [],
      needs_confirmation: Boolean(parsed.needs_confirmation),
    };

    return NextResponse.json(normalizedAnalysis, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno en el servidor al analizar la tarea.' },
      { status: 500 }
    );
  }
}
