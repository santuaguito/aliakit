'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { StepId, SpacingSetting } from '@/types/aliakit';
import { Sparkles, Eye, Type, Palette, RotateCcw, AlignJustify, CaseSensitive } from 'lucide-react';

interface HeaderProps {
  currentStep: StepId;
  onReset?: () => void;
}

const STEP_LABELS: Record<StepId, { number: number; label: string }> = {
  welcome: { number: 1, label: 'Inicio' },
  capture: { number: 2, label: 'Elegir foto' },
  ocr_review: { number: 3, label: 'Revisar texto' },
  analyzing: { number: 4, label: 'Entendiendo...' },
  adapted_guide: { number: 4, label: 'Tu tarea explicada' },
  completed: { number: 5, label: '¡Listo!' },
};

/** Botón de tres opciones reutilizable para los controles de espaciado */
function SpacingControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: SpacingSetting;
  onChange: (v: SpacingSetting) => void;
  options: { value: SpacingSetting; label: string }[];
}) {
  return (
    <div>
      <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider block mb-2">
        {label}
      </span>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
              value === opt.value
                ? 'border-amber-500 bg-amber-100 text-amber-950'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Header({ currentStep, onReset }: HeaderProps) {
  const {
    settings,
    setFontSize,
    setColorTheme,
    setLineSpacing,
    setLetterSpacing,
    toggleReadingRuler,
    resetSettings,
  } = useAccessibility();

  const [showAccessMenu, setShowAccessMenu] = useState(false);

  const stepInfo = STEP_LABELS[currentStep] || { number: 1, label: 'Inicio' };

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/60 bg-amber-50/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-sm transition-colors">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        {/* Logo e Identidad */}
        <button
          onClick={onReset}
          className="group flex items-center gap-2.5 text-left focus:outline-none focus:ring-4 focus:ring-amber-300 rounded-2xl p-1"
          title="Ir al inicio de ALIAKIT"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-md shadow-amber-300/50 group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-2xl font-black tracking-tight text-amber-950">
              ALIAKIT
            </span>
            <span className="hidden sm:block text-xs font-medium text-amber-800/80 -mt-1">
              Tu compañero de tareas
            </span>
          </div>
        </button>

        {/* Indicador de paso actual (amigable y claro) */}
        {currentStep !== 'welcome' && (
          <div className="hidden md:flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 border border-amber-200 text-sm font-semibold text-amber-900 shadow-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-amber-950">
              {stepInfo.number}
            </span>
            <span>{stepInfo.label}</span>
          </div>
        )}

        {/* Barra de accesibilidad directa */}
        <div className="flex items-center gap-2">
          {/* Botón rápido tamaño de letra */}
          <div className="flex items-center rounded-2xl bg-white/90 p-1 border border-amber-200/80 shadow-xs">
            <button
              onClick={() => setFontSize('normal')}
              aria-label="Tamaño de letra normal"
              className={`h-9 px-2.5 rounded-xl font-bold transition-colors ${
                settings.fontSize === 'normal'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-amber-900/70 hover:bg-amber-100/60'
              }`}
            >
              <span className="text-xs">A</span>
            </button>
            <button
              onClick={() => setFontSize('large')}
              aria-label="Tamaño de letra grande"
              className={`h-9 px-2.5 rounded-xl font-bold transition-colors ${
                settings.fontSize === 'large'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-amber-900/70 hover:bg-amber-100/60'
              }`}
            >
              <span className="text-sm">A</span>
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              aria-label="Tamaño de letra muy grande"
              className={`h-9 px-2.5 rounded-xl font-bold transition-colors ${
                settings.fontSize === 'xlarge'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-amber-900/70 hover:bg-amber-100/60'
              }`}
            >
              <span className="text-base">A+</span>
            </button>
          </div>

          {/* Menú desplegable con más ajustes de lectura */}
          <div className="relative">
            <button
              onClick={() => setShowAccessMenu(!showAccessMenu)}
              aria-expanded={showAccessMenu}
              aria-label="Abrir ajustes de lectura y accesibilidad"
              className={`flex h-11 items-center gap-1.5 rounded-2xl px-3 font-semibold text-sm transition-all ${
                showAccessMenu
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white/90 text-amber-950 border border-amber-200/80 hover:bg-amber-100/50'
              }`}
            >
              <Eye className="h-5 w-5" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>

            {showAccessMenu && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-3xl bg-white p-4 shadow-xl border-2 border-amber-200 text-zinc-800 z-50 animate-in fade-in slide-in-from-top-2"
                role="dialog"
                aria-label="Ajustes de lectura accesibles"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Type className="h-4 w-4 text-amber-600" />
                    Cómo querés leer
                  </h3>
                  <button
                    onClick={resetSettings}
                    title="Restablecer ajustes"
                    className="text-xs text-zinc-500 hover:text-amber-700 flex items-center gap-1 p-1 rounded-md"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restablecer
                  </button>
                </div>

                <div className="space-y-4 py-3">
                  {/* Color de fondo */}
                  <div>
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-amber-600" />
                      Fondo de pantalla
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setColorTheme('warm')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          settings.colorTheme === 'warm'
                            ? 'border-amber-500 bg-[#FBF8F2] text-amber-950 shadow-xs'
                            : 'border-zinc-200 bg-[#FBF8F2] text-zinc-700'
                        }`}
                      >
                        Cálido (crema)
                      </button>
                      <button
                        onClick={() => setColorTheme('white')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          settings.colorTheme === 'white'
                            ? 'border-amber-500 bg-white text-zinc-900 shadow-xs'
                            : 'border-zinc-200 bg-white text-zinc-700'
                        }`}
                      >
                        Blanco
                      </button>
                      <button
                        onClick={() => setColorTheme('contrast')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          settings.colorTheme === 'contrast'
                            ? 'border-yellow-400 bg-zinc-900 text-yellow-300 shadow-xs'
                            : 'border-zinc-300 bg-zinc-900 text-yellow-300'
                        }`}
                      >
                        Contraste
                      </button>
                    </div>
                  </div>

                  {/* ─── Espaciado entre letras ─── */}
                  <div className="pt-2 border-t border-zinc-100">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <CaseSensitive className="h-3.5 w-3.5 text-amber-600" />
                      Espaciado entre letras
                    </label>
                    <SpacingControl
                      label=""
                      value={settings.letterSpacing}
                      onChange={setLetterSpacing}
                      options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'relaxed', label: 'Amplio' },
                        { value: 'loose', label: 'Muy amplio' },
                      ]}
                    />
                    {/* Vista previa de la letra */}
                    <p
                      className="mt-2 text-xs text-zinc-500 bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-200 truncate"
                      style={{
                        letterSpacing:
                          settings.letterSpacing === 'loose'
                            ? '0.09em'
                            : settings.letterSpacing === 'relaxed'
                            ? '0.04em'
                            : 'normal',
                      }}
                    >
                      Vista previa: la maestra pide que leás el texto.
                    </p>
                  </div>

                  {/* ─── Espaciado entre líneas ─── */}
                  <div className="pt-2 border-t border-zinc-100">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <AlignJustify className="h-3.5 w-3.5 text-amber-600" />
                      Espaciado entre líneas
                    </label>
                    <SpacingControl
                      label=""
                      value={settings.lineSpacing}
                      onChange={setLineSpacing}
                      options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'relaxed', label: 'Amplio' },
                        { value: 'loose', label: 'Muy amplio' },
                      ]}
                    />
                  </div>

                  {/* Regla de lectura visual */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-zinc-800 block">
                        Regla de lectura
                      </span>
                      <span className="text-xs text-zinc-500">
                        Resalta la línea por donde vas leyendo
                      </span>
                    </div>
                    <button
                      onClick={toggleReadingRuler}
                      role="switch"
                      aria-checked={settings.readingRuler}
                      className={`h-7 w-12 rounded-full transition-colors p-1 flex items-center ${
                        settings.readingRuler ? 'bg-amber-500 justify-end' : 'bg-zinc-300 justify-start'
                      }`}
                    >
                      <span className="h-5 w-5 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-zinc-100">
                  <p className="text-[11px] text-zinc-500">
                    Adaptado para facilitar la lectura sin cansar la vista.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
