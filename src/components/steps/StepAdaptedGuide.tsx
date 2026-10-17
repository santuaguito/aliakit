'use client';

import React, { useState } from 'react';
import {
  PedagogicalAnalysis,
} from '@/types/aliakit';
import { useAccessibility } from '@/context/AccessibilityContext';
import AudioPlayerBar from '@/components/audio/AudioPlayerBar';
import {
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Languages,
  Award,
} from 'lucide-react';

interface StepAdaptedGuideProps {
  analysis: PedagogicalAnalysis;
  originalText: string;
  onBackToEdit: () => void;
  onFinish: () => void;
  onReAnalyze: () => void;
}

const SUBJECT_THEMES: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  math: {
    label: 'Matemática',
    bg: 'bg-emerald-100',
    text: 'text-emerald-950',
    border: 'border-emerald-300',
    icon: '🔢',
  },
  language: {
    label: 'Lengua y Literatura',
    bg: 'bg-amber-100',
    text: 'text-amber-950',
    border: 'border-amber-300',
    icon: '📖',
  },
  english: {
    label: 'Inglés',
    bg: 'bg-indigo-100',
    text: 'text-indigo-950',
    border: 'border-indigo-300',
    icon: '🇬🇧',
  },
  natural_sciences: {
    label: 'Ciencias Naturales',
    bg: 'bg-teal-100',
    text: 'text-teal-950',
    border: 'border-teal-300',
    icon: '🌱',
  },
  social_sciences: {
    label: 'Ciencias Sociales',
    bg: 'bg-orange-100',
    text: 'text-orange-950',
    border: 'border-orange-300',
    icon: '🗺️',
  },
  art: {
    label: 'Arte / Plástica',
    bg: 'bg-purple-100',
    text: 'text-purple-950',
    border: 'border-purple-300',
    icon: '🎨',
  },
  other: {
    label: 'Actividad escolar',
    bg: 'bg-sky-100',
    text: 'text-sky-950',
    border: 'border-sky-300',
    icon: '✏️',
  },
};

