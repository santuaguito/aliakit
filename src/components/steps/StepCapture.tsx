'use client';

import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  RotateCcw,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface StepCaptureProps {
  imageSrc: string | null;
  onImageSelected: (base64Image: string, fileName?: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function StepCapture({
  imageSrc,
  onImageSelected,
  onContinue,
  onBack,
}: StepCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        'El archivo no es una imagen válida. Por favor elegí una foto en formato JPG, PNG o WebP.'
      );
      return;
    }

    // Validación de tamaño (máx 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        'La foto es demasiado pesada (más de 10 MB). Probá sacar una foto con menor resolución.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageSelected(result, file.name);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Hubo un problema al cargar la foto. Por favor intentá de nuevo.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      {/* Botón Volver */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-amber-900 font-bold text-sm sm:text-base py-2 px-3 rounded-xl hover:bg-amber-100/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver al inicio</span>
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-amber-950 mb-2">
          {imageSrc ? 'Revisá la foto de tu tarea' : 'Cargá la foto de tu hoja'}
        </h2>
        <p className="text-zinc-600 font-medium text-base sm:text-lg">
          {imageSrc
            ? 'Asegurate de que las letras se vean claritas antes de continuar.'
            : 'Podés sacar una foto ahora o elegir una que ya tengas en el dispositivo.'}
        </p>
      </div>

      {/* Inputs ocultos para archivo y cámara */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mensaje de error si la validación falla */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-100 border-2 border-rose-300 text-rose-950 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{errorMessage}</p>
            <p className="text-sm mt-1 text-rose-800">
              Probá sacar una foto con buena luz o elegir otro archivo.
            </p>
          </div>
        </div>
      )}

      {/* Área principal: Vista previa o Carga */}
      {imageSrc ? (
        <div className="space-y-6">
          {/* Contenedor de la foto */}
          <div className="relative rounded-3xl overflow-hidden border-4 border-amber-300 bg-black/5 shadow-lg max-h-[460px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Foto de la tarea cargada"
              className="max-h-[460px] w-auto object-contain mx-auto"
            />
          </div>

          {/* Consejos para asegurar buena lectura */}
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-200/80 p-4 text-amber-950">
            <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base mb-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              ¿Se lee bien? Mirá estos 3 consejos:
            </h3>
            <ul className="text-xs sm:text-sm font-medium space-y-1 text-amber-900/90 pl-6 list-disc">
              <li>Que no haya sombras oscuras sobre las letras.</li>
              <li>Que la foto no haya salido movida o borrosa.</li>
              <li>Que entre toda la consigna que querés entender.</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                if (cameraInputRef.current) cameraInputRef.current.click();
                else if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-800 font-bold border-2 border-zinc-300 shadow-xs transition-colors"
            >
              <RotateCcw className="h-5 w-5 text-zinc-600" />
              <span>Cambiar o sacar otra foto</span>
            </button>

            <button
              onClick={onContinue}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-lg sm:text-xl shadow-lg shadow-amber-300/40 border-2 border-amber-400 transition-all"
            >
              <span>Leer texto de la tarea</span>
              <ArrowRight className="h-6 w-6 stroke-[2.5]" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Zona de arrastrar o tocar */}
          <div className="border-4 border-dashed border-amber-300 rounded-3xl p-8 sm:p-12 text-center bg-amber-50/50 hover:bg-amber-50 transition-colors">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="h-20 w-20 rounded-3xl bg-amber-200 text-amber-900 flex items-center justify-center mb-4 shadow-xs">
                <Upload className="h-10 w-10 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-amber-950 mb-2">
                Elegí cómo querés cargar tu tarea
              </h3>
              <p className="text-sm font-medium text-zinc-600 mb-6">
                Podés usar la cámara directamente o buscar una foto guardada en tu dispositivo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-base shadow-md transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <span>Usar cámara</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-sky-200 hover:bg-sky-300 text-sky-950 font-bold text-base shadow-xs transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span>Buscar foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
