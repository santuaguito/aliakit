'use client';

import React from 'react';
import { SAMPLE_TASKS, SampleTask } from '@/data/samples';
import { X, BookOpen, ArrowRight } from 'lucide-react';

interface SampleTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleTask) => void;
}

export default function SampleTasksModal({
  isOpen,
  onClose,
  onSelectSample,
}: SampleTasksModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border-4 border-amber-300 max-h-[90vh] overflow-y-auto">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          aria-label="Cerrar ventana de ejemplos"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3
            id="sample-modal-title"
            className="text-xl sm:text-2xl font-black text-amber-950"
          >
            Tareas de ejemplo para probar
          </h3>
        </div>

        <p className="text-sm font-medium text-zinc-600 mb-6">
          Elegí una tarea para ver cómo ALIAKIT explica consignas de diferentes materias:
        </p>

        <div className="space-y-3.5">
          {SAMPLE_TASKS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="w-full text-left p-4 rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50/70 transition-all flex items-center justify-between gap-4 group active:scale-[0.99]"
            >
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 mb-1">
                  {sample.category}
                </div>
                <h4 className="font-bold text-base text-zinc-900 group-hover:text-amber-950">
                  {sample.title}
                </h4>
                <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                  {sample.sampleText}
                </p>
              </div>

              <div className="h-10 w-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 group-hover:bg-amber-400 transition-colors">
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