export default function StepAdaptedGuide({
  analysis,
  originalText,
  onBackToEdit,
  onFinish,
  onReAnalyze,
}: StepAdaptedGuideProps) {
  const { settings } = useAccessibility();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showOriginalText, setShowOriginalText] = useState(false);

  // Mapeo amigable de materia
  const subjectTheme =
    SUBJECT_THEMES[analysis.subject] || {
      label: analysis.subject_label || analysis.subject || 'Tarea escolar',
      bg: 'bg-amber-100',
      text: 'text-amber-950',
      border: 'border-amber-300',
      icon: '📝',
    };

  // Conmutar paso completado
  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((i) => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  const isAllStepsCompleted =
    analysis.steps.length > 0 &&
    analysis.steps.every((_, idx) => completedSteps.includes(idx));

  // Texto consolidado para lectura en voz alta
  const fullTextToRead = `${analysis.simplified_instruction}. Pasos a seguir: ${analysis.steps.join('. ')}`;

  const bodySizeClass =
    settings.fontSize === 'xlarge'
      ? 'text-2xl leading-relaxed'
      : settings.fontSize === 'large'
      ? 'text-xl leading-relaxed'
      : 'text-lg leading-normal';

  return (
    <div className="flex flex-col max-w-4xl mx-auto py-6 px-4 animate-in fade-in duration-300 space-y-6">
      {/* Barra superior con botón volver */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToEdit}
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-amber-900 font-bold text-sm sm:text-base py-2 px-3 rounded-xl hover:bg-amber-100/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver a corregir el texto</span>
        </button>

        <button
          onClick={onReAnalyze}
          className="text-xs sm:text-sm font-bold text-amber-900 underline underline-offset-4 hover:text-amber-700"
        >
          Pedir otra explicación
        </button>
      </div>

      {/* Insignias de Metadatos de la Tarea (Materia, Idioma, Tipo) */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Materia */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 font-black text-sm sm:text-base shadow-xs ${subjectTheme.bg} ${subjectTheme.text} ${subjectTheme.border}`}
        >
          <span className="text-xl" role="img" aria-hidden="true">
            {subjectTheme.icon}
          </span>
          <span>{subjectTheme.label}</span>
        </div>

        {/* Tipo de actividad */}
        {analysis.activity_type_label && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border-2 border-zinc-200 text-zinc-800 font-bold text-xs sm:text-sm shadow-xs">
            <span>Actividad: {analysis.activity_type_label}</span>
          </div>
        )}

        {/* Idioma */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-zinc-200 text-zinc-700 font-medium text-xs">
          <Languages className="h-3.5 w-3.5 text-zinc-500" />
          <span>Idioma original: {analysis.detected_language.toUpperCase()}</span>
          <span className="text-zinc-400">• Explicado en español rioplatense</span>
        </div>
      </div>

      {/* Alerta de ambigüedad / confirmación si la hubiera */}
      {analysis.needs_confirmation && analysis.uncertainties.length > 0 && (
        <div className="rounded-3xl bg-amber-50 border-3 border-amber-400 p-5 text-amber-950 flex items-start gap-3.5">
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-base sm:text-lg">
              Tenemos una duda con esta consigna
            </h4>
            <ul className="text-sm font-medium mt-1 list-disc pl-5 space-y-1 text-amber-900">
              {analysis.uncertainties.map((unc, idx) => (
                <li key={idx}>{unc}</li>
              ))}
            </ul>
            <p className="text-xs text-amber-800 mt-2 font-semibold">
              Si algo no coincide con lo que te pidió la seño o el profe, podés corregir el texto con el botón de arriba.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta Principal: Explicación Adaptada */}
      <div className="rounded-3xl bg-white border-4 border-amber-300 p-6 sm:p-8 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-950">
              Qué tenés que hacer:
            </h2>
          </div>
        </div>

        {/* Texto de la consigna simplificada */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-200">
          <p
            className={`font-bold text-amber-950 ${bodySizeClass}`}
            style={{
              letterSpacing:
                settings.letterSpacing === 'loose'
                  ? '0.06em'
                  : settings.letterSpacing === 'relaxed'
                  ? '0.03em'
                  : 'normal',
            }}
          >
            {analysis.simplified_instruction}
          </p>
        </div>

        {/* Reproductor de audio de la explicación */}
        <AudioPlayerBar
          textToRead={fullTextToRead}
          originalText={originalText}
          title="Escuchar qué hay que hacer"
        />
      </div>

      {/* Lista interactiva de Pasos a seguir (Paso a paso) */}
      <div className="rounded-3xl bg-white border-3 border-sky-300 p-6 sm:p-8 shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-sky-400 text-sky-950 flex items-center justify-center font-black">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-sky-950">
                Paso a paso para resolverla:
              </h3>
              <p className="text-xs sm:text-sm text-sky-800 font-semibold">
                Tocá cada paso a medida que lo vayas haciendo en tu cuaderno.
              </p>
            </div>
          </div>

          <span className="text-xs sm:text-sm font-black bg-sky-100 text-sky-900 px-3 py-1.5 rounded-full border border-sky-300">
            {completedSteps.length} de {analysis.steps.length} hechos
          </span>
        </div>

        {/* Lista de pasos con casillas grandes */}
        <div className="space-y-3 pt-2">
          {analysis.steps.map((step, idx) => {
            const isCompleted = completedSteps.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-3 transition-all flex items-start gap-4 active:scale-[0.99] ${
                  isCompleted
                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-zinc-50/60 hover:bg-amber-50/50 border-zinc-200 hover:border-amber-300 text-zinc-800'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="h-6 w-6 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-xl border-2 border-zinc-400 bg-white flex items-center justify-center text-sm font-black text-zinc-500">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <span
                    className={`font-bold block ${bodySizeClass} ${
                      isCompleted ? 'line-through opacity-80 text-emerald-900' : ''
                    }`}
                  >
                    {step}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Palabras difíciles explicadas (si las hay) */}
      {analysis.difficult_terms && analysis.difficult_terms.length > 0 && (
        <div className="rounded-3xl bg-amber-50/80 border-2 border-amber-200 p-6 space-y-3">
          <h4 className="font-black text-amber-950 text-base sm:text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Palabras que quizás no conocías:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {analysis.difficult_terms.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs"
              >
                <span className="font-black text-amber-950 block text-base">
                  {item.term}:
                </span>
                <span className="text-sm font-medium text-zinc-700">
                  {item.explanation}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista del texto original reconocido (colapsable) */}
      <div className="border border-zinc-200 rounded-2xl bg-white/70 overflow-hidden">
        <button
          onClick={() => setShowOriginalText(!showOriginalText)}
          className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-zinc-500" />
            Ver el texto original que estaba en la hoja
          </span>
          {showOriginalText ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showOriginalText && (
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 text-sm font-mono text-zinc-800 whitespace-pre-wrap">
            {originalText}
          </div>
        )}
      </div>

      {/* Botón de Finalización (Paso 8) */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBackToEdit}
          className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-700 font-bold border-2 border-zinc-300 transition-colors"
        >
          Revisar o cambiar el texto
        </button>

        <button
          onClick={onFinish}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-black text-lg sm:text-xl shadow-lg border-2 transition-all ${
            isAllStepsCompleted
              ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border-emerald-400 shadow-emerald-300/40 animate-bounce'
              : 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-amber-400 shadow-amber-300/40'
          }`}
        >
          <Award className="h-6 w-6 stroke-[2.5]" />
          <span>
            {isAllStepsCompleted ? '¡Completé toda la tarea!' : 'Terminar por hoy'}
          </span>
        </button>
      </div>
    </div>
  );
}
