'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Volume2 } from 'lucide-react';

export default function TextToSpeechButton({ text, label = 'Escuchar' }: { text: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => () => {
    requestRef.current += 1;
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const speak = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }

    const requestId = ++requestRef.current;
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speed: 0.85 }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo generar el audio.');
      }
      const blob = await response.blob();
      if (requestRef.current !== requestId) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        setError('Hubo un problema al reproducir el audio.');
      };
      await audio.play();
      setPlaying(true);
    } catch (err) {
      if (requestRef.current === requestId) {
        setError(err instanceof Error ? err.message : 'No se pudo conectar con el servicio de voz.');
      }
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  };

  return <span className="inline-flex flex-col items-start gap-1">
    <button type="button" onClick={speak} disabled={!text.trim() || loading} aria-label={`${label}: ${text}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-2 font-bold text-sky-900 hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-50">
      {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
      {loading ? 'Cargando audio…' : playing ? 'Detener audio' : label}
    </button>
    {error && <span role="alert" className="text-sm font-semibold text-red-700">{error}</span>}
  </span>;
}
