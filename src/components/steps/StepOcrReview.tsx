'use client';

import React, { useState } from 'react';
import {
  Edit3,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityContext';

interface StepOcrReviewProps {
  imageSrc: string | null;
  recognizedText: string;
  isProcessingOcr: boolean;
  ocrProgress: number; // 0 to 100
  onTextChange: (newText: string) => void;
  onAnalyze: () => void;
  onRetake: () => void;
  onBack: () => void;
}

export default function StepOcrReview({
  imageSrc,
  recognizedText,
  isProcessingOcr,
  ocrProgress,
  onTextChange,
  onAnalyze,
  onRetake,
  onBack,
}: StepOcrReviewProps) {
  const { settings } = useAccessibility();
  const [showImagePreview, setShowImagePreview] = useState(true);

  const wordCount = recognizedText.trim()
    ? recognizedText.trim().split(/\s+/).length
    : 0;

  const textAreaSizeClass =
    settings.fontSize === 'xlarge'
      ? 'text-2xl leading-loose'
      : settings.fontSize === 'large'
      ? 'text-xl leading-relaxed'
      : 'text-lg leading-normal';

  return (
    <div className="flex flex-col max-w-4xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      {/* Botón Volver */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-amber-900 font-bold text-sm sm:text-base py-2 px-3 rounded-xl hover:bg-amber-100/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver a la foto</span>
        </button>

        {imageSrc && (
          <button
            onClick={() => setShowImagePreview(!showImagePreview)}
            className="text-xs sm:text-sm font-bold text-amber-900 underline underline-offset-4 hover:text-amber-700"
          >
            {showImagePreview ? 'Ocultar foto' : 'Ver foto original'}
          </button>
        )}
      </div>

      {/* Título de la pantalla */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-amber-950 mb-2">
          Revisá el texto de tu tarea
        </h2>
        <p className="text-zinc-600 font-medium text-base sm:text-lg max-w-2xl mx-auto">
          Leímos las palabras de tu hoja. Podés tocar el texto para corregir o agregar cualquier palabra si hace falta.
        </p>
      </div>

      {/* Estado de procesamiento OCR (cuando está escaneando) */}
      {isProcessingOcr ? (
        <div className="rounded-3xl bg-amber-50 border-4 border-amber-300 p-8 text-center my-8 shadow-sm">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-amber-200 flex items-center justify-center animate-spin">
            <Sparkles className="h-8 w-8 text-amber-700" />
          </div>
          <h3 className="text-xl font-black text-amber-950 mb-2">
            Leyendo la hoja con atención...
          </h3>
          <p className="text-sm font-semibold text-amber-800 mb-6">
            Esto tarda unos segunditos. ¡Casi listo!
          </p>

          {/* Barra de progreso */}
          <div className="w-full max-w-md mx-auto bg-amber-200/80 rounded-full h-4 overflow-hidden border border-amber-300">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(10, ocrProgress)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-amber-900 mt-2 block">
            {ocrProgress > 0 ? `${Math.round(ocrProgress)}%` : 'Iniciando escaneo...'}
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grilla: Foto y Campo Editable */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Foto original (colapsable) */}
            {imageSrc && showImagePreview && (
              <div className="md:col-span-5 rounded-3xl overflow-hidden border-2 border-amber-300 bg-black/5 shadow-xs">
                <div className="bg-amber-100/80 px-3 py-2 text-xs font-bold text-amber-900 border-b border-amber-200 flex items-center justify-between">
                  <span>Foto original</span>
                  <button
                    onClick={onRetake}
                    className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Cambiar
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt="Foto original de la tarea"
                  className="w-full max-h-[360px] object-contain p-2 bg-white"
                />
              </div>
            )}

            {/* Campo de texto editable */}
            <div
              className={`${
                imageSrc && showImagePreview ? 'md:col-span-7' : 'md:col-span-12'
              } flex flex-col space-y-2`}
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="task-text-editor"
                  className="text-sm font-bold text-zinc-700 flex items-center gap-1.5"
                >
                  <Edit3 className="h-4 w-4 text-amber-600" />
                  Texto reconocido (podés editarlo):
                </label>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 rounded-full px-2.5 py-0.5">
                  {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
                </span>
              </div>

              <textarea
                id="task-text-editor"
                rows={8}
                value={recognizedText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Acá va a aparecer el texto de la tarea. También podés escribirlo directamente con el teclado..."
                className={`w-full rounded-3xl border-3 border-amber-300 p-5 bg-white text-zinc-900 shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-400 focus:border-amber-500 transition-all ${textAreaSizeClass}`}
                style={{
                  letterSpacing:
                    settings.letterSpacing === 'loose'
                      ? '0.08em'
                      : settings.letterSpacing === 'relaxed'
                      ? '0.04em'
                      : 'normal',
                }}
              />

              <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-1">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  No te preocupes por tildes o mayúsculas. Lo importante es que las palabras coincidan con tu tarea.
                </span>
              </div>
            </div>
          </div>

          {/* Advertencia si no hay suficiente texto */}
          {recognizedText.trim().length > 0 && recognizedText.trim().length < 8 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm font-medium">
                Hay muy poquitas palabras. Si la hoja tenía más texto, probá sacar otra foto más de cerca.
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-200/60">
            <button
              onClick={onRetake}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-700 font-bold border-2 border-zinc-300 transition-colors"
            >
              <RotateCcw className="h-5 w-5 text-zinc-500" />
              <span>Volver a sacar la foto</span>
            </button>

            <button
              onClick={onAnalyze}
              disabled={!recognizedText.trim()}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-black text-lg sm:text-xl shadow-lg border-2 transition-all ${
                recognizedText.trim()
                  ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 border-amber-400 shadow-amber-300/40 cursor-pointer'
                  : 'bg-zinc-200 text-zinc-400 border-zinc-200 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles className="h-6 w-6 stroke-[2.5]" />
              <span>Explicar mi tarea paso a paso</span>
              <ArrowRight className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
