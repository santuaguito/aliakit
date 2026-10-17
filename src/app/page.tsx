'use client';

import React, { useState, useCallback } from 'react';
import { StepId, PedagogicalAnalysis } from '@/types/aliakit';
import { SampleTask } from '@/data/samples';
import Header from '@/components/Header';
import StepWelcome from '@/components/steps/StepWelcome';
import StepCapture from '@/components/steps/StepCapture';
import StepOcrReview from '@/components/steps/StepOcrReview';
import StepAdaptedGuide from '@/components/steps/StepAdaptedGuide';
import StepCompleted from '@/components/steps/StepCompleted';
import SampleTasksModal from '@/components/SampleTasksModal';
import { Sparkles, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<StepId>('welcome');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [taskText, setTaskText] = useState<string>('');
  const [analysis, setAnalysis] = useState<PedagogicalAnalysis | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrentStep('welcome');
    setImageSrc(null);
    setTaskText('');
    setAnalysis(null);
    setIsProcessingOcr(false);
    setOcrProgress(0);
    setAnalyzeError(null);
  };

  // ─── Paso 1 → 2: Iniciar captura ─────────────────────────────────────────
  const handleStartCamera = () => setCurrentStep('capture');
  const handleSelectImage = () => setCurrentStep('capture');

  // ─── Paso 2: Imagen seleccionada → arrancar OCR ──────────────────────────
  const handleImageSelected = useCallback(async (base64: string) => {
    setImageSrc(base64);
    setTaskText('');
    setOcrProgress(0);
    setIsProcessingOcr(true);
    setCurrentStep('ocr_review');

    try {
      // Carga dinámica de Tesseract.js para no penalizar el bundle inicial
      const { createWorker } = await import('tesseract.js');

      // Idiomas: spa (español) + eng (inglés) — cubre el 95% de las tareas escolares
      const worker = await createWorker('spa+eng', 1, {
        // No registramos nada sensible en logs de producción
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(base64);
      await worker.terminate();

      const text = (data.text || '').trim();
      setTaskText(text);
      setIsProcessingOcr(false);
      setOcrProgress(100);
    } catch {
      setIsProcessingOcr(false);
      setOcrProgress(0);
      setTaskText('');
    }
  }, []);

  // ─── Paso 2 → 3: Continuar a revisión ────────────────────────────────────
  const handleContinueToReview = () => setCurrentStep('ocr_review');

  // ─── Paso 3 → 4–5: Analizar con Gemini ───────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    setAnalyzeError(null);
    setCurrentStep('analyzing');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskText }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status} al analizar la tarea.`);
      }

      const data: PedagogicalAnalysis = await res.json();
      setAnalysis(data);
      setCurrentStep('adapted_guide');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo analizar la tarea.';
      setAnalyzeError(msg);
      setCurrentStep('analyzing'); // queda en la pantalla de error
    }
  }, [taskText]);

  // ─── Cargar tarea de ejemplo escolar ──────────────────────────────────────
  const handleSelectSample = (sample: SampleTask) => {
    setTaskText(sample.sampleText);
    setAnalysis(sample.analysis);
    setImageSrc(null);
    setCurrentStep('adapted_guide');
  };

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
          <StepOcrReview
            imageSrc={imageSrc}
            recognizedText={taskText}
            isProcessingOcr={isProcessingOcr}
            ocrProgress={ocrProgress}
            onTextChange={setTaskText}
            onAnalyze={handleAnalyze}
            onRetake={() => setCurrentStep('capture')}
            onBack={() => setCurrentStep('capture')}
          />
        )}

        {currentStep === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto animate-in fade-in">
            {analyzeError ? (
              /* ── Estado de error: Gemini no respondió ── */
              <div className="w-full space-y-5">
                <div className="h-20 w-20 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2 shadow-md">
                  <AlertCircle className="h-10 w-10 stroke-[2]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-900">
                  Algo salió mal
                </h3>
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-left">
                  <p className="text-sm font-semibold text-rose-800">{analyzeError}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleAnalyze}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-base shadow-md transition-all"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Intentar de nuevo
                  </button>
                  <button
                    onClick={() => setCurrentStep('ocr_review')}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-700 font-bold text-base border-2 border-zinc-300 transition-colors"
                  >
                    Volver al texto
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
                  Entendiendo tu tarea...
                </h3>
                <p className="text-base font-semibold text-zinc-600 mb-6">
                  Estamos preparando una explicación clarita para vos. ¡Ya casi está!
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <span>Analizando materia, idioma y pasos con inteligencia artificial</span>
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
            onReAnalyze={handleAnalyze}
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
