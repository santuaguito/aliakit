'use client';

import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';

export default function TextToSpeechButton({ text, label = 'Escuchar' }: { text: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return <button type="button" onClick={speak} disabled={!text.trim()} aria-label={`${label}: ${text}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-2 font-bold text-sky-900 hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-50"><Volume2 className="h-5 w-5" />{speaking ? 'Escuchando…' : label}</button>;
}
