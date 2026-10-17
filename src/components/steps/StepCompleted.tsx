'use client';

import React from 'react';
import {
  RotateCcw,
  Volume2,
  BookOpen,
  Award,
} from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityContext';

interface StepCompletedProps {
  onRestart: () => void;
  onReviewGuide: () => void;
  onListenAgain: () => void;
}

export default function StepCompleted({
  onRestart,
  onReviewGuide,
  onListenAgain,
}: StepCompletedProps) {
  const { settings } = useAccessibility();

  const titleSizeClass =
    settings.fontSize === 'xlarge'
      ? 'text-4xl sm:text-5xl'
      : settings.fontSize === 'large'
      ? 'text-3xl sm:text-4xl'
      : 'text-2xl sm:text-3xl';

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4 max-w-2xl mx-auto text-center animate-in fade-in duration-300">
      {/* Medalla amigable */}
      <div className="h-24 w-24 rounded-3xl bg-amber-400 text-amber-950 flex items-center justify-center mb-6 shadow-xl shadow-amber-300/50 border-4 border-amber-300">
        <Award className="h-14 w-14 stroke-[2.2]" />
      </div>

      {/* Felicitación */}
      <h2 className={`font-black text-amber-950 tracking-tight mb-3 ${titleSizeClass}`}>
        ¡Muy bien! ¡Terminaste tu tarea!
      </h2>

      <p className="text-zinc-700 font-medium text-lg sm:text-xl max-w-md mb-8">
        Hiciste cada paso con paciencia y por tu cuenta. ¡Excelente esfuerzo!
      </p>

      {/* Opciones de Cierre */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mb-8">
        <button
          onClick={onReviewGuide}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-800 font-bold border-2 border-zinc-300 shadow-xs transition-colors"
        >
          <BookOpen className="h-5 w-5 text-amber-600" />
          <span>Revisar la consigna</span>
        </button>

        <button
          onClick={onListenAgain}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold border-2 border-sky-300 shadow-xs transition-colors"
        >
          <Volume2 className="h-5 w-5 text-sky-700" />
          <span>Volver a escuchar</span>
        </button>
      </div>

      {/* Botón principal: Hacer otra tarea */}
      <button
        onClick={onRestart}
        className="inline-flex items-center justify-center gap-3 py-4 px-10 rounded-3xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xl shadow-lg shadow-amber-300/40 border-2 border-amber-400 transition-all"
      >
        <RotateCcw className="h-6 w-6 stroke-[2.5]" />
        <span>Hacer otra tarea</span>
      </button>

      <p className="text-xs text-zinc-500 font-medium mt-10">
        Recordá guardar tus hojas y lápices en la cartuchera. 🎒
      </p>
    </div>
  );
}
