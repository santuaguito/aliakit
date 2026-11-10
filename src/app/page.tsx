'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StepId, PedagogicalAnalysis } from '@/types/aliakit';
import { SampleTask } from '@/data/samples';
import Header from '@/components/Header';
import StepWelcome from '@/components/steps/StepWelcome';
import StepCapture from '@/components/steps/StepCapture';
import StepOcrReview from '@/components/steps/StepOcrReview';
import StepAdaptedGuide from '@/components/steps/StepAdaptedGuide';
import StepCompleted from '@/components/steps/StepCompleted';
import AudioPlayerBar from '@/components/audio/AudioPlayerBar';
import SampleTasksModal from '@/components/SampleTasksModal';
import { Sparkles, Loader2, AlertCircle, RotateCcw, Camera, Check } from 'lucide-react';

/* ─────────────────────────── Configuración ─────────────────────────── */

// Tesseract queda como señal AUXILIAR: Gemini compara su lectura de la foto contra este texto.
// Con letra manuscrita Tesseract suele leer mal y le mete ruido a Gemini, además de sumar demora.
// Poné en true si querés activarlo como señal de comparación.
const USE_AUX_OCR = false;
const OCR_TIMEOUT_MS = 12_000;

// Vercel limita el body a ~4.5 MB: se reduce la foto antes de enviarla.
const RESIZE_ATTEMPTS: Array<[number, number]> = [
  [2000, 0.85],
  [1600, 0.7],
  [1200, 0.6],
];
const MAX_DATA_URL_CHARS = 3_800_000;

/* ─────────────────────────── Tipos ─────────────────────────── */

// Idéntico al de route.ts. Conviene moverlo a '@/types/aliakit' e importarlo en ambos lados.
type VisionAnalysis = PedagogicalAnalysis & {
  status: 'ok' | 'needs_review';
  image_quality: 'clear' | 'partial' | 'unreadable';
  recognized_text: string;
  confidence: 'high' | 'medium' | 'low';
  uncertain_fragments: { fragment: string; reason: string }[];
  ocr_differences: string[];
};

type AnalysisSource = 'image' | 'text';

interface AnalyzeErrorState {
  message: string;
  type: string;
  retryable: boolean;
}

class AnalyzeApiError extends Error {
  errorType: string;
  retryable: boolean;

  constructor(message: string, errorType: string, retryable: boolean) {
    super(message);
    this.errorType = errorType;
    this.retryable = retryable;
  }
}

/* ─────────────────────────── Utilidades ─────────────────────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = src;
  });
}

async function resizeToJpeg(src: string): Promise<string> {
  const img = await loadImage(src);
  let last = '';

  for (const [maxSide, quality] of RESIZE_ATTEMPTS) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    last = canvas.toDataURL('image/jpeg', quality);
    if (last.length <= MAX_DATA_URL_CHARS) return last;
  }

  // Si aún es muy pesada, el servidor la rechaza con un mensaje claro.
  return last;
}

/** OCR auxiliar: nunca bloquea ni rompe el flujo. Devuelve '' si falla o tarda demasiado. */
async function runAuxOcr(src: string): Promise<string> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('spa+eng', 1);
    try {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), OCR_TIMEOUT_MS));
      const result = await Promise.race([worker.recognize(src), timeout]);
      return result ? (result.data.text || '').trim() : '';
    } finally {
      worker.terminate().catch(() => undefined);
    }
  } catch {
    return '';
  }
}

async function requestAnalysis(payload: Record<string, unknown>): Promise<VisionAnalysis> {
  let res: Response;
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AnalyzeApiError(
      'No pudimos conectar con el servicio. Revisá tu conexión a internet y reintentá. No es un problema de tu foto.',
      'connection',
      true
    );
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 413) {
      throw new AnalyzeApiError(
        'La foto es demasiado pesada. Sacá otra foto o usá una de menor tamaño.',
        'invalid_request',
        false
      );
    }
    const d = isRecord(data) ? data : {};
    throw new AnalyzeApiError(
      typeof d.error === 'string' && d.error ? d.error : `Error ${res.status} al analizar la tarea.`,
      typeof d.error_type === 'string' ? d.error_type : 'upstream',
      typeof d.retryable === 'boolean' ? d.retryable : true
    );
  }

  if (!isRecord(data) || (data.status !== 'ok' && data.status !== 'needs_review')) {
    throw new AnalyzeApiError(
      'La respuesta del servicio no tiene el formato esperado. Intentá de nuevo.',
      'invalid_response',
      true
    );
  }

  return data as unknown as VisionAnalysis;
}

