'use client';

import React, { useState } from 'react';
import { StepId, PedagogicalAnalysis } from '@/types/aliakit';
import { SAMPLE_TASKS, SampleTask } from '@/data/samples';
import Header from '@/components/Header';
import StepWelcome from '@/components/steps/StepWelcome';
import StepCapture from '@/components/steps/StepCapture';
import StepOcrReview from '@/components/steps/StepOcrReview';
import StepAdaptedGuide from '@/components/steps/StepAdaptedGuide';
import StepCompleted from '@/components/steps/StepCompleted';
import SampleTasksModal from '@/components/SampleTasksModal';
import { Sparkles, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<StepId>('welcome');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [taskText, setTaskText] = useState<string>('');
  const [analysis, setAnalysis] = useState<PedagogicalAnalysis | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);

  // Ir a inicio y restablecer
  const handleReset = () => {
    setCurrentStep('welcome');
    setImageSrc(null);
    setTaskText('');
    setAnalysis(null);
    setIsProcessingOcr(false);
    setOcrProgress(0);
  };

  // Paso 1 -> 2: Iniciar cámara
  const handleStartCamera = () => {
    setCurrentStep('capture');
  };

  // Paso 1 -> 2: Elegir imagen
  const handleSelectImage = () => {
    setCurrentStep('capture');
  };

  // Paso 2: Imagen seleccionada
  const handleImageSelected = (base64: string) => {
    setImageSrc(base64);
    // En la Fase 1, preparamos el paso hacia la revisión de OCR
    // y si no hay texto previo, sugerimos un texto para poder editarlo
    if (!taskText) {
      setTaskText('Leé la consigna y completá los ejercicios que pide la actividad.');
    }
  };

  // Paso 2 -> 3: Continuar a revisión
  const handleContinueToReview = () => {
    setCurrentStep('ocr_review');
  };

  // Paso 3 -> 4 & 5: Analizar tarea
  const handleAnalyze = () => {
    setCurrentStep('analyzing');

    // En Fase 1 (previo a conectar Gemini en Fase 3),
    // si el texto coincide con una muestra usamos su análisis, de lo contrario
    // generamos una adaptación pedagógica representativa para probar la interfaz
    setTimeout(() => {
      // Buscar si coincide con alguna muestra
      const matchedSample = SAMPLE_TASKS.find(
        (s) => s.sampleText.trim() === taskText.trim()
      );

      if (matchedSample) {
        setAnalysis(matchedSample.analysis);
      } else {
        // Adaptación estructurada representativa (Fase 1)
        const isEnglish = /complete|sentences|verb|read/i.test(taskText);
        const isMath = /\d+|\+|\-|\*|\/|calcular|sumar|restar/i.test(taskText);

        const fallbackAnalysis: PedagogicalAnalysis = {
          detected_language: isEnglish ? 'en' : 'es',
          additional_languages: [],
          explanation_language: 'es-AR',
          subject: isMath ? 'math' : isEnglish ? 'english' : 'language',
          subject_label: isMath
            ? 'Matemática'
            : isEnglish
            ? 'Inglés'
            : 'Lengua y Literatura',
          activity_type: isMath ? 'solve_operations' : 'understand_task',
          activity_type_label: isMath
            ? 'Cuentas y operaciones'
            : 'Lectura y comprensión',
          task_instruction: taskText.slice(0, 120),
          simplified_instruction: isMath
            ? 'Leé la consigna con atención y hacé las cuentas que te pide en tu hoja.'
            : isEnglish
            ? 'Tenés que leer las oraciones en inglés y completar lo que falta.'
            : 'Leé el texto despacito y respondé lo que pide la tarea en tu cuaderno.',
          steps: [
            'Leé la primera parte de tu tarea con calma.',
            'Buscá los datos más importantes o las palabras que ya conocés.',
            'Escribí tu respuesta en el renglón correspondiente.',
            'Revisá que no te haya quedado ningún punto sin responder.',
          ],
          difficult_terms: [
            {
              term: 'Consigna',
              explanation: 'Lo que la maestra o el profesor te pide que hagas.',
            },
          ],
          uncertainties: [],
          needs_confirmation: false,
        };
        setAnalysis(fallbackAnalysis);
      }

      setCurrentStep('adapted_guide');
    }, 1200);
  };

  // Cargar tarea de ejemplo escolar
  const handleSelectSample = (sample: SampleTask) => {
    setTaskText(sample.sampleText);
    setAnalysis(sample.analysis);
    setImageSrc(null);
    setCurrentStep('adapted_guide');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Encabezado accesible */}
      <Header currentStep={currentStep} onReset={handleReset} />

      {/* Contenido principal según el paso actual */}
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
              <span>Analizando materia, idioma y pasos</span>
            </div>
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

      {/* Modal de ejemplos escolares para pruebas */}
      <SampleTasksModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />
    </div>
  );
}
