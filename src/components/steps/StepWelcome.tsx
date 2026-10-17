'use client';

import React from 'react';
import { Camera, Image as ImageIcon, ShieldCheck, BookOpen } from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityContext';

interface StepWelcomeProps {
  onStartCamera: () => void;
  onSelectImage: () => void;
  onLoadSample: () => void;
}

export default function StepWelcome({
  onStartCamera,
  onSelectImage,
  onLoadSample,
}: StepWelcomeProps) {
  const { settings } = useAccessibility();

  const titleSizeClass =
    settings.fontSize === 'xlarge'
      ? 'text-4xl sm:text-5xl'
      : settings.fontSize === 'large'
      ? 'text-3xl sm:text-4xl'
      : 'text-2xl sm:text-3xl';

  const bodySizeClass =
    settings.fontSize === 'xlarge'
      ? 'text-xl sm:text-2xl leading-relaxed'
      : settings.fontSize === 'large'
      ? 'text-lg sm:text-xl leading-relaxed'
      : 'text-base sm:text-lg leading-normal';

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4 max-w-3xl mx-auto text-center animate-in fade-in duration-300">
      {/* Título Principal */}
      <h1
        className={`font-black text-amber-950 tracking-tight mb-4 ${titleSizeClass}`}
      >
        Vamos a entender tu tarea
      </h1>

      {/* Bajada clara y directa en español rioplatense */}
      <p
        className={`text-zinc-700 max-w-xl mb-10 font-medium ${bodySizeClass}`}
      >
        Sacale una foto a tu hoja del cuaderno o libro. Te la explicamos con
        palabras simples y paso a paso para que puedas resolverla vos solo.
      </p>

      {/* Opciones de Acción Principales (Botones Grandes y Táctiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl mb-8">
        {/* Opción 1: Sacar una foto */}
        <button
          onClick={onStartCamera}
          className="group flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-3xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black p-6 shadow-lg shadow-amber-300/40 border-4 border-amber-300/80 transition-all focus:outline-none focus:ring-4 focus:ring-amber-500"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-amber-800 shadow-md group-hover:scale-110 transition-transform">
            <Camera className="h-8 w-8 stroke-[2.5]" />
          </div>
          <span className="text-xl sm:text-2xl">Sacar una foto</span>
          <span className="text-xs sm:text-sm font-semibold text-amber-900/80">
            Con la cámara de tu celu o compu
          </span>
        </button>

        {/* Opción 2: Elegir del dispositivo */}
        <button
          onClick={onSelectImage}
          className="group flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-3xl bg-sky-100 hover:bg-sky-200 active:scale-95 text-sky-950 font-black p-6 shadow-md border-4 border-sky-300 transition-all focus:outline-none focus:ring-4 focus:ring-sky-400"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-sky-700 shadow-md group-hover:scale-110 transition-transform">
            <ImageIcon className="h-8 w-8 stroke-[2.5]" />
          </div>
          <span className="text-xl sm:text-2xl">Elegir una foto</span>
          <span className="text-xs sm:text-sm font-semibold text-sky-800/80">
            De tus fotos o archivos guardados
          </span>
        </button>
      </div>

      {/* Botón de prueba con ejemplo educativo */}
      <div className="mb-8">
        <button
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/80 hover:bg-white text-zinc-700 hover:text-amber-950 px-4 py-2.5 text-sm sm:text-base font-bold border-2 border-amber-200 shadow-xs transition-colors"
        >
          <BookOpen className="h-5 w-5 text-amber-600" />
          <span>¿Querés probar con una tarea de ejemplo?</span>
        </button>
      </div>

      {/* Cartel de Privacidad y Cuidado Infantil */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-600 bg-white/60 rounded-2xl px-4 py-2.5 border border-zinc-200/70">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          Cuidamos tu privacidad: no necesitás registrarte y las fotos no se
          guardan en internet.
        </span>
      </div>
    </div>
  );
}