function errorTitle(type: string): string {
  switch (type) {
    case 'rate_limit':
      return 'Se agotó la cuota por ahora';
    case 'timeout':
      return 'El análisis está tardando demasiado';
    case 'connection':
      return 'Problema de conexión';
    case 'blocked':
      return 'No pudimos procesar la imagen';
    case 'invalid_request':
      return 'No pudimos procesar la tarea';
    case 'auth':
    case 'config':
      return 'Problema técnico';
    default:
      return 'Algo salió mal';
  }
}

const ILLEGIBLE_MARK = /\[ilegible\]/i;

/* ─────────────────────────── Aviso de revisión ─────────────────────────── */

interface ReviewBannerProps {
  result: VisionAnalysis | null;
  source: AnalysisSource | null;
  hint: string | null;
  canConfirm: boolean;
  canRetryPhoto: boolean;
  onRetakePhoto: () => void;
  onRetryPhoto: () => void;
  onConfirmText: () => void;
}

function ReviewBanner({
  result,
  source,
  hint,
  canConfirm,
  canRetryPhoto,
  onRetakePhoto,
  onRetryPhoto,
  onConfirmText,
}: ReviewBannerProps) {
  if (!result && !hint) return null;

  const needsReview = result?.status === 'needs_review';
  const uncertainties = result ? result.uncertainties || [] : [];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-4 space-y-3">
      {result && needsReview && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 sm:p-5 space-y-3" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-base font-bold text-amber-950">
              {result.image_quality === 'unreadable'
                ? 'No pudimos leer lo esencial de la foto. Sacá otra con buena luz y enfocá toda la hoja, o escribí la consigna manualmente.'
                : 'No pudimos leer con seguridad una parte de la consigna. Para ayudarte sin cambiar lo que pide la tarea, sacá otra foto con buena luz y enfocá toda la hoja. También podés corregir el texto manualmente.'}
            </p>
          </div>

          {uncertainties.length > 0 && (
            <ul className="list-disc pl-10 space-y-1 text-sm font-semibold text-amber-900">
              {uncertainties.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={onRetakePhoto}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm shadow-sm transition-colors"
            >
              <Camera className="h-4 w-4" />
              Sacar otra foto
            </button>
            {canRetryPhoto && source === 'image' && (
              <button
                onClick={onRetryPhoto}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-sm border-2 border-zinc-300 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reintentar con la misma foto
              </button>
            )}
            {canConfirm && (
              <button
                onClick={onConfirmText}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-sm border-2 border-zinc-300 transition-colors"
              >
                <Check className="h-4 w-4" />
                El texto está bien, continuar
              </button>
            )}
          </div>
        </div>
      )}

      {result && !needsReview && (
        <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-4 flex items-start gap-3" role="status">
          <Check className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-base font-bold text-emerald-950">
            Esto es lo que leímos en tu hoja. Revisalo: si algo no coincide, corregilo antes de continuar.
          </p>
        </div>
      )}

      {hint && (
        <div className="rounded-2xl bg-white border-2 border-amber-300 p-3 text-sm font-semibold text-amber-900" role="status">
          {hint}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Página ─────────────────────────── */

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<StepId>('welcome');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [taskText, setTaskText] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [analysis, setAnalysis] = useState<PedagogicalAnalysis | null>(null);
  const [visionResult, setVisionResult] = useState<VisionAnalysis | null>(null);
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource | null>(null);
  const [analyzedText, setAnalyzedText] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'read' | 'explain' | null>(null);
  const [textConfirmed, setTextConfirmed] = useState(false);
  const [reviewHint, setReviewHint] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<AnalyzeErrorState | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);

  // Evita que una respuesta tardía pise el estado si el usuario ya volvió atrás o reinició.
  const requestIdRef = useRef(0);
  const lastOperationRef = useRef<AnalysisSource>('image');
  const progressStartedAtRef = useRef(0);

  useEffect(() => {
    if (currentStep !== 'analyzing' || analyzeError) return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - progressStartedAtRef.current;
      setLongWait(elapsed >= 25_000);
      setProgress((value) => {
        if (value >= 94) return value;
        const increment = value < 65 ? 2.2 : value < 84 ? 0.85 : 0.22;
        return Math.min(94, value + increment);
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [currentStep, analyzeError]);

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    requestIdRef.current += 1;
    setCurrentStep('welcome');
    setImageSrc(null);
    setTaskText('');
    setOcrText('');
    setAnalysis(null);
    setVisionResult(null);
    setAnalysisSource(null);
    setAnalyzedText('');
    setSelectedMode(null);
    setTextConfirmed(false);
    setReviewHint(null);
    setAnalyzeError(null);
    setIsOcrProcessing(false);
    setProgress(0);
    setLongWait(false);
  };

  // ─── Paso 1 → 2: Iniciar captura ─────────────────────────────────────────
  const handleStartCamera = () => setCurrentStep('capture');
  const handleSelectImage = () => setCurrentStep('capture');

  // ─── Resultado de Gemini → estado ────────────────────────────────────────
  const applyResult = useCallback((result: VisionAnalysis, source: AnalysisSource) => {
    const recognized = (result.recognized_text || '').trim();

    setVisionResult(result);
    setProgress(100);
    setAnalysisSource(source);
    setAnalyzedText(recognized);
    setTaskText(recognized);

    if (result.status === 'ok') {
      setAnalysis(result);
      // Foto: primero se revisa la transcripción. Texto ya corregido por el usuario: directo a la guía.
      setCurrentStep(source === 'text' ? 'adapted_guide' : 'ocr_review');
    } else {
      // Falta información esencial: NO hay guía definitiva.
      setAnalysis(null);
      setCurrentStep('ocr_review');
    }
  }, []);

  const showError = useCallback((err: unknown) => {
    if (err instanceof AnalyzeApiError) {
      setAnalyzeError({ message: err.message, type: err.errorType, retryable: err.retryable });
    } else {
      setAnalyzeError({
        message: 'No se pudo analizar la tarea. Intentá de nuevo.',
        type: 'upstream',
        retryable: true,
      });
    }
    setLongWait(false);
    setCurrentStep('analyzing'); // queda en la pantalla de error
  }, []);

  // ─── Análisis visual: la foto original se envía a Gemini ─────────────────
  const runImageAnalysis = useCallback(
    async (src: string) => {
      const id = ++requestIdRef.current;
      lastOperationRef.current = 'image';

      setAnalyzeError(null);
      setProgress(2);
      setLongWait(false);
      progressStartedAtRef.current = Date.now();
      setReviewHint(null);
      setVisionResult(null);
      setAnalysis(null);
      setCurrentStep('analyzing');

      try {
        let resized: string;
        try {
          resized = await resizeToJpeg(src);
        } catch {
          throw new AnalyzeApiError(
            'No pudimos preparar la imagen. Probá con otra foto.',
            'invalid_request',
            false
          );
        }

        let ocr = '';
        if (USE_AUX_OCR) {
          ocr = await runAuxOcr(resized);
          if (id !== requestIdRef.current) return;
          setOcrText(ocr);
        }

        const result = await requestAnalysis({ image: resized, mimeType: 'image/jpeg', ocrText: ocr });
        if (id !== requestIdRef.current) return;
        applyResult(result, 'image');
      } catch (err) {
        if (id !== requestIdRef.current) return;
        showError(err);
      }
    },
    [applyResult, showError]
  );

  // ─── Análisis del texto revisado/corregido por el usuario ────────────────
  const analyzeText = useCallback(
    async (text: string) => {
      const id = ++requestIdRef.current;
      lastOperationRef.current = 'text';

      setAnalyzeError(null);
      setProgress(2);
      setLongWait(false);
      progressStartedAtRef.current = Date.now();
      setReviewHint(null);
      setCurrentStep('analyzing');

      try {
        const result = await requestAnalysis({ correctedText: text });
        if (id !== requestIdRef.current) return;
        applyResult(result, 'text');
      } catch (err) {
        if (id !== requestIdRef.current) return;
        showError(err);
      }
    },
    [applyResult, showError]
  );

  // ─── Paso 2: Imagen seleccionada → análisis visual con Gemini ────────────
  const handleImageSelected = useCallback(
    (base64: string) => {
      setImageSrc(base64);
      setTaskText('');
      setOcrText('');
      setAnalyzedText('');
      setSelectedMode(null);
      setTextConfirmed(false);
      void runImageAnalysis(base64);
    },
    [runImageAnalysis]
  );

  // ─── Paso 2 → 3: Continuar a revisión ────────────────────────────────────
  const handleContinueToReview = () => setCurrentStep('ocr_review');

  // ─── Paso 3: Revisión → guía (o nuevo análisis si el texto cambió) ───────
  const handleAnalyze = () => {
    const current = taskText.trim();
    setReviewHint(null);

    if (!selectedMode) {
      setReviewHint('Elegí si querés escuchar la consigna o recibir una explicación para continuar.');
      return;
    }

    if (current.length < 3) {
      setReviewHint('Escribí o corregí el texto de la tarea antes de continuar.');
      return;
    }
    if (ILLEGIBLE_MARK.test(current)) {
      setReviewHint(
        'Todavía hay partes marcadas como [ilegible]. Reemplazalas por lo que dice tu hoja, borralas si no son importantes o sacá otra foto.'
      );
      return;
    }
    // Texto sin cambios y análisis completo: se muestra la guía ya generada.
    if (analysis && current === analyzedText && selectedMode === 'explain') {
      setCurrentStep('adapted_guide');
      return;
    }
    // Texto sin cambios pero con partes sin confirmar: no se avanza sin una decisión del usuario.
    if (visionResult?.status === 'needs_review' && current === analyzedText && !textConfirmed) {
      setReviewHint(
        'Todavía hay partes sin confirmar. Corregí el texto, o si ya está bien, tocá «El texto está bien, continuar». También podés sacar otra foto con buena luz.'
      );
      return;
    }
    if (selectedMode === 'read') {
      setCurrentStep('read_task');
      return;
    }
    void analyzeText(current);
  };

  // ─── Reintentar tras un error técnico ────────────────────────────────────
  const handleRetry = () => {
    if (lastOperationRef.current === 'text') {
      void analyzeText(taskText.trim());
    } else if (imageSrc) {
      void runImageAnalysis(imageSrc);
    } else {
      setCurrentStep('capture');
    }
  };

  const handleManualFix = async () => {
    setAnalyzeError(null);
    setCurrentStep('ocr_review');
    const existing = taskText.trim() || ocrText.trim();
    if (existing) {
      setTaskText(existing);
      setReviewHint('Podés revisar o escribir el texto de abajo y continuar.');
      return;
    }
    if (imageSrc) {
      setIsOcrProcessing(true);
      setReviewHint('Leyendo el texto de tu foto para que no tengas que escribirlo a mano...');
      try {
        const text = await runAuxOcr(imageSrc);
        if (text) {
          setTaskText(text);
          setOcrText(text);
          setReviewHint('Revisá el texto reconocido de la foto y corregí si hace falta.');
        } else {
          setReviewHint('No pudimos extraer el texto de la foto automáticamente. Podés escribirlo acá.');
        }
      } catch {
        setReviewHint('Podés escribir el texto de la tarea acá y continuar.');
      } finally {
        setIsOcrProcessing(false);
      }
    } else {
      setReviewHint('Podés escribir el texto de la tarea acá y continuar.');
    }
  };

  const handleReAnalyze = () => {
    const current = taskText.trim();
    if (current.length < 3) {
      setCurrentStep('ocr_review');
      return;
    }
    void analyzeText(current);
  };

  // ─── Cargar tarea de ejemplo escolar ──────────────────────────────────────
  const handleSelectSample = (sample: SampleTask) => {
    requestIdRef.current += 1;
    setAnalyzeError(null);
    setProgress(0);
    setLongWait(false);
    setTaskText(sample.sampleText);
    setAnalyzedText(sample.sampleText.trim());
    setAnalysis(sample.analysis);
    setVisionResult(null);
    setAnalysisSource(null);
    setReviewHint(null);
    setImageSrc(null);
    setCurrentStep('adapted_guide');
  };

  const canConfirmText =
    visionResult?.status === 'needs_review' &&
    taskText.trim().length >= 3 &&
    !ILLEGIBLE_MARK.test(taskText);

  return (
    <div className="flex flex-col min-h-screen">
      <Header currentStep={currentStep} onReset={handleReset} />

      <main className="flex-1 pb-16">

        {currentStep === 'welcome' && (
          <StepWelcome
            onStartCamera={handleStartCamera}
            onSelectImage={handleSelectImage}
            onLoadSample={() => setIsSampleModalOpen(true)}
          />
        )}

        {currentStep === 'capture' && (
          <StepCapture
            imageSrc={imageSrc}
            onImageSelected={handleImageSelected}
            onContinue={handleContinueToReview}
            onBack={() => setCurrentStep('welcome')}
          />
        )}

        {currentStep === 'ocr_review' && (
          <>
            <ReviewBanner
              result={visionResult}
              source={analysisSource}
              hint={reviewHint}
              canConfirm={canConfirmText}
              canRetryPhoto={Boolean(imageSrc)}
              onRetakePhoto={() => setCurrentStep('capture')}
              onRetryPhoto={() => imageSrc && void runImageAnalysis(imageSrc)}
              onConfirmText={() => {
                setTextConfirmed(true);
                setReviewHint('Texto confirmado. Elegí si querés escucharlo o recibir una explicación para continuar.');
              }}
            />
            <StepOcrReview
              imageSrc={imageSrc}
              mode={selectedMode}
              onModeChange={setSelectedMode}
              recognizedText={taskText}
              isProcessingOcr={isOcrProcessing}
              ocrProgress={isOcrProcessing ? 50 : 100}
              onTextChange={setTaskText}
              onAnalyze={handleAnalyze}
              onRetake={() => setCurrentStep('capture')}
              onBack={() => setCurrentStep('capture')}
            />
          </>
        )}

        {currentStep === 'read_task' && (
          <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-14" aria-labelledby="read-task-title">
            <button
              onClick={() => setCurrentStep('ocr_review')}
              className="self-start rounded-xl px-3 py-2 text-sm font-bold text-zinc-700 hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-300"
            >
              ← Volver a corregir el texto
            </button>
            <div className="text-center">
              <h2 id="read-task-title" className="mb-3 text-2xl font-black text-amber-950 sm:text-3xl">Tu consigna</h2>
              <p className="text-zinc-700">Este es el texto reconocido y corregido. Podés escucharlo en voz alta.</p>
            </div>
            <div className="whitespace-pre-wrap break-words rounded-3xl border-2 border-sky-200 bg-white p-5 text-zinc-900 shadow-sm sm:p-7">
              {taskText}
            </div>
            <AudioPlayerBar textToRead={taskText} title="Leer mi tarea en voz alta" />
          </section>
        )}

        {currentStep === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto animate-in fade-in">
            {analyzeError ? (
              /* ── Estado de error técnico (no significa que la foto sea ilegible) ── */
              <div className="w-full space-y-5">
                <div className="h-20 w-20 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2 shadow-md">
                  <AlertCircle className="h-10 w-10 stroke-[2]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-900">
                  {errorTitle(analyzeError.type)}
                </h3>
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-left">
                  <p className="text-sm font-semibold text-rose-800">{analyzeError.message}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {analyzeError.retryable && (
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-base shadow-md transition-all"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Intentar de nuevo
                    </button>
                  )}
                  <button
                    onClick={handleManualFix}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-base border-2 border-zinc-300 transition-colors"
                  >
                    Corregir texto a mano
                  </button>
                  <button
                    onClick={() => setCurrentStep('capture')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-base border-2 border-zinc-300 transition-colors"
                  >
                    Sacar otra foto
                  </button>
                </div>
              </div>
            ) : (
              /* ── Estado de carga: Gemini procesando ── */
              <>
                <div className="h-20 w-20 rounded-3xl bg-amber-400 text-amber-950 flex items-center justify-center mb-6 shadow-lg shadow-amber-300/50 animate-bounce">
                  <Sparkles className="h-10 w-10 stroke-[2.5]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-950 mb-3">
                  Estamos preparando tu actividad
                </h3>
                <div className="w-full max-w-md space-y-3 mb-5" role="status" aria-live="polite">
                  <div className="flex items-center justify-between gap-3 text-sm font-bold text-amber-950">
                    <span className="min-w-0 text-left">
                      {progress < 15 ? 'Preparando la imagen' : progress < 45 ? 'Analizando la fotografía' : progress < 80 ? 'Interpretando la consigna' : 'Esperando el resultado del análisis'}
                    </span>
                    <span className="tabular-nums shrink-0">{Math.round(progress)}%</span>
                  </div>
                  <div
                    className="h-4 w-full overflow-hidden rounded-full border border-amber-300 bg-amber-100 shadow-inner"
                    role="progressbar"
                    aria-label="Progreso del análisis"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                      style={{ width: `${Math.round(progress)}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-zinc-600">
                    {longWait
                      ? 'El análisis continúa y puede demorar un poco más. No hace falta volver a cargar la foto.'
                      : 'Estamos leyendo la hoja con cuidado para preparar una explicación clara.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <span>El análisis puede tardar unos segundos</span>
                </div>
              </>
            )}
          </div>
        )}

        {currentStep === 'adapted_guide' && analysis && (
          <StepAdaptedGuide
            analysis={analysis}
            originalText={taskText}
            onBackToEdit={() => setCurrentStep('ocr_review')}
            onFinish={() => setCurrentStep('completed')}
            onReAnalyze={handleReAnalyze}
          />
        )}

        {currentStep === 'completed' && (
          <StepCompleted
            onRestart={handleReset}
            onReviewGuide={() => setCurrentStep('adapted_guide')}
            onListenAgain={() => setCurrentStep('adapted_guide')}
          />
        )}

      </main>

      <SampleTasksModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />
    </div>
  );
}
