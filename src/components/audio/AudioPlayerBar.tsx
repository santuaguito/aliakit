'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AudioPlayerBarProps {
  textToRead: string;
  originalText?: string;
  title?: string;
}

export default function AudioPlayerBar({
  textToRead,
  originalText,
  title = 'Escuchar la explicación',
}: AudioPlayerBarProps) {
  const [activeTab, setActiveTab] = useState<'adapted' | 'original'>('adapted');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speed, setSpeed] = useState<0.75 | 1 | 1.25>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const lastFetchedTextRef = useRef<string | null>(null);

  // Seleccionar qué texto reproducir según la pestaña activa
  const currentText =
    activeTab === 'original' && originalText ? originalText : textToRead;

  // Limpiar URL de blob al desmontar
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Si cambia el texto o la pestaña, detener audio anterior
  useEffect(() => {
    handleStop();
  }, [activeTab, textToRead, originalText]);

  // Manejador de reproducción
  const handlePlay = async () => {
    setErrorMessage(null);

    // Si ya está pausado con el mismo audio, reanudar
    if (isPaused && audioRef.current) {
      try {
        audioRef.current.playbackRate = speed;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      } catch {
        // Si falla la reanudación, volver a sintetizar abajo
      }
    }

    // Si ya tenemos el audio para este mismo texto, reproducir directamente
    if (audioRef.current && lastFetchedTextRef.current === currentText) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = speed;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      } catch {
        // En caso de error, volver a consultar el endpoint
      }
    }

    // Solicitar síntesis de voz al endpoint del servidor /api/tts
    setIsLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentText,
          speed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error ${response.status}: no se pudo generar el audio.`
        );
      }

      const audioBlob = await response.blob();

      // Liberar URL anterior si existía
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      currentUrlRef.current = audioUrl;
      lastFetchedTextRef.current = currentText;

      // Crear o reusar elemento de audio
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
      };

      audio.onpause = () => {
        if (!audio.ended) {
          setIsPaused(true);
          setIsPlaying(false);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        setErrorMessage('Hubo un problema al reproducir el audio.');
      };

      await audio.play();
    } catch (err: unknown) {
      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servicio de voz.';
      setErrorMessage(msg);
    }
  };

  // Pausar
  const handlePause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  // Detener por completo
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  };

  // Cambio de velocidad en tiempo real
  const handleSpeedChange = (newSpeed: 0.75 | 1 | 1.25) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  return (
    <div className="rounded-3xl bg-amber-100/90 border-3 border-amber-300 p-4 sm:p-5 shadow-md text-amber-950 transition-all space-y-3">
      {/* Selector de segmento: Explicación vs Texto Original */}
      {originalText && (
        <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80">
          <span className="text-xs font-bold text-amber-900/80 mr-1">
            ¿Qué querés escuchar?
          </span>
          <button
            onClick={() => setActiveTab('adapted')}
            className={`py-1 px-3 rounded-xl text-xs font-black transition-colors ${
              activeTab === 'adapted'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white/70 text-amber-900 hover:bg-white'
            }`}
          >
            Explicación y pasos
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`py-1 px-3 rounded-xl text-xs font-black transition-colors ${
              activeTab === 'original'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white/70 text-amber-900 hover:bg-white'
            }`}
          >
            Texto original de la hoja
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Identidad y estado de la voz */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="h-12 w-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-xs">
            <Volume2 className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-black text-base sm:text-lg leading-tight">
              {activeTab === 'original' ? 'Escuchar texto original' : title}
            </h4>
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <span>Voz de Elena (español rioplatense)</span>
            </span>
          </div>
        </div>

        {/* Controles de reproducción */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl bg-amber-200 text-amber-950 font-bold text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-amber-700" />
              <span>Cargando audio...</span>
            </div>
          )}

          {!isLoading && !isPlaying && !isPaused && (
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-base shadow-sm border-2 border-amber-500 transition-all cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Escuchar</span>
            </button>
          )}

          {!isLoading && isPlaying && (
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-amber-300 hover:bg-amber-200 text-amber-950 font-black text-base border-2 border-amber-500 transition-all cursor-pointer"
            >
              <Pause className="h-5 w-5 fill-current" />
              <span>Pausar</span>
            </button>
          )}

          {!isLoading && isPaused && (
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-base border-2 border-emerald-500 transition-all cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Seguir</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              title="Detener lectura"
              className="p-3 rounded-2xl bg-white hover:bg-zinc-100 text-rose-700 font-bold border-2 border-rose-300 transition-colors cursor-pointer"
            >
              <Square className="h-5 w-5 fill-current" />
            </button>
          )}

          {/* Selector de velocidad */}
          <div className="flex items-center gap-1 bg-white/80 p-1 rounded-2xl border border-amber-300">
            <button
              onClick={() => handleSpeedChange(0.75)}
              className={`px-2 py-1.5 rounded-xl text-xs font-black transition-colors ${
                speed === 0.75
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-amber-900/70 hover:bg-amber-100'
              }`}
              title="Más lento"
            >
              0.75x
            </button>
            <button
              onClick={() => handleSpeedChange(1)}
              className={`px-2 py-1.5 rounded-xl text-xs font-black transition-colors ${
                speed === 1
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-amber-900/70 hover:bg-amber-100'
              }`}
              title="Velocidad normal"
            >
              1x
            </button>
            <button
              onClick={() => handleSpeedChange(1.25)}
              className={`px-2 py-1.5 rounded-xl text-xs font-black transition-colors ${
                speed === 1.25
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-amber-900/70 hover:bg-amber-100'
              }`}
              title="Más rápido"
            >
              1.25x
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error si falla la comunicación */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={handlePlay}
            className="text-xs font-bold text-rose-800 underline hover:text-rose-950 shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
